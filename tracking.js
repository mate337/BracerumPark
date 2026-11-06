/* =====================================================================
   Bracerum Park — rastreamento (tracking.js)
   ---------------------------------------------------------------------
   Um arquivo só, carregado por todas as páginas (site, linktree e
   3dmasterplan). Faz três coisas:

   1. Carrega os pixels configurados abaixo (GA4 e Meta). Campo vazio =
      pixel desligado; nada quebra.
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
    ga4: '',        // ex.: 'G-XXXXXXXXXX'  (Google Analytics 4)
    metaPixel: '',  // ex.: '1234567890123456' (Meta / Facebook / Instagram)
    vercel: true    // Vercel Web Analytics (ligar também no painel da Vercel)
  };
  /* ------------------------------------------------------------------ */

  var W = window, D = document;
  var STORE = 'bp-attrib';
  var DEBUG = /[?&]bpdebug=1/.test(location.search);
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'origem'];

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
  if (!attrib.first) attrib.first = touch;
  if (hasTag || ref || !attrib.last) attrib.last = touch;   // navegação interna não apaga a origem
  store(false, attrib);
  W.bpAttribution = function () { return store(true) || attrib; };

  /* ---------- 2. pixels --------------------------------------------- */
  if (CONFIG.ga4) {
    W.dataLayer = W.dataLayer || [];
    W.gtag = function () { W.dataLayer.push(arguments); };
    W.gtag('js', new Date());
    W.gtag('config', CONFIG.ga4, { page_path: location.pathname + location.search });
    load('https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4);
  }
  if (CONFIG.metaPixel) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(W, D, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    W.fbq('init', CONFIG.metaPixel);
    W.fbq('track', 'PageView');
  }
  if (CONFIG.vercel) {
    W.va = W.va || function () { (W.vaq = W.vaq || []).push(arguments); };
    load('/_vercel/insights/script.js');
  }

  /* ---------- envio -------------------------------------------------- */
  var META_STD = { whatsapp_click: 'Contact', phone_click: 'Contact', email_click: 'Contact', generate_lead: 'Lead' };

  function track(name, p) {
    p = p || {};
    p.page = location.pathname;
    p.lang = D.documentElement.lang || '';
    var c = (attrib.last && attrib.last.utm_campaign) || '';
    if (c) p.campaign = c;
    log(name, p);
    if (W.gtag && CONFIG.ga4) W.gtag('event', name, p);
    if (W.fbq && CONFIG.metaPixel) {
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
})();
