/*
  Portal do Corretor — aplicação de uma página só (rotas por #/).
  Conteúdo editável em conteudo.js; servidor em /api/portal (api/portal.js).
  Idioma pela mesma chave do site (bp-lang); tema em bp-portal-tema.
*/
(function () {
  'use strict';
  const C = window.BP_CONTEUDO;
  const app = document.getElementById('app');

  /* ============================================================ estado */
  const S = {
    user: null, avisos: [], lang: lerLang(), route: { name: 'inicio', arg: '' },
    lotes: null, precos: null, pedidos: null, corretores: null,
    mat: { tipo: 'all', produto: 'all', q: '' },
    share: { dest: 'park', msgLang: null },
    req: { filtro: 'abertos' }, team: { filtro: 'pendente' },
    price: { janela: null, pag: '12x', cat: 'P', area: 1250, faixa: 0 },
    mapLive: false,
  };

  function lerLang() {
    try { const l = localStorage.getItem('bp-lang'); if (['pt', 'es', 'en'].includes(l)) return l; } catch (e) {}
    const n = (navigator.language || 'pt').slice(0, 2);
    return n === 'es' ? 'es' : n === 'en' ? 'en' : 'pt';
  }
  function setLang(l) {
    S.lang = l;
    try { localStorage.setItem('bp-lang', l); } catch (e) {}
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    render();
  }

  /* ============================================================ utilitários */
  const t = (k) => { const v = C.UI[k]; return v ? (v[S.lang] || v.pt) : k; };
  const tx = (o) => (o && typeof o === 'object' ? (o[S.lang] || o.pt || '') : (o || ''));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const locale = () => ({ pt: 'pt-BR', es: 'es-PY', en: 'en-US' }[S.lang]);
  const nf = (n, d = 0) => new Intl.NumberFormat(locale(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const usd = (n) => 'US$ ' + nf(n, 0);
  const data = (iso, comHora) => {
    if (!iso) return '';
    const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    return new Intl.DateTimeFormat(locale(), comHora ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };
  const iniciais = (n) => String(n || '?').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const primeiro = (n) => String(n || '').split(' ')[0];
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const abs = (p) => new URL(p, location.origin).href;
  const isEquipe = () => S.user && S.user.papel === 'equipe';
  const aprovado = () => S.user && S.user.status === 'aprovado';

  function toast(msg) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = I.check + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2400);
  }
  async function copiar(txt) {
    try { await navigator.clipboard.writeText(txt); }
    catch (e) {
      const a = document.createElement('textarea'); a.value = txt; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
      document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove();
    }
    toast(t('c.copied'));
  }
  async function compartilhar(titulo, url) {
    if (navigator.share) { try { await navigator.share({ title: titulo, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    copiar(url);
  }

  /* ============================================================ ícones (traço 1,6) */
  const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const I = {
    home: ic('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    grid: ic('<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>'),
    share: ic('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    inbox: ic('<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>'),
    book: ic('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>'),
    table: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    users: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    download: ic('<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5"/><path d="M4 18v2h16v-2"/>'),
    link: ic('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
    copy: ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
    out: ic('<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    ext: ic('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    wa: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.06 3 3.4 8.66 3.4 15.64c0 2.23.58 4.4 1.69 6.32L3.3 28.7l6.9-1.76a12.6 12.6 0 0 0 5.84 1.44h.01c6.97 0 12.64-5.66 12.64-12.64 0-3.38-1.32-6.55-3.71-8.94A12.56 12.56 0 0 0 16.04 3zm0 23.1h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.23-4.1 1.05 1.1-4-.25-.4a10.45 10.45 0 0 1-1.6-5.6c0-5.8 4.72-10.52 10.53-10.52 2.81 0 5.45 1.1 7.44 3.09a10.45 10.45 0 0 1 3.08 7.44c0 5.8-4.72 10.53-10.46 10.53zm5.77-7.88c-.32-.16-1.87-.92-2.16-1.03-.29-.1-.5-.16-.71.16-.21.32-.81 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.33-.49-2.54-1.57-.94-.84-1.57-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.75.24 1.44.2 1.98.12.6-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.6-.37z"/></svg>',
    mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    qr: ic('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M17 20h4M20 17v3"/>'),
    cube: ic('<path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9.2"/>'),
    bell: ic('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    arrow: ic('<path d="M5 12h14m0 0-5-5m5 5-5 5"/>'),
    back: ic('<path d="M19 12H5m0 0 5-5m-5 5 5 5"/>'),
    megaphone: ic('<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
    lock: ic('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    image: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5.5-5.5L5 20"/>'),
    file: ic('<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>'),
    play: ic('<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>'),
    print: ic('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
    calendar: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    video: ic('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
    map: ic('<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>'),
    pen: ic('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
    dots: ic('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
    expand: ic('<path d="M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6"/>'),
    sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>'),
    star: ic('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  };
  const TIPO_ICONE = { peca: I.image, impresso: I.print, evento: I.calendar, visita: I.map, video: I.video, traducao: I.globe, material: I.file, outro: I.dots };

  /* ============================================================ servidor */
  async function api(acao, dados) {
    let r;
    try {
      r = await fetch('/api/portal', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao, ...(dados || {}) }) });
    } catch (e) { throw new Error(t('c.offline')); }
    let d = {};
    try { d = await r.json(); } catch (e) { d = { ok: false, erro: t('c.error') }; }
    if (r.status === 401 && d.sair && !['entrar', 'cadastro', 'equipe'].includes(acao)) {
      S.user = null; render(); throw new Error(d.erro || 'sessão');
    }
    if (!r.ok || !d.ok) throw new Error(d.erro || t('c.error'));
    return d;
  }

  /* dados públicos: disponibilidade (CV) e tabela */
  function carregarPublicos() {
    if (!S.lotes) {
      S.lotes = { carregando: true };
      fetch('/api/lotes-status').then((r) => r.json()).then((d) => {
        const st = d && d.lotes ? Object.values(d.lotes) : [];
        S.lotes = { total: d.total || 614, r: st.filter((x) => x === 'r').length, v: st.filter((x) => x === 'v').length, b: st.filter((x) => x === 'b').length, ok: !!d.ok, em: d.atualizado };
        atualizarKpis();
      }).catch(() => { S.lotes = { erro: true, total: 614 }; atualizarKpis(); });
    }
    if (!S.precos) {
      S.precos = { carregando: true };
      fetch('/3dmasterplan/data/precos.json').then((r) => r.json()).then((d) => {
        S.precos = d;
        if (!S.price.janela) S.price.janela = janelaAtual().id;
        atualizarKpis();
        if (S.route.name === 'tabela') renderMain();
      }).catch(() => { S.precos = { erro: true }; });
    }
  }
  const precosOk = () => S.precos && S.precos.janelas;
  function hojeISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
  function janelaAtual() {
    const h = hojeISO();
    const js = S.precos.janelas;
    return js.find((j) => (!j.de || j.de <= h) && (!j.ate || h <= j.ate)) || js[js.length - 1];
  }
  function proximaVirada() {
    const j = janelaAtual();
    if (!j.ate) return null;
    const d = new Date(j.ate + 'T12:00:00'); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  const PAG_IDX = { '12x': 0, vista: 1, '36x': 2 };

  /* ============================================================ rotas */
  // O corretor só lê o mural; "Corretores" (aprovação) existe só para a equipe.
  const ROTAS_CORRETOR = [
    ['inicio', 'nav.home', I.home], ['materiais', 'nav.materials', I.grid], ['mural', 'nav.board', I.megaphone],
    ['tabela', 'nav.prices', I.table], ['aprender', 'nav.learn', I.book], ['pedidos', 'nav.requests', I.inbox],
    ['divulgar', 'nav.share', I.share],
  ];
  const ROTAS_EQUIPE = [
    ['inicio', 'nav.home', I.home], ['pedidos', 'nav.requests', I.inbox], ['corretores', 'nav.brokers', I.users],
    ['mural', 'nav.board', I.megaphone], ['materiais', 'nav.materials', I.grid], ['tabela', 'nav.prices', I.table],
    ['aprender', 'nav.learn', I.book],
  ];
  const rotas = () => (isEquipe() ? ROTAS_EQUIPE : ROTAS_CORRETOR);
  function lerRota() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, ...rest] = h.split('/');
    const validas = [...rotas().map((r) => r[0]), 'conta'];
    const def = 'inicio';
    S.route = { name: validas.includes(name) ? name : def, arg: decodeURIComponent(rest.join('/') || '') };
  }
  window.addEventListener('hashchange', () => { if (!S.user) return; lerRota(); fecharSheet(); renderMain(true); marcarNav(); });

  /* ============================================================ render geral */
  function render() {
    if (!S.user) return renderAuth();
    lerRota();
    carregarPublicos();
    const rs = rotas();
    const nome = isEquipe() ? t('team.hi') + ' · ' + S.user.nome : S.user.nome;
    app.innerHTML = `
      <div class="app">
        <header class="top" id="top">
          <a class="brand" href="#/${rs[0][0]}" aria-label="Bracerum Park · ${esc(t('brand'))}">
            <img class="brand__logo logo--ink" src="/assets/logo/logo-horizontal-black.svg" alt="Bracerum Park" width="150" height="18" />
            <img class="brand__logo logo--paper" src="/assets/logo/logo-horizontal-white.svg" alt="" width="150" height="18" />
            <span class="brand__sep"></span><span class="brand__name">${esc(t('brand'))}</span>
          </a>
          <nav class="tabs seg" aria-label="${esc(t('brand'))}">
            ${rs.map(([id, k]) => `<a href="#/${id}" data-nav="${id}" class="segl">${esc(t(k))}</a>`).join('')}
          </nav>
          <div class="top__end">
            ${langSwitch()}
            <a href="#/conta" class="avatar" data-nav="conta" title="${esc(nome)}" aria-label="${esc(t('nav.account'))}">${esc(iniciais(S.user.nome))}</a>
          </div>
        </header>
        <main class="main" id="main" tabindex="-1"></main>
        ${bottomBar()}
      </div>`;
    bindLang(app);
    $('#bb-more') && $('#bb-more').addEventListener('click', abrirMais);
    $('#bb-plus') && $('#bb-plus').addEventListener('click', () => (isEquipe() ? (location.hash = '#/mural') : novoPedido()));
    renderMain();
    marcarNav();
    onScrollTop();
  }
  function langSwitch() {
    return `<div class="lang" role="group" aria-label="${esc(t('acc.lang'))}">${['pt', 'es', 'en'].map((l) => `<button type="button" data-lang="${l}" aria-pressed="${S.lang === l}">${l.toUpperCase()}</button>`).join('')}</div>`;
  }
  function bindLang(root) { $$('[data-lang]', root).forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang))); }
  function bottomBar() {
    const it = (id, k, ico) => `<a href="#/${id}" data-nav="${id}">${ico}<span>${esc(t(k))}</span></a>`;
    const left = isEquipe() ? [it('inicio', 'nav.home', I.home), it('pedidos', 'nav.requests', I.inbox)] : [it('inicio', 'nav.home', I.home), it('materiais', 'nav.materials', I.grid)];
    const right = isEquipe() ? [it('corretores', 'nav.brokers', I.users)] : [it('mural', 'nav.board', I.megaphone)];
    return `<nav class="bottombar" aria-label="${esc(t('brand'))}">${left.join('')}
      <button type="button" class="plus" id="bb-plus" aria-label="${esc(isEquipe() ? t('team.boardTitle') : t('nav.new'))}">${I.plus}</button>
      ${right.join('')}<button type="button" id="bb-more">${I.dots}<span>Menu</span></button></nav>`;
  }
  function marcarNav() {
    $$('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === S.route.name;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  let scrollBound = false;
  function onScrollTop() {
    if (scrollBound) return; scrollBound = true;
    window.addEventListener('scroll', () => { const top = $('#top'); if (top) top.classList.toggle('is-scrolled', window.scrollY > 4); }, { passive: true });
  }

  const VIEWS = {};
  function renderMain(foco) {
    const main = $('#main');
    if (!main) return;
    S.mapLive = false;
    const fn = VIEWS[S.route.name] || VIEWS.inicio;
    main.innerHTML = `<div class="view">${fn()}</div>`;
    const after = VIEWS[S.route.name + ':after'];
    if (after) after(main);
    if (foco) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    document.title = `${t(rotas().concat([['conta', 'nav.account']]).find((r) => r[0] === S.route.name)?.[1] || 'brand')} · ${t('brand')}`;
  }

  /* ============================================================ entrada */
  let authTab = 'in';
  function renderAuth() {
    document.title = `${t('brand')} · Bracerum Park`;
    const ddi = `<select class="select" name="ddi" aria-label="DDI">
        <option value="55">🇧🇷 +55</option><option value="595">🇵🇾 +595</option><option value="54">🇦🇷 +54</option><option value="598">🇺🇾 +598</option><option value="1">+1</option><option value="351">🇵🇹 +351</option></select>`;
    const forms = {
      in: `<form id="f-in" novalidate>
          <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" name="email" autocomplete="username" required inputmode="email" /></label>
          <label class="field"><span>${esc(t('auth.pass'))}</span><input class="input" type="password" name="senha" autocomplete="current-password" required /></label>
          <p class="formmsg" role="alert"></p>
          <button class="btn btn--ink btn--block" type="submit">${esc(t('auth.go'))}${I.arrow}</button>
          <p class="small muted">${esc(t('auth.forgot'))}</p>
        </form>`,
      up: `<form id="f-up" novalidate>
          <label class="field"><span>${esc(t('auth.name'))}</span><input class="input" name="nome" autocomplete="name" required /></label>
          <div class="grid2">
            <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" name="email" autocomplete="email" required inputmode="email" /></label>
            <label class="field"><span>${esc(t('auth.wa'))}</span><span class="phone">${ddi}<input class="input" name="tel" type="tel" autocomplete="tel-national" inputmode="tel" required /></span></label>
          </div>
          <div class="grid2">
            <label class="field"><span>${esc(t('auth.agency'))}</span><input class="input" name="imobiliaria" autocomplete="organization" required /><small>${esc(t('auth.agencyHint'))}</small></label>
            <label class="field"><span>${esc(t('auth.creci'))}</span><input class="input" name="creci" /></label>
          </div>
          <label class="field"><span>${esc(t('auth.pass8'))}</span><input class="input" type="password" name="senha" autocomplete="new-password" minlength="8" required /></label>
          <label class="check"><input type="checkbox" name="termo" required /><span>${esc(t('auth.terms'))}</span></label>
          <p class="formmsg" role="alert"></p>
          <button class="btn btn--ink btn--block" type="submit">${esc(t('auth.create'))}${I.arrow}</button>
        </form>`,
      team: `<form id="f-team" novalidate>
          <label class="field"><span>${esc(t('auth.teamName'))}</span><input class="input" name="nome" autocomplete="name" required /></label>
          <label class="field"><span>${esc(t('auth.teamPass'))}</span><input class="input" type="password" name="senha" autocomplete="current-password" required /></label>
          <p class="formmsg" role="alert"></p>
          <button class="btn btn--ink btn--block" type="submit">${esc(t('auth.go'))}${I.arrow}</button>
        </form>`,
    };
    app.innerHTML = `
      <div class="auth view">
        <section class="auth__form">
          <div class="auth__top">
            <a class="brand" href="/" aria-label="Bracerum Park">
              <img class="brand__logo logo--ink" src="/assets/logo/logo-horizontal-black.svg" alt="Bracerum Park" width="150" height="18" />
              <img class="brand__logo logo--paper" src="/assets/logo/logo-horizontal-white.svg" alt="" width="150" height="18" />
            </a>
            ${langSwitch()}
          </div>
          <div class="auth__mid" id="main" tabindex="-1">
            <div style="display:grid;gap:14px">
              <p class="eyebrow">${esc(t('brand'))}</p>
              <h1 class="h1">${esc(t('auth.title'))}</h1>
              <p class="lead">${esc(t('auth.lead'))}</p>
            </div>
            <div class="seg" role="tablist" aria-label="${esc(t('brand'))}">
              ${[['in', 'auth.in'], ['up', 'auth.up'], ['team', 'auth.team']].map(([id, k]) => `<button type="button" role="tab" data-auth="${id}" aria-selected="${authTab === id}">${esc(t(k))}</button>`).join('')}
            </div>
            ${forms[authTab]}
          </div>
          <p class="auth__foot">© Bracerum Park · Villeta, Paraguay · <a class="linkbtn" href="/">bracerumpark.com</a></p>
        </section>
        <aside class="auth__panel" aria-hidden="true">
          <img src="/assets/web/fotos/park-aereo-rio.jpg" alt="" />
          <div class="auth__panelin">
            <span class="glass stage__chip" style="align-self:flex-start"><i class="dot-live" style="background:#f5f5f3"></i> Villeta · Paraguay</span>
            <div style="display:grid;gap:22px">
              <p class="display">Bracerum<br/>Park</p>
              <div class="auth__stats">
                <div class="glass"><b>614</b><span>${esc(t('auth.stat1'))}</span></div>
                <div class="glass"><b>1.250</b><span>${esc(t('auth.stat2'))}</span></div>
                <div class="glass"><b>1%</b><span>${esc(t('auth.stat3'))}</span></div>
              </div>
            </div>
          </div>
        </aside>
      </div>`;
    bindLang(app);
    $$('[data-auth]').forEach((b) => b.addEventListener('click', () => { authTab = b.dataset.auth; renderAuth(); const f = $('form input'); f && f.focus(); }));
    const f = $('form');
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      const msg = $('.formmsg', f); msg.textContent = '';
      const btn = $('button[type=submit]', f); const htmlBtn = btn.innerHTML;
      $$('.input', f).forEach((i) => i.removeAttribute('aria-invalid'));
      const falta = $$('[required]', f).filter((i) => (i.type === 'checkbox' ? !i.checked : !i.value.trim()));
      if (falta.length) { falta.forEach((i) => i.setAttribute('aria-invalid', 'true')); falta[0].focus(); msg.textContent = t('c.error'); return; }
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
      try {
        let d;
        if (authTab === 'in') d = await api('entrar', { email: fd.email, senha: fd.senha });
        else if (authTab === 'team') d = await api('equipe', { nome: fd.nome, senha: fd.senha });
        else {
          const pais = { 55: 'BR', 595: 'PY', 54: 'AR', 598: 'UY' }[fd.ddi] || 'OUTRO';
          d = await api('cadastro', { ...fd, termo: !!fd.termo, pais, idioma: S.lang });
        }
        S.user = d.usuario; S.pedidos = null; S.corretores = null;
        const a = await api('eu').catch(() => null);
        if (a) S.avisos = a.avisos || [];
        location.hash = '#/inicio';
        render();
      } catch (e) {
        msg.textContent = e.message;
        btn.disabled = false; btn.innerHTML = htmlBtn;
      }
    });
  }

  /* ============================================================ início */
  function saudacao() { const h = new Date().getHours(); return t(h < 12 ? 'home.hello.m' : h < 18 ? 'home.hello.a' : 'home.hello.n'); }
  // Legenda do mapa de reservas: números ao vivo do CV + janela de preço.
  function kpisHTML() {
    const L = S.lotes || {};
    const total = L.total || 614;
    const ocup = (L.r || 0) + (L.v || 0) + (L.b || 0);
    const pronto = !(L.carregando || L.erro);
    const livres = pronto ? total - ocup : null;
    const jan = precosOk() ? janelaAtual() : null;
    const preco = jan ? S.precos.precos[jan.id].P[0][0] : null;
    const vir = jan ? proximaVirada() : null;
    const dias = vir ? Math.max(0, Math.ceil((new Date(vir + 'T00:00:00') - new Date()) / 864e5)) : null;
    const n = (v) => (pronto ? nf(v) : '<span class="skel" style="display:inline-block;width:40px;height:22px"></span>');
    const item = (cls, rot, v) => `<div class="legend__item"><i class="legend__dot ${cls}"></i><span>${esc(rot)}</span><b class="num">${v}</b></div>`;
    return `
      ${item('is-free', t('home.k.avail'), n(livres))}
      ${item('is-res', t('map.res'), n(L.r || 0))}
      ${item('is-sold', t('map.sold'), n(L.v || 0))}
      ${item('is-off', t('map.off'), n(L.b || 0))}
      <div class="legend__item legend__item--wide"><span>${esc(t('home.k.window'))}</span><b>${jan ? esc(tx(jan.curto)) : '—'}${preco != null ? ` · <span class="num">US$ ${nf(preco)}</span>/m²` : ''}</b>${dias != null ? `<small>${nf(dias)} ${esc(t('home.k.days'))}</small>` : ''}</div>`;
  }
  function atualizarKpis() {
    const box = $('#kpis');
    if (box) box.innerHTML = kpisHTML();
  }
  function avisosAuto() {
    const out = [];
    if (precosOk()) {
      const vir = proximaVirada();
      if (vir) {
        const dias = Math.ceil((new Date(vir + 'T00:00:00') - new Date()) / 864e5);
        if (dias <= 45) out.push({ titulo: `${t('home.window.auto')} · ${data(vir)}`, texto: tx(janelaAtual().nome) + ' → ' + tx(S.precos.janelas[S.precos.janelas.indexOf(janelaAtual()) + 1].nome), link: '#/tabela', auto: true });
      }
    }
    return out;
  }
  function noticeHTML(a) {
    const inner = `<span class="notice__ico">${a.fixo ? I.star : a.auto ? I.calendar : I.bell}</span>
      <div><b>${esc(a.titulo)}</b>${a.texto ? `<p>${esc(a.texto)}</p>` : ''}${a.em ? `<time datetime="${esc(a.em)}">${esc(data(a.em, true))}</time>` : ''}</div>`;
    if (a.link) {
      const ext = /^https:/.test(a.link);
      return `<a class="notice" href="${esc(a.link)}" ${ext ? 'target="_blank" rel="noopener"' : ''}>${inner}</a>`;
    }
    return `<div class="notice">${inner}</div>`;
  }
  function muralHTML(max = 6) {
    const lst = [...avisosAuto(), ...(S.avisos || []).slice().sort((a, b) => (b.fixo ? 1 : 0) - (a.fixo ? 1 : 0))].slice(0, max);
    return lst.length ? `<div class="feed">${lst.map(noticeHTML).join('')}</div>` : `<p class="muted small" style="margin:0">${esc(t('home.boardEmpty'))}</p>`;
  }
  // Página inicial: "Bem-vindo, Nome", os tópicos no meio e, abaixo, o mapa de reservas ao vivo.
  const TOPICOS_CORRETOR = [
    ['materiais', 'nav.materials', 'top.materials', I.grid],
    ['mural', 'nav.board', 'top.board', I.megaphone],
    ['tabela', 'nav.prices', 'top.prices', I.table],
    ['aprender', 'nav.learn', 'top.learn', I.book],
  ];
  const TOPICOS_EQUIPE = [
    ['pedidos', 'nav.requests', 'top.requests', I.inbox],
    ['corretores', 'nav.brokers', 'top.brokers', I.users],
    ['mural', 'nav.board', 'top.boardTeam', I.megaphone],
    ['materiais', 'nav.materials', 'top.materials', I.grid],
    ['tabela', 'nav.prices', 'top.prices', I.table],
    ['aprender', 'nav.learn', 'top.learn', I.book],
  ];
  VIEWS.inicio = () => {
    const hoje = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const tops = isEquipe() ? TOPICOS_EQUIPE : TOPICOS_CORRETOR;
    const extras = isEquipe()
      ? ''
      : `<div class="extras">
          <button type="button" class="extra" id="q-req" ${aprovado() ? '' : 'aria-disabled="true"'}>${I.megaphone}<span>${esc(t('home.q.req'))}</span>${aprovado() ? I.arrow : I.lock}</button>
          <a class="extra" href="#/divulgar">${I.qr}<span>${esc(t('home.q.link'))}</span>${I.arrow}</a>
          <a class="extra" href="#/pedidos">${I.inbox}<span>${esc(t('home.myReq'))}</span><b class="num" id="cnt-req"></b>${I.arrow}</a>
          <a class="extra" href="${C.CV.corretor}" target="_blank" rel="noopener">${I.ext}<span>${esc(t('home.q.cv'))}</span>${I.arrow}</a>
        </div>`;
    return `
      ${!isEquipe() && S.user.status === 'pendente' ? `<div class="banner">${I.info}<span>${esc(t('home.pending'))}</span></div>` : ''}
      <section class="welcome">
        <p class="eyebrow">${esc(hoje)}</p>
        <h1 class="display">${esc(t('home.welcome'))}, ${esc(primeiro(S.user.nome))}</h1>
        <p class="lead">${esc(t(isEquipe() ? 'home.subTeam' : 'home.sub2'))}</p>
      </section>
      <nav class="topics ${tops.length > 4 ? 'topics--6' : ''}" aria-label="${esc(t('brand'))}">
        ${tops.map(([id, k, d, ico], i) => `<a class="topic" href="#/${id}">
          <span class="topic__n num">0${i + 1}</span>
          <span class="topic__ico">${ico}</span>
          <span class="topic__t">${esc(t(k))}</span>
          <span class="topic__d">${esc(t(d))}</span>
          <span class="topic__go">${I.arrow}</span>
          <b class="topic__badge num" data-cnt="${id}" hidden></b>
        </a>`).join('')}
      </nav>
      ${extras}
      <section class="section reserv">
        <div class="section__head"><div><p class="eyebrow">${esc(t('home.k.live'))}</p><h2 class="h2" style="margin-top:6px">${esc(t('map.title'))}</h2></div>
          <a class="btn btn--line btn--sm" href="/3dmasterplan/#lotes" target="_blank" rel="noopener">${I.expand}${esc(t('home.mapFull'))}</a></div>
        <div class="legend" id="kpis">${kpisHTML()}</div>
        <div class="stage stage--map" id="stage">
          <img class="stage__poster" src="/assets/web/fotos/park-aereo-rio.jpg" alt="" loading="lazy" />
          <div class="stage__ui"><div></div>
            <div class="glass stage__card"><b class="h3" style="color:#f5f5f3">${esc(t('map.title'))}</b><p>${esc(t('map.desc'))}</p>
              <button class="btn btn--light btn--sm" type="button" id="load-map">${I.play}${esc(t('home.mapOpen'))}</button></div>
          </div>
        </div>
        <p class="small muted" style="margin:10px 0 0">${esc(t('map.note'))}</p>
      </section>`;
  };
  VIEWS['inicio:after'] = (main) => {
    const st = $('#stage', main);
    const carregar = () => {
      if (!st || st.classList.contains('is-live')) return;
      const fr = document.createElement('iframe');
      fr.className = 'stage__frame'; fr.title = t('map.title'); fr.src = '/3dmasterplan/?embed=1#lotes'; fr.allow = 'fullscreen';
      st.prepend(fr); st.classList.add('is-live'); S.mapLive = true;
    };
    $('#load-map', main).addEventListener('click', carregar);
    // carrega sozinho quando o mapa chega perto da tela (não com economia de dados)
    const economia = navigator.connection && navigator.connection.saveData;
    if (!economia && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); carregar(); } }, { rootMargin: '200px' });
      io.observe(st);
    }
    const q = $('#q-req', main);
    if (q) q.addEventListener('click', () => novoPedido());
    const badge = (id, n) => { const b = $(`[data-cnt="${id}"]`, main); if (b && n) { b.textContent = n; b.hidden = false; } };
    carregarPedidos().then(() => {
      const abertos = (S.pedidos || []).filter((p) => !['entregue', 'cancelado'].includes(p.status)).length;
      const c = $('#cnt-req', main); if (c && abertos) c.textContent = abertos;
      if (isEquipe()) badge('pedidos', (S.pedidos || []).filter((p) => p.status === 'recebido').length);
    }).catch(() => {});
    if (isEquipe()) api('corretores').then((d) => { S.corretores = d.corretores; badge('corretores', d.corretores.filter((u) => u.status === 'pendente').length); }).catch(() => {});
    const novos = (S.avisos || []).filter((a) => Date.now() - new Date(a.em).getTime() < 7 * 864e5).length + avisosAuto().length;
    if (!isEquipe()) badge('mural', novos);
  };

  /* ============================================================ materiais */
  function linkRastreado(caminho, meio) {
    const u = new URL(caminho, location.origin);
    if (S.user && S.user.slug) {
      u.searchParams.set('utm_source', 'corretor');
      u.searchParams.set('utm_medium', meio || 'corretor');
      u.searchParams.set('utm_campaign', 'corretor-' + S.user.slug);
      u.searchParams.set('utm_content', S.user.slug);
    }
    return u.href;
  }
  const kb = (n) => (n >= 1024 ? nf(n / 1024, 1) + ' MB' : nf(n) + ' KB');
  function urlMaterial(m) { return m.arquivo ? abs(m.arquivo) : (m.tipo === 'folder' || m.tipo === 'pagina' || m.link === '/3dmasterplan/') ? linkRastreado(m.link, 'corretor') : abs(m.link); }
  function tileHTML(m, i) {
    const tipoCls = m.tipo === 'logo' ? `is-logo${m.escuro ? ' is-dark' : ''}` : (!m.previa ? 'is-doc' : '');
    const media = m.previa ? `<img src="${esc(m.previa)}" alt="" loading="lazy" decoding="async" />` : `<span class="doc"><i></i><i></i>${esc(m.formato)}</span>`;
    const meta = [m.formato, m.kb ? kb(m.kb) : null, tx(C.PRODUTOS[m.produto])].filter(Boolean).join(' · ');
    const acoes = m.arquivo
      ? `<a class="btn btn--ink" href="${esc(m.arquivo)}" download aria-label="${esc(t('mat.download'))}">${I.download}<span class="lbl">${esc(t('mat.download'))}</span></a>`
      : `<a class="btn btn--ink" href="${esc(urlMaterial(m))}" target="_blank" rel="noopener" aria-label="${esc(t('mat.open'))}">${I.ext}<span class="lbl">${esc(t('mat.open'))}</span></a>`;
    return `<article class="tile">
      <div class="tile__media ${tipoCls}">
        ${media}
        <button type="button" class="tile__open" data-ver="${i}" aria-label="${esc(tx(m.titulo))}"></button>
        <span class="badge tile__fmt">${esc(tx(C.TIPOS_MATERIAL[m.tipo]))}</span>
        ${m.destaque ? `<span class="badge badge--ink tile__star">${I.star.replace('<svg', '<svg width="12" height="12"')}</span>` : ''}
      </div>
      <div class="tile__body"><b class="tile__title">${esc(tx(m.titulo))}</b><span class="tile__meta">${esc(meta)}</span>${m.desc ? `<span class="tile__meta">${esc(tx(m.desc))}</span>` : ''}</div>
      <div class="tile__actions">${acoes}
        <button type="button" class="iconbtn" data-copy="${i}" aria-label="${esc(t('mat.copy'))}" title="${esc(t('mat.copy'))}">${I.link}</button>
        <button type="button" class="iconbtn" data-share="${i}" aria-label="${esc(t('mat.share'))}" title="${esc(t('mat.share'))}">${I.share}</button>
      </div>
    </article>`;
  }
  function filtrarMateriais() {
    const q = S.mat.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return C.MATERIAIS.map((m, i) => [m, i]).filter(([m]) => (S.mat.tipo === 'all' || m.tipo === S.mat.tipo)
      && (S.mat.produto === 'all' || m.produto === S.mat.produto)
      && (!q || [tx(m.titulo), tx(m.desc), tx(C.PRODUTOS[m.produto]), m.formato].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
  }
  VIEWS.materiais = () => {
    const tipos = ['all', ...Object.keys(C.TIPOS_MATERIAL)];
    const prods = ['all', ...Object.keys(C.PRODUTOS)];
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><a href="#/${rotas()[0][0]}" class="linkbtn" style="text-decoration:none">← ${esc(t(rotas()[0][1]))}</a><span id="mat-count" class="num"></span></div>
        <div class="pagehead__body">
          <h1 class="h1">${esc(t('mat.title'))}</h1>
          <p class="lead">${esc(t('mat.lead'))}</p>
          <div class="tags" role="group" aria-label="${esc(t('mat.title'))}">${tipos.map((k) => `<button type="button" data-mtipo="${k}" aria-pressed="${S.mat.tipo === k}">${esc(k === 'all' ? t('mat.all') : tx(C.TIPOS_MATERIAL[k]))}</button>`).join('')}</div>
        </div>
      </header>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="${esc(t('req.product'))}">${prods.map((k) => `<button type="button" class="chip" data-mprod="${k}" aria-pressed="${S.mat.produto === k}">${esc(k === 'all' ? t('mat.all') : tx(C.PRODUTOS[k]))}</button>`).join('')}</div>
        <label class="search"><span class="vh">${esc(t('mat.search'))}</span>${I.search}<input class="input" type="search" id="mat-q" placeholder="${esc(t('mat.search'))}" value="${esc(S.mat.q)}" /></label>
      </div>
      <div class="grid" id="mat-grid"></div>
      <p class="small muted" style="margin-top:28px">${esc(t('mat.missing'))} <button type="button" class="linkbtn" id="mat-ask">${esc(t('req.new'))} →</button></p>`;
  };
  function desenharGrade() {
    const lst = filtrarMateriais();
    const g = $('#mat-grid');
    g.innerHTML = lst.length ? lst.map(([m, i]) => tileHTML(m, i)).join('') : `<div class="empty" style="grid-column:1/-1">${I.search}${esc(t('mat.none'))}</div>`;
    $('#mat-count').textContent = `${lst.length} ${t('mat.count')}`;
  }
  VIEWS['materiais:after'] = (main) => {
    desenharGrade();
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('button,a'); if (!b) return;
      if (b.dataset.mtipo) { S.mat.tipo = b.dataset.mtipo; $$('[data-mtipo]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharGrade(); }
      else if (b.dataset.mprod) { S.mat.produto = b.dataset.mprod; $$('[data-mprod]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharGrade(); }
      else if (b.dataset.copy) copiar(urlMaterial(C.MATERIAIS[+b.dataset.copy]));
      else if (b.dataset.share) { const m = C.MATERIAIS[+b.dataset.share]; compartilhar(tx(m.titulo), urlMaterial(m)); }
      else if (b.dataset.ver) verMaterial(C.MATERIAIS[+b.dataset.ver]);
      else if (b.id === 'mat-ask') novoPedido('material');
    });
    let tmr;
    $('#mat-q', main).addEventListener('input', (e) => { clearTimeout(tmr); tmr = setTimeout(() => { S.mat.q = e.target.value; desenharGrade(); }, 120); });
  };
  function verMaterial(m) {
    if (!m.arquivo || m.tipo !== 'foto') { window.open(m.arquivo || urlMaterial(m), '_blank', 'noopener'); return; }
    abrirSheet({
      cls: 'viewer', titulo: tx(m.titulo),
      corpo: `<img class="viewer__img" src="${esc(m.arquivo)}" alt="${esc(tx(m.titulo))}" />
        <p class="small muted" style="margin:0">${esc([m.formato, kb(m.kb), tx(C.PRODUTOS[m.produto])].join(' · '))}</p>`,
      pe: `<button type="button" class="btn btn--line" data-x="copy">${I.link}${esc(t('mat.copy'))}</button>
        <a class="btn btn--ink" href="${esc(m.arquivo)}" download>${I.download}${esc(t('mat.download'))}</a>`,
      depois: (p) => { $('[data-x=copy]', p).addEventListener('click', () => copiar(abs(m.arquivo))); },
    });
  }

  /* ============================================================ divulgar */
  function qrDe(texto) {
    const q = window.qrcode(0, 'M'); q.addData(texto); q.make(); return q;
  }
  function qrSVG(q) {
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#0b0b0b"/></svg>`;
  }
  function baixar(nome, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function qrPNG(q, nome) {
    const n = q.getModuleCount(); const s = Math.floor(1600 / (n + 8)); const lado = s * (n + 8);
    const cv = document.createElement('canvas'); cv.width = cv.height = lado; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, lado, lado); x.fillStyle = '#0b0b0b';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) x.fillRect((c + 4) * s, (r + 4) * s, s, s);
    cv.toBlob((b) => baixar(nome, b), 'image/png');
  }
  const destAtual = () => C.DESTINOS.find((d) => d.id === S.share.dest) || C.DESTINOS[0];
  function mensagem(m, lang) {
    const d = destAtual();
    const vir = precosOk() ? proximaVirada() : null;
    const virTxt = vir ? new Intl.DateTimeFormat({ pt: 'pt-BR', es: 'es-PY', en: 'en-US' }[lang], { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(vir + 'T12:00:00')) : '—';
    return m[lang].replace('{nome}', S.user.nome || '').replace('{link}', linkRastreado(d.caminho, 'whatsapp')).replace('{virada}', virTxt);
  }
  VIEWS.divulgar = () => {
    const d = destAtual();
    const ml = S.share.msgLang || S.lang;
    const msgs = C.MENSAGENS.filter((m) => m.id !== 'prazo' || (precosOk() && proximaVirada()));
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><span>${esc(t('share.code'))}</span><b class="num" style="color:var(--ink)">${esc(S.user.slug || '—')}</b></div>
        <div class="pagehead__body"><h1 class="h1">${esc(t('share.title'))}</h1><p class="lead">${esc(t('share.lead'))}</p></div>
      </header>
      <div class="sharegrid">
        <section class="card" style="display:grid;gap:18px;align-content:start">
          <h2 class="h3">${esc(t('share.dest'))}</h2>
          <div class="dests" role="group" aria-label="${esc(t('share.dest'))}">
            ${C.DESTINOS.map((x) => `<button type="button" class="dest" data-dest="${x.id}" aria-pressed="${x.id === d.id}"><b>${esc(tx(x.nome))}</b><span>${esc(x.caminho)}</span></button>`).join('')}
          </div>
          <h2 class="h3">${esc(t('share.link'))}</h2>
          <div class="linkbox"><code id="my-link">${esc(linkRastreado(d.caminho, 'corretor'))}</code>
            <button type="button" class="btn btn--ink btn--sm" id="copy-link">${I.copy}${esc(t('mat.copy'))}</button>
            <button type="button" class="iconbtn" id="share-link" aria-label="${esc(t('mat.share'))}">${I.share}</button>
          </div>
        </section>
        <section class="card card--dark qrwrap">
          <div style="display:flex;justify-content:space-between;width:100%;align-items:center"><span class="eyebrow">${esc(t('share.qr'))}</span><span class="small" style="color:var(--on-dark-muted)">${esc(tx(d.nome))}</span></div>
          <div class="qr" id="qr" role="img" aria-label="${esc(t('share.qr'))}: ${esc(tx(d.nome))}"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            <button type="button" class="btn btn--light btn--sm" id="qr-png">${I.download}${esc(t('share.png'))}</button>
            <button type="button" class="btn btn--sm" style="border-color:var(--on-dark-muted);color:var(--on-dark)" id="qr-svg">${I.download}${esc(t('share.svg'))}</button>
          </div>
        </section>
      </div>
      <section class="section">
        <div class="section__head"><div><h2 class="h2">${esc(t('share.msgs'))}</h2><p class="muted small" style="margin:6px 0 0">${esc(t('share.msgsd'))}</p></div>
          <div class="seg" role="group" aria-label="${esc(t('share.lang'))}">${['pt', 'es', 'en'].map((l) => `<button type="button" data-ml="${l}" aria-pressed="${ml === l}">${l.toUpperCase()}</button>`).join('')}</div>
        </div>
        <div class="msgs">
          ${msgs.map((m) => `<article class="card msg"><div style="display:grid;gap:8px"><span class="eyebrow">${esc(tx(m.titulo))}</span><p>${esc(mensagem(m, ml))}</p></div>
            <div class="row"><button type="button" class="btn btn--line btn--sm" data-mcopy="${m.id}">${I.copy}${esc(t('mat.copy').split(' ')[0])}</button>
            <a class="btn btn--ink btn--sm" href="https://wa.me/?text=${encodeURIComponent(mensagem(m, ml))}" target="_blank" rel="noopener">${I.wa.replace('<svg', '<svg width="16" height="16"')}${esc(t('share.wa'))}</a></div></article>`).join('')}
        </div>
      </section>`;
  };
  VIEWS['divulgar:after'] = (main) => {
    const d = destAtual();
    const linkQR = linkRastreado(d.caminho, 'qr');
    let q = null;
    if (window.qrcode) { q = qrDe(linkQR); $('#qr').innerHTML = qrSVG(q); }
    const nomeArq = `qr-bracerum-${d.id}-${(S.user.slug || 'equipe')}`;
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.dest) { S.share.dest = b.dataset.dest; renderMain(); }
      else if (b.dataset.ml) { S.share.msgLang = b.dataset.ml; renderMain(); }
      else if (b.dataset.mcopy) copiar(mensagem(C.MENSAGENS.find((m) => m.id === b.dataset.mcopy), S.share.msgLang || S.lang));
      else if (b.id === 'copy-link') copiar(linkRastreado(d.caminho, 'corretor'));
      else if (b.id === 'share-link') compartilhar('Bracerum Park', linkRastreado(d.caminho, 'corretor'));
      else if (b.id === 'qr-png' && q) qrPNG(q, nomeArq + '.png');
      else if (b.id === 'qr-svg' && q) baixar(nomeArq + '.svg', new Blob([qrSVG(q)], { type: 'image/svg+xml' }));
    });
  };

  /* ============================================================ tabela */
  VIEWS.tabela = () => {
    if (!precosOk()) return `<div class="skel" style="height:420px;border-radius:18px"></div>`;
    const P = S.precos; const jA = janelaAtual();
    const jid = S.price.janela || jA.id;
    const pi = PAG_IDX[S.price.pag];
    const cats = ['V', 'B', 'P', 'I'];
    const faixas = P.faixas.map((f) => (f.ate ? `${f.de}–${f.ate}` : `${f.de}+`));
    const tabela = P.precos[jid];
    const area = Math.max(0, Number(S.price.area) || 0);
    const m2 = tabela[S.price.cat][S.price.faixa][pi];
    const total = m2 * area;
    const pag = P.pagamentos.find((p) => p.id === S.price.pag);
    const nParc = S.price.pag === '12x' ? 12 : S.price.pag === '36x' ? 36 : 0;
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><span>P1 · v${esc(String(P.tabela).replace(/^v/, ''))} · rev. ${esc(data(P.revisao))}</span><span>${esc(t('price.window'))}: <b style="color:var(--ink)">${esc(tx(jA.nome))}</b> (${esc(t('price.now'))})</span></div>
        <div class="pagehead__body">
          <h1 class="h1">${esc(t('price.title'))}</h1><p class="lead">${esc(t('price.lead'))}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn--ink btn--sm" href="/portalcorretores/materiais/bracerum-park-tabela-de-precos-v3.1.pdf" download>${I.download}${esc(t('price.pdf'))}</a>
            <a class="btn btn--line btn--sm" href="/portalcorretores/materiais/bracerum-park-mapa-de-lotes-mp14.pdf" target="_blank" rel="noopener">${I.map}${esc(t('price.map'))}</a>
          </div>
        </div>
      </header>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="${esc(t('price.window'))}">${P.janelas.map((j) => `<button type="button" data-jan="${j.id}" aria-pressed="${j.id === jid}">${esc(tx(j.curto))}${j.id === jA.id ? ' •' : ''}</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="${esc(t('price.pay'))}">${P.pagamentos.map((p) => `<button type="button" data-pag="${p.id}" aria-pressed="${p.id === S.price.pag}">${esc(tx(p.nome))}</button>`).join('')}</div>
      </div>
      <p class="small muted" style="margin:-10px 0 14px">${esc(tx(P.janelas.find((j) => j.id === jid).quando))} · ${esc(tx(pag.nota))}</p>
      <div class="pricewrap">
        <table class="price">
          <caption class="vh">${esc(t('price.title'))}</caption>
          <thead><tr><th scope="col">${esc(t('price.cat'))}</th>${faixas.map((f) => `<th scope="col">${f} ${esc(t('price.qty'))}</th>`).join('')}</tr></thead>
          <tbody>${cats.map((c) => `<tr class="${c === S.price.cat ? 'is-on' : ''}"><td>${esc(tx(P.categorias[c].nome))}<small>× ${esc(P.categorias[c].fator)}</small></td>${tabela[c].map((v) => `<td>${nf(v[pi])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <section class="section card">
        <h2 class="h2" style="margin-bottom:16px">${esc(t('price.calc'))}</h2>
        <div class="calc">
          <label class="field"><span>${esc(t('price.cat'))}</span><select class="select" id="c-cat">${cats.map((c) => `<option value="${c}" ${c === S.price.cat ? 'selected' : ''}>${esc(tx(P.categorias[c].nome))}</option>`).join('')}</select></label>
          <label class="field"><span>${esc(t('price.area'))}</span><input class="input num" id="c-area" type="number" min="100" step="1" inputmode="numeric" value="${esc(S.price.area)}" /></label>
          <label class="field"><span>${esc(t('price.qtyLabel'))}</span><select class="select" id="c-faixa">${faixas.map((f, i) => `<option value="${i}" ${i === S.price.faixa ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
        </div>
        <div class="calcout">
          <div class="card card--flat"><span class="card__label">${esc(t('price.total'))} · ${nf(m2)} US$/m²</span><b>${usd(total)}</b></div>
          ${nParc ? `<div class="card card--flat"><span class="card__label">${esc(t('price.down'))}</span><b>${usd(total * 0.2)}</b></div>
          <div class="card card--dark"><span class="card__label" style="color:var(--on-dark-muted)">${nParc} ${esc(t('price.inst'))}</span><b>${usd((total * 0.8) / nParc)}</b></div>`
          : `<div class="card card--dark" style="grid-column:span 2"><span class="card__label" style="color:var(--on-dark-muted)">${esc(tx(pag.nome))}</span><b>${usd(total)}</b></div>`}
        </div>
        <p class="small muted" style="margin:14px 0 0">${esc(t('price.note'))}</p>
      </section>`;
  };
  VIEWS['tabela:after'] = (main) => {
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.jan) { S.price.janela = b.dataset.jan; renderMain(); }
      if (b.dataset.pag) { S.price.pag = b.dataset.pag; renderMain(); }
    });
    const rerender = () => { const y = window.scrollY; renderMain(); window.scrollTo(0, y); };
    const c = $('#c-cat', main); if (c) c.addEventListener('change', (e) => { S.price.cat = e.target.value; rerender(); });
    const f = $('#c-faixa', main); if (f) f.addEventListener('change', (e) => { S.price.faixa = +e.target.value; rerender(); });
    const a = $('#c-area', main); if (a) a.addEventListener('change', (e) => { S.price.area = Math.max(0, Math.round(+e.target.value || 0)); rerender(); $('#c-area') && $('#c-area').focus(); });
  };

  /* ============================================================ pedidos */
  async function carregarPedidos(forcar) {
    if (S.pedidos && !forcar) return S.pedidos;
    const d = await api('pedidos');
    S.pedidos = d.pedidos || [];
    return S.pedidos;
  }
  const ETAPAS = ['recebido', 'producao', 'aprovacao', 'entregue'];
  function reqCard(p) {
    const idx = ETAPAS.indexOf(p.status);
    const quem = isEquipe() ? `<span>${esc(p.corretor.nome)} · ${esc(p.corretor.imobiliaria)}</span>` : '';
    return `<button type="button" class="req" data-req="${esc(p.id)}">
      <div style="display:grid;gap:6px;min-width:0"><span class="req__title">${esc(p.titulo)}</span>
        <span class="req__meta"><span>#${esc(p.numero)}</span><span>${esc(rotuloMaterial(p))}${p.formato ? ' · ' + esc(t(p.formato === 'impresso' ? 'form.print' : p.formato === 'ambos' ? 'form.both' : 'form.digital')) : ''}${p.quantidade > 1 ? ' · ' + nf(p.quantidade) + '×' : ''}</span>${(p.anexos || []).length ? `<span>${I.file.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${p.anexos.length}</span>` : ''}<span>${esc(tx(C.PRODUTOS[p.produto]))}</span>${p.prazo ? `<span>${I.calendar.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(data(p.prazo))}</span>` : ''}${quem}</span></div>
      <span class="badge ${p.status === 'entregue' ? 'badge--ink' : ''}"><i></i>${esc(t('st.' + p.status))}</span>
      ${p.status !== 'cancelado' ? `<div class="steps" aria-hidden="true">${ETAPAS.map((e, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    </button>`;
  }
  VIEWS.pedidos = () => {
    if (S.route.arg === 'novo' && !isEquipe()) return formPedidoHTML();
    const travado = !isEquipe() && !aprovado();
    const filtros = isEquipe() ? [['abertos', 'req.open'], ['cancelado', 'st.cancelado']] : [['abertos', 'req.open'], ['todos', 'req.all']];
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><span id="req-count" class="num"></span></div>
        <div class="pagehead__body"><h1 class="h1">${esc(t('req.title'))}</h1><p class="lead">${esc(t('req.lead'))}</p>
          ${isEquipe() ? '' : `<div><button type="button" class="btn btn--ink" id="req-new" ${travado ? 'aria-disabled="true"' : ''}>${I.plus}${esc(t('req.new'))}</button>${travado ? `<p class="small muted" style="margin:10px 0 0">${I.lock.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} ${esc(t('req.locked'))}</p>` : ''}</div>`}
        </div>
      </header>
      <div class="toolbar"><div class="seg" role="group">${filtros.map(([id, k]) => `<button type="button" data-rf="${id}" aria-pressed="${S.req.filtro === id}">${esc(t(k))}</button>`).join('')}</div>
        <button type="button" class="iconbtn" id="req-reload" aria-label="↻" title="↻">${ic('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>')}</button></div>
      <div id="req-list"><div class="reqlist">${'<div class="skel" style="height:96px;border-radius:18px"></div>'.repeat(3)}</div></div>`;
  };
  function desenharPedidos() {
    const box = $('#req-list'); if (!box) return;
    const lst = S.pedidos || [];
    const f = S.req.filtro;
    const vis = lst.filter((p) => (f === 'todos' ? true : f === 'cancelado' ? p.status === 'cancelado' : !['cancelado'].includes(p.status) && (isEquipe() || p.status !== 'entregue')));
    $('#req-count').textContent = `${vis.length} / ${lst.length}`;
    if (isEquipe() && f === 'abertos') {
      box.innerHTML = `<div class="board">${ETAPAS.map((e) => { const it = vis.filter((p) => p.status === e); return `<section class="board__col"><header><span>${esc(t('st.' + e))}</span><span class="badge">${it.length}</span></header>${it.map(reqCard).join('') || `<p class="small muted" style="margin:6px">${esc(t('req.emptyTeam'))}</p>`}</section>`; }).join('')}</div>`;
    } else {
      box.innerHTML = vis.length ? `<div class="reqlist">${vis.map(reqCard).join('')}</div>` : `<div class="empty">${I.inbox}${esc(isEquipe() ? t('req.emptyTeam') : t('req.empty'))}</div>`;
    }
  }
  VIEWS['pedidos:after'] = (main) => {
    if (S.route.arg === 'novo' && !isEquipe()) return formPedidoDepois(main);
    carregarPedidos(true).then(desenharPedidos).catch((e) => { const b = $('#req-list'); if (b) b.innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.rf) { S.req.filtro = b.dataset.rf; $$('[data-rf]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharPedidos(); }
      else if (b.dataset.req) abrirPedido(b.dataset.req);
      else if (b.id === 'req-new') novoPedido();
      else if (b.id === 'req-reload') carregarPedidos(true).then(desenharPedidos);
    });
  };
  function rotuloMaterial(p) {
    if (p.material && C.MATERIAIS_PEDIDO[p.material]) return tx(C.MATERIAIS_PEDIDO[p.material].nome);
    return tx(C.TIPOS_PEDIDO[p.tipo] || C.TIPOS_PEDIDO.outro).split(' (')[0];
  }
  const urlAnexo = (a) => `/api/portal?anexo=${encodeURIComponent(a.caminho)}`;
  function novoPedido(material) {
    if (isEquipe()) return;
    if (!aprovado()) { location.hash = '#/pedidos'; toast(t('req.locked')); return; }
    S.req.material = typeof material === 'string' ? material : null;
    location.hash = '#/pedidos/novo';
  }

  /* ---------- formulário de solicitação (página) */
  function formPedidoHTML() {
    if (!aprovado()) return `<div class="empty">${I.lock}${esc(t('req.locked'))}</div>`;
    const u = S.user;
    const mat = S.req.material || '';
    const dadosPadrao = [
      `${t('auth.name')}: ${u.nome}`,
      `WhatsApp: +${u.ddi} ${u.tel}`,
      `${t('auth.email')}: ${u.email}`,
      `${t('auth.agency')}: ${u.imobiliaria}`,
      u.creci ? `CRECI: ${u.creci}` : null,
      `${t('share.link')}: ${linkRastreado('/folderpark/', 'qr')}`,
    ].filter(Boolean).join('\n');
    const amanha = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const passo = (n, titulo, dica, corpo) => `<section class="fstep"><div class="fstep__head"><span class="fstep__n num">${n}</span><div><h2 class="h3">${esc(titulo)}</h2>${dica ? `<p class="small muted" style="margin:4px 0 0">${esc(dica)}</p>` : ''}</div></div><div class="fstep__body">${corpo}</div></section>`;
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><a href="#/pedidos" class="linkbtn" style="text-decoration:none">← ${esc(t('req.title'))}</a></div>
        <div class="pagehead__body"><h1 class="h1">${esc(t('form.title'))}</h1><p class="lead">${esc(t('form.lead'))}</p></div>
      </header>
      <form id="f-req" class="reqform" novalidate>
        ${passo('01', t('form.material'), t('form.materialHint'), `<div class="mats" role="radiogroup" aria-label="${esc(t('form.material'))}">${Object.entries(C.MATERIAIS_PEDIDO).map(([k, m]) => `<button type="button" class="mat" role="radio" data-mat="${k}" aria-checked="${k === mat}">${I[m.icone] || I.dots}<b>${esc(tx(m.nome))}</b><span>${esc(tx(m.ex))}</span></button>`).join('')}</div>`)}
        ${passo('02', t('form.kind'), '', `<div class="seg" role="radiogroup" aria-label="${esc(t('form.kind'))}" id="f-formato">${[['digital', 'form.digital'], ['impresso', 'form.print'], ['ambos', 'form.both']].map(([v, k]) => `<button type="button" role="radio" data-formato="${v}" aria-checked="false" aria-pressed="false">${esc(t(k))}</button>`).join('')}</div>
          <div class="grid3">
            <label class="field"><span>${esc(t('form.qty'))}</span><input class="input num" type="number" name="quantidade" min="1" max="100000" value="1" inputmode="numeric" /><small id="qty-hint">${esc(t('form.qtyHint'))}</small></label>
            <label class="field"><span>${esc(t('form.size'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="medida" list="medidas" maxlength="80" placeholder="1080 × 1350" /><datalist id="medidas">${['1080 × 1080', '1080 × 1350', '1080 × 1920', 'A4', 'A5', '10 × 15 cm', '9 × 5 cm', '1920 × 1080', '2 × 1 m'].map((m) => `<option value="${m}">`).join('')}</datalist></label>
            <label class="field"><span>${esc(t('req.product'))}</span><select class="select" name="produto">${Object.keys(C.PRODUTOS).map((k) => `<option value="${k}">${esc(tx(C.PRODUTOS[k]))}</option>`).join('')}</select></label>
          </div>`)}
        ${passo('03', t('form.fill'), t('form.fillHint'), `<textarea class="textarea" name="dados" maxlength="1500" style="min-height:150px">${esc(dadosPadrao)}</textarea>`)}
        ${passo('04', t('form.details'), t('form.detailsHint'), `<textarea class="textarea" name="descricao" maxlength="2000" placeholder="${esc(t('req.descPh'))}"></textarea>`)}
        ${passo('05', t('form.examples'), t('form.examplesHint'), `
          <label class="drop" id="drop"><input type="file" id="f-files" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" />
            ${I.download.replace('<svg', '<svg style="transform:rotate(180deg)"')}<b>${esc(t('form.drop'))}</b><span>${esc(t('form.dropHint'))}</span></label>
          <ul class="files" id="f-list"></ul>
          <label class="field"><span>${esc(t('req.ref'))}</span><input class="input" type="url" name="referencia" placeholder="https://" inputmode="url" /></label>`)}
        ${passo('06', t('form.when'), '', `<div class="grid2">
            <label class="field"><span>${esc(t('req.due'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" type="date" name="prazo" min="${amanha}" /></label>
            <label class="field"><span>${esc(t('req.lang'))}</span><select class="select" name="idioma">${['pt', 'es', 'en'].map((l) => `<option value="${l}" ${l === S.lang ? 'selected' : ''}>${{ pt: 'Português', es: 'Español', en: 'English' }[l]}</option>`).join('')}</select></label></div>`)}
        <div class="reqform__foot">
          <p class="formmsg" role="alert"></p>
          <div class="reqform__actions"><a class="btn btn--line" href="#/pedidos">${esc(t('req.close'))}</a><button type="submit" class="btn btn--ink">${esc(t('req.send'))}${I.arrow}</button></div>
        </div>
      </form>`;
  }

  // Foto grande é reduzida no navegador (máx. 2400 px, JPEG 85%) para caber no limite de 3 MB por arquivo.
  function prepararArquivo(f) {
    const LIM = 3 * 1024 * 1024;
    return new Promise((ok, falha) => {
      const ler = (blob, tipo, nome) => {
        const r = new FileReader();
        r.onload = () => ok({ nome, tipo, dados: String(r.result).split(',')[1], kb: Math.ceil(blob.size / 1024) });
        r.onerror = () => falha(new Error(t('c.error')));
        r.readAsDataURL(blob);
      };
      const ehImagem = /^image\/(jpeg|png|webp)$/.test(f.type);
      if (!ehImagem || f.size <= 1.5 * 1024 * 1024) {
        if (f.size > LIM) return falha(new Error(`${f.name}: ${t('form.tooBig')}`));
        return ler(f, f.type, f.name);
      }
      const img = new Image();
      img.onload = () => {
        const esc2 = Math.min(1, 2400 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * esc2); cv.height = Math.round(img.height * esc2);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(img.src);
        cv.toBlob((b) => {
          if (!b || b.size > LIM) return falha(new Error(`${f.name}: ${t('form.tooBig')}`));
          ler(b, 'image/jpeg', f.name.replace(/\.\w+$/, '') + '.jpg');
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => falha(new Error(`${f.name}: ${t('c.error')}`));
      img.src = URL.createObjectURL(f);
    });
  }
  function formPedidoDepois(main) {
    const f = $('#f-req', main);
    if (!f) return;
    let material = C.MATERIAIS_PEDIDO[S.req.material] ? S.req.material : null;
    let formato = null;
    const arquivos = [];
    const marcar = (sel, attr, v) => $$(sel, f).forEach((b) => { const on = b.dataset[attr] === v; b.setAttribute('aria-checked', on); b.setAttribute('aria-pressed', on); });
    $$('[data-mat]', f).forEach((b) => b.addEventListener('click', () => {
      material = b.dataset.mat; marcar('[data-mat]', 'mat', material);
      const m = C.MATERIAIS_PEDIDO[material];
      if (m.formato && !formato) { formato = m.formato; marcar('[data-formato]', 'formato', formato); }
      const med = $('[name=medida]', f); if (m.medida && !med.value) med.placeholder = m.medida;
    }));
    $$('[data-formato]', f).forEach((b) => b.addEventListener('click', () => { formato = b.dataset.formato; marcar('[data-formato]', 'formato', formato); }));
    const lista = $('#f-list', f);
    const desenhar = () => {
      lista.innerHTML = arquivos.map((a, i) => `<li class="file">${a.tipo === 'application/pdf' ? `<span class="file__ico">${I.file}</span>` : `<img src="data:${a.tipo};base64,${a.dados}" alt="" />`}<span class="file__n">${esc(a.nome)}<small>${kb(a.kb)}</small></span><button type="button" class="iconbtn" data-rmf="${i}" aria-label="${esc(t('team.remove'))}">${I.x}</button></li>`).join('');
    };
    const adicionar = async (files) => {
      const msg = $('.formmsg', f); msg.textContent = '';
      for (const file of Array.from(files)) {
        if (arquivos.length >= 6) { msg.textContent = t('form.max'); break; }
        try { arquivos.push(await prepararArquivo(file)); } catch (e) { msg.textContent = e.message; }
      }
      desenhar();
    };
    $('#f-files', f).addEventListener('change', (e) => { adicionar(e.target.files); e.target.value = ''; });
    const drop = $('#drop', f);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => adicionar(e.dataTransfer.files));
    lista.addEventListener('click', (e) => { const b = e.target.closest('[data-rmf]'); if (b) { arquivos.splice(+b.dataset.rmf, 1); desenhar(); } });

    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      const msg = $('.formmsg', f); msg.textContent = '';
      if (!material) { msg.textContent = t('form.needMaterial'); $('[data-mat]', f).focus(); return; }
      if (!formato) { msg.textContent = t('form.needKind'); $('[data-formato]', f).focus(); return; }
      if ((fd.dados || '').trim().length + (fd.descricao || '').trim().length < 10) { msg.textContent = t('form.needInfo'); return; }
      const btn = $('button[type=submit]', f); btn.disabled = true;
      const tituloAuto = `${tx(C.MATERIAIS_PEDIDO[material].nome)} · ${tx(C.PRODUTOS[fd.produto])}`;
      try {
        btn.innerHTML = `<span class="spin"></span>${esc(t('form.sending'))}`;
        let d = await api('pedido', { ...fd, material, formato, tituloAuto });
        for (let i = 0; i < arquivos.length; i++) {
          btn.innerHTML = `<span class="spin"></span>${esc(t('form.uploading'))} ${i + 1}/${arquivos.length}`;
          try { d = await api('anexo', { pedido: d.pedido.id, ...arquivos[i] }); }
          catch (e) { toast(`${arquivos[i].nome}: ${e.message}`); }
        }
        S.pedidos = [d.pedido, ...(S.pedidos || []).filter((p) => p.id !== d.pedido.id)];
        S.req.material = null;
        toast(t('req.sent'));
        location.hash = '#/pedidos';
        setTimeout(() => abrirPedido(d.pedido.id), 250);
      } catch (e) { msg.textContent = e.message; btn.disabled = false; btn.innerHTML = `${esc(t('req.send'))}${I.arrow}`; }
    });
  }
  function abrirPedido(id) {
    const p = (S.pedidos || []).find((x) => x.id === id);
    if (!p) return;
    const idx = ETAPAS.indexOf(p.status);
    const wa = `https://wa.me/${p.corretor.ddi}${p.corretor.tel}`;
    const edicao = isEquipe() ? `
      <form id="f-upd" style="display:grid;gap:14px" class="card card--flat">
        <div class="grid2">
          <label class="field"><span>Status</span><select class="select" name="status">${[...ETAPAS, 'cancelado'].map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${esc(t('st.' + s))}</option>`).join('')}</select></label>
          <label class="field"><span>${esc(t('req.owner'))}</span><input class="input" name="responsavel" value="${esc(p.responsavel || S.user.nome)}" /></label>
        </div>
        <label class="field"><span>${esc(t('req.answer'))}</span><textarea class="textarea" name="resposta" style="min-height:90px">${esc(p.resposta || '')}</textarea></label>
        <label class="field"><span>${esc(t('req.delivery'))} (https://)</span><input class="input" type="url" name="entrega" value="${esc(p.entrega || '')}" placeholder="https://drive.google.com/…" /></label>
        <p class="formmsg" role="alert"></p>
      </form>` : '';
    abrirSheet({
      titulo: `#${p.numero} · ${p.titulo}`,
      corpo: `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="badge ${p.status === 'entregue' ? 'badge--ink' : ''}"><i></i>${esc(t('st.' + p.status))}</span><span class="small muted">${esc(data(p.atualizado, true))}</span></div>
        ${p.status !== 'cancelado' ? `<div class="steps" style="grid-template-columns:repeat(4,1fr)">${ETAPAS.map((e, i) => `<i class="${i <= idx ? 'on' : ''}" title="${esc(t('st.' + e))}"></i>`).join('')}</div>` : ''}
        ${p.entrega ? `<a class="btn btn--ink" href="${esc(p.entrega)}" target="_blank" rel="noopener">${I.download}${esc(t('req.delivery'))}</a>` : ''}
        ${p.resposta && !isEquipe() ? `<div class="card card--flat"><span class="eyebrow">${esc(t('req.answer'))}</span><p style="margin:8px 0 0;white-space:pre-line">${esc(p.resposta)}</p></div>` : ''}
        <dl class="kv">
          <dt>${esc(t('form.material'))}</dt><dd>${esc(rotuloMaterial(p))}</dd>
          ${p.formato ? `<dt>${esc(t('form.kind'))}</dt><dd>${esc(t(p.formato === 'impresso' ? 'form.print' : p.formato === 'ambos' ? 'form.both' : 'form.digital'))}</dd>` : ''}
          ${p.quantidade ? `<dt>${esc(t('form.qty'))}</dt><dd class="num">${nf(p.quantidade)}</dd>` : ''}
          ${p.medida ? `<dt>${esc(t('form.size'))}</dt><dd>${esc(p.medida)}</dd>` : ''}
          <dt>${esc(t('req.product'))}</dt><dd>${esc(tx(C.PRODUTOS[p.produto]))}</dd>
          <dt>${esc(t('req.lang'))}</dt><dd>${esc(p.idioma.toUpperCase())}</dd>
          ${p.prazo ? `<dt>${esc(t('req.due'))}</dt><dd>${esc(data(p.prazo))}</dd>` : ''}
          ${p.referencia ? `<dt>${esc(t('req.ref').split(' (')[0])}</dt><dd><a class="linkbtn" href="${esc(p.referencia)}" target="_blank" rel="noopener">${esc(p.referencia)}</a></dd>` : ''}
          ${isEquipe() ? `<dt>${esc(t('req.from'))}</dt><dd>${esc(p.corretor.nome)} · ${esc(p.corretor.imobiliaria)}<br/><a class="linkbtn" href="${wa}" target="_blank" rel="noopener">WhatsApp</a> · <a class="linkbtn" href="mailto:${esc(p.corretor.email)}">${esc(p.corretor.email)}</a></dd>` : ''}
        </dl>
        ${p.dados ? `<div><span class="eyebrow">${esc(t('form.fill'))}</span><p style="margin:8px 0 0;white-space:pre-line">${esc(p.dados)}</p></div>` : ''}
        ${p.descricao ? `<div><span class="eyebrow">${esc(t('form.details'))}</span><p style="margin:8px 0 0;white-space:pre-line">${esc(p.descricao)}</p></div>` : ''}
        ${(p.anexos || []).length ? `<div><span class="eyebrow">${esc(t('form.examples'))}</span><ul class="files" style="margin-top:10px">${p.anexos.map((x) => `<li class="file">${x.tipo.startsWith('image/') ? `<img src="${esc(urlAnexo(x))}" alt="" loading="lazy" />` : `<span class="file__ico">${I.file}</span>`}<span class="file__n">${esc(x.nome)}<small>${kb(x.kb)}</small></span><a class="iconbtn" href="${esc(urlAnexo(x))}" target="_blank" rel="noopener" aria-label="${esc(t('mat.open'))}">${I.ext}</a></li>`).join('')}</ul></div>` : ''}
        ${edicao}
        <div><span class="eyebrow">${esc(t('req.history'))}</span><ul class="timeline" style="margin-top:12px">${(p.historico || []).map((h) => `<li><span>${esc(t('st.' + h.status))} · <span class="muted">${esc(h.por || '')} · ${esc(data(h.em, true))}</span></span></li>`).join('')}</ul></div>`,
      pe: isEquipe()
        ? `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-upd" class="btn btn--ink">${esc(t('req.save'))}</button>`
        : `${p.status === 'recebido' ? `<button type="button" class="btn btn--line" data-x="cancel">${esc(t('req.cancel'))}</button>` : ''}<button type="button" class="btn btn--ink" data-x="close">${esc(t('req.close'))}</button>`,
      depois: (panel) => {
        const c = $('[data-x=cancel]', panel);
        if (c) c.addEventListener('click', async () => {
          c.disabled = true;
          try { const d = await api('pedidoCancelar', { id: p.id }); Object.assign(p, d.pedido); fecharSheet(); desenharPedidos(); }
          catch (e) { toast(e.message); c.disabled = false; }
        });
        const f = $('#f-upd', panel);
        if (f) f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          const btn = $('button[form=f-upd]', panel); btn.disabled = true;
          try { const d = await api('pedidoAtualizar', { id: p.id, ...fd }); Object.assign(p, d.pedido); fecharSheet(); toast(t('acc.saved')); desenharPedidos(); }
          catch (e) { $('.formmsg', f).textContent = e.message; btn.disabled = false; }
        });
      },
    });
  }

  /* ============================================================ aprender */
  function blocoHTML(b) {
    const [k, v] = b;
    if (k === 'h') return `<h2>${esc(v)}</h2>`;
    if (k === 'p') return `<p>${esc(v)}</p>`;
    if (k === 'q') return `<blockquote>${esc(v)}</blockquote>`;
    if (k === 'l') return `<ul>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (k === 'o') return `<ol>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
    if (k === 'n') return `<div class="numbers">${v.map(([n, d]) => `<div><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('')}</div>`;
    return '';
  }
  function contatosHTML() {
    return `<div class="people">${C.CONTATOS.map((c) => `<article class="card person"><span class="avatar">${esc(iniciais(c.nome))}</span>
      <div><b class="h3">${esc(c.nome)}</b><div class="small muted">${esc(tx(c.papel))} · <span class="num">${esc(c.tel)}</span></div></div>
      <div class="row"><a class="btn btn--ink btn--sm" href="https://wa.me/${c.wa}" target="_blank" rel="noopener">${I.wa.replace('<svg', '<svg width="16" height="16"')}WhatsApp</a>
      <a class="btn btn--line btn--sm" href="mailto:${esc(c.email)}">${I.mail}${esc(c.email)}</a></div></article>`).join('')}</div>`;
  }
  VIEWS.aprender = () => {
    const g = C.GUIAS.find((x) => x.id === S.route.arg);
    if (g) {
      return `<article class="article">
        <a href="#/aprender" class="linkbtn" style="text-decoration:none;display:inline-flex;gap:8px;align-items:center">${I.back.replace('<svg', '<svg width="18" height="18"')}${esc(t('learn.back'))}</a>
        <p class="eyebrow" style="margin-top:28px">${g.min} ${esc(t('learn.min'))}</p>
        <h1 class="h1" style="margin-top:10px">${esc(tx(g.titulo))}</h1>
        <p class="lead" style="margin-top:14px">${esc(tx(g.resumo))}</p>
        <div class="article__cover"><img src="${esc(g.capa)}" alt="" /></div>
        <div class="prose">${(g.corpo[S.lang] || g.corpo.pt).map(blocoHTML).join('')}</div>
      </article>`;
    }
    return `
      <header class="pagehead"><div class="pagehead__meta"><span class="num">${C.GUIAS.length} ${esc(S.lang === 'en' ? 'guides' : 'guias')}</span></div>
        <div class="pagehead__body"><h1 class="h1">${esc(t('learn.title'))}</h1><p class="lead">${esc(t('learn.lead'))}</p></div></header>
      <div class="guides">${C.GUIAS.map((x) => `<a class="guide" href="#/aprender/${x.id}"><div class="guide__media"><img src="${esc(x.capa)}" alt="" loading="lazy" /></div>
        <span class="eyebrow">${x.min} ${esc(t('learn.min'))}</span><b>${esc(tx(x.titulo))}</b><p>${esc(tx(x.resumo))}</p></a>`).join('')}</div>
      <section class="section"><h2 class="h2" style="margin-bottom:12px">${esc(t('learn.faq'))}</h2>
        <div class="faq">${C.FAQ.map((f) => `<details><summary>${esc(tx(f.q))}</summary><p>${esc(tx(f.a))}</p></details>`).join('')}</div></section>
      <section class="section"><h2 class="h2" style="margin-bottom:16px">${esc(t('learn.contacts'))}</h2>${contatosHTML()}</section>`;
  };

  /* ============================================================ conta */
  VIEWS.conta = () => {
    const u = S.user;
    const tema = (() => { try { return localStorage.getItem('bp-portal-tema') || 'auto'; } catch (e) { return 'auto'; } })();
    const prefs = `<section class="card" style="display:grid;gap:16px;align-content:start">
        <h2 class="h3">${esc(t('acc.lang'))}</h2>${langSwitch()}
        <h2 class="h3">${esc(t('acc.theme'))}</h2>
        <div class="seg" role="group">${[['light', 'acc.light'], ['dark', 'acc.dark'], ['auto', 'acc.auto']].map(([v, k]) => `<button type="button" data-tema="${v}" aria-pressed="${tema === v}">${esc(t(k))}</button>`).join('')}</div>
        <button type="button" class="btn btn--line" id="sair" style="justify-self:start">${I.out}${esc(t('acc.out'))}</button>
      </section>`;
    if (isEquipe()) {
      const senha = u.conta ? `<form id="f-senha-eq" class="card" style="display:grid;gap:12px;align-content:start" novalidate><h2 class="h3">${esc(t('acc.pass'))}</h2>
          <label class="field"><span>${esc(t('acc.passNow'))}</span><input class="input" type="password" name="senhaAtual" autocomplete="current-password" required /></label>
          <label class="field"><span>${esc(t('acc.passNew'))}</span><input class="input" type="password" name="senhaNova" autocomplete="new-password" minlength="8" required /></label>
          <p class="formmsg" role="alert"></p><button type="submit" class="btn btn--ink" style="justify-self:start">${esc(t('acc.save'))}</button></form>`
        : `<section class="card"><h2 class="h3" style="margin-bottom:12px">${esc(t('learn.contacts'))}</h2>${contatosHTML()}</section>`;
      return `<header class="pagehead"><div class="pagehead__meta"><span>${esc(t('team.hi'))}</span>${u.email ? `<span>${esc(u.email)}</span>` : ''}</div><div class="pagehead__body"><h1 class="h1">${esc(u.nome)}</h1></div></header>
        <div class="split">${prefs}${senha}</div>`;
    }
    const ddiOpts = ['55', '595', '54', '598', '1', '351'].map((d) => `<option value="${d}" ${d === u.ddi ? 'selected' : ''}>+${d}</option>`).join('');
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><span class="avatar avatar--lg">${esc(iniciais(u.nome))}</span></div>
        <div class="pagehead__body"><h1 class="h1">${esc(u.nome)}</h1>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="badge ${u.status === 'aprovado' ? 'badge--ink' : ''}"><i></i>${esc(t('acc.' + u.status))}</span><span class="small muted">${esc(u.email)} · ${esc(t('acc.since'))} ${esc(data(u.criado))}</span></div></div>
      </header>
      <div class="split">
        <section class="card">
          <form id="f-perfil" style="display:grid;gap:14px" novalidate>
            <h2 class="h3">${esc(t('acc.title'))}</h2>
            <label class="field"><span>${esc(t('auth.name'))}</span><input class="input" name="nome" value="${esc(u.nome)}" required /></label>
            <div class="grid2">
              <label class="field"><span>${esc(t('auth.wa'))}</span><span class="phone"><select class="select" name="ddi">${ddiOpts}</select><input class="input" name="tel" value="${esc(u.tel)}" inputmode="tel" required /></span></label>
              <label class="field"><span>${esc(t('auth.agency'))}</span><input class="input" name="imobiliaria" value="${esc(u.imobiliaria)}" required /></label>
            </div>
            <label class="field"><span>${esc(t('auth.creci'))}</span><input class="input" name="creci" value="${esc(u.creci || '')}" /></label>
            <details><summary class="linkbtn" style="cursor:pointer;list-style:none">${esc(t('acc.pass'))}</summary>
              <div class="grid2" style="margin-top:12px">
                <label class="field"><span>${esc(t('acc.passNow'))}</span><input class="input" type="password" name="senhaAtual" autocomplete="current-password" /></label>
                <label class="field"><span>${esc(t('acc.passNew'))}</span><input class="input" type="password" name="senhaNova" autocomplete="new-password" minlength="8" /></label>
              </div></details>
            <p class="formmsg" role="alert"></p>
            <button class="btn btn--ink" type="submit" style="justify-self:start">${esc(t('acc.save'))}</button>
          </form>
        </section>
        ${prefs}
      </div>
      <section class="section"><h2 class="h2" style="margin-bottom:16px">${esc(t('learn.contacts'))}</h2>${contatosHTML()}</section>
      <section class="section"><details class="card card--flat"><summary class="linkbtn" style="cursor:pointer;list-style:none">${esc(t('acc.delete'))}</summary>
        <form id="f-del" style="display:grid;gap:12px;margin-top:14px;max-width:420px" novalidate>
          <p class="small muted" style="margin:0">${esc(t('acc.deleteInfo'))}</p>
          <label class="field"><span>${esc(t('auth.pass'))}</span><input class="input" type="password" name="senha" autocomplete="current-password" required /></label>
          <p class="formmsg" role="alert"></p>
          <button type="submit" class="btn btn--line" style="justify-self:start">${esc(t('acc.delete'))}</button>
        </form></details></section>`;
  };
  VIEWS['conta:after'] = (main) => {
    bindLang(main);
    $$('[data-tema]', main).forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.tema;
      try { if (v === 'auto') localStorage.removeItem('bp-portal-tema'); else localStorage.setItem('bp-portal-tema', v); } catch (e) {}
      if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
      $$('[data-tema]', main).forEach((x) => x.setAttribute('aria-pressed', x === b));
    }));
    $('#sair', main).addEventListener('click', async () => { await api('sair').catch(() => {}); S.user = null; S.pedidos = null; S.corretores = null; authTab = 'in'; history.replaceState(null, '', location.pathname); render(); });
    const fse = $('#f-senha-eq', main);
    if (fse) fse.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(fse).entries());
      try { await api('senhaEquipe', fd); fse.reset(); toast(t('acc.saved')); }
      catch (e) { $('.formmsg', fse).textContent = e.message; }
    });
    const fdel = $('#f-del', main);
    if (fdel) fdel.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const senha = new FormData(fdel).get('senha');
      if (!senha) return;
      if (!confirm(t('acc.deleteInfo'))) return;
      try { await api('excluirConta', { senha }); S.user = null; S.pedidos = null; authTab = 'in'; history.replaceState(null, '', location.pathname); render(); }
      catch (e) { $('.formmsg', fdel).textContent = e.message; }
    });
    const f = $('#f-perfil', main);
    if (f) f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      if (!fd.senhaNova) { delete fd.senhaNova; delete fd.senhaAtual; }
      const msg = $('.formmsg', f); msg.textContent = '';
      try { const d = await api('perfil', fd); S.user = d.usuario; toast(t('acc.saved')); renderMain(); }
      catch (e) { msg.textContent = e.message; }
    });
  };

  /* ============================================================ equipe: corretores */
  VIEWS.corretores = () => `
    <header class="pagehead"><div class="pagehead__meta"><span id="br-count" class="num"></span></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('team.brokers'))}</h1></div></header>
    <div class="toolbar"><div class="seg" role="group">${[['pendente', 'team.pending'], ['aprovado', 'acc.aprovado'], ['bloqueado', 'acc.bloqueado'], ['todos', 'req.all']].map(([id, k]) => `<button type="button" data-bf="${id}" aria-pressed="${S.team.filtro === id}">${esc(t(k))}</button>`).join('')}</div>
      <button type="button" class="btn btn--line btn--sm" id="br-csv">${I.download}${esc(t('team.csv'))}</button></div>
    <div id="br-list"><div class="skel" style="height:240px;border-radius:18px"></div></div>
    <section class="section split">
      <div class="card"><h2 class="h3" style="margin-bottom:12px">${esc(t('inv.team'))}</h2><div id="eq-list" class="feed"></div></div>
      <form class="card" id="f-conv" style="display:grid;gap:12px;align-content:start" novalidate>
        <h2 class="h3">${esc(t('inv.invite'))}</h2><p class="small muted" style="margin:0">${esc(t('inv.inviteInfo'))}</p>
        <div class="grid2"><label class="field"><span>${esc(t('inv.name'))}</span><input class="input" name="nome" /></label>
        <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" name="email" required /></label></div>
        <p class="formmsg" role="alert"></p>
        <button type="submit" class="btn btn--ink" style="justify-self:start">${I.link}${esc(t('inv.make'))}</button>
      </form>
    </section>`;
  function desenharCorretores() {
    const box = $('#br-list'); if (!box) return;
    const lst = S.corretores || [];
    const vis = lst.filter((u) => S.team.filtro === 'todos' || u.status === S.team.filtro);
    $('#br-count').textContent = `${vis.length} / ${lst.length}`;
    if (!vis.length) { box.innerHTML = `<div class="empty">${I.users}${esc(t('team.noBrokers'))}</div>`; return; }
    box.innerHTML = `<div class="tablewrap"><table class="table"><thead><tr><th>${esc(t('auth.name'))}</th><th>${esc(t('auth.agency'))}</th><th>${esc(t('auth.wa'))} · ${esc(t('auth.email'))}</th><th>${esc(t('acc.status'))}</th><th></th></tr></thead><tbody>
      ${vis.map((u) => `<tr><td><b>${esc(u.nome)}</b><div class="small muted">${esc(data(u.criado))}${u.ultimoAcesso ? ` · ${esc(t('team.lastSeen'))} ${esc(data(u.ultimoAcesso, true))}` : ''}</div></td>
        <td>${esc(u.imobiliaria)}${u.creci ? `<div class="small muted">${esc(u.creci)}</div>` : ''}</td>
        <td><a class="linkbtn" href="https://wa.me/${esc(u.ddi)}${esc(u.tel)}" target="_blank" rel="noopener">+${esc(u.ddi)} ${esc(u.tel)}</a><div class="small"><a href="mailto:${esc(u.email)}">${esc(u.email)}</a></div></td>
        <td><span class="badge ${u.status === 'aprovado' ? 'badge--ink' : ''}"><i></i>${esc(t('acc.' + u.status))}</span></td>
        <td><div class="row">
          ${u.status !== 'aprovado' ? `<button type="button" class="btn btn--ink btn--sm" data-ba="${esc(u.id)}" data-st="aprovado">${I.check}${esc(t(u.status === 'bloqueado' ? 'team.unblock' : 'team.approve'))}</button>` : ''}
          ${u.status !== 'bloqueado' ? `<button type="button" class="btn btn--line btn--sm" data-ba="${esc(u.id)}" data-st="bloqueado">${esc(t('team.block'))}</button>` : ''}
          <button type="button" class="btn btn--ghost btn--sm" data-reset="${esc(u.id)}">${esc(t('team.reset'))}</button></div></td></tr>`).join('')}
    </tbody></table></div>`;
  }
  VIEWS['corretores:after'] = (main) => {
    const desenharEquipe = (lst) => {
      const box = $('#eq-list'); if (!box) return;
      box.innerHTML = (lst || []).length ? lst.map((p) => `<div class="notice"><span class="avatar" style="width:36px;height:36px;font-size:12px">${esc(iniciais(p.nome || p.email))}</span><div><b>${esc(p.nome || p.email)}</b><p>${esc(p.email)} · ${esc(p.ativo ? t('acc.aprovado') : t('inv.waiting'))}${p.ultimoAcesso ? ` · ${esc(t('team.lastSeen'))} ${esc(data(p.ultimoAcesso, true))}` : ''}</p></div></div>`).join('')
        : `<p class="small muted" style="margin:0">${esc(t('inv.none'))}</p>`;
    };
    const carregar = () => api('corretores').then((d) => { S.corretores = d.corretores; desenharCorretores(); desenharEquipe(d.equipe); }).catch((e) => { $('#br-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
    carregar();
    const fc = $('#f-conv', main);
    fc.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(fc).entries());
      const msg = $('.formmsg', fc); msg.textContent = '';
      try {
        const d = await api('convidar', fd);
        const txt = `Bracerum Park · ${t('brand')}\n${t('inv.msg')}\n${d.link}`;
        abrirSheet({ titulo: t('inv.invite'), corpo: `<p style="margin:0">${esc(t('inv.linkInfo'))}</p><div class="linkbox"><code>${esc(d.link)}</code><button type="button" class="btn btn--ink btn--sm" data-x="cp">${I.copy}</button></div>`,
          pe: `<a class="btn btn--line" href="mailto:${esc(fd.email)}?subject=${encodeURIComponent('Bracerum Park · ' + t('brand'))}&body=${encodeURIComponent(txt)}">${I.mail}E-mail</a><a class="btn btn--ink" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">${I.wa.replace('<svg', '<svg width="16" height="16"')}WhatsApp</a>`,
          depois: (p) => $('[data-x=cp]', p).addEventListener('click', () => copiar(d.link)) });
        fc.reset(); carregar();
      } catch (e) { msg.textContent = e.message; }
    });
    main.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.bf) { S.team.filtro = b.dataset.bf; $$('[data-bf]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharCorretores(); }
      else if (b.dataset.ba) {
        b.disabled = true;
        try { const d = await api('corretor', { id: b.dataset.ba, status: b.dataset.st }); Object.assign(S.corretores.find((u) => u.id === d.corretor.id), d.corretor); desenharCorretores(); toast(t('acc.saved')); }
        catch (e) { toast(e.message); b.disabled = false; }
      } else if (b.dataset.reset) {
        const u = S.corretores.find((x) => x.id === b.dataset.reset);
        if (!confirm(`${t('team.reset')}: ${u.nome}?`)) return;
        try {
          const d = await api('corretor', { id: u.id, novaSenha: true });
          const txt = `Bracerum Park · ${t('brand')}\n${location.origin}/PortalCorretores\n${t('auth.email')}: ${u.email}\n${t('auth.pass')}: ${d.senhaNova}`;
          abrirSheet({ titulo: t('team.reset'), corpo: `<p>${esc(t('team.newPass'))}</p><div class="linkbox"><code>${esc(d.senhaNova)}</code><button type="button" class="btn btn--ink btn--sm" data-x="cp">${I.copy}</button></div>`,
            pe: `<a class="btn btn--ink" href="https://wa.me/${esc(u.ddi)}${esc(u.tel)}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">${I.wa.replace('<svg', '<svg width="16" height="16"')}WhatsApp</a>`,
            depois: (p) => $('[data-x=cp]', p).addEventListener('click', () => copiar(d.senhaNova)) });
        } catch (e) { toast(e.message); }
      } else if (b.id === 'br-csv') {
        const lin = [['nome', 'email', 'whatsapp', 'imobiliaria', 'creci', 'pais', 'status', 'criado', 'ultimo_acesso', 'codigo']]
          .concat((S.corretores || []).map((u) => [u.nome, u.email, `+${u.ddi}${u.tel}`, u.imobiliaria, u.creci || '', u.pais || '', u.status, u.criado, u.ultimoAcesso || '', u.slug]));
        const csv = lin.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
        baixar(`corretores-bracerum-${hojeISO()}.csv`, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      }
    });
  };

  /* ============================================================ mural (corretor lê; equipe publica) */
  VIEWS.mural = () => (isEquipe() ? muralEquipe() : `
    <header class="pagehead"><div class="pagehead__meta"><span>${esc(t('top.board'))}</span></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('home.board'))}</h1><p class="lead">${esc(t('board.lead'))}</p></div></header>
    <section class="card board-read"><div id="av-list"><div class="skel" style="height:80px"></div></div></section>`);
  const muralEquipe = () => `
    <header class="pagehead"><div class="pagehead__meta"><span>${esc(t('home.board'))}</span></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('team.boardTitle'))}</h1></div></header>
    <div class="split">
      <section class="card"><form id="f-aviso" style="display:grid;gap:14px" novalidate>
        <label class="field"><span>${esc(t('req.titleF'))}</span><input class="input" name="titulo" maxlength="100" required /></label>
        <label class="field"><span>${esc(t('team.boardText'))}</span><textarea class="textarea" name="texto" maxlength="600"></textarea></label>
        <label class="field"><span>${esc(t('team.boardLink'))}</span><input class="input" name="link" placeholder="https://… ${S.lang === 'en' ? 'or' : 'ou'} #/tabela" /></label>
        <label class="check"><input type="checkbox" name="fixo" /><span>${esc(t('team.boardPin'))}</span></label>
        <p class="formmsg" role="alert"></p>
        <button type="submit" class="btn btn--ink" style="justify-self:start">${I.megaphone}${esc(t('team.publish'))}</button>
      </form></section>
      <section class="card"><h2 class="h3" style="margin-bottom:8px">${esc(t('home.board'))}</h2><div id="av-list"></div></section>
    </div>`;
  function desenharAvisos() {
    const box = $('#av-list'); if (!box) return;
    if (!isEquipe()) { box.innerHTML = muralHTML(40); return; }
    const lst = S.avisos || [];
    box.innerHTML = lst.length ? `<div class="feed">${lst.map((a) => `<div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start">${noticeHTML(a)}<button type="button" class="btn btn--ghost btn--sm" data-rm="${esc(a.id)}">${esc(t('team.remove'))}</button></div>`).join('')}</div>` : `<p class="muted small">${esc(t('home.boardEmpty'))}</p>`;
  }
  VIEWS['mural:after'] = (main) => {
    api('eu').then((d) => { S.avisos = d.avisos || []; desenharAvisos(); }).catch(() => desenharAvisos());
    const f = $('#f-aviso', main);
    if (!f) return;
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      try { const d = await api('aviso', { ...fd, fixo: !!fd.fixo }); S.avisos = d.avisos; f.reset(); desenharAvisos(); toast(t('acc.saved')); }
      catch (e) { $('.formmsg', f).textContent = e.message; }
    });
    main.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-rm]'); if (!b) return;
      try { const d = await api('aviso', { remover: b.dataset.rm }); S.avisos = d.avisos; desenharAvisos(); } catch (e) { toast(e.message); }
    });
  };

  /* ============================================================ folha lateral */
  let ultimoFoco = null;
  let teclaSheet = null;
  function abrirSheet({ titulo, corpo, pe, depois, cls }) {
    fecharSheet();
    ultimoFoco = document.activeElement;
    const el = document.createElement('div');
    el.className = 'sheet ' + (cls || '');
    el.id = 'sheet';
    el.innerHTML = `<div class="sheet__veil" data-x="close"></div>
      <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
        <div class="sheet__head"><h2 class="h3" id="sheet-t">${esc(titulo)}</h2><button type="button" class="iconbtn" data-x="close" aria-label="${esc(t('req.close'))}">${I.x}</button></div>
        <div class="sheet__body">${corpo}</div>
        ${pe ? `<div class="sheet__foot">${pe}</div>` : ''}
      </div>`;
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    $$('[data-x=close]', el).forEach((b) => b.addEventListener('click', fecharSheet));
    teclaSheet = (e) => { if (e.key === 'Escape') fecharSheet(); };
    document.addEventListener('keydown', teclaSheet);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const f = $$('a[href],button:not([disabled]),input,select,textarea,summary', el).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    if (depois) depois(el);
    const primeiroCampo = $('.sheet__body input, .sheet__body select, .sheet__body textarea, .sheet__body button', el) || $('.iconbtn', el);
    setTimeout(() => primeiroCampo && primeiroCampo.focus({ preventScroll: true }), 30);
  }
  function fecharSheet() {
    const el = document.getElementById('sheet');
    if (!el) return;
    if (teclaSheet) { document.removeEventListener('keydown', teclaSheet); teclaSheet = null; }
    el.remove();
    document.body.style.overflow = '';
    if (ultimoFoco && document.body.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
  }
  function abrirMais() {
    const rs = rotas().filter(([id]) => !$(`.bottombar [data-nav="${id}"]`));
    abrirSheet({
      titulo: 'Menu',
      corpo: `<nav class="menu">${[...rs, ['conta', 'nav.account', I.user]].map(([id, k, ico]) => `<a href="#/${id}">${ico}${esc(t(k))}</a>`).join('')}
        ${isEquipe() ? '' : `<a href="${C.CV.corretor}" target="_blank" rel="noopener">${I.ext}${esc(t('home.q.cv'))}</a>`}</nav>
        <div>${langSwitch()}</div>`,
      depois: (p) => { bindLang(p); $$('.menu a[href^="#"]', p).forEach((a) => a.addEventListener('click', fecharSheet)); },
    });
  }

  /* ============================================================ início do app */
  /* primeiro acesso de alguém da equipe: #/convite/<token> */
  async function renderConvite(token) {
    let info;
    try { info = await api('conviteVer', { token }); }
    catch (e) {
      history.replaceState(null, '', location.pathname);
      render();
      setTimeout(() => { const m = $('.formmsg'); if (m) m.textContent = e.message; }, 50);
      return;
    }
    document.title = `${t('inv.title')} · ${t('brand')}`;
    app.innerHTML = `
      <div class="auth view">
        <section class="auth__form">
          <div class="auth__top"><a class="brand" href="/"><img class="brand__logo logo--ink" src="/assets/logo/logo-horizontal-black.svg" alt="Bracerum Park" width="150" height="18" /><img class="brand__logo logo--paper" src="/assets/logo/logo-horizontal-white.svg" alt="" width="150" height="18" /></a>${langSwitch()}</div>
          <div class="auth__mid" id="main" tabindex="-1">
            <div style="display:grid;gap:14px"><p class="eyebrow">${esc(t('auth.team'))}</p><h1 class="h1">${esc(t('inv.title'))}</h1><p class="lead">${esc(t('inv.lead'))}</p></div>
            <form id="f-inv" novalidate>
              <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" value="${esc(info.email)}" autocomplete="username" readonly /></label>
              <label class="field"><span>${esc(t('auth.teamName'))}</span><input class="input" name="nome" value="${esc(info.nome)}" autocomplete="name" required /></label>
              <label class="field"><span>${esc(t('auth.pass8'))}</span><input class="input" type="password" name="senha" autocomplete="new-password" minlength="8" required /></label>
              <label class="field"><span>${esc(t('inv.repeat'))}</span><input class="input" type="password" name="senha2" autocomplete="new-password" minlength="8" required /></label>
              <p class="formmsg" role="alert"></p>
              <button class="btn btn--ink btn--block" type="submit">${esc(t('inv.go'))}${I.arrow}</button>
            </form>
          </div>
          <p class="auth__foot">© Bracerum Park</p>
        </section>
        <aside class="auth__panel" aria-hidden="true"><img src="/assets/web/fotos/park-aereo-rio.jpg" alt="" /><div class="auth__panelin"><span class="glass stage__chip" style="align-self:flex-start">${I.lock.replace('<svg', '<svg width="16" height="16"')} ${esc(t('auth.team'))}</span><p class="display">Bracerum<br/>Park</p></div></aside>
      </div>`;
    bindLang(app);
    const f = $('#f-inv');
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      const msg = $('.formmsg', f);
      if (!fd.nome || !fd.senha) { msg.textContent = t('c.error'); return; }
      if (fd.senha.length < 8) { msg.textContent = t('auth.pass8'); return; }
      if (fd.senha !== fd.senha2) { msg.textContent = t('inv.mismatch'); return; }
      const btn = $('button[type=submit]', f); btn.disabled = true;
      try {
        const d = await api('convite', { token, nome: fd.nome, senha: fd.senha });
        S.user = d.usuario;
        history.replaceState(null, '', location.pathname + '#/inicio');
        render(); toast(t('inv.done'));
      } catch (e) { msg.textContent = e.message; btn.disabled = false; }
    });
  }

  async function iniciar() {
    document.documentElement.lang = S.lang === 'pt' ? 'pt-BR' : S.lang;
    try {
      const d = await api('eu');
      S.user = d.usuario; S.avisos = d.avisos || [];
    } catch (e) { S.user = null; }
    const conv = location.hash.match(/^#\/convite\/([A-Za-z0-9_\-.]+)$/);
    if (conv && !S.user) return renderConvite(conv[1]);
    render();
  }
  // o idioma trocado no site (outra aba) vale aqui também
  window.addEventListener('storage', (e) => { if (e.key === 'bp-lang' && ['pt', 'es', 'en'].includes(e.newValue) && e.newValue !== S.lang) { S.lang = e.newValue; render(); } });
  iniciar();
})();
