/* =====================================================================
   Bracerum Park — rastreamento (tracking.js)
   ---------------------------------------------------------------------
   Um arquivo só, carregado por todas as páginas (site, linktree e
   3dmasterplan). Faz três coisas:

   1. Carrega os pixels configurados abaixo (GA4, Clarity e Meta) — SÓ depois
      que o visitante aceita o aviso de cookies (seção 5; escolha em
      localStorage 'bp-consent', vale 12 meses). Campo vazio = pixel
      desligado; nada quebra. A Vercel Web Analytics não usa cookies e conta
      todas as visitas, com ou sem aceite.
   2. Guarda a ORIGEM do visitante (utm_*, gclid, fbclid, referrer, página
      de entrada) — primeira e última visita — em localStorage. É isso que
      a página de captura vai mandar ao CVCRM em campos ocultos:
        window.bpAttribution()  → { first:{…}, last:{…} }
   3. Mede o comportamento sem precisar marcar o HTML à mão:
        page_view          toda página (o GA4 já faz; o Meta recebe PageView)
        whatsapp_click     link wa.me / api.whatsapp        (Meta: Contact)
        phone_click        link tel:                        (Meta: Contact)
        email_click        link mailto:                     (Meta: Contact)
        social_click       Instagram / Facebook / LinkedIn
        outbound_click     outro site
        nav_click          link interno (CTA, menu, cards)
        button_click       botões (pinos do masterplan, setas, POIs…)
        language_change    troca de idioma
        section_view       seção com id que entrou na tela
        scroll_depth       25 / 50 / 75 / 90 %
      Para nomear um clique à mão: data-track="nome_do_evento".
      Para disparar do código: window.bpTrack('evento', {param:'valor'}).

   Para ver no navegador o que está saindo: adicione ?bpdebug=1 à URL.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- CONFIGURAÇÃO ------------------------------------------ */
  var CONFIG = {
    ga4: 'G-0MZSYRTHND', // Google Analytics 4 — propriedade "Bracerum Park" (ligado em 2026-11-12)
    clarity: 'zcor807a8n', // Microsoft Clarity — mapas de calor e gravações (ligado em 2026-11-12)
    metaPixel: '',  // ex.: '1234567890123456' (Meta / Facebook / Instagram)
    vercel: true    // Vercel Web Analytics (ligar também no painel da Vercel)
  };
  /* ------------------------------------------------------------------ */

  var W = window, D = document;
  var STORE = 'bp-attrib';
  var DEBUG = /[?&]bpdebug=1/.test(location.search);
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'origem'];

  /* Dentro de um iframe do próprio site (a maquete 3D embutida na home, 3dmasterplan/?embed): a
     página de cima já contou a visita, guarda a origem e carrega os pixels. Aqui só os cliques,
     entregues ao bpTrack dela com frame = caminho do quadro. De outro domínio o acesso falha e
     a página segue como sempre. */
  var PARENT = null;
  try { if (W.parent !== W && typeof W.parent.bpTrack === 'function') PARENT = W.parent.bpTrack; } catch (e) { PARENT = null; }

  function log() { if (DEBUG && W.console) console.log.apply(console, ['[bp-track]'].concat([].slice.call(arguments))); }
  function load(src) { var s = D.createElement('script'); s.async = true; s.src = src; D.head.appendChild(s); return s; }
  function store(get, val) {
    try { return get ? JSON.parse(localStorage.getItem(STORE) || 'null') : localStorage.setItem(STORE, JSON.stringify(val)); }
    catch (e) { return null; }
  }

  /* ---------- 1. origem (atribuição) -------------------------------- */
  var params = new URLSearchParams(location.search);
  var touch = { landing: location.pathname, at: new Date().toISOString() };
  var hasTag = false;
  KEYS.forEach(function (k) { var v = params.get(k); if (v) { touch[k] = v.slice(0, 120); hasTag = true; } });
  var ref = D.referrer && D.referrer.indexOf(location.host) === -1 ? D.referrer : '';
  if (ref) touch.referrer = ref.slice(0, 200);

  var attrib = store(true) || {};
  if (!PARENT) {
    if (!attrib.first) attrib.first = touch;
    if (hasTag || ref || !attrib.last) attrib.last = touch;   // navegação interna não apaga a origem
    store(false, attrib);
  }
  W.bpAttribution = function () { return store(true) || attrib; };

  /* ---------- 2. consentimento e pixels ----------------------------- */
  /* GA4, Clarity e Meta gravam cookies: só carregam com o aceite do aviso (seção 5). Sem
     escolha ou com recusa, o Google, a Microsoft e a Meta não recebem nada — nem o
     "ping sem cookie" do Consent Mode avançado, que com o tráfego deste site nem
     apareceria nos relatórios. A Vercel Web Analytics não usa cookies: conta todos. */
  if (PARENT) CONFIG = { ga4: '', clarity: '', metaPixel: '', vercel: false };
  var CONSENT = 'bp-consent', ANO = 365 * 864e5;
  var PEDE = !!(CONFIG.ga4 || CONFIG.clarity || CONFIG.metaPixel);
  function escolha() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT) || 'null');
      if (c && (c.v === 'sim' || c.v === 'nao') && Date.now() - c.t < ANO) return c.v;
    } catch (e) { /* sem storage: pergunta de novo */ }
    return null;
  }
  function grava(v) { try { localStorage.setItem(CONSENT, JSON.stringify({ v: v, t: Date.now() })); } catch (e) { /* sem storage */ } }

  var ligado = false;
  function ligaMedicao() {
    if (ligado || !PEDE) return;
    ligado = true;
    log('consentimento: medição ligada');
    if (CONFIG.ga4) {
      W['ga-disable-' + CONFIG.ga4] = false;
      W.dataLayer = W.dataLayer || [];
      W.gtag = W.gtag || function () { W.dataLayer.push(arguments); };
      // medição sim, publicidade do Google não (o site não roda Google Ads)
      W.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      W.gtag('js', new Date());
      var cfg = { page_path: location.pathname + location.search };
      if (DEBUG) cfg.debug_mode = true;   // ?bpdebug=1 também aparece no DebugView do GA4
      W.gtag('config', CONFIG.ga4, cfg);
      load('https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4);
    }
    if (CONFIG.clarity) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(W, D, 'clarity', 'script', CONFIG.clarity);
      W.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    }
    if (CONFIG.metaPixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(W, D, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      W.fbq('consent', 'grant');
      W.fbq('init', CONFIG.metaPixel);
      W.fbq('track', 'PageView');
    }
  }
  // recusa depois de ter aceitado (pelo link do rodapé): para o que já carregou e apaga os cookies
  function desligaMedicao() {
    log('consentimento: medição desligada');
    if (CONFIG.ga4) {
      W['ga-disable-' + CONFIG.ga4] = true;
      if (W.gtag) W.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
    if (W.clarity) { try { W.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); W.clarity('stop'); } catch (e) { /* */ } }
    if (W.fbq) { try { W.fbq('consent', 'revoke'); } catch (e) { /* */ } }
    var host = location.hostname.replace(/^www\./, '');
    (D.cookie || '').split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_clck|_clsk|_fbp|_fbc)/.test(n)) return;   // só os nossos, primários
      ['', '; domain=' + host, '; domain=.' + host, '; domain=' + location.hostname].forEach(function (d) {
        D.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
    ligado = false;
  }
  if (escolha() === 'sim') ligaMedicao();

  if (CONFIG.vercel) {
    W.va = W.va || function () { (W.vaq = W.vaq || []).push(arguments); };
    load('/_vercel/insights/script.js');
  }

  /* ---------- envio -------------------------------------------------- */
  var META_STD = { whatsapp_click: 'Contact', phone_click: 'Contact', email_click: 'Contact', generate_lead: 'Lead' };

  function track(name, p) {
    p = p || {};
    if (PARENT) { p.frame = location.pathname; log(name, p); return PARENT(name, p); }
    p.page = location.pathname;
    p.lang = D.documentElement.lang || '';
    var c = (attrib.last && attrib.last.utm_campaign) || '';
    if (c) p.campaign = c;
    log(name, p);
    if (ligado && W.gtag && CONFIG.ga4) W.gtag('event', name, p);
    if (ligado && W.clarity && CONFIG.clarity) W.clarity('event', name);   // filtra as gravações por evento
    if (ligado && W.fbq && CONFIG.metaPixel) {
      if (META_STD[name]) W.fbq('track', META_STD[name], p);
      W.fbq('trackCustom', name, p);
    }
    if (W.va && CONFIG.vercel) W.va('event', { name: name, data: p });
  }
  W.bpTrack = track;

  /* ---------- 3. cliques --------------------------------------------- */
  function label(el) {
    var t = el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) { var img = el.querySelector('img[alt]'); if (img) t = img.alt; }
    return (t || '').slice(0, 80);
  }
  function section(el) { var s = el.closest('section[id], footer[id], header[id], aside[id]'); return s ? s.id : ''; }

  D.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button, [data-track]');
    if (!el) return;
    var p = { label: label(el), section: section(el) };
    var name = el.getAttribute('data-track');

    if (!name && el.matches('[data-lang]')) { name = 'language_change'; p.to = el.getAttribute('data-lang'); }
    if (!name && el.tagName === 'A') {
      var href = el.getAttribute('href') || '';
      p.url = el.href;
      if (/wa\.me|whatsapp\.com/i.test(href)) name = 'whatsapp_click';
      else if (/^tel:/i.test(href)) name = 'phone_click';
      else if (/^mailto:/i.test(href)) name = 'email_click';
      else if (/instagram\.com|facebook\.com|linkedin\.com|youtube\.com|tiktok\.com/i.test(href)) name = 'social_click';
      else if (el.host && el.host !== location.host) name = 'outbound_click';
      else name = 'nav_click';
    }
    track(name || 'button_click', p);
  }, true);

  /* ---------- 4. leitura da página ----------------------------------- */
  function onReady(fn) { D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', fn) : fn(); }

  onReady(function () {
    if (PARENT) return;   // seções e rolagem são da página de cima
    // seções vistas (uma vez por página)
    if ('IntersectionObserver' in W) {
      var seen = {};
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          var id = en.target.id;
          if (en.isIntersecting && !seen[id]) { seen[id] = 1; track('section_view', { section: id }); io.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      D.querySelectorAll('section[id], footer[id]').forEach(function (s) { io.observe(s); });
    }
    // profundidade de rolagem
    var marks = [25, 50, 75, 90], done = {};
    W.addEventListener('scroll', function () {
      var h = D.documentElement.scrollHeight - W.innerHeight;
      if (h <= 0) return;
      var pct = (W.scrollY / h) * 100;
      marks.forEach(function (m) { if (pct >= m && !done[m]) { done[m] = 1; track('scroll_depth', { percent: m }); } });
    }, { passive: true });
  });

  /* ---------- 5. aviso de cookies ------------------------------------ */
  /* Montado aqui para valer em toda página que carrega este arquivo (site, linktree, cartões,
     LPs, maquete) sem mexer em HTML gerado. Visual do site: tinta, papel e areia, cantos retos,
     Noto Serif no título. Aceitar e Recusar com o mesmo tamanho (o guia de cookies da ANPD pede
     que recusar seja tão fácil quanto aceitar). Reabre por qualquer elemento [data-cookies] —
     o rodapé do site tem "Preferências de cookies". Idioma pelo lang do <html>. */
  var TXT = {
    pt: { t: 'Cookies', aria: 'Aviso de cookies', sim: 'Aceitar', nao: 'Recusar', e: ' e ',
      x: 'Usamos cookies de {tipo} ({s}) para entender como o site é usado e melhorar o atendimento. Eles só são ativados se você aceitar.',
      m: 'medição', mp: 'medição e publicidade' },
    en: { t: 'Cookies', aria: 'Cookie notice', sim: 'Accept', nao: 'Decline', e: ' and ',
      x: 'We use {tipo} cookies ({s}) to understand how the site is used and improve our service. They are only turned on if you accept.',
      m: 'measurement', mp: 'measurement and advertising' },
    es: { t: 'Cookies', aria: 'Aviso de cookies', sim: 'Aceptar', nao: 'Rechazar', e: ' y ',
      x: 'Usamos cookies de {tipo} ({s}) para entender cómo se usa el sitio y mejorar la atención. Solo se activan si usted acepta.',
      m: 'medición', mp: 'medición y publicidad' }
  };
  function idioma() { var l = (D.documentElement.lang || 'pt').slice(0, 2).toLowerCase(); return TXT[l] ? l : 'pt'; }
  function textos() {
    var t = TXT[idioma()], nomes = [];
    if (CONFIG.ga4) nomes.push('Google Analytics');
    if (CONFIG.clarity) nomes.push('Microsoft Clarity');
    if (CONFIG.metaPixel) nomes.push('Meta');
    var s = nomes.length > 1 ? nomes.slice(0, -1).join(', ') + t.e + nomes[nomes.length - 1] : nomes[0];
    return { t: t.t, aria: t.aria, sim: t.sim, nao: t.nao,
      x: t.x.replace('{tipo}', CONFIG.metaPixel ? t.mp : t.m).replace('{s}', s) };
  }

  var CSS = '.bpc{position:fixed;z-index:2147483000;left:20px;bottom:20px;width:min(440px,calc(100vw - 40px));box-sizing:border-box;' +
    'padding:22px 22px 20px;background:#0e0d0b;color:#f7f3ea;border:1px solid rgba(247,243,234,.18);border-radius:0;' +
    'box-shadow:0 22px 60px -18px rgba(0,0,0,.6);font:400 14px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif;' +
    '-webkit-font-smoothing:antialiased;opacity:0;transform:translateY(16px);transition:opacity .45s cubic-bezier(.19,.8,.22,1),transform .45s cubic-bezier(.19,.8,.22,1)}' +
    '.bpc.is-on{opacity:1;transform:none}' +
    '.bpc *{box-sizing:border-box}' +
    '.bpc__t{margin:0 0 8px;display:flex;align-items:center;gap:12px;font:600 .62rem/1 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#cbb88f}' +
    '.bpc__t::before{content:"";width:22px;height:1px;background:#cbb88f}' +
    '.bpc__x{margin:0 0 18px;color:rgba(247,243,234,.78)}' +
    '.bpc__b{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.bpc__b button{appearance:none;margin:0;border-radius:0;cursor:pointer;padding:13px 10px;font:600 .68rem/1 "Helvetica Neue",Helvetica,Arial,sans-serif;' +
    'letter-spacing:.16em;text-transform:uppercase;transition:background .2s,color .2s,border-color .2s}' +
    '.bpc__b [data-v="nao"]{background:transparent;color:#f7f3ea;border:1px solid rgba(247,243,234,.42)}' +
    '.bpc__b [data-v="nao"]:hover{border-color:#f7f3ea}' +
    '.bpc__b [data-v="sim"]{background:#f7f3ea;color:#0e0d0b;border:1px solid #f7f3ea}' +
    '.bpc__b [data-v="sim"]:hover{background:#cbb88f;border-color:#cbb88f}' +
    '.bpc__b button:focus-visible{outline:2px solid #cbb88f;outline-offset:2px}' +
    '@media (max-width:560px){.bpc{left:10px;right:10px;bottom:10px;width:auto;padding:15px 16px 14px;font-size:13px;line-height:1.5}' +
    '.bpc__t{margin-bottom:6px}.bpc__x{margin-bottom:13px}.bpc__b{gap:8px}.bpc__b button{padding:12px 8px}}' +
    '@media (prefers-reduced-motion:reduce){.bpc{transition:none}}' +
    '@media print{.bpc{display:none}}';

  var aviso = null, obsLang = null;
  function pinta() {
    if (!aviso) return;
    var t = textos();
    aviso.setAttribute('aria-label', t.aria);
    aviso.querySelector('.bpc__t').textContent = t.t;
    aviso.querySelector('.bpc__x').textContent = t.x;
    aviso.querySelector('[data-v="sim"]').textContent = t.sim;
    aviso.querySelector('[data-v="nao"]').textContent = t.nao;
  }
  function fecha() {
    if (!aviso) return;
    var el = aviso; aviso = null;
    if (obsLang) { obsLang.disconnect(); obsLang = null; }
    el.classList.remove('is-on');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
  }
  function mostra() {
    if (aviso || !PEDE || PARENT || !D.body) return;
    if (!D.getElementById('bpc-css')) { var st = D.createElement('style'); st.id = 'bpc-css'; st.textContent = CSS; D.head.appendChild(st); }
    aviso = D.createElement('div');
    aviso.className = 'bpc';
    aviso.setAttribute('role', 'region');
    aviso.innerHTML = '<p class="bpc__t"></p><p class="bpc__x"></p>' +
      '<div class="bpc__b"><button type="button" data-v="nao"></button><button type="button" data-v="sim"></button></div>';
    pinta();
    aviso.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-v]');
      if (!b) return;
      var v = b.getAttribute('data-v');
      grava(v);
      if (v === 'sim') ligaMedicao(); else desligaMedicao();
      fecha();
    });
    D.body.insertBefore(aviso, D.body.firstChild);   // primeiro na ordem de leitura e de Tab
    if ('MutationObserver' in W) { obsLang = new MutationObserver(pinta); obsLang.observe(D.documentElement, { attributes: true, attributeFilter: ['lang'] }); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (aviso) aviso.classList.add('is-on'); }); });
  }
  W.bpConsent = { get: escolha, open: mostra };

  // "Preferências de cookies" (ou qualquer [data-cookies]) reabre o aviso
  D.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-cookies]');
    if (!el) return;
    e.preventDefault();
    mostra();
  });

  // primeira visita: espera a página carregar e o loader (home e maquete) sair da frente
  if (PEDE && !PARENT && !escolha()) {
    var tenta = function (n) {
      var l = D.getElementById('loader');
      var cs = l && getComputedStyle(l);   // o loader é fixed: offsetParent não serve para saber se sumiu
      var livre = !l || l.classList.contains('is-done') || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0;
      if (livre || n > 25) setTimeout(mostra, 600); else setTimeout(function () { tenta(n + 1); }, 300);
    };
    if (D.readyState === 'complete') tenta(0); else W.addEventListener('load', function () { tenta(0); });
  }
})();
