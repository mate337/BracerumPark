/*
  Portal do Corretor — aplicação de uma página só (rotas por #/).
  Conteúdo editável em conteudo.js; servidor em /api/portal (api/portal.js).
  Idioma pela mesma chave do site (bp-lang); tema: sempre claro, escuro só por escolha (bp-portal-tema2).
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
    req: { filtro: 'abertos' }, team: { filtro: 'todos' },
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
    trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: ic('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    upload: ic('<path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5"/><path d="M4 16v4h16v-4"/>'),
    moon: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    star: ic('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
    tag: ic('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    building: ic('<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>'),
    clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    send: ic('<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>'),
    up: ic('<path d="M12 19V5m0 0-6 6m6-6 6 6"/>'),
    down: ic('<path d="M12 5v14m0 0-6-6m6 6 6-6"/>'),
    refresh: ic('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>'),
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

  /* dados comerciais unificados (servidor): unidades do V14 + situação do CV (retrato com última
     tentativa/sucesso) + referência de preço. Mapa, tabela e ofertas leem daqui. */
  function aplicarComercial(d) {
    S.com = d;
    const sits = d.unidades.map((u) => u.situacao);
    const n = (s) => sits.filter((x) => x === s).length;
    S.lotes = { total: d.unidades.length, livres: n('disponivel'), r: n('reservado'), v: n('vendido'), b: n('indisponivel'), desconhecida: n('desconhecida'), sync: d.sync };
    atualizarKpis();
    if (S.route.name === 'tabela') { const y = window.scrollY; renderMain(); window.scrollTo(0, y); }   // o mapa só atualiza a legenda (não recarrega a maquete)
  }
  function carregarComercial(forcar) {
    if (S.lotes && !forcar && !S.lotes.erro) return;
    if (!S.lotes) S.lotes = { carregando: true };
    api('comercial').then(aplicarComercial).catch(() => { S.lotes = { erro: true, total: 614 }; atualizarKpis(); });
  }
  function carregarPublicos() {
    carregarComercial(false);
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
    if (S.com && S.com.janela) { const j = S.precos.janelas.find((x) => x.id === S.com.janela.id); if (j) return j; }   // fuso comercial vem do servidor
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
  // Dois perfis: corretor (só consulta) e gestor (tudo + Gestão). Desde 2026-11-24 as solicitações ao
  // marketing são só do gestor (pedido do Matheus): o corretor não vê nem cria — o servidor também recusa.
  const ROTAS_CORRETOR = [
    ['inicio', 'nav.home', I.home], ['masterplan', 'nav.masterplan', I.cube], ['tabela', 'nav.prices', I.table],
    ['ofertas', 'nav.offers', I.tag], ['materiais', 'nav.materials', I.grid], ['aprender', 'nav.learn', I.book],
  ];
  const ROTAS_EQUIPE = [
    ['inicio', 'nav.home', I.home], ['gestao', 'nav.gestao', I.users], ['pedidos', 'nav.requests', I.inbox],
    ['ofertas', 'nav.offers', I.tag], ['materiais', 'nav.materials', I.grid], ['masterplan', 'nav.masterplan', I.cube],
    ['tabela', 'nav.prices', I.table], ['aprender', 'nav.learn', I.book],
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
    const nome = `${S.user.nome} · ${t(isEquipe() ? 'acc.manager' : 'acc.broker')}`;
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
            ${temaBtn()}
            ${langSwitch()}
            <a href="#/conta" class="avatar" data-nav="conta" title="${esc(nome)}" aria-label="${esc(t('nav.account'))}">${esc(iniciais(S.user.nome))}</a>
          </div>
        </header>
        <main class="main" id="main" tabindex="-1"></main>
        ${bottomBar()}
      </div>`;
    bindLang(app); bindTema(app);
    $('#bb-more') && $('#bb-more').addEventListener('click', abrirMais);
    $('#bb-plus') && $('#bb-plus').addEventListener('click', () => { location.hash = '#/gestao'; setTimeout(novaConta, 60); });
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
    const left = isEquipe() ? [it('inicio', 'nav.home', I.home), it('gestao', 'nav.gestao', I.users)] : [it('inicio', 'nav.home', I.home), it('masterplan', 'nav.map', I.cube)];
    const right = isEquipe() ? [it('pedidos', 'nav.requests', I.inbox)] : [it('ofertas', 'nav.offers', I.tag)];
    const meio = isEquipe() ? `<button type="button" class="plus" id="bb-plus" aria-label="${esc(t('gest.new'))}">${I.plus}</button>` : it('tabela', 'nav.prices', I.table);
    return `<nav class="bottombar" aria-label="${esc(t('brand'))}">${left.join('')}
      ${meio}
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

  /* ============================================================ entrada (só "Entrar": as contas nascem na Gestão) */
  // painel da direita da entrada e do primeiro acesso: foto do galpão (enviada pelo cliente em 2026-11-18)
  function painelAuth(chip) {
    return `<aside class="auth__panel" aria-hidden="true">
      <picture><source srcset="/portalcorretores/img/galpao-avenida.webp" type="image/webp" /><img src="/portalcorretores/img/galpao-avenida.jpg" alt="" /></picture>
      <div class="auth__panelin">
        <span class="glass stage__chip" style="align-self:flex-start">${chip}</span>
        <div style="display:grid;gap:22px">
          <p class="display">Bracerum<br/>Park</p>
          <div class="auth__stats">
            <div class="glass"><b>614</b><span>${esc(t('auth.stat1'))}</span></div>
            <div class="glass"><b>1.250</b><span>${esc(t('auth.stat2'))}</span></div>
            <div class="glass"><b>1%</b><span>${esc(t('auth.stat3'))}</span></div>
          </div>
        </div>
      </div>
    </aside>`;
  }
  const topoAuth = () => `<div class="auth__top">
      <a class="brand" href="/" aria-label="Bracerum Park">
        <img class="brand__logo logo--ink" src="/assets/logo/logo-horizontal-black.svg" alt="Bracerum Park" width="150" height="18" />
        <img class="brand__logo logo--paper" src="/assets/logo/logo-horizontal-white.svg" alt="" width="150" height="18" />
      </a>
      <div style="display:flex;gap:8px;align-items:center">${temaBtn()}${langSwitch()}</div>
    </div>`;
  function renderAuth() {
    document.title = `${t('brand')} · Bracerum Park`;
    app.innerHTML = `
      <div class="auth view">
        <section class="auth__form">
          ${topoAuth()}
          <div class="auth__mid" id="main" tabindex="-1">
            <div style="display:grid;gap:14px">
              <p class="eyebrow">${esc(t('brand'))}</p>
              <h1 class="h1">${esc(t('auth.title'))}</h1>
              <p class="lead">${esc(t('auth.lead'))}</p>
            </div>
            <form id="f-in" novalidate>
              <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" name="email" autocomplete="username" required inputmode="email" /></label>
              <label class="field"><span>${esc(t('auth.pass'))}</span><input class="input" type="password" name="senha" autocomplete="current-password" required /></label>
              <p class="formmsg" role="alert"></p>
              <button class="btn btn--ink btn--block" type="submit">${esc(t('auth.go'))}${I.arrow}</button>
              <p class="small muted">${esc(t('auth.noAccount'))}</p>
            </form>
          </div>
          <p class="auth__foot">© Bracerum Park · Villeta, Paraguay · <a class="linkbtn" href="/">bracerumpark.com</a></p>
        </section>
        ${painelAuth(`<i class="dot-live" style="background:#f5f5f3"></i> Villeta · Paraguay`)}
      </div>`;
    bindLang(app); bindTema(app);
    const f = $('#f-in');
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(f).entries());
      const msg = $('.formmsg', f); msg.textContent = '';
      const btn = $('button[type=submit]', f); const htmlBtn = btn.innerHTML;
      $$('.input', f).forEach((i) => i.removeAttribute('aria-invalid'));
      const falta = $$('[required]', f).filter((i) => !i.value.trim());
      if (falta.length) { falta.forEach((i) => i.setAttribute('aria-invalid', 'true')); falta[0].focus(); msg.textContent = t('auth.fill'); return; }
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
      try {
        const d = await api('entrar', { email: fd.email, senha: fd.senha });
        S.user = d.usuario; S.pedidos = null; S.contas = null; S.bib = null;
        location.hash = '#/inicio';
        render();
      } catch (e) {
        msg.textContent = e.message;
        btn.disabled = false; btn.innerHTML = htmlBtn;
      }
    });
  }

  /* tema: abre sempre claro (fundo branco); escuro só se a pessoa escolher — botão no topo e na conta.
     Chave nova (bp-portal-tema2) para todo mundo recomeçar no claro, mesmo quem tinha escolhido escuro antes. */
  function temaAtual() { try { return localStorage.getItem('bp-portal-tema2') === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; } }
  function temaEfetivo() { return temaAtual(); }
  function aplicarTema(v) {
    v = v === 'dark' ? 'dark' : 'light';
    try { if (v === 'dark') localStorage.setItem('bp-portal-tema2', 'dark'); else localStorage.removeItem('bp-portal-tema2'); } catch (e) {}
    document.documentElement.dataset.theme = v;
    $$('[data-tema-btn]').forEach((b) => { b.innerHTML = temaEfetivo() === 'dark' ? I.sun : I.moon; b.setAttribute('aria-label', t(temaEfetivo() === 'dark' ? 'acc.toLight' : 'acc.toDark')); b.title = b.getAttribute('aria-label'); });
    $$('[data-tema]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.tema === v));
  }
  const temaBtn = () => `<button type="button" class="iconbtn" data-tema-btn aria-label="${esc(t(temaEfetivo() === 'dark' ? 'acc.toLight' : 'acc.toDark'))}" title="${esc(t(temaEfetivo() === 'dark' ? 'acc.toLight' : 'acc.toDark'))}">${temaEfetivo() === 'dark' ? I.sun : I.moon}</button>`;
  function bindTema(root) { $$('[data-tema-btn]', root).forEach((b) => b.addEventListener('click', () => aplicarTema(temaEfetivo() === 'dark' ? 'light' : 'dark'))); }

  /* ============================================================ início */
  function saudacao() { const h = new Date().getHours(); return t(h < 12 ? 'home.hello.m' : h < 18 ? 'home.hello.a' : 'home.hello.n'); }
  // Situação do retrato comercial: quando veio do CV, se está atual, e o aviso se não estiver.
  function idade(iso) {
    if (!iso) return '—';
    const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (min < 1) return t('sync.now');
    if (min < 60) return `${nf(min)} min`;
    if (min < 48 * 60) return `${nf(Math.round(min / 60))} h`;
    return data(iso, true);
  }
  function syncHTML(gestor) {
    const sy = S.lotes && S.lotes.sync;
    if (!sy) return '';
    const cls = sy.estado === 'atual' ? '' : 'syncbar--alerta';
    const msg = sy.estado === 'atual' ? `${t('sync.ok')} ${idade(sy.ultimoSucesso)}`
      : sy.estado === 'desatualizado' ? `${t('sync.stale')} ${sy.ultimoSucesso ? data(sy.ultimoSucesso, true) : '—'}. ${t('sync.confirm')}`
        : t('sync.none');
    return `<div class="syncbar ${cls}" role="status">${sy.estado === 'atual' ? '<i class="dot-live"></i>' : I.info}<span>${esc(msg)}${sy.resultado === 'erro' && sy.estado !== 'indisponivel' ? ` <span class="muted">· ${esc(t('sync.lastFail'))} ${esc(data(sy.ultimaTentativa, true))}</span>` : ''}</span>
      ${gestor && isEquipe() ? `<button type="button" class="btn btn--line btn--sm" id="sync-now">${I.refresh}${esc(t('sync.now2'))}</button>` : ''}</div>`;
  }
  function ligarSync(main) {
    const b = $('#sync-now', main);
    if (b) b.addEventListener('click', async () => {
      b.disabled = true;
      try { const d = await api('sincronizar'); toast(d.sync.resultado === 'ok' ? t('sync.done') : `${t('sync.fail')}: ${d.sync.erro || ''}`); carregarComercial(true); }
      catch (e) { toast(e.message); b.disabled = false; }
    });
  }
  // Legenda do mapa de reservas: números do retrato do CV + janela de preço.
  function kpisHTML() {
    const L = S.lotes || {};
    const total = L.total || 614;
    const pronto = !(L.carregando || L.erro) && L.sync && L.sync.estado !== 'indisponivel';
    const livres = pronto ? L.livres : null;
    const jan = precosOk() ? janelaAtual() : null;
    const preco = jan ? S.precos.precos[jan.id].P[0][0] : null;
    const vir = jan ? proximaVirada() : null;
    const dias = vir ? Math.max(0, Math.ceil((new Date(vir + 'T00:00:00') - new Date()) / 864e5)) : null;
    const n = (v) => (pronto ? nf(v) : (L.carregando ? '<span class="skel" style="display:inline-block;width:40px;height:22px"></span>' : '—'));
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
    const sb = $('#syncbox');
    if (sb) { sb.innerHTML = syncHTML(true); ligarSync(sb); }
  }
  // Página inicial: "Bem-vindo, Nome", os tópicos no meio e, abaixo, o mapa de reservas ao vivo.
  // Corretor: as seis áreas. Gestor: as seis + Gestão.
  const TOPICOS_CORRETOR = [
    ['masterplan', 'nav.masterplan', 'top.masterplan', I.cube],
    ['tabela', 'nav.prices', 'top.prices', I.table],
    ['ofertas', 'nav.offers', 'top.offers', I.tag],
    ['materiais', 'nav.materials', 'top.materials', I.grid],
    ['aprender', 'nav.learn', 'top.learn', I.book],
  ];
  const TOPICOS_EQUIPE = [
    ['gestao', 'nav.gestao', 'top.gestao', I.users],
    ['pedidos', 'nav.requests', 'top.requests', I.inbox],
    ['ofertas', 'nav.offers', 'top.offersAdm', I.tag],
    ['materiais', 'nav.materials', 'top.materialsAdm', I.grid],
    ['masterplan', 'nav.masterplan', 'top.masterplan', I.cube],
    ['tabela', 'nav.prices', 'top.prices', I.table],
    ['aprender', 'nav.learn', 'top.learnAdm', I.book],
  ];
  VIEWS.inicio = () => {
    const hoje = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const tops = isEquipe() ? TOPICOS_EQUIPE : TOPICOS_CORRETOR;
    const extras = isEquipe()
      ? ''
      : `<div class="extras">
          <a class="extra" href="${C.CV.corretor}" target="_blank" rel="noopener">${I.ext}<span>${esc(t('home.q.cv'))}</span>${I.arrow}</a>
        </div>`;
    return `
      ${!isEquipe() && S.user.status === 'pendente' ? `<div class="banner">${I.info}<span>${esc(t('home.pending'))}</span></div>` : ''}
      <section class="welcome">
        <p class="eyebrow">${esc(hoje)}</p>
        <h1 class="display">${esc(t('home.welcome'))}, ${esc(primeiro(S.user.nome))}</h1>
        <p class="lead">${esc(t(isEquipe() ? 'home.subTeam' : 'home.sub2'))}</p>
      </section>
      <nav class="topics topics--${tops.length}" aria-label="${esc(t('brand'))}">
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
        <div id="syncbox">${syncHTML(true)}</div>
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
    ligarSync(main);
    const q = $('#q-req', main);
    if (q) q.addEventListener('click', () => novoPedido());
    const badge = (id, n) => { const b = $(`[data-cnt="${id}"]`, main); if (b && n) { b.textContent = n; b.hidden = false; } };
    if (isEquipe()) carregarPedidos(true).then(() => {
      const abertos = (S.pedidos || []).filter((p) => !['concluida', 'cancelada'].includes(p.status)).length;
      const c = $('#cnt-req', main); if (c && abertos) c.textContent = abertos;
      if (isEquipe()) badge('pedidos', (S.pedidos || []).filter((p) => p.status === 'enviada').length);
    }).catch(() => {});
    api('ofertas').then((d) => badge('ofertas', isEquipe() ? 0 : d.ofertas.length)).catch(() => {});
    if (isEquipe()) api('contas').then((d) => { S.contas = d.contas; badge('gestao', d.contas.filter((c) => !c.ativo && c.status !== 'bloqueado').length); }).catch(() => {});
  };

  /* ============================================================ materiais (rascunho / publicado / arquivado, com versões) */
  function linkRastreado(caminho, meio) {
    const u = new URL(caminho, location.origin);
    if (S.user && S.user.slug && S.user.papel !== 'equipe') {
      u.searchParams.set('utm_source', 'corretor');
      u.searchParams.set('utm_medium', meio || 'corretor');
      u.searchParams.set('utm_campaign', 'corretor-' + S.user.slug);
      u.searchParams.set('utm_content', S.user.slug);
    }
    return u.href;
  }
  const kb = (n) => (n >= 1024 ? nf(n / 1024, 1) + ' MB' : nf(n) + ' KB');
  const urlArquivoEnviado = (caminho, baixar) => `/api/portal?material=${encodeURIComponent(caminho)}${baixar ? '&baixar=1' : ''}`;
  const extDe = (nome, tipo) => ((String(nome || '').match(/\.(\w{2,5})$/) || [])[1] || String(tipo || '').split('/').pop() || '').toUpperCase().slice(0, 5);
  const versaoAtual = (x) => x.versoes.find((v) => v.n === x.atual) || x.versoes[x.versoes.length - 1];

  // Lista única: fixos do conteudo.js (sempre "publicados", podem ser retirados) + os enviados pelo gestor.
  function todosMateriais() {
    const bib = S.bib || { itens: [], ocultos: [] };
    const fixos = C.MATERIAIS.map((m) => ({ ...m, origem: 'fixo', chave: m.arquivo || m.link, status: bib.ocultos.includes(m.arquivo || m.link) ? 'arquivado' : 'publicado' }));
    const enviados = bib.itens.map((x) => {
      const v = versaoAtual(x);
      const img = v.caminho && /^image\//.test(v.conteudo || '');
      return {
        origem: 'enviado', chave: 'up:' + x.id, id: x.id, tipo: x.tipo, produto: x.produto, destaque: x.destaque, status: x.status,
        titulo: x.titulo, desc: x.desc, kb: v.kb, caminho: v.caminho, linkExterno: v.link, versao: v.n, nVersoes: x.versoes.length, versoes: x.versoes,
        formato: v.caminho ? extDe(v.nomeArquivo || v.caminho, v.conteudo) : 'LINK', previa: img ? urlArquivoEnviado(v.caminho) : null,
        conteudo: v.conteudo, atualizado: x.atualizado || v.em,
      };
    });
    const lst = [...enviados, ...fixos];
    if (!isEquipe()) return lst.filter((m) => m.status === 'publicado');
    const f = S.mat.st || 'publicado';
    return f === 'todos' ? lst : lst.filter((m) => m.status === f);
  }
  function urlMaterial(m) {
    if (m.origem === 'enviado') return m.caminho ? abs(urlArquivoEnviado(m.caminho)) : m.linkExterno;
    return m.arquivo ? abs(m.arquivo) : (m.tipo === 'folder' || m.tipo === 'pagina' || m.link === '/3dmasterplan/') ? linkRastreado(m.link, 'corretor') : abs(m.link);
  }
  const ST_MAT = { rascunho: 'mst.draft', publicado: 'mst.pub', arquivado: 'mst.arch' };
  function tileHTML(m, i) {
    const tipoCls = m.tipo === 'logo' && m.previa ? `is-logo${m.escuro ? ' is-dark' : ''}` : (!m.previa ? 'is-doc' : '');
    const media = m.previa ? `<img src="${esc(m.previa)}" alt="" loading="lazy" decoding="async" />` : `<span class="doc"><i></i><i></i>${esc(m.formato)}</span>`;
    const meta = [m.formato, m.kb ? kb(m.kb) : null, tx(C.PRODUTOS[m.produto]), m.origem === 'enviado' ? `v${m.versao}` : null].filter(Boolean).join(' · ');
    const publico = m.origem === 'fixo';
    let principal;
    if (m.origem === 'enviado' && m.caminho) principal = `<a class="btn btn--ink" href="${esc(urlArquivoEnviado(m.caminho, true))}" aria-label="${esc(t('mat.download'))}">${I.download}<span class="lbl">${esc(t('mat.download'))}</span></a>`;
    else if (m.arquivo) principal = `<a class="btn btn--ink" href="${esc(m.arquivo)}" download aria-label="${esc(t('mat.download'))}">${I.download}<span class="lbl">${esc(t('mat.download'))}</span></a>`;
    else principal = `<a class="btn btn--ink" href="${esc(urlMaterial(m))}" target="_blank" rel="noopener" aria-label="${esc(t('mat.open'))}">${I.ext}<span class="lbl">${esc(t('mat.open'))}</span></a>`;
    const gestao = !isEquipe() ? '' : `<button type="button" class="iconbtn" data-mmenu="${i}" aria-label="${esc(t('gest.more'))}" title="${esc(t('gest.more'))}">${I.dots}</button>`;
    return `<article class="tile ${m.status !== 'publicado' ? 'is-hidden' : ''}">
      <div class="tile__media ${tipoCls}">
        ${media}
        <button type="button" class="tile__open" data-ver="${i}" aria-label="${esc(tx(m.titulo))}"></button>
        <span class="badge tile__fmt">${esc(isEquipe() && m.status !== 'publicado' ? t(ST_MAT[m.status]) : tx(C.TIPOS_MATERIAL[m.tipo] || C.TIPOS_MATERIAL.documento))}</span>
        ${m.destaque ? `<span class="badge badge--ink tile__star">${I.star.replace('<svg', '<svg width="12" height="12"')}</span>` : ''}
      </div>
      <div class="tile__body"><b class="tile__title">${esc(tx(m.titulo))}</b><span class="tile__meta">${esc(meta)}</span>${m.desc ? `<span class="tile__meta">${esc(tx(m.desc))}</span>` : ''}
        ${isEquipe() && m.origem === 'enviado' ? `<span class="tile__meta">${esc(t('mst.updated'))} ${esc(data(m.atualizado, true))}</span>` : ''}</div>
      <div class="tile__actions">${principal}
        ${publico ? `<button type="button" class="iconbtn" data-copy="${i}" aria-label="${esc(t('mat.copy'))}" title="${esc(t('mat.copy'))}">${I.link}</button>` : ''}
        ${gestao}
      </div>
    </article>`;
  }
  let MATS = [];
  function filtrarMateriais() {
    const q = S.mat.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    MATS = todosMateriais();
    return MATS.map((m, i) => [m, i]).filter(([m]) => (S.mat.tipo === 'all' || m.tipo === S.mat.tipo)
      && (S.mat.produto === 'all' || m.produto === S.mat.produto)
      && (!q || [tx(m.titulo), tx(m.desc), tx(C.PRODUTOS[m.produto]), m.formato].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
  }
  VIEWS.materiais = () => {
    const st = S.mat.st || 'publicado';
    const vis = todosMateriais().filter((m) => st === 'todos' || m.status === st);   // só filtros que têm material
    const tipos = ['all', ...Object.keys(C.TIPOS_MATERIAL).filter((k) => k === S.mat.tipo || vis.some((m) => m.tipo === k))];
    const prods = ['all', ...Object.keys(C.PRODUTOS).filter((k) => k === S.mat.produto || vis.some((m) => m.produto === k))];
    return `
      <header class="pagehead">
        <div class="pagehead__meta"><a href="#/inicio" class="linkbtn" style="text-decoration:none">← ${esc(t('nav.home'))}</a><span id="mat-count" class="num"></span></div>
        <div class="pagehead__body">
          <h1 class="h1">${esc(t('mat.title'))}</h1>
          <p class="lead">${esc(t(isEquipe() ? 'matadm.lead' : 'mat.lead'))}</p>
          ${isEquipe() ? `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button type="button" class="btn btn--ink" id="mat-add">${I.plus}${esc(t('matadm.add'))}</button>
            <div class="seg" role="group" aria-label="${esc(t('acc.status'))}">${[['publicado', 'mst.pubs'], ['rascunho', 'mst.drafts'], ['arquivado', 'mst.archs'], ['todos', 'req.all']].map(([v, k]) => `<button type="button" data-mst="${v}" aria-pressed="${st === v}">${esc(t(k))}</button>`).join('')}</div></div>` : ''}
          <div class="tags" role="group" aria-label="${esc(t('mat.title'))}">${tipos.map((k) => `<button type="button" data-mtipo="${k}" aria-pressed="${S.mat.tipo === k}">${esc(k === 'all' ? t('mat.all') : tx(C.TIPOS_MATERIAL[k]))}</button>`).join('')}</div>
        </div>
      </header>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="${esc(t('req.product'))}">${prods.map((k) => `<button type="button" class="chip" data-mprod="${k}" aria-pressed="${S.mat.produto === k}">${esc(k === 'all' ? t('mat.all') : tx(C.PRODUTOS[k]))}</button>`).join('')}</div>
        <label class="search"><span class="vh">${esc(t('mat.search'))}</span>${I.search}<input class="input" type="search" id="mat-q" placeholder="${esc(t('mat.search'))}" value="${esc(S.mat.q)}" /></label>
      </div>
      <div class="grid" id="mat-grid"><div class="skel" style="height:280px;grid-column:1/-1;border-radius:18px"></div></div>
`;
  };
  function desenharGrade() {
    const lst = filtrarMateriais();
    const g = $('#mat-grid'); if (!g) return;
    g.innerHTML = lst.length ? lst.map(([m, i]) => tileHTML(m, i)).join('') : `<div class="empty" style="grid-column:1/-1">${I.search}${esc(t('mat.none'))}</div>`;
    $('#mat-count').textContent = `${lst.length} ${t('mat.count')}`;
  }
  async function carregarBib() {
    try { const d = await api('materiais'); S.bib = { itens: d.itens || [], ocultos: d.ocultos || [] }; desenharGrade(); }
    catch (e) { const g = $('#mat-grid'); if (g) g.innerHTML = `<div class="empty" style="grid-column:1/-1">${I.info}${esc(e.message)} <button type="button" class="linkbtn" id="mat-retry">${esc(t('c.retry'))}</button></div>`; }
  }
  VIEWS['materiais:after'] = (main) => {
    if (S.bib) desenharGrade();
    carregarBib();
    main.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button,a'); if (!b) return;
      if (b.dataset.mtipo) { S.mat.tipo = b.dataset.mtipo; $$('[data-mtipo]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharGrade(); }
      else if (b.dataset.mprod) { S.mat.produto = b.dataset.mprod; $$('[data-mprod]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharGrade(); }
      else if (b.dataset.mst) { S.mat.st = b.dataset.mst; $$('[data-mst]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharGrade(); }
      else if (b.dataset.copy) copiar(urlMaterial(MATS[+b.dataset.copy]));
      else if (b.dataset.ver) verMaterial(MATS[+b.dataset.ver]);
      else if (b.dataset.mmenu) menuMaterial(MATS[+b.dataset.mmenu]);
      else if (b.id === 'mat-add') editarMaterial(null);
      else if (b.id === 'mat-retry') carregarBib();
    });
    let tmr;
    $('#mat-q', main).addEventListener('input', (e) => { clearTimeout(tmr); tmr = setTimeout(() => { S.mat.q = e.target.value; desenharGrade(); }, 120); });
  };
  function verMaterial(m) {
    const src = m.origem === 'enviado' ? (m.caminho ? urlArquivoEnviado(m.caminho) : m.linkExterno) : (m.arquivo || urlMaterial(m));
    const ehFoto = m.origem === 'enviado' ? /^image\//.test(m.conteudo || '') : (m.tipo === 'foto' && m.arquivo);
    if (!ehFoto) { window.open(src, '_blank', 'noopener'); return; }
    const baixarUrl = m.origem === 'enviado' ? urlArquivoEnviado(m.caminho, true) : m.arquivo;
    abrirSheet({
      cls: 'viewer', titulo: tx(m.titulo),
      corpo: `<img class="viewer__img" src="${esc(src)}" alt="${esc(tx(m.titulo))}" />
        <p class="small muted" style="margin:0">${esc([m.formato, m.kb ? kb(m.kb) : null, tx(C.PRODUTOS[m.produto])].filter(Boolean).join(' · '))}</p>`,
      pe: `${m.origem === 'fixo' ? `<button type="button" class="btn btn--line" data-x="copy">${I.link}${esc(t('mat.copy'))}</button>` : ''}
        <a class="btn btn--ink" href="${esc(baixarUrl)}" ${m.origem === 'fixo' ? 'download' : ''}>${I.download}${esc(t('mat.download'))}</a>`,
      depois: (p) => { const c = $('[data-x=copy]', p); if (c) c.addEventListener('click', () => copiar(abs(m.arquivo))); },
    });
  }
  function menuMaterial(m) {
    const it = (acao, ico, k) => `<button type="button" data-acao="${acao}">${ico}${esc(t(k))}</button>`;
    const hist = m.origem === 'enviado' ? `<div><span class="eyebrow">${esc(t('mst.versions'))}</span><ul class="timeline" style="margin-top:10px">${m.versoes.slice().reverse().map((v) => `<li><span>v${v.n}${v.n === m.versao ? ` · <b>${esc(t('mst.current'))}</b>` : ''} · ${esc(v.nomeArquivo || v.link || '')} <span class="muted">· ${esc(v.por || '')} · ${esc(data(v.em, true))}</span>${v.caminho ? ` · <a class="linkbtn" href="${esc(urlArquivoEnviado(v.caminho, true))}">${esc(t('mat.download'))}</a>` : ''}</span></li>`).join('')}</ul></div>` : '';
    abrirSheet({
      titulo: tx(m.titulo),
      corpo: `<p class="small muted" style="margin:0">${esc(t(ST_MAT[m.status]))}${m.origem === 'fixo' ? ` · ${esc(t('mst.fixed'))}` : ''}</p>
        <nav class="menu">
          ${m.status !== 'publicado' ? it('publicado', I.check, 'mst.publish') : ''}
          ${m.origem === 'enviado' && m.status !== 'rascunho' ? it('rascunho', I.pen, 'mst.toDraft') : ''}
          ${m.status !== 'arquivado' ? it('arquivado', I.eyeOff, 'mst.archive') : ''}
          ${m.origem === 'enviado' ? it('versao', I.upload, 'mst.newVersion') + it('editar', I.pen, 'matadm.edit') : ''}
        </nav>${hist}`,
      depois: (p) => $$('[data-acao]', p).forEach((b) => b.addEventListener('click', async () => {
        const a = b.dataset.acao;
        if (a === 'editar') return editarMaterial(m);
        if (a === 'versao') return editarMaterial(m, true);
        try {
          const d = m.origem === 'fixo'
            ? await api('materialOcultar', { chave: m.chave, ocultar: a === 'arquivado' })
            : await api('materialStatus', { id: m.id, status: a });
          S.bib = d; fecharSheet(); desenharGrade(); toast(t('acc.saved'));
        } catch (e) { toast(e.message); }
      })),
    });
  }

  /* gestor: novo material, nova versão ou edição (o arquivo vai direto do navegador para o Blob privado) */
  let blobClient = null;
  async function enviarArquivo(arquivo, destino, prog, btn) {
    const tk = await api('arquivoToken', { nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, destino });
    if (!blobClient) blobClient = await import('/portalcorretores/vendor/vercel-blob-client-2.8.0.js');
    if (prog) prog.hidden = false;
    await blobClient.put(tk.caminho, arquivo, {
      access: 'private', token: tk.token, contentType: arquivo.type || undefined, multipart: arquivo.size > 20 * 1024 * 1024,
      onUploadProgress: (e) => { if (prog) $('i', prog).style.width = Math.round(e.percentage) + '%'; if (btn) btn.textContent = Math.round(e.percentage) + '%'; },
    });
    return { caminho: tk.caminho, conteudo: arquivo.type, kb: Math.ceil(arquivo.size / 1024), nomeArquivo: arquivo.name };
  }
  function blocoArquivo(id) {
    return `<div class="seg" role="radiogroup" data-srcg="${id}"><button type="button" data-src="arq" aria-checked="true" aria-pressed="true">${esc(t('matadm.file'))}</button><button type="button" data-src="link" aria-checked="false" aria-pressed="false">${esc(t('matadm.link'))}</button></div>
      <label class="drop" data-drop="${id}"><input type="file" data-file="${id}" /><span>${I.upload}</span><b data-fname="${id}">${esc(t('matadm.pick'))}</b><span>${esc(t('matadm.pickHint'))}</span></label>
      <label class="field" data-linkf="${id}" hidden><span>${esc(t('matadm.link'))} (https://)</span><input class="input" type="url" name="link" placeholder="https://" /></label>`;
  }
  function ligarArquivo(p, id, aoEscolher) {
    const st = { fonte: 'arq', arquivo: null };
    $$(`[data-srcg="${id}"] [data-src]`, p).forEach((b) => b.addEventListener('click', () => {
      st.fonte = b.dataset.src;
      $$(`[data-srcg="${id}"] [data-src]`, p).forEach((x) => { x.setAttribute('aria-checked', x === b); x.setAttribute('aria-pressed', x === b); });
      $(`[data-drop="${id}"]`, p).hidden = st.fonte !== 'arq'; $(`[data-linkf="${id}"]`, p).hidden = st.fonte !== 'link';
    }));
    const fi = $(`[data-file="${id}"]`, p);
    fi.addEventListener('change', () => {
      st.arquivo = fi.files[0] || null;
      $(`[data-fname="${id}"]`, p).textContent = st.arquivo ? `${st.arquivo.name} · ${kb(Math.ceil(st.arquivo.size / 1024))}` : t('matadm.pick');
      if (st.arquivo && aoEscolher) aoEscolher(st.arquivo);
    });
    return st;
  }
  function editarMaterial(m, soVersao) {
    const novo = !m;
    const opt = (obj, sel) => Object.keys(obj).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(tx(obj[k]))}</option>`).join('');
    const titulo = soVersao ? t('mst.newVersion') : novo ? t('matadm.add') : t('matadm.edit');
    abrirSheet({
      titulo,
      corpo: `<form id="f-mat" style="display:grid;gap:16px" novalidate>
        ${novo || soVersao ? blocoArquivo('mat') : ''}
        ${soVersao ? `<p class="small muted" style="margin:0">${esc(t('mst.versionInfo'))}</p><label class="field"><span>${esc(t('mst.note'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="nota" maxlength="200" /></label>` : `
        <label class="field"><span>${esc(t('req.titleF'))}</span><input class="input" name="titulo" maxlength="120" value="${esc(m ? m.titulo : '')}" required /></label>
        <div class="grid2">
          <label class="field"><span>${esc(t('matadm.cat'))}</span><select class="select" name="tipo">${opt(C.TIPOS_MATERIAL, m ? m.tipo : 'apresentacao')}</select></label>
          <label class="field"><span>${esc(t('req.product'))}</span><select class="select" name="produto">${opt(C.PRODUTOS, m ? m.produto : 'geral')}</select></label>
        </div>
        <label class="field"><span>${esc(t('matadm.desc'))} <span class="muted">(${esc(t('c.optional'))})</span></span><textarea class="textarea" name="desc" maxlength="400" style="min-height:80px">${esc(m ? m.desc || '' : '')}</textarea></label>
        <label class="check"><input type="checkbox" name="destaque" ${m && m.destaque ? 'checked' : ''} /><span>${esc(t('matadm.star'))}</span></label>
        ${novo ? `<label class="check"><input type="checkbox" name="publicar" /><span>${esc(t('mst.publishNow'))}</span></label>` : ''}`}
        <div class="bar" id="mat-prog" hidden><i style="width:0%"></i></div>
        <p class="formmsg" role="alert"></p>
      </form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-mat" class="btn btn--ink">${esc(t(novo || soVersao ? 'matadm.upload' : 'req.save'))}</button>`,
      depois: (p) => {
        const f = $('#f-mat', p);
        const arq = (novo || soVersao) ? ligarArquivo(p, 'mat', (a) => {
          const tit = $('[name=titulo]', f);
          if (tit && !tit.value) tit.value = a.name.replace(/\.\w+$/, '').replace(/[-_]+/g, ' ');
          const sel = $('[name=tipo]', f);
          if (sel) { if (/^image\//.test(a.type)) sel.value = 'foto'; else if (/^video\//.test(a.type)) sel.value = 'video'; else if (/pdf$/.test(a.type)) sel.value = 'apresentacao'; }
        }) : null;
        f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          const msg = $('.formmsg', f); msg.textContent = '';
          if (!soVersao && (!fd.titulo || fd.titulo.trim().length < 2)) { msg.textContent = t('matadm.needTitle'); return; }
          const btn = $('button[form=f-mat]', p); btn.disabled = true;
          try {
            let fonte = {};
            if (arq) {
              if (arq.fonte === 'link') fonte = { link: fd.link };
              else if (!arq.arquivo) { msg.textContent = t('matadm.needFile'); btn.disabled = false; return; }
              else fonte = await enviarArquivo(arq.arquivo, 'material', $('#mat-prog', p), btn);
            }
            const d = soVersao ? await api('materialVersao', { id: m.id, ...fonte, nota: fd.nota })
              : await api('materialSalvar', { id: m ? m.id : undefined, titulo: fd.titulo, tipo: fd.tipo, produto: fd.produto, desc: fd.desc, destaque: !!fd.destaque, publicar: !!fd.publicar, ...fonte });
            S.bib = d; fecharSheet(); desenharGrade(); toast(t('acc.saved'));
          } catch (e) { msg.textContent = e.message || t('c.error'); btn.disabled = false; btn.textContent = t(novo || soVersao ? 'matadm.upload' : 'req.save'); }
        });
      },
    });
  }

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
      </section>
      ${lotesSecaoHTML(jid, pi)}`;
  };
  /* lista lote a lote: mesma unidade da maquete (Q07.L014), situação do retrato do CV, preço da Tabela v3.1 */
  const SIT_ROT = { disponivel: 'lot.free', reservado: 'map.res', vendido: 'map.sold', indisponivel: 'map.off', desconhecida: 'lot.unknown' };
  const SIT_DOT = { disponivel: 'is-free', reservado: 'is-res', vendido: 'is-sold', indisponivel: 'is-off', desconhecida: 'is-unk' };
  function lotesFiltrados() {
    const f = S.lotf || (S.lotf = { q: '', sit: 'disponivel', cat: 'all', amin: '', busca: '', n: 60 });
    const busca = f.busca.trim().toUpperCase();
    return (S.com ? S.com.unidades : []).filter((u) => (!f.q || u.q === f.q) && (f.sit === 'all' || u.situacao === f.sit)
      && (f.cat === 'all' || u.cat === f.cat) && (!f.amin || u.a >= +f.amin) && (!busca || u.id.includes(busca) || (u.nome || '').includes(busca)));
  }
  function lotesSecaoHTML(jid, pi) {
    const f = S.lotf || (S.lotf = { q: '', sit: 'disponivel', cat: 'all', amin: '', busca: '', n: 60 });
    if (!S.com) return `<section class="section"><h2 class="h2">${esc(t('lot.title'))}</h2><div class="skel" style="height:240px;border-radius:18px;margin-top:14px"></div></section>`;
    const P = S.precos;
    const quadras = [...new Set(S.com.unidades.map((u) => u.q))].sort();
    const lst = lotesFiltrados();
    const linhas = lst.slice(0, f.n).map((u) => {
      const linha = ((P.precos[jid] || {})[u.cat] || [])[0];
      const m2 = linha ? linha[pi] : null;
      return `<tr><th scope="row" class="num">${esc(u.id)}</th><td>${esc(u.q)}</td><td class="num">${nf(u.a)} m²</td><td>${esc(tx(P.categorias[u.cat].nome))}</td>
        <td><span class="sit"><i class="legend__dot ${SIT_DOT[u.situacao]}"></i>${esc(t(SIT_ROT[u.situacao]))}</span></td>
        <td class="num">${m2 != null ? usd(m2 * u.a) : '—'}</td>
        <td><a class="iconbtn" href="/3dmasterplan/#lote-${esc(u.id)}" target="_blank" rel="noopener" aria-label="${esc(t('lot.see'))} ${esc(u.id)}" title="${esc(t('lot.see'))}">${I.cube}</a></td></tr>`;
    }).join('');
    return `<section class="section" id="lotes">
      <div class="section__head"><div><h2 class="h2">${esc(t('lot.title'))}</h2><p class="small muted" style="margin:6px 0 0">${esc(t('lot.lead'))}</p></div></div>
      ${syncHTML(false)}
      <div class="lotfilt">
        <label class="field"><span>${esc(t('lot.search'))}</span><input class="input" id="lf-busca" value="${esc(f.busca)}" placeholder="Q07.L014" /></label>
        <label class="field"><span>${esc(t('lot.block'))}</span><select class="select" id="lf-q"><option value="">${esc(t('mat.all'))}</option>${quadras.map((q) => `<option ${q === f.q ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
        <label class="field"><span>${esc(t('acc.status'))}</span><select class="select" id="lf-sit">${['all', 'disponivel', 'reservado', 'vendido', 'indisponivel'].map((s) => `<option value="${s}" ${s === f.sit ? 'selected' : ''}>${esc(s === 'all' ? t('mat.all') : t(SIT_ROT[s]))}</option>`).join('')}</select></label>
        <label class="field"><span>${esc(t('price.cat'))}</span><select class="select" id="lf-cat"><option value="all">${esc(t('mat.all'))}</option>${['V', 'B', 'P', 'I'].map((c) => `<option value="${c}" ${c === f.cat ? 'selected' : ''}>${esc(tx(P.categorias[c].nome))}</option>`).join('')}</select></label>
        <label class="field"><span>${esc(t('lot.minArea'))}</span><input class="input num" id="lf-amin" type="number" min="0" step="50" inputmode="numeric" value="${esc(f.amin)}" /></label>
      </div>
      <p class="small muted" style="margin:0 0 10px">${nf(lst.length)} ${esc(t('lot.found'))} · ${esc(t('lot.priceNote'))} ${esc(tx(P.janelas.find((j) => j.id === jid).curto))} · ${esc(tx(P.pagamentos.find((p) => PAG_IDX[p.id] === pi).nome))} · 1–8 ${esc(t('price.qty'))}</p>
      ${lst.length ? `<div class="tablewrap"><table class="table table--lots"><caption class="vh">${esc(t('lot.title'))}</caption>
        <thead><tr><th scope="col">${esc(t('lot.lot'))}</th><th scope="col">${esc(t('lot.block'))}</th><th scope="col">${esc(t('price.area'))}</th><th scope="col">${esc(t('price.cat'))}</th><th scope="col">${esc(t('acc.status'))}</th><th scope="col">${esc(t('price.total'))} (USD)</th><th></th></tr></thead>
        <tbody>${linhas}</tbody></table></div>
        ${lst.length > f.n ? `<button type="button" class="btn btn--line" id="lf-mais" style="margin-top:12px">${esc(t('lot.more'))} (${nf(lst.length - f.n)})</button>` : ''}`
        : `<div class="empty">${I.search}${esc(S.com.sync.estado === 'indisponivel' && f.sit !== 'all' ? t('lot.noSync') : t('mat.none'))}</div>`}
    </section>`;
  }
  VIEWS['tabela:after'] = (main) => {
    ligarSync(main);
    const re = () => { const y = window.scrollY; renderMain(); window.scrollTo(0, y); };
    const liga = (id, k, ev = 'change') => { const el = $(id, main); if (el) el.addEventListener(ev, (e) => { S.lotf[k] = e.target.value; S.lotf.n = 60; re(); const n = $(id); if (n && ev === 'input') { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); };
    liga('#lf-q', 'q'); liga('#lf-sit', 'sit'); liga('#lf-cat', 'cat'); liga('#lf-amin', 'amin'); liga('#lf-busca', 'busca', 'input');
    const mais = $('#lf-mais', main); if (mais) mais.addEventListener('click', () => { S.lotf.n += 120; re(); });
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
  // Fluxo do briefing: Enviada → Em análise → Em produção → Concluída; Cancelada como término alternativo.
  const ETAPAS = ['enviada', 'analise', 'producao', 'concluida'];
  function reqCard(p) {
    const idx = ETAPAS.indexOf(p.status);
    const quem = isEquipe() ? `<span>${esc(p.corretor.nome)} · ${esc(p.corretor.imobiliaria)}</span>` : '';
    return `<button type="button" class="req" data-req="${esc(p.id)}">
      <div style="display:grid;gap:6px;min-width:0"><span class="req__title">${esc(p.titulo)}</span>
        <span class="req__meta"><span>#${esc(p.numero)}</span><span>${esc(rotuloMaterial(p))}${p.formato ? ' · ' + esc(t(p.formato === 'impresso' ? 'form.print' : p.formato === 'ambos' ? 'form.both' : 'form.digital')) : ''}${p.quantidade > 1 ? ' · ' + nf(p.quantidade) + '×' : ''}</span>${(p.anexos || []).length ? `<span>${I.file.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${p.anexos.length}</span>` : ''}<span>${esc(tx(C.PRODUTOS[p.produto]))}</span>${p.prazo ? `<span>${I.calendar.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(data(p.prazo))}</span>` : ''}${quem}</span></div>
      <span class="badge ${p.status === 'concluida' ? 'badge--ink' : ''}"><i></i>${esc(t('st.' + p.status))}</span>
      ${p.status !== 'cancelada' ? `<div class="steps" aria-hidden="true">${ETAPAS.map((e, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    </button>`;
  }
  VIEWS.pedidos = () => {
    if (S.route.arg === 'novo' && !isEquipe()) return formPedidoHTML();
    const travado = !isEquipe() && !aprovado();
    const filtros = isEquipe() ? [['abertos', 'req.open'], ['cancelada', 'st.cancelada']] : [['abertos', 'req.open'], ['todos', 'req.all']];
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
    const vis = lst.filter((p) => (f === 'todos' ? true : f === 'cancelada' ? p.status === 'cancelada' : p.status !== 'cancelada' && (isEquipe() || p.status !== 'concluida')));
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
    const terminal = ['concluida', 'cancelada'].includes(p.status);
    const wa = `https://wa.me/${p.corretor.ddi}${p.corretor.tel}`;
    const proximas = [...ETAPAS, 'cancelada'].filter((s) => s !== p.status);
    const edicao = isEquipe() ? `
      <form id="f-upd" style="display:grid;gap:14px" class="card card--flat">
        <div class="grid2">
          <label class="field"><span>${esc(t('acc.status'))}</span><select class="select" name="status" ${terminal ? 'disabled' : ''}><option value="${esc(p.status)}" selected>${esc(t('st.' + p.status))}</option>${terminal ? '' : proximas.map((s) => `<option value="${s}">→ ${esc(t('st.' + s))}</option>`).join('')}</select>${terminal ? `<small>${esc(t('req.terminal'))}</small>` : ''}</label>
          <label class="field"><span>${esc(t('req.owner'))}</span><select class="select" name="responsavelId" id="f-resp"><option value="">—</option>${p.responsavel ? `<option value="${esc(p.responsavel.id)}" selected>${esc(p.responsavel.nome)}</option>` : ''}</select></label>
        </div>
        <label class="field"><span>${esc(t('req.delivery'))} (https://)</span><input class="input" type="url" name="entrega" value="${esc(p.entrega || '')}" placeholder="https://drive.google.com/…" /></label>
        <p class="formmsg" role="alert"></p>
      </form>` : '';
    const msgs = (p.mensagens || []).map((m) => `<li class="msg2 ${m.autor.papel === 'equipe' ? 'is-team' : ''}"><b>${esc(m.autor.nome)}${m.autor.papel === 'equipe' ? ` · ${esc(t('acc.manager'))}` : ''}</b><p>${esc(m.texto)}</p><time>${esc(data(m.em, true))}</time></li>`).join('');
    const legado = p.resposta ? `<li class="msg2 is-team"><b>${esc(t('req.answer'))}</b><p>${esc(p.resposta)}</p></li>` : '';
    const histTxt = (h) => (h.campo === 'responsavel' ? `${t('req.owner')}: ${h.para || '—'}` : h.campo === 'entrega' ? `${t('req.delivery')}: ${h.para ? t('req.linkSet') : '—'}` : t('st.' + (h.status || h.para)));
    abrirSheet({
      titulo: `#${p.numero} · ${p.titulo}`,
      corpo: `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="badge ${p.status === 'concluida' ? 'badge--ink' : ''}"><i></i>${esc(t('st.' + p.status))}</span>${p.responsavel ? `<span class="badge">${I.user.replace('<svg', '<svg width="12" height="12"')} ${esc(p.responsavel.nome)}</span>` : ''}<span class="small muted">${esc(data(p.atualizado, true))}</span></div>
        ${p.status !== 'cancelada' ? `<div class="steps" style="grid-template-columns:repeat(4,1fr)">${ETAPAS.map((e, i) => `<i class="${i <= idx ? 'on' : ''}" title="${esc(t('st.' + e))}"></i>`).join('')}</div>` : ''}
        ${p.entrega ? `<a class="btn btn--ink" href="${esc(p.entrega)}" target="_blank" rel="noopener">${I.download}${esc(t('req.delivery'))}</a>` : ''}
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
        ${(p.anexos || []).length ? `<div><span class="eyebrow">${esc(t('req.files'))}</span><ul class="files" style="margin-top:10px">${p.anexos.map((x) => `<li class="file">${x.tipo.startsWith('image/') ? `<img src="${esc(urlAnexo(x))}" alt="" loading="lazy" />` : `<span class="file__ico">${I.file}</span>`}<span class="file__n">${esc(x.nome)}<small>${kb(x.kb)} · ${esc(x.por || '')}</small></span><a class="iconbtn" href="${esc(urlAnexo(x))}" target="_blank" rel="noopener" aria-label="${esc(t('mat.open'))}">${I.ext}</a></li>`).join('')}</ul></div>` : ''}
        <div><span class="eyebrow">${esc(t('req.messages'))}</span>
          <ul class="thread">${legado}${msgs || (legado ? '' : `<li class="muted small">${esc(t('req.noMessages'))}</li>`)}</ul>
          ${!terminal || isEquipe() ? `<form id="f-msg" class="msgform" novalidate>
            <label class="vh" for="msg-txt">${esc(t('req.write'))}</label><textarea class="textarea" id="msg-txt" name="texto" maxlength="2000" placeholder="${esc(t('req.write'))}"></textarea>
            <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap">
              <label class="btn btn--line btn--sm" style="position:relative;overflow:hidden">${I.file}${esc(t('req.attach'))}<input type="file" id="msg-file" accept="image/jpeg,image/png,image/webp,application/pdf" style="position:absolute;inset:0;opacity:0;cursor:pointer" /></label>
              <button type="submit" class="btn btn--ink btn--sm">${I.send}${esc(t('req.send2'))}</button></div>
            <p class="formmsg" role="alert"></p></form>` : ''}
        </div>
        ${edicao}
        <div><span class="eyebrow">${esc(t('req.history'))}</span><ul class="timeline" style="margin-top:12px">${(p.historico || []).map((h) => `<li><span>${esc(histTxt(h))} · <span class="muted">${esc(h.por || '')} · ${esc(data(h.em, true))}</span></span></li>`).join('')}</ul></div>`,
      pe: isEquipe()
        ? `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-upd" class="btn btn--ink">${esc(t('req.save'))}</button>`
        : `${p.status === 'enviada' ? `<button type="button" class="btn btn--line" data-x="cancel">${esc(t('req.cancel'))}</button>` : ''}<button type="button" class="btn btn--ink" data-x="close">${esc(t('req.close'))}</button>`,
      depois: (panel) => {
        const atualizar = (d) => { Object.assign(p, d.pedido); const i = (S.pedidos || []).findIndex((x) => x.id === p.id); if (i >= 0) S.pedidos[i] = p; desenharPedidos(); };
        if (isEquipe()) api('gestores').then((d) => {
          const sel = $('#f-resp', panel); if (!sel) return;
          sel.innerHTML = `<option value="">—</option>${d.gestores.map((g) => `<option value="${esc(g.id)}" ${p.responsavel && p.responsavel.id === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}`;
        }).catch(() => {});
        const c = $('[data-x=cancel]', panel);
        if (c) c.addEventListener('click', async () => {
          c.disabled = true;
          try { atualizar(await api('pedidoCancelar', { id: p.id })); fecharSheet(); }
          catch (e) { toast(e.message); c.disabled = false; }
        });
        const fm = $('#f-msg', panel);
        if (fm) fm.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const txt = $('#msg-txt', fm).value.trim();
          const file = $('#msg-file', fm).files[0];
          if (!txt && !file) return;
          const btn = $('button[type=submit]', fm); btn.disabled = true;
          try {
            if (file) atualizar(await api('anexo', { pedido: p.id, ...(await prepararArquivo(file)) }));
            if (txt) atualizar(await api('pedidoMensagem', { id: p.id, texto: txt }));
            abrirPedido(p.id);
          } catch (e) { $('.formmsg', fm).textContent = e.message; btn.disabled = false; }
        });
        const f = $('#f-upd', panel);
        if (f) f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          if (fd.status === p.status || !fd.status) delete fd.status;
          const btn = $('button[form=f-upd]', panel); btn.disabled = true;
          try { atualizar(await api('pedidoAtualizar', { id: p.id, ...fd })); fecharSheet(); toast(t('acc.saved')); }
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

  VIEWS.aprender = () => {
    const tut = S.tut || { itens: [], ocultos: [] };
    const fixos = C.GUIAS.map((x) => ({ ...x, fixo: true, status: tut.ocultos.includes(x.id) ? 'arquivado' : 'publicado' }));
    const g = fixos.find((x) => x.id === S.route.arg);
    if (g && g.status === 'publicado') {
      return `<article class="article">
        <a href="#/aprender" class="linkbtn" style="text-decoration:none;display:inline-flex;gap:8px;align-items:center">${I.back.replace('<svg', '<svg width="18" height="18"')}${esc(t('learn.back'))}</a>
        <p class="eyebrow" style="margin-top:28px">${g.min} ${esc(t('learn.min'))}</p>
        <h1 class="h1" style="margin-top:10px">${esc(tx(g.titulo))}</h1>
        <p class="lead" style="margin-top:14px">${esc(tx(g.resumo))}</p>
        <div class="article__cover"><img src="${esc(g.capa)}" alt="" /></div>
        <div class="prose">${(g.corpo[S.lang] || g.corpo.pt).map(blocoHTML).join('')}</div>
      </article>`;
    }
    const d = tut.itens.find((x) => 't-' + x.id === S.route.arg);
    if (d) {
      return `<article class="article">
        <a href="#/aprender" class="linkbtn" style="text-decoration:none;display:inline-flex;gap:8px;align-items:center">${I.back.replace('<svg', '<svg width="18" height="18"')}${esc(t('learn.back'))}</a>
        ${d.categoria ? `<p class="eyebrow" style="margin-top:28px">${esc(d.categoria)}</p>` : ''}
        <h1 class="h1" style="margin-top:10px">${esc(d.titulo)}</h1>
        ${d.resumo ? `<p class="lead" style="margin-top:14px">${esc(d.resumo)}</p>` : ''}
        <div class="prose" style="margin-top:28px">${d.tipo === 'texto' ? d.corpo.split(/\n{2,}/).map((par) => `<p style="white-space:pre-line">${esc(par)}</p>`).join('')
          : `<p><a class="btn btn--ink" href="${esc(d.tipo === 'link' ? d.link : `/api/portal?tutorial=${encodeURIComponent(d.caminho)}`)}" target="_blank" rel="noopener">${d.tipo === 'link' ? I.ext : I.download}${esc(t(d.tipo === 'link' ? 'tut.openLink' : 'tut.openFile'))}</a></p>`}</div>
      </article>`;
    }
    const pub = (x) => isEquipe() || x.status === 'publicado';
    const cards = [
      ...tut.itens.filter(pub).map((x) => ({ href: `#/aprender/t-${x.id}`, capa: null, tit: x.titulo, res: x.resumo || '', meta: [x.categoria, t('tut.k.' + x.tipo)].filter(Boolean).join(' · '), st: x.status, id: x.id })),
      ...fixos.filter(pub).map((x) => ({ href: `#/aprender/${x.id}`, capa: x.capa, tit: tx(x.titulo), res: tx(x.resumo), meta: `${x.min} ${t('learn.min')}`, st: x.status, chave: x.id })),
    ];
    return `
      <header class="pagehead"><div class="pagehead__meta"><span class="num">${cards.length} ${esc(t('tut.count'))}</span></div>
        <div class="pagehead__body"><h1 class="h1">${esc(t('learn.title'))}</h1><p class="lead">${esc(t('learn.lead'))}</p>
          ${isEquipe() ? `<div><button type="button" class="btn btn--ink" id="tut-new">${I.plus}${esc(t('tut.new'))}</button></div>` : ''}</div></header>
      ${cards.length ? `<div class="guides">${cards.map((c) => `<div class="guide ${c.st !== 'publicado' ? 'is-hidden' : ''}"><a href="${c.href}" style="display:grid;gap:12px;text-decoration:none">
        <div class="guide__media">${c.capa ? `<img src="${esc(c.capa)}" alt="" loading="lazy" />` : `<span class="guide__ph">${I.book}</span>`}</div>
        <span class="eyebrow">${esc(c.meta)}${isEquipe() && c.st !== 'publicado' ? ` · ${esc(t(ST_MAT[c.st]))}` : ''}</span><b>${esc(c.tit)}</b><p>${esc(c.res)}</p></a>
        ${isEquipe() ? `<div class="tile__actions">${c.id ? `<button type="button" class="iconbtn" data-tup="${esc(c.id)}" aria-label="${esc(t('tut.up'))}" title="${esc(t('tut.up'))}">${I.up}</button><button type="button" class="iconbtn" data-tdown="${esc(c.id)}" aria-label="${esc(t('tut.down'))}" title="${esc(t('tut.down'))}">${I.down}</button>` : ''}
          <button type="button" class="btn btn--line btn--sm" data-tmenu="${esc(c.id || '')}" data-tfixo="${esc(c.chave || '')}">${I.dots}${esc(t('gest.more'))}</button></div>` : ''}
      </div>`).join('')}</div>` : `<div class="empty">${I.book}${esc(t('tut.empty'))}</div>`}
      <section class="section"><h2 class="h2" style="margin-bottom:12px">${esc(t('learn.faq'))}</h2>
        <div class="faq">${C.FAQ.map((f) => `<details><summary>${esc(tx(f.q))}</summary><p>${esc(tx(f.a))}</p></details>`).join('')}</div></section>`;
  };
  async function carregarTut(redesenhar) {
    try { S.tut = await api('tutoriais'); if (redesenhar && S.route.name === 'aprender') renderMain(); } catch (e) { toast(e.message); }
  }
  function editarTutorial(x) {
    const tipo0 = x ? x.tipo : 'texto';
    abrirSheet({
      titulo: x ? t('tut.edit') : t('tut.new'),
      corpo: `<form id="f-tut" style="display:grid;gap:14px" novalidate>
        <label class="field"><span>${esc(t('req.titleF'))}</span><input class="input" name="titulo" maxlength="120" value="${esc(x ? x.titulo : '')}" required /></label>
        <div class="grid2"><label class="field"><span>${esc(t('tut.cat'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="categoria" maxlength="60" value="${esc(x ? x.categoria || '' : '')}" placeholder="${esc(t('tut.catPh'))}" /></label>
          <label class="field"><span>${esc(t('tut.kind'))}</span><select class="select" name="tipo" id="tut-tipo">${['texto', 'link', 'arquivo'].map((k) => `<option value="${k}" ${k === tipo0 ? 'selected' : ''}>${esc(t('tut.k.' + k))}</option>`).join('')}</select></label></div>
        <label class="field"><span>${esc(t('tut.summary'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="resumo" maxlength="240" value="${esc(x ? x.resumo || '' : '')}" /></label>
        <label class="field" data-tk="texto"><span>${esc(t('tut.body'))}</span><textarea class="textarea" name="corpo" style="min-height:200px" maxlength="20000">${esc(x ? x.corpo || '' : '')}</textarea><small>${esc(t('tut.bodyHint'))}</small></label>
        <label class="field" data-tk="link"><span>${esc(t('tut.link'))} (https://)</span><input class="input" type="url" name="link" value="${esc(x && x.tipo === 'link' ? x.link || '' : '')}" placeholder="https://youtube.com/…" /></label>
        <div data-tk="arquivo" style="display:grid;gap:10px"><label class="drop"><input type="file" id="tut-file" /><span>${I.upload}</span><b id="tut-fname">${esc(x && x.nomeArquivo ? x.nomeArquivo : t('matadm.pick'))}</b><span>${esc(t('matadm.pickHint'))}</span></label></div>
        <div class="bar" id="tut-prog" hidden><i style="width:0%"></i></div>
        <p class="small muted" style="margin:0">${esc(t('tut.draftInfo'))}</p>
        <p class="formmsg" role="alert"></p>
      </form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-tut" class="btn btn--ink">${esc(t('req.save'))}</button>`,
      depois: (p) => {
        const f = $('#f-tut', p);
        const mostra = () => { const v = $('#tut-tipo', p).value; $$('[data-tk]', p).forEach((el) => { el.hidden = el.dataset.tk !== v; }); };
        $('#tut-tipo', p).addEventListener('change', mostra); mostra();
        let arquivo = null;
        $('#tut-file', p).addEventListener('change', (e) => { arquivo = e.target.files[0] || null; $('#tut-fname', p).textContent = arquivo ? arquivo.name : t('matadm.pick'); });
        f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          const btn = $('button[form=f-tut]', p); btn.disabled = true;
          try {
            let extra = {};
            if (fd.tipo === 'arquivo' && arquivo) extra = await enviarArquivo(arquivo, 'tutorial', $('#tut-prog', p), btn);
            if (fd.tipo !== 'link') delete fd.link;
            S.tut = await api('tutorialSalvar', { id: x ? x.id : undefined, ...fd, ...extra });
            fecharSheet(); renderMain(); toast(t('acc.saved'));
          } catch (e) { $('.formmsg', f).textContent = e.message; btn.disabled = false; btn.textContent = t('req.save'); }
        });
      },
    });
  }
  function menuTutorial(id, chave) {
    const x = id ? S.tut.itens.find((i) => i.id === id) : null;
    const st = x ? x.status : (S.tut.ocultos.includes(chave) ? 'arquivado' : 'publicado');
    const it = (acao, ico, k) => `<button type="button" data-acao="${acao}">${ico}${esc(t(k))}</button>`;
    abrirSheet({
      titulo: x ? x.titulo : tx(C.GUIAS.find((g) => g.id === chave).titulo),
      corpo: `<p class="small muted" style="margin:0">${esc(t(ST_MAT[st]))}${x ? '' : ` · ${esc(t('mst.fixed'))}`}</p><nav class="menu">
        ${st !== 'publicado' ? it('publicado', I.check, 'mst.publish') : ''}
        ${x && st !== 'rascunho' ? it('rascunho', I.pen, 'mst.toDraft') : ''}
        ${st !== 'arquivado' ? it('arquivado', I.eyeOff, 'tut.retire') : ''}
        ${x ? it('editar', I.pen, 'tut.edit') : ''}</nav>`,
      depois: (p) => $$('[data-acao]', p).forEach((b) => b.addEventListener('click', async () => {
        if (b.dataset.acao === 'editar') return editarTutorial(x);
        try {
          S.tut = x ? await api('tutorialStatus', { id, status: b.dataset.acao }) : await api('tutorialOcultar', { chave, ocultar: b.dataset.acao === 'arquivado' });
          fecharSheet(); renderMain(); toast(t('acc.saved'));
        } catch (e) { toast(e.message); }
      })),
    });
  }
  VIEWS['aprender:after'] = (main) => {
    if (!S.tutPedido) { S.tutPedido = true; carregarTut(true).finally(() => { S.tutPedido = false; }); }
    main.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.id === 'tut-new') editarTutorial(null);
      else if (b.dataset.tmenu !== undefined && (b.dataset.tmenu || b.dataset.tfixo)) menuTutorial(b.dataset.tmenu, b.dataset.tfixo);
      else if (b.dataset.tup || b.dataset.tdown) {
        try { S.tut = await api('tutorialMover', { id: b.dataset.tup || b.dataset.tdown, dir: b.dataset.tup ? -1 : 1 }); renderMain(); } catch (e) { toast(e.message); }
      }
    });
  };

  /* ============================================================ conta */
  VIEWS.conta = () => {
    const u = S.user;
    const tema = temaAtual();
    const prefs = `<section class="card" style="display:grid;gap:16px;align-content:start">
        <h2 class="h3">${esc(t('acc.lang'))}</h2>${langSwitch()}
        <h2 class="h3">${esc(t('acc.theme'))}</h2>
        <div class="seg" role="group">${[['light', 'acc.light'], ['dark', 'acc.dark']].map(([v, k]) => `<button type="button" data-tema="${v}" aria-pressed="${tema === v}">${esc(t(k))}</button>`).join('')}</div>
        <button type="button" class="btn btn--line" id="sair" style="justify-self:start">${I.out}${esc(t('acc.out'))}</button>
      </section>`;
    if (isEquipe()) {
      const senha = u.conta ? `<form id="f-senha-eq" class="card" style="display:grid;gap:12px;align-content:start" novalidate><h2 class="h3">${esc(t('acc.pass'))}</h2>
          <label class="field"><span>${esc(t('acc.passNow'))}</span><input class="input" type="password" name="senhaAtual" autocomplete="current-password" required /></label>
          <label class="field"><span>${esc(t('acc.passNew'))}</span><input class="input" type="password" name="senhaNova" autocomplete="new-password" minlength="8" required /></label>
          <p class="formmsg" role="alert"></p><button type="submit" class="btn btn--ink" style="justify-self:start">${esc(t('acc.save'))}</button></form>`
        : '';
      return `<header class="pagehead"><div class="pagehead__meta"><span>${esc(t('acc.manager'))}</span>${u.email ? `<span>${esc(u.email)}</span>` : ''}</div><div class="pagehead__body"><h1 class="h1">${esc(u.nome)}</h1></div></header>
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
              <div class="field"><span>${esc(t('auth.agency'))}</span><p class="input" style="margin:0;display:flex;align-items:center;background:var(--surface-2)">${esc(u.imobiliaria || '—')}</p><small>${esc(t('acc.agencyByManager'))}</small></div>
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
      <p class="small muted">${esc(t('acc.deleteByManager'))}</p>`;
  };
  VIEWS['conta:after'] = (main) => {
    bindLang(main);
    $$('[data-tema]', main).forEach((b) => b.addEventListener('click', () => aplicarTema(b.dataset.tema)));
    $('#sair', main).addEventListener('click', async () => { await api('sair').catch(() => {}); S.user = null; S.pedidos = null; S.contas = null; history.replaceState(null, '', location.pathname); render(); });
    const fse = $('#f-senha-eq', main);
    if (fse) fse.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(fse).entries());
      try { await api('senhaEquipe', fd); fse.reset(); toast(t('acc.saved')); }
      catch (e) { $('.formmsg', fse).textContent = e.message; }
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

  /* ============================================================ masterplan 3D (mapa de reservas) */
  VIEWS.masterplan = () => `
    <header class="pagehead">
      <div class="pagehead__meta"><a href="#/inicio" class="linkbtn" style="text-decoration:none">← ${esc(t('nav.home'))}</a></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('nav.masterplan'))}</h1><p class="lead">${esc(t('map.desc'))}</p>
        <div><a class="btn btn--line btn--sm" href="/3dmasterplan/#lotes" target="_blank" rel="noopener">${I.expand}${esc(t('home.mapFull'))}</a></div></div>
    </header>
    <div id="syncbox">${syncHTML(true)}</div>
    <div class="legend" id="kpis">${kpisHTML()}</div>
    <div class="stage stage--map stage--tall is-live"><iframe class="stage__frame" title="${esc(t('nav.masterplan'))}" src="/3dmasterplan/?embed=1#lotes" allow="fullscreen"></iframe></div>
    <p class="small muted" style="margin:10px 0 0">${esc(t('map.note2'))}</p>`;
  VIEWS['masterplan:after'] = (main) => { ligarSync(main); carregarComercial(true); };

  /* ============================================================ ofertas / campanhas / cards de WhatsApp */
  const OF_ST = { rascunho: 'of.draft', publicada: 'of.pub', encerrada: 'of.closed' };
  const fmtUSD = (s) => { const [i, d] = String(s).split('.'); return `US$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, S.lang === 'en' ? ',' : '.')}${d ? (S.lang === 'en' ? '.' : ',') + d.padEnd(2, '0') : ''}`; };
  const quando = (iso) => new Intl.DateTimeFormat(locale(), { timeZone: (S.of && S.of.fuso) || undefined, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  // ISO UTC → "AAAA-MM-DDTHH:MM" no fuso comercial (para o campo datetime-local)
  function paraLocal(iso) {
    if (!iso) return '';
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: S.of.fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  function ofertaCardHTML(o) {
    const el = o.elegibilidade || { ok: true };
    const lots = (o.unidades || []).map((id) => { const u = S.com && S.com.unidades.find((x) => x.id === id); return u ? `${id} · ${nf(u.a)} m²` : id; });
    return `<article class="offer ${el.ok ? '' : 'is-off'}">
      <div class="offer__card">
        <span class="offer__brand">BRACERUM PARK</span><span class="offer__camp">${esc(o.campanha || t('of.offer'))}</span>
        <b class="offer__title">${esc(o.titulo)}</b>
        <p class="offer__cond">${esc(o.condicoes)}</p>
        <div class="offer__box">${o.valor ? `<b class="num">${esc(fmtUSD(o.valor))}</b><span>${esc(o.valorRotulo || t('of.value'))}</span>` : ''}
          ${lots.length ? `<ul>${lots.slice(0, 4).map((l) => `<li class="num">${esc(l)}</li>`).join('')}${lots.length > 4 ? `<li>+ ${lots.length - 4}</li>` : ''}</ul>` : ''}
          <small>${esc(t('of.validUntil'))} ${esc(quando(o.fim))}</small></div>
      </div>
      <div class="offer__body">
        ${isEquipe() ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><span class="badge ${o.status === 'publicada' ? 'badge--ink' : ''}"><i></i>${esc(t(OF_ST[o.status]))}</span><span class="badge">${esc(el.ok ? t('of.eligible') : o.motivo)}</span></div>` : ''}
        ${o.descricao ? `<p class="small" style="margin:0;white-space:pre-line">${esc(o.descricao)}</p>` : ''}
        <p class="small muted" style="margin:0">${esc(t('of.period'))} ${esc(quando(o.inicio))} → ${esc(quando(o.fim))} (${esc(S.of.nomeFuso)})</p>
        <div class="tile__actions">
          <button type="button" class="btn btn--ink" data-card="${esc(o.id)}" ${el.ok ? '' : 'disabled'}>${I.download}<span class="lbl">${esc(t('of.png'))}</span></button>
          <button type="button" class="iconbtn" data-cardsvg="${esc(o.id)}" ${el.ok ? '' : 'disabled'} aria-label="SVG" title="SVG">${I.file}</button>
          ${isEquipe() ? `<button type="button" class="iconbtn" data-omenu="${esc(o.id)}" aria-label="${esc(t('gest.more'))}" title="${esc(t('gest.more'))}">${I.dots}</button>` : ''}
        </div>
      </div>
    </article>`;
  }
  VIEWS.ofertas = () => `
    <header class="pagehead">
      <div class="pagehead__meta"><a href="#/inicio" class="linkbtn" style="text-decoration:none">← ${esc(t('nav.home'))}</a><span id="of-count" class="num"></span></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('nav.offers'))}</h1><p class="lead">${esc(t(isEquipe() ? 'of.leadAdm' : 'of.lead'))}</p>
        ${isEquipe() ? `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button type="button" class="btn btn--ink" id="of-new">${I.plus}${esc(t('of.new'))}</button>
          <div class="seg" role="group">${[['ativas', 'of.active'], ['rascunho', 'of.drafts'], ['encerrada', 'of.closeds'], ['todos', 'req.all']].map(([v, k]) => `<button type="button" data-of="${v}" aria-pressed="${(S.ofFiltro || 'ativas') === v}">${esc(t(k))}</button>`).join('')}</div></div>` : ''}</div>
    </header>
    <div id="of-sync"></div>
    <div class="offers" id="of-list"><div class="skel" style="height:320px;border-radius:18px"></div></div>
    <p class="small muted" style="margin-top:20px">${esc(t('of.rules'))}</p>`;
  function desenharOfertas() {
    const box = $('#of-list'); if (!box || !S.of) return;
    const f = S.ofFiltro || 'ativas';
    const lst = S.of.ofertas.filter((o) => !isEquipe() || f === 'todos' || (f === 'ativas' ? o.status === 'publicada' : o.status === f));
    $('#of-count').textContent = `${lst.length}`;
    const sb = $('#of-sync');
    if (sb) sb.innerHTML = S.of.sync.estado === 'atual' ? '' : `<div class="syncbar syncbar--alerta">${I.info}<span>${esc(t('of.syncWarn'))} ${esc(S.of.sync.ultimoSucesso ? data(S.of.sync.ultimoSucesso, true) : '—')}</span></div>`;
    box.innerHTML = lst.length ? lst.map(ofertaCardHTML).join('') : `<div class="empty" style="grid-column:1/-1">${I.tag}${esc(t(isEquipe() ? 'of.emptyAdm' : 'of.empty'))}</div>`;
  }
  async function carregarOfertas() {
    try { S.of = await api('ofertas'); desenharOfertas(); }
    catch (e) { const b = $('#of-list'); if (b) b.innerHTML = `<div class="empty" style="grid-column:1/-1">${I.info}${esc(e.message)}</div>`; }
  }
  // O card é gerado e validado no servidor (SVG); aqui só vira PNG para o WhatsApp.
  async function baixarCard(id, png) {
    const r = await fetch(`/api/portal?card=${encodeURIComponent(id)}`, { credentials: 'same-origin' });
    if (!r.ok) { let m = t('c.error'); try { m = (await r.json()).erro || m; } catch (e) {} toast(m); carregarOfertas(); return; }
    const svg = await r.text();
    const nome = `bracerum-oferta-${id}`;
    if (!png) return baixar(nome + '.svg', new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350;
      cv.getContext('2d').drawImage(img, 0, 0, 1080, 1350); URL.revokeObjectURL(url);
      cv.toBlob((b) => baixar(nome + '.png', b), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); baixar(nome + '.svg', new Blob([svg], { type: 'image/svg+xml' })); };
    img.src = url;
  }
  function editarOferta(o) {
    abrirSheet({
      titulo: o ? t('of.edit') : t('of.new'),
      corpo: `<form id="f-of" style="display:grid;gap:14px" novalidate>
        <label class="field"><span>${esc(t('req.titleF'))}</span><input class="input" name="titulo" maxlength="90" value="${esc(o ? o.titulo : '')}" required /></label>
        <label class="field"><span>${esc(t('of.campaign'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="campanha" maxlength="60" value="${esc(o ? o.campanha || '' : '')}" placeholder="Pós-Expo" /></label>
        <label class="field"><span>${esc(t('of.conditions'))}</span><textarea class="textarea" name="condicoes" maxlength="600" style="min-height:90px" required>${esc(o ? o.condicoes : '')}</textarea><small>${esc(t('of.conditionsHint'))}</small></label>
        <label class="field"><span>${esc(t('of.desc'))} <span class="muted">(${esc(t('c.optional'))})</span></span><textarea class="textarea" name="descricao" maxlength="1200" style="min-height:70px">${esc(o ? o.descricao || '' : '')}</textarea></label>
        <label class="field"><span>${esc(t('of.units'))}</span><input class="input" name="unidades" value="${esc(o ? (o.unidades || []).join(', ') : '')}" placeholder="Q01.L001, Q01.L002" /><small>${esc(t('of.unitsHint'))}</small></label>
        <div class="grid2">
          <label class="field"><span>${esc(t('of.value'))} (USD) <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input num" name="valor" inputmode="decimal" value="${esc(o ? o.valor || '' : '')}" placeholder="150000" /></label>
          <label class="field"><span>${esc(t('of.valueLabel'))} <span class="muted">(${esc(t('c.optional'))})</span></span><input class="input" name="valorRotulo" maxlength="60" value="${esc(o ? o.valorRotulo || '' : '')}" placeholder="${esc(t('of.valueLabelPh'))}" /></label>
        </div>
        <div class="grid2">
          <label class="field"><span>${esc(t('of.start'))}</span><input class="input" type="datetime-local" name="inicio" value="${esc(o ? paraLocal(o.inicio) : '')}" required /></label>
          <label class="field"><span>${esc(t('of.end'))}</span><input class="input" type="datetime-local" name="fim" value="${esc(o ? paraLocal(o.fim) : '')}" required /></label>
        </div>
        <p class="small muted" style="margin:0">${esc(t('of.tz'))} ${esc(S.of.nomeFuso)} (${esc(S.of.fuso)}). ${esc(t('of.endRule'))}</p>
        <p class="formmsg" role="alert"></p>
      </form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-of" class="btn btn--ink">${esc(t('req.save'))}</button>`,
      depois: (p) => {
        const f = $('#f-of', p);
        f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          const btn = $('button[form=f-of]', p); btn.disabled = true;
          try { S.of = await api('ofertaSalvar', { id: o ? o.id : undefined, ...fd }); fecharSheet(); desenharOfertas(); toast(t('of.savedDraft')); }
          catch (e) { $('.formmsg', f).textContent = e.message; btn.disabled = false; }
        });
      },
    });
  }
  function menuOferta(o) {
    const it = (acao, ico, k) => `<button type="button" data-acao="${acao}">${ico}${esc(t(k))}</button>`;
    abrirSheet({
      titulo: o.titulo,
      corpo: `<p class="small muted" style="margin:0">${esc(t(OF_ST[o.status]))} · ${esc(o.elegibilidade.ok ? t('of.eligible') : o.motivo)}</p>
        <nav class="menu">
          ${o.status !== 'publicada' ? it('publicada', I.check, 'of.publish') : ''}
          ${o.status === 'publicada' ? it('encerrada', I.x, 'of.close') : ''}
          ${o.status === 'encerrada' ? it('rascunho', I.pen, 'mst.toDraft') : ''}
          ${it('editar', I.pen, 'of.edit')}
        </nav>
        <div><span class="eyebrow">${esc(t('req.history'))}</span><ul class="timeline" style="margin-top:10px">${(o.historico || []).map((h) => `<li><span>${esc(h.acao)} <span class="muted">· ${esc(h.por || '')} · ${esc(data(h.em, true))}</span></span></li>`).join('')}</ul></div>`,
      depois: (p) => $$('[data-acao]', p).forEach((b) => b.addEventListener('click', async () => {
        if (b.dataset.acao === 'editar') return editarOferta(o);
        try { S.of = await api('ofertaStatus', { id: o.id, status: b.dataset.acao }); fecharSheet(); desenharOfertas(); toast(t('acc.saved')); }
        catch (e) { toast(e.message); }
      })),
    });
  }
  VIEWS['ofertas:after'] = (main) => {
    carregarOfertas();
    if (!S.com) carregarComercial(true);
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.card) baixarCard(b.dataset.card, true);
      else if (b.dataset.cardsvg) baixarCard(b.dataset.cardsvg, false);
      else if (b.dataset.omenu) menuOferta(S.of.ofertas.find((x) => x.id === b.dataset.omenu));
      else if (b.dataset.of) { S.ofFiltro = b.dataset.of; $$('[data-of]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharOfertas(); }
      else if (b.id === 'of-new') editarOferta(null);
    });
  };

  /* ============================================================ gestão: contas, imobiliárias e atividade (só gestor) */
  const papelNome = (p) => t(p === 'equipe' ? 'acc.manager' : 'acc.broker');
  function situacao(c) {
    if (c.status === 'excluido') return ['gest.deleted', ''];
    if (c.status === 'bloqueado') return ['acc.bloqueado', ''];
    if (!c.ativo) return ['gest.waiting', ''];
    return ['gest.active', 'badge--ink'];
  }
  VIEWS.gestao = () => {
    const aba = ['contas', 'cv', 'imobiliarias', 'atividade'].includes(S.route.arg) ? S.route.arg : 'contas';
    const abas = `<div class="seg" role="tablist" style="margin-bottom:18px">${[['contas', 'gest.tabAccounts'], ['cv', 'gest.tabCV'], ['imobiliarias', 'gest.tabAgencies'], ['atividade', 'gest.tabActivity']].map(([id, k]) => `<a role="tab" href="#/gestao/${id}" aria-current="${aba === id ? 'page' : 'false'}" aria-selected="${aba === id}">${esc(t(k))}</a>`).join('')}</div>`;
    const head = (botao) => `<header class="pagehead"><div class="pagehead__meta"><span id="ct-count" class="num"></span></div>
      <div class="pagehead__body"><h1 class="h1">${esc(t('nav.gestao'))}</h1><p class="lead">${esc(t('gest.lead'))}</p>${botao}</div></header>${abas}`;
    if (aba === 'imobiliarias') return `${head(`<div><button type="button" class="btn btn--ink" id="im-new">${I.plus}${esc(t('imob.new'))}</button></div>`)}
      <p class="small muted" style="margin:0 0 14px">${esc(t('imob.lead'))}</p><div id="im-list"><div class="skel" style="height:200px;border-radius:18px"></div></div>`;
    if (aba === 'cv') return `${head('')}<div id="cv-box"><div class="skel" style="height:240px;border-radius:18px"></div></div>`;
    if (aba === 'atividade') return `${head('')}<p class="small muted" style="margin:0 0 14px">${esc(t('aud.lead'))}</p><div id="au-list"><div class="skel" style="height:240px;border-radius:18px"></div></div>`;
    return `${head(`<div><button type="button" class="btn btn--ink" id="ct-new">${I.plus}${esc(t('gest.new'))}</button></div>`)}
    <div class="toolbar"><div class="seg" role="group">${[['todos', 'req.all'], ['corretor', 'gest.brokers'], ['equipe', 'gest.managers'], ['aguardando', 'gest.waiting'], ['bloqueado', 'acc.bloqueado'], ['excluido', 'gest.deletedPl']].map(([id, k]) => `<button type="button" data-cf="${id}" aria-pressed="${S.team.filtro === id}">${esc(t(k))}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;flex:1 1 260px;justify-content:flex-end;flex-wrap:wrap">
        <label class="search"><span class="vh">${esc(t('mat.search'))}</span>${I.search}<input class="input" type="search" id="ct-q" placeholder="${esc(t('gest.search'))}" /></label>
        <button type="button" class="btn btn--line btn--sm" id="ct-csv" style="min-height:44px">${I.download}CSV</button></div></div>
    <div id="ct-list"><div class="skel" style="height:240px;border-radius:18px"></div></div>`;
  };
  function desenharContas() {
    const box = $('#ct-list'); if (!box) return;
    const lst = S.contas || [];
    const f = S.team.filtro;
    const q = ($('#ct-q') && $('#ct-q').value || '').trim().toLowerCase();
    const vis = lst.filter((c) => (f === 'excluido' ? c.status === 'excluido' : c.status !== 'excluido' && (f === 'todos' || (f === 'aguardando' ? !c.ativo && c.status !== 'bloqueado' : f === 'bloqueado' ? c.status === 'bloqueado' : c.papel === f)))
      && (!q || [c.nome, c.email, c.imobiliaria].join(' ').toLowerCase().includes(q)));
    $('#ct-count').textContent = `${vis.length} / ${lst.filter((c) => c.status !== 'excluido').length}`;
    if (!vis.length) { box.innerHTML = `<div class="empty">${I.users}${esc(t('team.noBrokers'))}</div>`; return; }
    box.innerHTML = `<div class="tablewrap"><table class="table table--cards"><thead><tr><th>${esc(t('auth.name'))}</th><th>${esc(t('gest.kind'))}</th><th>${esc(t('auth.wa'))} · ${esc(t('auth.agency'))}</th><th>${esc(t('acc.status'))}</th><th></th></tr></thead><tbody>
      ${vis.map((c) => { const [st, cls] = situacao(c); const eu = c.id === S.user.id; return `<tr>
        <td><b>${esc(c.nome || '—')}</b>${eu ? ` <span class="badge">${esc(t('gest.you'))}</span>` : ''}<div class="small muted">${esc(c.email)}</div><div class="small muted">${c.ultimoAcesso ? `${esc(t('team.lastSeen'))} ${esc(data(c.ultimoAcesso, true))}` : `${esc(t('gest.created'))} ${esc(data(c.criado))}`}</div></td>
        <td><span class="badge ${c.papel === 'equipe' ? 'badge--ink' : ''}">${esc(papelNome(c.papel))}</span></td>
        <td>${c.tel ? `<a class="linkbtn" href="https://wa.me/${esc(c.ddi)}${esc(c.tel)}" target="_blank" rel="noopener">+${esc(c.ddi)} ${esc(c.tel)}</a>` : '<span class="muted">—</span>'}<div class="small muted">${esc(c.imobiliaria || '')}${c.creci ? ` · ${esc(c.creci)}` : ''}</div></td>
        <td><span class="badge ${cls}"><i></i>${esc(t(st))}</span></td>
        <td>${eu ? '' : `<div class="row">
          ${!c.ativo && c.status === 'aprovado' ? `<button type="button" class="btn btn--ink btn--sm" data-clink="${esc(c.id)}">${I.link}${esc(t('gest.copyLink'))}</button>` : ''}
          <button type="button" class="iconbtn" data-cmenu="${esc(c.id)}" aria-label="${esc(t('gest.more'))}" title="${esc(t('gest.more'))}">${I.dots}</button></div>`}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  }
  function mostrarLink(c, link, titulo) {
    const msg = `${t('gest.msgHi')} ${primeiro(c.nome)}! ${t('gest.msgBody')}\n${link}`;
    abrirSheet({
      titulo: titulo || t('gest.linkTitle'),
      corpo: `<p style="margin:0">${esc(t('gest.linkInfo'))}</p>
        <dl class="kv"><dt>${esc(t('auth.name'))}</dt><dd>${esc(c.nome)}</dd><dt>${esc(t('auth.email'))}</dt><dd>${esc(c.email)}</dd><dt>${esc(t('gest.kind'))}</dt><dd>${esc(papelNome(c.papel))}</dd></dl>
        <div class="linkbox"><code>${esc(link)}</code><button type="button" class="btn btn--ink btn--sm" data-x="cp">${I.copy}${esc(t('mat.copy').split(' ')[0])}</button></div>`,
      pe: `<a class="btn btn--line" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Bracerum Park · ' + t('brand'))}&body=${encodeURIComponent(msg)}">${I.mail}E-mail</a>
        <a class="btn btn--ink" href="https://wa.me/${c.tel ? esc(c.ddi) + esc(c.tel) : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${I.wa.replace('<svg', '<svg width="16" height="16"')}WhatsApp</a>`,
      depois: (p) => $('[data-x=cp]', p).addEventListener('click', () => copiar(link)),
    });
  }
  async function imobsAtivas() {
    if (!S.imobs) { try { S.imobs = (await api('imobiliarias')).itens; } catch (e) { S.imobs = []; } }
    return S.imobs.filter((x) => x.status === 'ativa');
  }
  const opcoesImob = (lst, sel) => `<option value="">${esc(t('imob.none'))}</option>${lst.map((x) => `<option value="${esc(x.id)}" ${x.id === sel ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}`;
  async function novaConta() {
    let papel = 'corretor';
    const ddi = ['55', '595', '54', '598', '1', '351'].map((d) => `<option value="${d}">+${d}</option>`).join('');
    const imobs = await imobsAtivas();
    abrirSheet({
      titulo: t('gest.new'),
      corpo: `<form id="f-conta" style="display:grid;gap:16px" novalidate>
        <div class="kinds" role="radiogroup" aria-label="${esc(t('gest.kind'))}">
          <button type="button" class="kind" role="radio" data-papel="corretor" aria-checked="true">${I.user}<b>${esc(t('acc.broker'))}</b><span>${esc(t('gest.brokerInfo'))}</span></button>
          <button type="button" class="kind" role="radio" data-papel="equipe" aria-checked="false">${I.lock}<b>${esc(t('acc.manager'))}</b><span>${esc(t('gest.managerInfo'))}</span></button>
        </div>
        <label class="field"><span>${esc(t('auth.name'))}</span><input class="input" name="nome" autocomplete="off" required /></label>
        <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" name="email" autocomplete="off" required /></label>
        <label class="field"><span>${esc(t('auth.wa'))} <span class="muted" data-opc hidden>(${esc(t('c.optional'))})</span></span><span class="phone"><select class="select" name="ddi">${ddi}</select><input class="input" name="tel" type="tel" inputmode="tel" /></span></label>
        <div style="display:grid;gap:14px" data-so-corretor>
          <div class="grid2">
            <label class="field"><span>${esc(t('auth.agency'))}</span><select class="select" name="imobiliariaId" id="nc-imob">${opcoesImob(imobs, '')}</select></label>
            <label class="field" id="nc-imob-txt"><span>${esc(t('imob.orText'))}</span><input class="input" name="imobiliaria" placeholder="${esc(t('imob.autonomo'))}" /></label>
          </div>
          <label class="field"><span>${esc(t('auth.creci'))}</span><input class="input" name="creci" /></label>
        </div>
        <p class="small muted" style="margin:0">${esc(t('gest.newInfo'))}</p>
        <p class="formmsg" role="alert"></p>
      </form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-conta" class="btn btn--ink">${esc(t('gest.create'))}${I.arrow}</button>`,
      depois: (p) => {
        $$('[data-papel]', p).forEach((b) => b.addEventListener('click', () => {
          papel = b.dataset.papel;
          $$('[data-papel]', p).forEach((x) => x.setAttribute('aria-checked', x === b));
          $('[data-so-corretor]', p).hidden = papel !== 'corretor';
          $('[data-opc]', p).hidden = papel === 'corretor';
        }));
        const im = $('#nc-imob', p);
        im.addEventListener('change', () => { $('#nc-imob-txt', p).hidden = !!im.value; });
        const f = $('#f-conta', p);
        f.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(f).entries());
          const msg = $('.formmsg', f); msg.textContent = '';
          const btn = $('button[form=f-conta]', p); btn.disabled = true;
          try {
            const pais = { 55: 'BR', 595: 'PY', 54: 'AR', 598: 'UY' }[fd.ddi] || 'OUTRO';
            const d = await api('contaCriar', { ...fd, papel, pais });
            S.contas = [d.conta, ...(S.contas || [])];
            desenharContas();
            mostrarLink(d.conta, d.link, t('gest.created2'));
          } catch (e) { msg.textContent = e.message; btn.disabled = false; }
        });
      },
    });
  }
  async function trocarImobiliaria(c) {
    const imobs = await imobsAtivas();
    abrirSheet({
      titulo: `${t('imob.change')} · ${c.nome}`,
      corpo: `<form id="f-ci" style="display:grid;gap:14px" novalidate>
        <label class="field"><span>${esc(t('auth.agency'))}</span><select class="select" name="imobiliariaId">${opcoesImob(imobs, c.imobiliariaId)}</select></label>
        <label class="field"><span>${esc(t('imob.orText'))}</span><input class="input" name="imobiliaria" value="${esc(c.imobiliariaId ? '' : c.imobiliaria || '')}" placeholder="${esc(t('imob.autonomo'))}" /></label>
        <p class="formmsg" role="alert"></p></form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-ci" class="btn btn--ink">${esc(t('req.save'))}</button>`,
      depois: (p) => $('#f-ci', p).addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = Object.fromEntries(new FormData(ev.target).entries());
        try { const d = await api('contaAtualizar', { id: c.id, imobiliariaId: fd.imobiliariaId, imobiliaria: fd.imobiliaria }); Object.assign(c, d.conta); fecharSheet(); desenharContas(); toast(t('acc.saved')); }
        catch (e) { $('.formmsg', p).textContent = e.message; }
      }),
    });
  }
  function menuConta(c) {
    const it = (acao, ico, k) => `<button type="button" data-acao="${acao}">${ico}${esc(t(k))}</button>`;
    const exc = c.status === 'excluido';
    abrirSheet({
      titulo: c.nome || c.email,
      corpo: `<p class="small muted" style="margin:0">${esc(c.email)} · ${esc(papelNome(c.papel))} · ${esc(t(situacao(c)[0]))}</p><nav class="menu">
        ${exc ? it('reativar', I.check, 'gest.restore') : `
          ${c.status === 'aprovado' ? (c.ativo ? it('reset', I.link, 'gest.resetLink') : it('link', I.link, 'gest.copyLink')) : ''}
          ${c.papel === 'corretor' ? it('imob', I.building, 'imob.change') : ''}
          ${it('papel', c.papel === 'equipe' ? I.user : I.lock, c.papel === 'equipe' ? 'gest.toBroker' : 'gest.toManager')}
          ${c.status === 'bloqueado' ? it('reativar', I.check, 'team.unblock') : it('suspender', I.x, 'team.block')}
          ${it('remover', I.trash, 'gest.remove')}`}
      </nav>${c.status !== 'excluido' ? `<p class="small muted" style="margin:0">${esc(t('gest.removeInfo'))}</p>` : ''}`,
      depois: (p) => $$('[data-acao]', p).forEach((b) => b.addEventListener('click', async () => {
        const a = b.dataset.acao;
        try {
          if (a === 'imob') return trocarImobiliaria(c);
          if (a === 'link') { const d = await api('contaLink', { id: c.id }); mostrarLink(c, d.link); return; }
          if (a === 'reset') {
            if (!confirm(t('gest.resetConfirm'))) return;
            const d = await api('contaAtualizar', { id: c.id, novoLink: true }); Object.assign(c, d.conta); desenharContas(); mostrarLink(c, d.link); return;
          }
          if (a === 'remover') {
            if (!confirm(`${t('gest.remove')}: ${c.nome || c.email}? ${t('gest.removeInfo')}`)) return;
            const d = await api('contaRemover', { id: c.id }); Object.assign(c, d.conta);
          } else {
            const mud = a === 'papel' ? { papel: c.papel === 'equipe' ? 'corretor' : 'equipe' } : { status: a === 'suspender' ? 'bloqueado' : 'aprovado' };
            const d = await api('contaAtualizar', { id: c.id, ...mud }); Object.assign(c, d.conta);
            if (a === 'reativar' && exc) { fecharSheet(); desenharContas(); toast(t('gest.restored')); return; }
          }
          fecharSheet(); desenharContas(); toast(t('acc.saved'));
        } catch (e) { toast(e.message); }
      })),
    });
  }
  /* imobiliárias */
  function desenharImobs() {
    const box = $('#im-list'); if (!box) return;
    const lst = (S.imobs || []).slice().sort((a, b) => (a.status === b.status ? a.nome.localeCompare(b.nome) : a.status === 'ativa' ? -1 : 1));
    $('#ct-count').textContent = `${lst.filter((x) => x.status === 'ativa').length}`;
    box.innerHTML = lst.length ? `<div class="tablewrap"><table class="table table--cards"><thead><tr><th>${esc(t('imob.name'))}</th><th>${esc(t('imob.contact'))}</th><th>${esc(t('gest.brokers'))}</th><th>${esc(t('acc.status'))}</th><th></th></tr></thead><tbody>
      ${lst.map((x) => `<tr><td><b>${esc(x.nome)}</b>${x.documento ? `<div class="small muted">${esc(x.documento)}</div>` : ''}${x.cidade ? `<div class="small muted">${esc(x.cidade)}</div>` : ''}</td>
        <td>${esc(x.contato || '—')}<div class="small muted">${esc([x.telefone, x.email].filter(Boolean).join(' · '))}</div></td>
        <td class="num">${nf(x.corretores || 0)}</td>
        <td><span class="badge ${x.status === 'ativa' ? 'badge--ink' : ''}"><i></i>${esc(t(x.status === 'ativa' ? 'imob.active' : 'imob.archived'))}</span></td>
        <td><div class="row"><button type="button" class="btn btn--line btn--sm" data-imed="${esc(x.id)}">${I.pen}${esc(t('matadm.edit'))}</button>
          <button type="button" class="iconbtn" data-imarq="${esc(x.id)}" aria-label="${esc(t(x.status === 'ativa' ? 'imob.archive' : 'imob.restore'))}" title="${esc(t(x.status === 'ativa' ? 'imob.archive' : 'imob.restore'))}">${x.status === 'ativa' ? I.eyeOff : I.eye}</button>
          ${x.corretores ? '' : `<button type="button" class="iconbtn" data-imdel="${esc(x.id)}" aria-label="${esc(t('team.remove'))}" title="${esc(t('team.remove'))}">${I.trash}</button>`}</div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${I.building}${esc(t('imob.empty'))}</div>`;
  }
  function editarImob(x) {
    const campo = (n, k, v, extra = '') => `<label class="field"><span>${esc(t(k))}</span><input class="input" name="${n}" value="${esc(v || '')}" ${extra} /></label>`;
    abrirSheet({
      titulo: x ? t('matadm.edit') : t('imob.new'),
      corpo: `<form id="f-im" style="display:grid;gap:14px" novalidate>
        ${campo('nome', 'imob.name', x && x.nome, 'required maxlength="100"')}
        <div class="grid2">${campo('documento', 'imob.doc', x && x.documento)}${campo('cidade', 'imob.city', x && x.cidade)}</div>
        ${campo('contato', 'imob.contact', x && x.contato)}
        <div class="grid2">${campo('telefone', 'auth.wa', x && x.telefone)}${campo('email', 'auth.email', x && x.email, 'type="email"')}</div>
        <p class="formmsg" role="alert"></p></form>`,
      pe: `<button type="button" class="btn btn--line" data-x="close">${esc(t('req.close'))}</button><button type="submit" form="f-im" class="btn btn--ink">${esc(t('req.save'))}</button>`,
      depois: (p) => $('#f-im', p).addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = Object.fromEntries(new FormData(ev.target).entries());
        try { S.imobs = (await api('imobiliariaSalvar', { id: x ? x.id : undefined, ...fd })).itens; fecharSheet(); desenharImobs(); toast(t('acc.saved')); }
        catch (e) { $('.formmsg', p).textContent = e.message; }
      }),
    });
  }
  /* atividade (auditoria) */
  function desenharAuditoria(ev) {
    const box = $('#au-list'); if (!box) return;
    box.innerHTML = ev.length ? `<ul class="timeline audit">${ev.map((e) => `<li><span><b>${esc(e.acao)}</b>${e.id ? ` <span class="muted">· ${esc(e.entidade)} ${esc(String(e.id).slice(0, 14))}</span>` : ''}${e.det ? ` <span class="muted">· ${esc(JSON.stringify(e.det).slice(0, 140))}</span>` : ''}<br/><span class="muted small">${esc(e.por ? e.por.nome || '' : '')} · ${esc(data(e.em, true))}</span></span></li>`).join('')}</ul>`
      : `<div class="empty">${I.clock}${esc(t('aud.empty'))}</div>`;
  }
  /* corretores do CV → conta no portal + e-mail de boas-vindas */
  function cvSitu(c) {
    if (c.fora) return ['muted', c.fora];
    if (!c.conta) return ['', t('cv.noAccount')];
    if (c.conta.papel === 'equipe') return ['', t('cv.isManager')];
    if (c.conta.ativo) return ['ok', t('cv.active')];
    const cv = c.conta.convite;
    if (cv && cv.ok) return ['', `${t('cv.sent')} ${data(cv.em, true)}`];
    if (cv && !cv.ok) return ['erro', `${t('cv.failed')}: ${cv.erro || ''}`];
    return ['', t('cv.notSent')];
  }
  function desenharCV() {
    const box = $('#cv-box'); const d = S.cv; if (!box || !d) return;
    const e = d.estado || {};
    const pend = d.corretores.filter((c) => !c.fora && (!c.conta || (c.conta.papel === 'corretor' && !c.conta.ativo && !(c.conta.convite && c.conta.convite.ok))));
    box.innerHTML = `
      <p class="small muted" style="margin:0 0 14px">${esc(t('cv.lead'))}</p>
      <div class="syncbar ${d.auto && d.email ? '' : 'syncbar--alerta'}">${I.info}<span>${esc(d.auto ? t('cv.autoOn') + (d.desdeId ? ` ${t('cv.autoFrom')} #${d.desdeId}.` : '') : t('cv.autoOff'))}${d.email ? '' : ` ${esc(t('cv.noEmail'))}`}${e.ultimaTentativa ? ` <span class="muted">· ${esc(t('cv.last'))} ${esc(data(e.ultimaTentativa, true))}${e.resultado === 'erro' ? ` — ${esc(e.erro || '')}` : ''}</span>` : ''}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 16px">
        <button type="button" class="btn btn--ink btn--sm" id="cv-sync" ${pend.length ? '' : 'disabled'}>${I.send}${esc(t('cv.syncSend'))} (${pend.length})</button>
        <button type="button" class="btn btn--line btn--sm" id="cv-test">${I.send}${esc(t('cv.test'))}</button>
        <button type="button" class="btn btn--line btn--sm" id="cv-reload">${I.refresh}${esc(t('cv.reload'))}</button>
      </div>
      <div class="tablewrap"><table class="table"><thead><tr><th>${esc(t('auth.name'))}</th><th>${esc(t('auth.email'))}</th><th>${esc(t('auth.agency'))}</th><th>${esc(t('acc.status'))}</th><th></th></tr></thead><tbody>
      ${d.corretores.map((c) => { const [cls, txt] = cvSitu(c); const pode = !c.fora && (!c.conta || (c.conta.papel === 'corretor' && !c.conta.ativo));
        return `<tr><td><b>${esc(c.nome)}</b><br><span class="small muted">CV #${esc(c.cvId)}${c.cadastro ? ` · ${esc(c.cadastro)}` : ''}</span></td><td>${esc(c.email || '—')}</td><td>${esc(c.imobiliaria || '—')}</td>
          <td><span class="small ${cls === 'erro' ? '' : cls === 'muted' ? 'muted' : ''}" style="${cls === 'erro' ? 'font-weight:600' : ''}">${esc(txt)}</span></td>
          <td>${pode ? `<button type="button" class="btn btn--line btn--sm" data-cvsend="${esc(c.cvId)}">${I.send}${esc(c.conta && c.conta.convite ? t('cv.resend') : t('cv.send'))}</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="small muted" style="margin-top:12px">${esc(t('cv.from'))} ${esc(d.remetente)}</p>`;
  }
  function carregarCV() {
    return api('cvCorretores').then((d) => { S.cv = d; desenharCV(); }).catch((e) => { const b = $('#cv-box'); if (b) b.innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
  }
  VIEWS['gestao:after'] = (main) => {
    const aba = ['contas', 'cv', 'imobiliarias', 'atividade'].includes(S.route.arg) ? S.route.arg : 'contas';
    if (aba === 'cv') {
      carregarCV();
      main.addEventListener('click', async (ev) => {
        const b = ev.target.closest('button'); if (!b || b.disabled) return;
        const rodar = async (fn, msg) => { b.disabled = true; try { await fn(); toast(msg); } catch (e) { toast(e.message); } await carregarCV(); };
        if (b.id === 'cv-reload') rodar(async () => {}, t('acc.saved'));
        else if (b.id === 'cv-test') rodar(() => api('cvTeste'), t('cv.testSent'));
        else if (b.id === 'cv-sync') { if (!confirm(t('cv.confirmAll'))) return; rodar(async () => { const d = await api('cvSincronizar', { enviar: true }); if (d.resultado.falhas) throw new Error(`${t('cv.failed')}: ${d.resultado.falhas}`); }, t('cv.done')); }
        else if (b.dataset.cvsend) {
          const c = S.cv.corretores.find((x) => String(x.cvId) === b.dataset.cvsend);
          rodar(async () => {
            if (!c.conta) { const d = await api('cvSincronizar', { enviar: true, cvIds: [c.cvId] }); if (d.resultado.falhas) throw new Error(t('cv.failed')); }
            else await api('cvConvite', { id: c.conta.id });
          }, t('cv.oneSent'));
        }
      });
      return;
    }
    if (aba === 'imobiliarias') {
      api('imobiliarias').then((d) => { S.imobs = d.itens; desenharImobs(); }).catch((e) => { $('#im-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
      main.addEventListener('click', async (ev) => {
        const b = ev.target.closest('button'); if (!b) return;
        try {
          if (b.id === 'im-new') editarImob(null);
          else if (b.dataset.imed) editarImob(S.imobs.find((x) => x.id === b.dataset.imed));
          else if (b.dataset.imarq) { const x = S.imobs.find((i) => i.id === b.dataset.imarq); S.imobs = (await api('imobiliariaArquivar', { id: x.id, arquivar: x.status === 'ativa' })).itens; desenharImobs(); }
          else if (b.dataset.imdel) { if (!confirm(t('imob.delConfirm'))) return; S.imobs = (await api('imobiliariaExcluir', { id: b.dataset.imdel })).itens; desenharImobs(); }
        } catch (e) { toast(e.message); }
      });
      return;
    }
    if (aba === 'atividade') {
      api('auditoria').then((d) => desenharAuditoria(d.eventos)).catch((e) => { $('#au-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
      return;
    }
    api('contas').then((d) => { S.contas = d.contas; desenharContas(); }).catch((e) => { $('#ct-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
    $('#ct-q', main).addEventListener('input', desenharContas);
    main.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.cf) { S.team.filtro = b.dataset.cf; $$('[data-cf]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharContas(); }
      else if (b.id === 'ct-new') novaConta();
      else if (b.dataset.clink) { const c = S.contas.find((x) => x.id === b.dataset.clink); try { const d = await api('contaLink', { id: c.id }); mostrarLink(c, d.link); } catch (e) { toast(e.message); } }
      else if (b.dataset.cmenu) menuConta(S.contas.find((x) => x.id === b.dataset.cmenu));
      else if (b.id === 'ct-csv') {
        const lin = [['nome', 'email', 'tipo', 'situacao', 'whatsapp', 'imobiliaria', 'creci', 'pais', 'criado', 'ultimo_acesso', 'codigo']]
          .concat((S.contas || []).map((c) => [c.nome, c.email, papelNome(c.papel), t(situacao(c)[0]), c.tel ? `+${c.ddi}${c.tel}` : '', c.imobiliaria, c.creci, c.pais, c.criado, c.ultimoAcesso || '', c.slug]));
        const csv = lin.map((r) => r.map((x) => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(';')).join('\n');
        baixar(`contas-portal-bracerum-${hojeISO()}.csv`, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      }
    });
  };
  function baixar(nome, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

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
          ${topoAuth()}
          <div class="auth__mid" id="main" tabindex="-1">
            <div style="display:grid;gap:14px"><p class="eyebrow">${esc(t(info.papel === 'equipe' ? 'acc.manager' : 'acc.broker'))}</p><h1 class="h1">${esc(t('inv.title'))}</h1><p class="lead">${esc(t('inv.lead'))}</p></div>
            <form id="f-inv" novalidate>
              <label class="field"><span>${esc(t('auth.email'))}</span><input class="input" type="email" value="${esc(info.email)}" autocomplete="username" readonly /></label>
              <label class="field"><span>${esc(t('auth.name'))}</span><input class="input" name="nome" value="${esc(info.nome)}" autocomplete="name" required /></label>
              <label class="field"><span>${esc(t('auth.pass8'))}</span><input class="input" type="password" name="senha" autocomplete="new-password" minlength="8" required /></label>
              <label class="field"><span>${esc(t('inv.repeat'))}</span><input class="input" type="password" name="senha2" autocomplete="new-password" minlength="8" required /></label>
              <p class="formmsg" role="alert"></p>
              <button class="btn btn--ink btn--block" type="submit">${esc(t('inv.go'))}${I.arrow}</button>
            </form>
          </div>
          <p class="auth__foot">© Bracerum Park</p>
        </section>
        ${painelAuth(`${I.lock.replace('<svg', '<svg width="16" height="16"')} ${esc(t('inv.title'))}`)}
      </div>`;
    bindLang(app); bindTema(app);
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
