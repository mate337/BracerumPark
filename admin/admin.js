/* Bracerum Park — painel de reservas da feira (/admin/).
   Fluxo: escolher o lote (mapa, quadra ou busca) → condição de pagamento (as tabelas do CV) →
   dados do interessado (nome, CPF, e-mail, telefone, empresa — todos obrigatórios) → revisar →
   /api/admin cria lead + cliente + reserva no CV → o lote sai da venda (aqui e na maquete).
   Documentação: docs/admin-reservas.md. */
(() => {
  'use strict';
  const API = '/api/admin';
  const LOTES = '../3dmasterplan/data/lotes.json';
  const MAX_SEL = 20;
  const CAT = { V: 'Vitrine', B: 'Business', P: 'Padrão', I: 'Interna' };
  const ST = { d: 'Disponível', r: 'Reservado', n: 'Em negociação', v: 'Vendido', b: 'Indisponível' };
  const DDI = [['55', 'BR +55'], ['595', 'PY +595'], ['54', 'AR +54'], ['598', 'UY +598'], ['1', 'US +1'], ['', 'Outro']];

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
  const usd = (n) => `US$ ${fmt(n)}`;
  const store = {
    get(k, s = localStorage) { try { return JSON.parse(s.getItem(k)); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
    del(k, s = localStorage) { try { s.removeItem(k); } catch (e) { /* idem */ } },
  };

  const S = { token: null, exp: 0, quem: '', geo: null, est: null, quadra: null, sel: [], cond: null,
    passo: 'lote', form: store.get('bp-admin-form', sessionStorage) || { ddi: '55' }, enviando: false, res: null, ultimo: null };

  /* ------------------------------------------------------------------ API */
  async function api(acao, dados = {}) {
    let r, d;
    try {
      r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', ...(S.token ? { authorization: `Bearer ${S.token}` } : {}) },
        body: JSON.stringify({ acao, ...dados }) });
      d = await r.json();
    } catch (e) {
      return { ok: false, status: 0, erro: 'Sem conexão. Confira a internet do celular e tente de novo.' };
    }
    d.status = r.status;
    if (r.status === 401 && d.sair) { sair('A sessão expirou. Entre de novo.'); }
    return d;
  }

  /* ------------------------------------------------------------------ login */
  function mostraLogin(msg) {
    $('#app').hidden = true; $('#login').hidden = false;
    const f = $('#loginForm');
    f.quem.value = store.get('bp-admin-quem') || '';
    $('#loginErr').hidden = !msg; $('#loginErr').textContent = msg || '';
    (f.quem.value ? f.senha : f.quem).focus();
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget, b = f.querySelector('button');
    if (!f.quem.value.trim()) { $('#loginErr').hidden = false; $('#loginErr').textContent = 'Escreva seu nome — ele vai na anotação de cada reserva.'; return; }
    b.disabled = true;
    const d = await api('login', { senha: f.senha.value, quem: f.quem.value.trim() });
    b.disabled = false;
    if (!d.ok) { $('#loginErr').hidden = false; $('#loginErr').textContent = d.erro || 'Não entrou.'; f.senha.select(); return; }
    Object.assign(S, { token: d.token, exp: d.exp, quem: d.quem });
    store.set('bp-admin', { token: d.token, exp: d.exp, quem: d.quem });
    store.set('bp-admin-quem', d.quem);
    f.senha.value = '';
    entrar();
  });
  function sair(msg) {
    store.del('bp-admin');
    Object.assign(S, { token: null, exp: 0 });
    clearInterval(S.timer);
    fechaSheet(true);
    mostraLogin(msg);
  }

  /* ------------------------------------------------------------------ app */
  async function entrar() {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#menuWho').textContent = `Atendente: ${S.quem || '—'}`;
    if (!S.geo) {
      lista('<p class="empty">Carregando o mapa dos lotes…</p>');
      try { S.geo = prepara(await (await fetch(LOTES)).json()); } catch (e) { lista('<p class="empty">Não carregou o mapa dos lotes. Atualize a página.</p>'); return; }
      montaMapa();
    }
    renderLista();
    await carregar();
    clearInterval(S.timer);
    S.timer = setInterval(() => { if (!document.hidden && !S.enviando) carregar(true); }, 30000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.token && !S.enviando) carregar(true); });

  async function carregar(quieto) {
    const b = $('#btnRefresh');
    b.classList.add('is-busy');
    if (!quieto && !S.est) live('carregando lotes e preços do CV…', '');
    const d = await api('estado');
    b.classList.remove('is-busy');
    if (!d.ok) {
      if (d.status === 401) return;
      live(S.est ? 'sem resposta do CV — mostrando a última leitura' : 'sem resposta do CV', 'is-err');
      if (!S.est) lista(`<p class="empty">${esc(d.erro || 'O CV não respondeu.')}<br><button class="linkbtn" type="button" data-acao="recarregar">Tentar de novo</button></p>`);
      return;
    }
    S.est = d;
    if (S.cond == null) S.cond = d.padrao;
    const h = new Date(d.atualizado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    live(`CV ao vivo · ${h}`, 'is-on');
    pinta(); contagem(); renderLista();
    const saiu = S.sel.filter((id) => stDe(id) !== 'd');
    if (saiu.length && !S.enviando) {
      S.sel = S.sel.filter((id) => !saiu.includes(id));
      toast(`${saiu.join(', ')} deixou de estar disponível e saiu da seleção.`);
      pinta(); renderLista();
    }
    barra();
    if (!$('#sheet').hidden && S.passo === 'lotes') renderSheet();
  }
  function live(txt, cls) {
    $('#liveTxt').textContent = txt;
    $('#liveDot').className = `dot ${cls || ''}`;
  }
  const stDe = (id) => { const x = S.est && S.est.lotes[id]; return !x ? (S.est ? 'b' : null) : (x.s || 'd'); };
  const precoDe = (id, t) => { const x = S.est && S.est.lotes[id]; return x && x.p ? x.p[t] : null; };

  function contagem() {
    const c = { d: 0, r: 0, v: 0, b: 0 };
    for (const id of S.geo.ids) { const st = stDe(id) || 'd'; c[st === 'n' ? 'r' : st]++; }   // negociação conta com reservado
    $('#counts').innerHTML = ['d', 'r', 'v', 'b'].map((k) => `<div><b>${fmt(c[k])}</b><span><i class="sw sw--${k}"></i>${ST[k]}${k === 'd' || k === 'r' ? '' : ''}</span></div>`).join('');
  }

  /* ------------------------------------------------------------------ geometria */
  function prepara(j) {
    const lotes = new Map(), quadras = new Map();
    for (const l of j.lotes) {
      const pts = [];
      for (let i = 0; i < l.p.length; i += 2) pts.push([l.p[i], l.p[i + 1]]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      lotes.set(l.id, { ...l, pts, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
    }
    for (const q of j.quadras) {
      const pts = [];
      for (let i = 0; i < q.p.length; i += 2) pts.push([q.p[i], q.p[i + 1]]);
      const ls = [...lotes.values()].filter((l) => l.q === q.q).sort((a, b) => a.id.localeCompare(b.id));
      const all = ls.length ? ls.flatMap((l) => l.pts) : pts;
      const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
      quadras.set(q.q, { q: q.q, fora: q.fora || null, pts, lotes: ls.map((l) => l.id), bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
    }
    const xs = [...quadras.values()].flatMap((q) => [q.bb[0], q.bb[2]]), ys = [...quadras.values()].flatMap((q) => [q.bb[1], q.bb[3]]);
    const tudo = [Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) + 20, Math.max(...ys) + 20];
    return { lotes, quadras, ids: [...lotes.keys()].sort(), tudo };
  }

  /* ------------------------------------------------------------------ mapa */
  const svg = $('#svg');
  const NS = 'http://www.w3.org/2000/svg';
  let VB = null;
  const d = (pts) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
  function montaMapa() {
    const g = S.geo;
    let h = `<defs><pattern id="hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#d6d1c6"/><rect width="3" height="8" fill="#bdb7aa"/></pattern></defs>`;
    h += '<g class="g-q">';
    for (const q of g.quadras.values()) h += `<path class="q${q.fora ? ' q--fora' : ''}" d="${d(q.pts)}"/>`;
    h += '</g><g class="g-l">';
    for (const l of g.lotes.values()) h += `<path class="lote" data-id="${l.id}" d="${d(l.pts)}"/>`;
    h += '</g><g class="g-ll"></g><g class="g-hit">';
    for (const q of g.quadras.values()) {
      if (q.fora || !q.lotes.length) continue;
      const [x0, y0, x1, y1] = q.bb;
      h += `<rect class="qhit" data-q="${q.q}" x="${x0 - 4}" y="${y0 - 4}" width="${x1 - x0 + 8}" height="${y1 - y0 + 8}"/>`;
    }
    h += '</g><g class="g-qlab">';
    for (const q of g.quadras.values()) {
      const [x0, y0, x1, y1] = q.bb;
      h += `<text class="qlab" data-ql="${q.q}" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2}">${q.q}</text>`;
    }
    h += '</g>';
    svg.innerHTML = h;
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const [x0, y0, x1, y1] = g.tudo;
    setVB({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  function pinta() {
    if (!S.geo) return;
    for (const el of svg.querySelectorAll('.lote')) {
      const s = stDe(el.dataset.id) || 'd';
      el.setAttribute('class', `lote s-${s}${S.sel.includes(el.dataset.id) ? ' is-sel' : ''}`);
    }
    rotulosLotes();
  }
  function rect() { return svg.getBoundingClientRect(); }
  function upp(vb = VB) { const r = rect(); return Math.max(vb.w / r.width, vb.h / r.height); }   // unidades por pixel
  function setVB(vb) {
    VB = vb;
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const u = upp();
    for (const t of svg.querySelectorAll('.qlab')) { t.style.fontSize = `${(11 * u).toFixed(2)}px`; t.style.strokeWidth = `${(3 * u).toFixed(2)}px`; }
    for (const t of svg.querySelectorAll('.llab')) t.style.fontSize = `${(10 * u).toFixed(2)}px`;
    const verLotes = 25 / u > 26;                                 // lote de 25 m com mais de 26 px: dá para ler e tocar
    svg.querySelector('.g-ll').style.display = verLotes ? '' : 'none';
    svg.querySelector('.g-qlab').style.display = verLotes && S.quadra ? 'none' : '';
  }
  function rotulosLotes() {
    const g = svg.querySelector('.g-ll');
    if (!S.quadra) { g.innerHTML = ''; return; }
    const q = S.geo.quadras.get(S.quadra), u = upp();
    g.innerHTML = q.lotes.map((id) => {
      const l = S.geo.lotes.get(id), s = stDe(id) || 'd';
      const cx = l.pts.reduce((a, p) => a + p[0], 0) / l.pts.length, cy = l.pts.reduce((a, p) => a + p[1], 0) / l.pts.length;
      return `<text class="llab${s === 'r' || s === 'v' ? ' on-dark' : ''}" x="${cx}" y="${cy}" style="font-size:${(10 * u).toFixed(2)}px">${id.slice(4)}</text>`;
    }).join('');
  }
  function enquadra(bb, pad = 0.1) {
    const r = rect(), [x0, y0, x1, y1] = bb;
    let w = (x1 - x0) * (1 + pad * 2), h = (y1 - y0) * (1 + pad * 2);
    const asp = r.width / r.height;
    if (w / h < asp) w = h * asp; else h = w / asp;
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
  }
  let anim = 0;
  function voa(alvo, ms = 380) {
    cancelAnimationFrame(anim);
    const de = { ...VB }, t0 = performance.now();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setVB(alvo); return; }
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      setVB({ x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, w: de.w + (alvo.w - de.w) * e, h: de.h + (alvo.h - de.h) * e });
      if (k < 1) anim = requestAnimationFrame(passo);
    };
    anim = requestAnimationFrame(passo);
  }
  function toSvg(cx, cy, vb = VB) {
    const r = rect(), u = upp(vb);
    const ox = (r.width - vb.w / u) / 2, oy = (r.height - vb.h / u) / 2;
    return [vb.x + (cx - r.left - ox) * u, vb.y + (cy - r.top - oy) * u];
  }
  // arrastar, pinçar e tocar
  const ptrs = new Map();
  let ges = null;
  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cancelAnimationFrame(anim);
    ges = { vb: { ...VB }, pts: new Map([...ptrs].map(([k, v]) => [k, { ...v }])), mov: 0, t: performance.now(), multi: ptrs.size > 1 || (ges && ges.multi) };
  });
  svg.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId) || !ges) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ids = [...ges.pts.keys()].filter((k) => ptrs.has(k));
    if (ids.length >= 2) {
      const [a0, b0] = ids.map((k) => ges.pts.get(k)), [a1, b1] = ids.map((k) => ptrs.get(k));
      const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y), d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y);
      const m0 = [(a0.x + b0.x) / 2, (a0.y + b0.y) / 2], m1 = [(a1.x + b1.x) / 2, (a1.y + b1.y) / 2];
      zoomEm(ges.vb, m0, m1, d0 / Math.max(d1, 1));
      ges.mov = 99; ges.multi = true;
    } else if (ids.length === 1) {
      const p0 = ges.pts.get(ids[0]), p1 = ptrs.get(ids[0]);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      ges.mov = Math.max(ges.mov, Math.hypot(dx, dy));
      if (ges.mov > 6) { const u = upp(ges.vb); setVB(limita({ ...ges.vb, x: ges.vb.x - dx * u, y: ges.vb.y - dy * u })); }
    }
  });
  const solta = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (!ges) return;
    if (ptrs.size === 0) {
      const toque = ges.mov < 8 && !ges.multi && performance.now() - ges.t < 600;
      ges = null;
      if (toque && e.type === 'pointerup') tocou(p.x, p.y);
    } else ges = { vb: { ...VB }, pts: new Map([...ptrs].map(([k, v]) => [k, { ...v }])), mov: 99, t: 0, multi: true };
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const m = [e.clientX, e.clientY];
    zoomEm({ ...VB }, m, m, Math.exp(e.deltaY * 0.0015));
  }, { passive: false });
  function zoomEm(vb0, m0, m1, f) {
    const all = S.geo.tudo, maxW = (all[2] - all[0]) * 1.3;
    const w = Math.min(maxW, Math.max(60, vb0.w * f)), k = w / vb0.w, h = vb0.h * k;
    const [sx, sy] = toSvg(m0[0], m0[1], vb0);
    const r = rect(), u = Math.max(w / r.width, h / r.height);
    const ox = (r.width - w / u) / 2, oy = (r.height - h / u) / 2;
    setVB(limita({ x: sx - (m1[0] - r.left - ox) * u, y: sy - (m1[1] - r.top - oy) * u, w, h }));
  }
  function limita(vb) {
    const [x0, y0, x1, y1] = S.geo.tudo;
    const cx = Math.min(x1, Math.max(x0, vb.x + vb.w / 2)), cy = Math.min(y1, Math.max(y0, vb.y + vb.h / 2));
    return { ...vb, x: cx - vb.w / 2, y: cy - vb.h / 2 };
  }
  function tocou(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return;
    const lote = el.closest('[data-id]'), hit = el.closest('[data-q]');
    if (!S.quadra && hit) { abreQuadra(hit.dataset.q); return; }
    if (lote) {
      const l = S.geo.lotes.get(lote.dataset.id);
      if (S.quadra !== l.q) { abreQuadra(l.q); return; }
      alterna(l.id);
    }
  }

  /* ------------------------------------------------------------------ quadras e listas */
  function abreQuadra(q, voo = true) {
    const Q = S.geo.quadras.get(q);
    if (!Q) return;
    S.quadra = q;
    $('#map').classList.add('is-quadra');
    svg.querySelector('.g-hit').style.display = 'none';
    $('#mapBack').hidden = false;
    requestAnimationFrame(() => { rotulosLotes(); if (voo) voa(enquadra(Q.bb, 0.08)); });
    renderLista();
  }
  function todas() {
    S.quadra = null;
    $('#map').classList.remove('is-quadra');
    svg.querySelector('.g-hit').style.display = '';
    $('#mapBack').hidden = true;
    rotulosLotes();
    requestAnimationFrame(() => voa(enquadra(S.geo.tudo, 0)));
    renderLista();
  }
  $('#mapBack').addEventListener('click', todas);
  const lista = (h) => { $('#list').innerHTML = h; };
  const livres = (q) => q.lotes.filter((id) => stDe(id) === 'd').length;
  function renderLista() {
    if (!S.geo) return;
    if (!S.quadra) {
      $('#mapTitle').innerHTML = 'Toque numa quadra';
      const qs = [...S.geo.quadras.values()].filter((q) => q.lotes.length && !q.fora).sort((a, b) => a.q.localeCompare(b.q));
      lista(`<div class="list__head"><h3>Quadras</h3><span>${S.est ? 'livres / lotes' : 'carregando o CV…'}</span></div>
        <div class="qgrid">${qs.map((q) => {
          const n = S.est ? livres(q) : null;
          return `<button class="qchip${n === 0 ? ' is-zero' : ''}" type="button" data-q="${q.q}"><b>${q.q}</b><span>${n == null ? '…' : `${n} / ${q.lotes.length}`}</span></button>`;
        }).join('')}</div>`);
      return;
    }
    const Q = S.geo.quadras.get(S.quadra), n = S.est ? livres(Q) : null;
    $('#mapTitle').innerHTML = `<b>Quadra ${Q.q}</b> · ${n == null ? '…' : `${n} de ${Q.lotes.length} livres`}`;
    const livresQ = Q.lotes.filter((id) => stDe(id) === 'd'), todosMarcados = livresQ.length && livresQ.every((id) => S.sel.includes(id));
    lista(`<div class="list__head"><h3>Lotes da ${Q.q}</h3>${livresQ.length ? `<button class="linkbtn" type="button" data-acao="todaQ">${todosMarcados ? 'Desmarcar a quadra' : `Marcar os ${livresQ.length} livres`}</button>` : '<span>nenhum livre</span>'}</div>
      <p class="note">Toque nos lotes para marcar — dá para escolher vários, de quadras diferentes.</p>
      <div class="rows">${Q.lotes.map((id) => {
        const l = S.geo.lotes.get(id), s = stDe(id), p = precoDe(id, S.cond || (S.est && S.est.padrao)), on = S.sel.includes(id);
        return `<button class="row${s && s !== 'd' ? ' is-off' : ''}${on ? ' is-on' : ''}" type="button" data-lote="${id}" aria-pressed="${on}">
          <span class="row__ck" aria-hidden="true"></span>
          <span class="row__id">${id.slice(4)}</span>
          <span class="row__info"><b>${fmt(l.a)} m² · ${CAT[l.cat] || ''}</b>${p ? usd(p[0]) : '&nbsp;'}</span>
          <span class="row__st"><i class="sw sw--${s || 'd'}"></i>${s ? ST[s] : '…'}</span></button>`;
      }).join('')}</div>`);
  }
  $('#list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.q) { abreQuadra(b.dataset.q); $('#map').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (b.dataset.lote) alterna(b.dataset.lote);
    else if (b.dataset.acao === 'recarregar') carregar();
    else if (b.dataset.acao === 'todaQ') {
      const livresQ = S.geo.quadras.get(S.quadra).lotes.filter((id) => stDe(id) === 'd');
      const todos = livresQ.every((id) => S.sel.includes(id));
      S.sel = todos ? S.sel.filter((id) => !livresQ.includes(id)) : [...new Set([...S.sel, ...livresQ])].slice(0, MAX_SEL);
      if (!todos && S.sel.length === MAX_SEL) toast(`Até ${MAX_SEL} lotes por reserva.`);
      pinta(); renderLista(); barra();
    }
  });

  // busca: "Q07 L14", "7-14", "q7", "LTIND.Q07.L014"
  $('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#q').value.toUpperCase();
    const m = /Q?\s*(\d{1,2})(?:\D+L?\s*(\d{1,3}))?/.exec(v.replace(/LTIND\.?/, ''));
    if (!m) { toast('Escreva a quadra e o lote, ex.: Q07 L14'); return; }
    const q = `Q${m[1].padStart(2, '0')}`;
    if (!S.geo.quadras.has(q)) { toast(`Não existe a quadra ${q}`); return; }
    abreQuadra(q);
    if (m[2]) {
      const id = `${q}.L${m[2].padStart(3, '0')}`;
      if (!S.geo.lotes.has(id)) toast(`A ${q} não tem o lote L${m[2].padStart(3, '0')}`);
      else if (!S.sel.includes(id)) alterna(id);
    }
    $('#q').blur();
  });

  /* ------------------------------------------------------------------ seleção e barra */
  const sheet = $('#sheet');
  function alterna(id) {
    const s = stDe(id);
    if (S.sel.includes(id)) S.sel = S.sel.filter((x) => x !== id);
    else if (s && s !== 'd') { toast(`LTIND.${id} está ${ST[s].toLowerCase()} no CV.`); return; }
    else if (!s) { toast('Aguardando a situação do CV…'); return; }
    else if (S.sel.length >= MAX_SEL) { toast(`Até ${MAX_SEL} lotes por reserva.`); return; }
    else S.sel = [...S.sel, id];
    pinta(); renderLista(); barra();
  }
  function somaSel(t) {                          // total e séries somadas dos lotes marcados, na tabela t
    let total = 0; const ser = new Map(); let falta = 0;
    for (const id of S.sel) {
      const p = precoDe(id, t);
      if (!p) { falta++; continue; }
      total += p[0];
      for (const [n, q, v, venc] of p[1]) {
        const k = `${n}|${q}|${venc}`;
        ser.set(k, { n, q, venc, v: (ser.get(k) || { v: 0 }).v + v });
      }
    }
    return { total, series: [...ser.values()], falta };
  }
  const serieTxt = (series) => series.map(({ n, q, v, venc }) => (q === 1 ? `${n === 'SINAL' ? 'Sinal' : n.toLowerCase()} ${usd(v)} em ${venc}` : `${q}× ${usd(v)} a partir de ${venc}`)).join(' + ');
  function barra() {
    const b = $('#selbar'), n = S.sel.length;
    b.hidden = !n || !sheet.hidden;
    document.body.classList.toggle('com-barra', !b.hidden);
    if (!n) return;
    const sm = somaSel(S.cond || (S.est && S.est.padrao));
    $('#selTxt').innerHTML = `<b>${n} ${n > 1 ? 'lotes' : 'lote'}</b> · ${sm.total ? usd(sm.total) : '…'}<small>${esc(S.sel.slice(0, 4).join(' · '))}${n > 4 ? ` +${n - 4}` : ''}</small>`;
  }
  $('#selLimpar').addEventListener('click', () => { S.sel = []; pinta(); renderLista(); barra(); });
  $('#selIr').addEventListener('click', () => abreCarrinho());

  /* ------------------------------------------------------------------ gaveta: lotes → dados → revisar → envio */
  function abreCarrinho() {
    if (!S.sel.length) return;
    if (S.est && !S.est.tabelas.some((t) => t.id === Number(S.cond))) S.cond = S.est.padrao;
    S.passo = 'lotes';
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    barra();
    renderSheet();
  }
  function fechaSheet(forca) {
    if (S.enviando && !forca) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
    if (S.passo === 'ok') { S.sel = []; S.passo = 'lotes'; }
    pinta(); renderLista(); barra();
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechaSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) fechaSheet(); });
  $('#sheetBack').addEventListener('click', () => {
    if (S.enviando) return;
    S.passo = { form: 'lotes', revisar: 'form', erro: 'revisar' }[S.passo] || 'lotes';
    renderSheet();
  });
  const tabNome = (t) => ((S.est && S.est.tabelas.find((x) => x.id === Number(t))) || {}).nome || `Tabela ${t}`;
  const qtd = () => `${S.sel.length} ${S.sel.length > 1 ? 'lotes' : 'lote'}`;

  function renderSheet() {
    const body = $('#sheetBody'), n = S.sel.length, sm = somaSel(S.cond);
    const quadras = [...new Set(S.sel.map((id) => id.slice(0, 3)))];
    $('#sheetEyebrow').textContent = `${qtd()} · ${quadras.length > 1 ? `quadras ${quadras.join(', ')}` : `quadra ${quadras[0] || ''}`}`;
    $('#sheetBack').hidden = !['form', 'revisar', 'erro'].includes(S.passo);
    sheet.querySelector('.sheet__x').hidden = S.passo === 'enviando';

    if (S.passo === 'lotes') {
      $('#sheetTitle').textContent = n > 1 ? `Reservar ${n} lotes` : `Reservar LTIND.${S.sel[0] || ''}`;
      if (!n) { body.innerHTML = '<p class="empty">Nenhum lote marcado.</p>'; return; }
      const conds = S.est ? S.est.tabelas.filter((t) => S.sel.every((id) => precoDe(id, t.id))) : [];
      body.innerHTML = `
        <div class="rows">${S.sel.map((id) => {
          const l = S.geo.lotes.get(id), p = precoDe(id, S.cond);
          return `<div class="row row--sel"><span class="row__id">${id}</span>
            <span class="row__info"><b>${fmt(l.a)} m² · ${CAT[l.cat] || ''}</b>${p ? usd(p[0]) : '—'}</span>
            <button class="row__x" type="button" data-tira="${id}" aria-label="Tirar ${id} da seleção">×</button></div>`;
        }).join('')}</div>
        ${conds.length ? `<fieldset class="conds"><legend class="field__lab" style="margin-bottom:8px">Condição de pagamento (tabelas do CV)</legend>
          ${conds.map((t) => { const x = somaSel(t.id); return `<label class="cond"><input type="radio" name="cond" value="${t.id}"${Number(S.cond) === t.id ? ' checked' : ''} />
            <span><span class="cond__nome">${esc(t.nome.replace(/^Lançamento\s+/i, ''))}</span><span class="cond__total">${usd(x.total)}</span>
            <span class="cond__det">${esc(serieTxt(x.series))}${n > 1 ? ' — soma dos lotes' : ''}</span></span></label>`; }).join('')}</fieldset>`
          : `<p class="empty">${S.est ? 'Sem preço no CV para estes lotes.' : 'Carregando preços do CV…'}</p>`}
        ${n > 1 ? '<p class="note">Valores por lote da tabela do CV (faixa de 1 a 8 lotes). Desconto por volume, se houver, é negociado no CV.</p>' : ''}
        <button class="btn btn--ink" type="button" data-acao="form"${sm.falta || !conds.length ? ' disabled' : ''}>Continuar <span aria-hidden="true">→</span></button>
        <button class="btn btn--ghost" type="button" data-fechar>Escolher mais lotes</button>`;
      body.querySelectorAll('input[name=cond]').forEach((r) => r.addEventListener('change', () => { S.cond = Number(r.value); renderSheet(); renderLista(); }));
    }

    if (S.passo === 'form') {
      $('#sheetTitle').textContent = 'Dados do interessado';
      const f = S.form, err = S.errosForm || {}, nerr = Object.keys(err).length;
      const campo = (k, lab, attrs) => `<label class="field${err[k] ? ' is-err' : ''}" data-campo="${k}"><span class="field__lab">${lab} <b>*</b></span>
        <input class="field__in" name="${k}" value="${esc(f[k] || '')}" ${attrs} required />${err[k] ? `<span class="field__err">${err[k]}</span>` : ''}</label>`;
      body.innerHTML = `
        ${nerr ? `<div class="alerta" role="alert" tabindex="-1"><b>Corrija ${nerr > 1 ? `${nerr} campos` : '1 campo'} para continuar:</b> ${Object.keys(err).map((k) => ({ nome: 'nome', cpf: 'CPF', email: 'e-mail', telefone: 'telefone', empresa: 'empresa' })[k]).join(', ')}.</div>` : ''}
        <p class="note">${qtd()} · ${esc(tabNome(S.cond))} · <b>${usd(sm.total)}</b></p>
        <form class="form" id="fCad" novalidate>
          ${campo('nome', 'Nome completo', 'autocomplete="name" autocapitalize="words" enterkeyhint="next"')}
          ${campo('cpf', 'CPF', 'inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00" enterkeyhint="next"')}
          ${campo('email', 'E-mail', 'type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" enterkeyhint="next"')}
          <div class="field${err.telefone ? ' is-err' : ''}" data-campo="telefone"><span class="field__lab">Telefone / WhatsApp <b>*</b></span>
            <div class="field__row">
              <select class="field__in" name="ddi" aria-label="Código do país">${DDI.map(([v, t]) => `<option value="${v}"${(f.ddi ?? '55') === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
              <input class="field__in" name="telefone" value="${esc(f.telefone || '')}" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="DDD + número" enterkeyhint="next" required aria-label="Telefone" />
            </div>
            ${f.ddi === '' ? `<input class="field__in" name="ddiOutro" value="${esc(f.ddiOutro || '')}" inputmode="numeric" placeholder="Código do país, ex.: 351" aria-label="Código do país" />` : ''}
            ${err.telefone ? `<span class="field__err">${err.telefone}</span>` : ''}</div>
          ${campo('empresa', 'Empresa', 'autocomplete="organization" autocapitalize="words" enterkeyhint="next"')}
          <label class="field"><span class="field__lab">Observações (opcional)</span>
            <textarea class="field__in" name="obs" maxlength="600" enterkeyhint="done">${esc(f.obs || '')}</textarea></label>
          <button class="btn btn--ink" type="submit">Revisar <span aria-hidden="true">→</span></button>
        </form>`;
      const fm = $('#fCad');
      fm.addEventListener('input', (e) => {
        const el = e.target;
        if (el.name === 'cpf') el.value = mascaraCpf(el.value);
        S.form[el.name] = el.value;
        store.set('bp-admin-form', S.form, sessionStorage);
        const cx = el.closest('.is-err');                // corrigiu: o campo deixa de piscar como erro
        if (cx && !validar(S.form)[cx.dataset.campo]) { cx.classList.remove('is-err'); const m = cx.querySelector('.field__err'); if (m) m.remove(); }
      });
      fm.ddi.addEventListener('change', () => { S.form.ddi = fm.ddi.value; renderSheet(); });
      fm.addEventListener('submit', (e) => {
        e.preventDefault();
        S.errosForm = validar(S.form);
        if (Object.keys(S.errosForm).length) {
          renderSheet();
          body.scrollTop = 0;
          const a = body.querySelector('.alerta'); if (a) a.focus();
          toast('Confira os campos marcados em vermelho escuro.');
          return;
        }
        S.passo = 'revisar'; renderSheet(); body.scrollTop = 0;
      });
      if (!f.nome && !nerr) setTimeout(() => fm.nome.focus(), 350);
    }

    if (S.passo === 'revisar') {
      $('#sheetTitle').textContent = 'Revisar e confirmar';
      const f = S.form;
      body.innerHTML = `
        <dl class="review">
          <div><dt>${n > 1 ? 'Lotes' : 'Lote'}</dt><dd>${S.sel.map((id) => { const l = S.geo.lotes.get(id), p = precoDe(id, S.cond); return `<b>LTIND.${id}</b> · ${fmt(l.a)} m² · ${p ? usd(p[0]) : ''}`; }).join('<br>')}</dd></div>
          <div><dt>Condição</dt><dd>${esc(tabNome(S.cond))}<br><b>${usd(sm.total)}</b> — ${esc(serieTxt(sm.series))}${n > 1 ? ' (soma)' : ''}</dd></div>
          <div><dt>Nome</dt><dd>${esc(f.nome)}</dd></div>
          <div><dt>CPF</dt><dd>${esc(mascaraCpf(f.cpf))}</dd></div>
          <div><dt>E-mail</dt><dd>${esc(f.email)}</dd></div>
          <div><dt>Telefone</dt><dd>+${esc(ddiDe(f))} ${esc(String(f.telefone).replace(/\D/g, '').replace(/^0+/, ''))}</dd></div>
          <div><dt>Empresa</dt><dd>${esc(f.empresa)}</dd></div>
          ${f.obs ? `<div><dt>Obs.</dt><dd>${esc(f.obs)}</dd></div>` : ''}
          <div><dt>Atendente</dt><dd>${esc(S.quem)}</dd></div>
        </dl>
        <p class="note">Ao confirmar, o lead e o cliente são criados no CV e ${n > 1 ? `uma reserva para cada um dos ${n} lotes` : 'a reserva do lote'} (corretor "Feira EXPO PY BR"); ${n > 1 ? 'os lotes saem' : 'o lote sai'} da venda na hora — aqui e na maquete.</p>
        <div class="btns">
          <button class="btn btn--ink" type="button" data-acao="enviar">Confirmar ${n > 1 ? `${n} reservas` : 'reserva'}</button>
          <button class="btn btn--ghost" type="button" data-acao="form">Corrigir dados</button>
        </div>`;
    }

    if (S.passo === 'enviando' || S.passo === 'erro') {
      const r = S.ultimo || {};
      $('#sheetTitle').textContent = S.passo === 'erro' ? 'Não concluiu' : 'Reservando…';
      const etapas = [['conferir', `Conferindo ${n > 1 ? 'os lotes' : 'o lote'} no CV`], ['lead', 'Cadastrando o lead'], ['cliente', 'Cadastrando o cliente'], ['reserva', n > 1 ? `Criando as ${n} reservas` : 'Criando a reserva']];
      const feitos = new Set((r.passos || []).map((x) => x.etapa));
      const falhou = S.passo === 'erro' ? (r.etapa || 'conferir') : null;
      const ativo = S.passo === 'enviando' ? S.etapaAtiva || 0 : -1;
      body.innerHTML = `
        <ol class="steps">${etapas.map(([k, t], i) => {
          let c = '';
          if (S.passo === 'enviando') c = i < ativo ? 'is-ok' : i === ativo ? 'is-on' : '';
          else c = k === falhou ? 'is-err' : (feitos.has(k) || etapas.findIndex((e) => e[0] === falhou) > i) ? 'is-ok' : '';
          return `<li class="${c}"><i></i>${t}</li>`;
        }).join('')}</ol>
        ${S.passo === 'erro' ? `<p class="form__err" role="alert">${esc(r.erro || 'Erro')}${r.idlead ? `<br>O lead <b>#${r.idlead}</b> já ficou no CV.` : ''}${r.idpessoa ? ` Cliente <b>#${r.idpessoa}</b> cadastrado.` : ''}</p>
          <div class="btns">${r.status === 409 ? `<button class="btn btn--ink" type="button" data-acao="outro">Tirar o lote ocupado e escolher outro</button>`
            : `<button class="btn btn--ink" type="button" data-acao="enviar">Tentar de novo</button>`}
          <button class="btn btn--ghost" type="button" data-acao="form">Voltar aos dados</button></div>` : '<p class="note">Não feche esta tela — leva alguns segundos por lote.</p>'}`;
    }

    if (S.passo === 'ok') {
      const r = S.ultimo, its = r.itens || [];
      const nr = its.filter((x) => x.modo === 'reserva').length, nn = its.filter((x) => x.modo === 'negociacao').length, ne = its.filter((x) => x.modo === 'erro').length;
      $('#sheetTitle').textContent = nn && !nr ? 'Lotes em negociação' : ne ? 'Concluído em parte' : nr > 1 ? 'Reservas feitas' : 'Reserva feita';
      $('#sheetBack').hidden = true;
      const aviso = its.find((x) => x.aviso);
      body.innerHTML = `
        <div class="done"><div class="done__ic" aria-hidden="true">✓</div>
          <h3>${esc(r.nome)}</h3>
          <p>${its.length} ${its.length > 1 ? 'lotes' : 'lote'} · ${esc(r.tabela && r.tabela.nome || '')} · ${usd(r.total)}</p>
          <dl><div><dt>Lead</dt><dd>#${r.idlead || '—'}</dd></div>${r.idpessoa ? `<div><dt>Cliente</dt><dd>#${r.idpessoa}${r.cliente_novo ? ' (novo)' : ' (já existia)'}</dd></div>` : ''}</dl>
        </div>
        <ul class="steps">${its.map((x) => `<li class="${x.modo === 'erro' ? 'is-err' : 'is-ok'}"><i></i><span><b>LTIND.${esc(x.lote)}</b> — ${
          x.modo === 'reserva' ? `reserva #${x.idreserva || '?'} (Nova Reserva)` : x.modo === 'negociacao' ? `em negociação até ${esc(x.ate)} 23:59` : esc(x.erro || 'não reservado')}</span></li>`).join('')}</ul>
        ${nn ? `<p class="form__err">O CV não aceitou criar ${nn > 1 ? 'as reservas' : 'a reserva'}: <i>${esc(String(aviso && aviso.aviso || '').replace(/[.\s]+$/, ''))}</i>. ${nn > 1 ? 'Os lotes ficaram segurados' : 'O lote ficou segurado'} em negociação para o CPF do cliente — fora da venda no painel e na maquete, e no CV só ele pode ser reservado. <b>Termine a reserva no CV</b> pelo lead #${r.idlead || '—'}.</p>` : ''}
        ${nr ? `<p class="note">No CV ${nr > 1 ? 'as reservas estão' : 'a reserva está'} em <b>Nova Reserva</b>, com o corretor da feira.${r.associado === false ? ' <b>Associe o lead às reservas no CV</b> — a ligação automática não confirmou.' : ''}</p>` : ''}
        <div class="btns"><button class="btn btn--ink" type="button" data-acao="nova">Nova reserva</button>
          <button class="btn btn--ghost" type="button" data-acao="verres">Ver reservas e negociações</button></div>`;
    }
  }
  $('#sheetBody').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tira]');
    if (t) { S.sel = S.sel.filter((x) => x !== t.dataset.tira); pinta(); renderLista(); if (!S.sel.length) fechaSheet(); else renderSheet(); return; }
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const a = b.dataset.acao;
    if (a === 'form') { S.passo = 'form'; renderSheet(); $('#sheetBody').scrollTop = 0; }
    else if (a === 'enviar') enviar();
    else if (a === 'outro') {
      const lote = S.ultimo && S.ultimo.lote;
      if (lote) S.sel = S.sel.filter((x) => x !== lote);
      carregar(true);
      if (S.sel.length) { S.passo = 'lotes'; renderSheet(); } else fechaSheet(true);
    }
    else if (a === 'nova') { fechaSheet(true); }
    else if (a === 'verres') { fechaSheet(true); aba('res'); }
  });

  /* ------------------------------------------------------------------ validação e envio */
  function mascaraCpf(v) {
    const d = String(v || '').replace(/\D/g, '').slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  function cpfValido(c) {
    c = String(c || '').replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (const k of [9, 10]) {
      let s = 0;
      for (let i = 0; i < k; i++) s += Number(c[i]) * (k + 1 - i);
      if (((s * 10) % 11) % 10 !== Number(c[k])) return false;
    }
    return true;
  }
  const ddiDe = (f) => String(f.ddi === '' ? f.ddiOutro || '' : f.ddi || '55').replace(/\D/g, '');
  function validar(f) {
    const e = {};
    if (String(f.nome || '').trim().length < 3) e.nome = 'Escreva o nome do cliente.';
    const cpf = String(f.cpf || '').replace(/\D/g, '');
    if (cpf.length !== 11) e.cpf = 'O CPF tem 11 números.';
    else if (!cpfValido(cpf)) e.cpf = 'CPF inválido: os dois últimos dígitos não conferem. O CV só aceita CPF válido — confira com o cliente.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(f.email || '').trim())) e.email = 'E-mail inválido.';
    const t = String(f.telefone || '').replace(/\D/g, '').replace(/^0+/, '');
    if (t.length < 8 || t.length > 13 || !ddiDe(f)) e.telefone = 'Telefone com DDD (e o código do país).';
    if (String(f.empresa || '').trim().length < 2) e.empresa = 'Nome da empresa.';
    return e;
  }
  async function enviar() {
    if (S.enviando) return;
    S.enviando = true; S.passo = 'enviando'; S.etapaAtiva = 0; S.ultimo = null;
    renderSheet();
    const tic = setInterval(() => { if (S.etapaAtiva < 3) { S.etapaAtiva++; renderSheet(); } }, 1300);
    const f = S.form;
    const d = await api('reservar', { lotes: S.sel, tabela: S.cond, nome: f.nome.trim(), cpf: f.cpf, email: f.email.trim(), ddi: ddiDe(f),
      telefone: f.telefone, empresa: f.empresa.trim(), obs: (f.obs || '').trim() });
    clearInterval(tic);
    S.enviando = false;
    if (d.status === 401) return;
    S.ultimo = { ...d, nome: f.nome.trim() };
    if (!d.ok) {
      if (d.campos && d.campos.length) {
        S.errosForm = Object.fromEntries(d.campos.filter((c) => c !== 'lote' && c !== 'tabela').map((c) => [c, 'O CV não aceitou este campo — confira.']));
        if (Object.keys(S.errosForm).length) { S.passo = 'form'; renderSheet(); toast('Confira os campos marcados.'); return; }
      }
      S.passo = 'erro'; renderSheet();
      if (d.status === 409) carregar(true);
      return;
    }
    for (const x of d.itens || []) if (S.est && S.est.lotes[x.lote] && x.modo !== 'erro') S.est.lotes[x.lote].s = x.modo === 'negociacao' ? 'n' : 'r';
    S.form = { ddi: f.ddi };                       // limpa os dados pessoais para o próximo atendimento
    store.del('bp-admin-form', sessionStorage);
    S.errosForm = {};
    S.passo = 'ok'; renderSheet(); pinta(); contagem(); renderLista();
    S.res = null;
    setTimeout(() => carregar(true), 2500);
  }

  /* ------------------------------------------------------------------ reservas */
  function aba(qual) {
    const res = qual === 'res';
    $('#tabLotes').setAttribute('aria-selected', String(!res));
    $('#tabRes').setAttribute('aria-selected', String(res));
    $('#vLotes').hidden = res; $('#vRes').hidden = !res;
    if (res) carregaReservas();
    window.scrollTo({ top: 0 });
  }
  $('#tabLotes').addEventListener('click', () => aba('lotes'));
  $('#tabRes').addEventListener('click', () => aba('res'));
  $('#btnResRefresh').addEventListener('click', () => carregaReservas());
  $('#soFeira').addEventListener('change', renderReservas);
  async function carregaReservas() {
    if (!S.res) $('#resList').innerHTML = '<p class="empty">Carregando as reservas do CV…</p>';
    const d = await api('reservas');
    if (!d.ok) { if (d.status !== 401) $('#resList').innerHTML = `<p class="empty">${esc(d.erro || 'O CV não respondeu.')}</p>`; return; }
    S.res = d.reservas || [];
    S.neg = d.negociacoes || [];
    S.resAviso = (d.avisos || []).join(' · ');
    renderReservas();
  }
  const ativa = (r) => !/cancel|vencid|distrato/i.test(r.situacao);
  function renderReservas() {
    if (!S.res) return;
    const so = $('#soFeira').checked;
    const lst = S.res.filter((r) => (!so || r.feira));
    $('#resN').textContent = (S.res.filter((r) => r.feira && ativa(r)).length + (S.neg || []).length) || '';
    const neg = (S.neg || []).length ? `<div class="list__head"><h3>Em negociação</h3><span>lote segurado para o CPF</span></div>
      ${S.neg.map((n) => `<article class="rcard"><div class="rcard__top"><span class="rcard__lote">LTIND.${esc(n.lote)}</span>
        <span class="rcard__sit">Em negociação</span></div>
        <p class="rcard__meta"><span>CPF ${esc(n.doc)}</span>${n.desde ? `<span>desde ${esc(String(n.desde).slice(0, 16).split(' ').map((x, i) => (i ? x : x.split('-').reverse().join('/'))).join(' '))}</span>` : ''}<span>${esc(n.motivo || '')}</span></p>
        <div class="rcard__acts"><button class="linkbtn" type="button" data-liberar="${esc(n.lote)}">Liberar o lote</button></div></article>`).join('')}
      <div class="list__head"><h3>Reservas</h3><span>no CV</span></div>` : '';
    const aviso = S.resAviso ? `<p class="form__err">${esc(S.resAviso)}</p>` : '';
    if (!lst.length) { $('#resList').innerHTML = aviso + neg + `<p class="empty">${so ? 'Nenhuma reserva da feira ainda.' : 'Nenhuma reserva no loteamento.'}</p>`; return; }
    $('#resList').innerHTML = aviso + neg + lst.map((r) => `
      <article class="rcard">
        <div class="rcard__top"><span class="rcard__lote">${esc(/^Q\d/.test(r.lote) ? 'LTIND.' + r.lote : r.lote)}</span>
          <span class="rcard__sit${ativa(r) ? '' : ' is-cancel'}">${esc(r.situacao)}</span></div>
        <p class="rcard__cli">${esc(r.cliente)}</p>
        <p class="rcard__meta"><span>#${r.idreserva}</span><span>${usd(r.total)}</span><span>${esc((r.data || '').slice(0, 16).split(' ').map((x, i) => (i ? x : x.split('-').reverse().join('/'))).join(' '))}</span>
          ${r.telefone ? `<a href="https://wa.me/${esc(String(r.telefone).replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : ''}<span>${esc(r.corretor)}</span></p>
        ${r.feira && ativa(r) && !/vendid/i.test(r.situacao) ? `<div class="rcard__acts"><button class="linkbtn" type="button" data-cancelar="${r.idreserva}" data-lote="${esc(r.lote)}">Cancelar esta reserva</button></div>` : ''}
      </article>`).join('');
  }
  $('#resList').addEventListener('click', async (e) => {
    const lb = e.target.closest('[data-liberar]');
    if (lb) {
      if (!confirm(`Liberar o lote ${lb.dataset.liberar}? Ele volta a ficar disponível para qualquer cliente.`)) return;
      lb.disabled = true;
      const d = await api('liberar', { lote: lb.dataset.liberar });
      if (!d.ok) { lb.disabled = false; toast(d.erro || 'Não liberou.'); return; }
      toast(`${d.lote} liberado — disponível de novo.`);
      S.res = null; carregaReservas(); carregar(true);
      return;
    }
    const b = e.target.closest('[data-cancelar]');
    if (!b) return;
    if (!confirm(`Cancelar a reserva #${b.dataset.cancelar} (${b.dataset.lote}) no CV? O lote volta a ficar disponível.`)) return;
    b.disabled = true;
    const d = await api('cancelar', { idreserva: Number(b.dataset.cancelar) });
    if (!d.ok) { b.disabled = false; toast(d.erro || 'Não cancelou.'); return; }
    toast(`Reserva #${d.idreserva} cancelada — ${d.lote} disponível de novo.`);
    S.res = null; carregaReservas(); carregar(true);
  });

  /* ------------------------------------------------------------------ menu, toast, início */
  $('#btnRefresh').addEventListener('click', () => { carregar(); if (!$('#vRes').hidden) carregaReservas(); });
  $('#btnMenu').addEventListener('click', (e) => {
    const m = $('#menu'), on = m.hidden;
    m.hidden = !on; e.currentTarget.setAttribute('aria-expanded', String(on));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#menu,#btnMenu')) { $('#menu').hidden = true; $('#btnMenu').setAttribute('aria-expanded', 'false'); } });
  $('#btnSair').addEventListener('click', () => sair());
  let tt = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3600);
  }
  addEventListener('resize', () => { if (VB && S.geo) setVB(S.quadra ? enquadra(S.geo.quadras.get(S.quadra).bb, 0.08) : enquadra(S.geo.tudo, 0)); });

  const s = store.get('bp-admin');
  if (s && s.token && s.exp > Date.now() + 60e3) { Object.assign(S, { token: s.token, exp: s.exp, quem: s.quem }); entrar(); }
  else mostraLogin();
  window.__adm = { S, alterna, abreCarrinho, abreQuadra, carregar };
})();
