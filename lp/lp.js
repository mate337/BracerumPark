/* =====================================================================
   Bracerum Park — landing pages dos folders (lp.js)
   Um arquivo para as LPs geradas por docs/build_lps.py (seis dos folders
   e a de corretores):
     1. idioma (PT no HTML; EN/ES no <script id="lp-i18n">; chave "bp-lang",
        a mesma do site, do linktree e da maquete)
     2. barra do topo, barra fixa do celular, revelar ao rolar
     3. WhatsApp: PT → Sydney (Brasil), ES/EN → Cleber (Paraguai), com a
        mensagem no idioma ativo
     4. formulário em duas etapas → POST /api/lead → lead no CV CRM
        (com a origem guardada pelo tracking.js: utm, gclid, fbclid…)
     5. tabela de preço dos lotes pela janela vigente (precos.json da
        maquete — um lugar só para editar quando sair tabela nova)
     6. disponibilidade ao vivo dos lotes (/api/lotes-status)
     4b. cadastro de corretor (form data-kind="corretor"): um passo só →
        POST /api/corretor → planilha do Drive, e o WhatsApp do Sydney abre
        com a mensagem pronta. Não passa pelo CV.
   Sem JS a página continua inteira em PT; o formulário cai no WhatsApp.
   ===================================================================== */
(function () {
  'use strict';
  var D = document, W = window, html = D.documentElement;
  html.classList.add('js');
  var CFG = {};
  try { CFG = JSON.parse((D.getElementById('lp-config') || {}).textContent || '{}'); } catch (e) {}
  var DICT = {};
  try { DICT = JSON.parse((D.getElementById('lp-i18n') || {}).textContent || '{}'); } catch (e) {}
  var WA = { br: '5547988030200', py: '595985516065' };

  /* ---------- textos das partes geradas pelo JS ---------------------- */
  var UI = {
    pt: {
      step: 'Etapa {n} de 2', next: 'Continuar', send: 'Receber agora', back: '← voltar',
      pick: 'Escolha uma opção para continuar.', name: 'Escreva seu nome.', email: 'Confira o e-mail.',
      phone: 'Confira o WhatsApp (com DDD).', consent: 'Marque a autorização de contato para enviar.',
      busy: 'Enviando…',
      okT: 'Pronto, {nome}. <em>Recebemos seu pedido.</em>',
      okP: 'Um consultor do Bracerum Park vai falar com você pelo WhatsApp. Se preferir adiantar, chame agora:',
      okWa: 'Falar agora no WhatsApp', ok3d: 'Abrir o masterplan 3D',
      failT: 'Não conseguimos registrar agora.',
      failP: 'Seu pedido não se perde: toque abaixo e ele segue pelo WhatsApp, já escrito.',
      failWa: 'Enviar pelo WhatsApp',
      waLead: 'Olá! Sou {nome} e vim pela página {lp} do Bracerum Park. Tenho interesse em: {int}. Meu e-mail: {email}.',
      size: 'Tamanho', lots: '{n} lote(s)', cat: { V: 'Vitrine', B: 'Business', P: 'Padrão', I: 'Interna' },
      perm2: 'US$ {v}/m²',
      until: 'até {d}', from: 'a partir de {d}',
      ribbon: '<b>Preço de lançamento</b> {nome}: m² Padrão a US$ {v} {quando}.',
      ribbonNext: 'Depois sobe para US$ {v}.', left: 'faltam', d: 'd', h: 'h', m: 'min',
      ribbonCta: 'Garantir este preço',
      tblNote: 'Valores em dólares americanos, por lote, na condição 20% + 12 parcelas (preço de tabela), conforme a Tabela de Preços v3.1 (rev. 14/10/2026), válida até a publicação de nova tabela. Lotes múltiplos de 1.250 m²: o preço por m² cai a partir de 9, 17 e 33 lotes. À vista: −8%. 20% + 36 parcelas: +8%. Preços sujeitos à disponibilidade do lote no momento da reserva e à alteração sem aviso prévio; esta tabela não é oferta vinculante — as condições valem conforme o contrato de compra e venda.',
      liveAv: 'disponíveis agora', liveR: 'reservados', liveV: 'vendidos', liveB: 'indisponíveis',
      liveAt: 'Atualizado às {h} pelo mapa de vendas (CV CRM).', liveOff: 'Mapa de vendas indisponível no momento — fale com a equipe para a posição de hoje.',
      catAv: '{n} {cat}',
      imob: 'Escreva o nome da imobiliária (ou “Autônomo”).',
      cMsg: 'Olá, me chamo {nome}, {imob}, e tenho interesse em ofertar o Bracerum Park para os meus clientes.',
      cDa: 'da Imobiliária {x}', cDe: 'da {x}', cAuto: 'corretor(a) autônomo(a)',
      cOkT: 'Pronto, {nome}. <em>Cadastro recebido.</em>',
      cOkP: 'A conversa com Sydney Savi abriu no WhatsApp, com a sua mensagem já escrita — é só enviar. Se não abriu, toque abaixo:',
      cOkWa: 'Abrir o WhatsApp', cOk2: 'Conhecer os produtos'
    },
    en: {
      step: 'Step {n} of 2', next: 'Continue', send: 'Get it now', back: '← back',
      pick: 'Choose an option to continue.', name: 'Please enter your name.', email: 'Please check your e-mail.',
      phone: 'Please check your WhatsApp number.', consent: 'Please tick the contact authorisation to send.',
      busy: 'Sending…',
      okT: 'Thank you, {nome}. <em>We have your request.</em>',
      okP: 'A Bracerum Park consultant will contact you on WhatsApp. To speed things up, message us now:',
      okWa: 'Message us on WhatsApp', ok3d: 'Open the 3D masterplan',
      failT: 'We could not register it right now.',
      failP: 'Your request is not lost: tap below and it goes through WhatsApp, already written.',
      failWa: 'Send via WhatsApp',
      waLead: 'Hello! I am {nome} and I came from the Bracerum Park {lp} page. I am interested in: {int}. My e-mail: {email}.',
      size: 'Size', lots: '{n} lot(s)', cat: { V: 'Showcase', B: 'Business', P: 'Standard', I: 'Inner' },
      perm2: 'US$ {v}/m²',
      until: 'until {d}', from: 'from {d}',
      ribbon: '<b>Launch price</b> {nome}: Standard m² at US$ {v} {quando}.',
      ribbonNext: 'Then it rises to US$ {v}.', left: 'left', d: 'd', h: 'h', m: 'min',
      ribbonCta: 'Secure this price',
      tblNote: 'Prices in US dollars, per lot, for 20% down + 12 instalments (list price), per Price Table v3.1 (rev. 14 Oct 2026), valid until a new table is published. Lots in multiples of 1,250 m²: the price per m² drops from 9, 17 and 33 lots. Cash: −8%. 20% + 36 instalments: +8%. Prices subject to lot availability at the time of reservation and to change without notice; this table is not a binding offer — terms are those of the purchase contract.',
      liveAv: 'available now', liveR: 'reserved', liveV: 'sold', liveB: 'unavailable',
      liveAt: 'Updated at {h} from the sales map (CV CRM).', liveOff: 'Sales map unavailable right now — ask the team for today’s position.',
      catAv: '{n} {cat}',
      imob: 'Please enter the agency name (or “Independent”).',
      cMsg: 'Hello, my name is {nome}, {imob}, and I am interested in offering Bracerum Park to my clients.',
      cDa: 'from {x}', cDe: 'from {x}', cAuto: 'an independent broker',
      cOkT: 'Done, {nome}. <em>You are signed up.</em>',
      cOkP: 'A chat with Sydney Savi opened on WhatsApp with your message already written — just hit send. If it did not open, tap below:',
      cOkWa: 'Open WhatsApp', cOk2: 'See the products'
    },
    es: {
      step: 'Paso {n} de 2', next: 'Continuar', send: 'Recibir ahora', back: '← volver',
      pick: 'Elija una opción para continuar.', name: 'Escriba su nombre.', email: 'Revise el e-mail.',
      phone: 'Revise el WhatsApp (con código de área).', consent: 'Marque la autorización de contacto para enviar.',
      busy: 'Enviando…',
      okT: 'Listo, {nome}. <em>Recibimos su pedido.</em>',
      okP: 'Un consultor de Bracerum Park le escribirá por WhatsApp. Si prefiere adelantar, escríbanos ahora:',
      okWa: 'Hablar ahora por WhatsApp', ok3d: 'Abrir el masterplan 3D',
      failT: 'No pudimos registrarlo ahora.',
      failP: 'Su pedido no se pierde: toque abajo y sigue por WhatsApp, ya escrito.',
      failWa: 'Enviar por WhatsApp',
      waLead: '¡Hola! Soy {nome} y llegué por la página {lp} de Bracerum Park. Me interesa: {int}. Mi e-mail: {email}.',
      size: 'Tamaño', lots: '{n} lote(s)', cat: { V: 'Vitrina', B: 'Business', P: 'Estándar', I: 'Interna' },
      perm2: 'US$ {v}/m²',
      until: 'hasta el {d}', from: 'a partir del {d}',
      ribbon: '<b>Precio de lanzamiento</b> {nome}: m² Estándar a US$ {v} {quando}.',
      ribbonNext: 'Después sube a US$ {v}.', left: 'faltan', d: 'd', h: 'h', m: 'min',
      ribbonCta: 'Asegurar este precio',
      tblNote: 'Valores en dólares estadounidenses, por lote, en la condición 20% + 12 cuotas (precio de lista), según la Tabla de Precios v3.1 (rev. 14/10/2026), vigente hasta la publicación de una nueva tabla. Lotes en múltiplos de 1.250 m²: el precio por m² baja a partir de 9, 17 y 33 lotes. Al contado: −8%. 20% + 36 cuotas: +8%. Precios sujetos a la disponibilidad del lote al momento de la reserva y a cambios sin aviso; esta tabla no es oferta vinculante — rigen las condiciones del contrato de compraventa.',
      liveAv: 'disponibles ahora', liveR: 'reservados', liveV: 'vendidos', liveB: 'no disponibles',
      liveAt: 'Actualizado a las {h} desde el mapa de ventas (CV CRM).', liveOff: 'Mapa de ventas no disponible ahora — consulte al equipo la posición de hoy.',
      catAv: '{n} {cat}',
      imob: 'Escriba el nombre de la inmobiliaria (o “Independiente”).',
      cMsg: 'Hola, me llamo {nome}, {imob}, y tengo interés en ofrecer Bracerum Park a mis clientes.',
      cDa: 'de la Inmobiliaria {x}', cDe: 'de {x}', cAuto: 'corredor(a) independiente',
      cOkT: 'Listo, {nome}. <em>Registro recibido.</em>',
      cOkP: 'La conversación con Sydney Savi se abrió en WhatsApp, con su mensaje ya escrito — solo tiene que enviarlo. Si no se abrió, toque abajo:',
      cOkWa: 'Abrir WhatsApp', cOk2: 'Conocer los productos'
    }
  };
  var LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-PY' };
  var lang = 'pt';
  function u(k) { return (UI[lang] && UI[lang][k]) || UI.pt[k]; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return Number(n).toLocaleString(LOCALE[lang] === 'en-US' ? 'en-US' : 'de-DE'); }   // 1.250 / 1,250
  function track(ev, p) { try { if (W.bpTrack) W.bpTrack(ev, p || {}); } catch (e) {} }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- 1. idioma --------------------------------------------- */
  var nodes = D.querySelectorAll('[data-t]');
  nodes.forEach(function (n) { n._pt = n.innerHTML; });
  var attrs = [['data-tp', 'placeholder'], ['data-ta', 'aria-label'], ['data-tc', 'content']];
  attrs.forEach(function (a) { D.querySelectorAll('[' + a[0] + ']').forEach(function (n) { n['_pt_' + a[1]] = n.getAttribute(a[1]); }); });
  var titlePt = D.title;

  function setLang(l, user) {
    if (!LOCALE[l]) l = 'pt';
    lang = l;
    var d = DICT[l] || {};
    nodes.forEach(function (n) { var k = n.getAttribute('data-t'); n.innerHTML = (l !== 'pt' && d[k]) || n._pt; });
    attrs.forEach(function (a) {
      D.querySelectorAll('[' + a[0] + ']').forEach(function (n) {
        var k = n.getAttribute(a[0]); n.setAttribute(a[1], (l !== 'pt' && d[k]) || n['_pt_' + a[1]]);
      });
    });
    D.title = (l !== 'pt' && d._title) || titlePt;
    html.lang = LOCALE[l] === 'en-US' ? 'en' : LOCALE[l] === 'es-PY' ? 'es' : 'pt-BR';
    D.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    if (user) { store('bp-lang', l); track('language_change', { language: l }); }
    D.dispatchEvent(new CustomEvent('lp:lang', { detail: l }));
  }
  D.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang, true); }); });
  var saved = store('bp-lang');
  var nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
  var qs = new URLSearchParams(location.search).get('lang');

  /* ---------- 2. topo, barra fixa, revelar -------------------------- */
  var top = D.querySelector('.top'), hero = D.querySelector('.hero'), sticky = D.querySelector('.sticky');
  var formEl = D.getElementById('form');
  var formVisible = false;
  function onScroll() {
    var y = W.scrollY || 0;
    if (top) top.classList.toggle('is-solid', y > 40);
    if (sticky && hero) sticky.classList.toggle('is-on', y > hero.offsetHeight * 0.6 && !formVisible);
  }
  W.addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in W) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    D.querySelectorAll('.rv').forEach(function (n) { io.observe(n); });
    if (formEl) new IntersectionObserver(function (es) { formVisible = es[0].isIntersecting; onScroll(); }).observe(formEl);
  } else D.querySelectorAll('.rv').forEach(function (n) { n.classList.add('is-in'); });

  /* ---------- 3. WhatsApp --------------------------------------------- */
  function waNumber() { return CFG.wa || (lang === 'pt' ? WA.br : WA.py); }
  function waLink(msg, n) { return 'https://wa.me/' + (n || waNumber()) + '?text=' + encodeURIComponent(msg); }
  function paintWa() {
    var msg = (DICT[lang] && DICT[lang]['wa.msg']) || (D.querySelector('[data-t="wa.msg"]') || {})._pt || '';
    D.querySelectorAll('.js-wa').forEach(function (a) {
      var n = a.dataset.phone || waNumber();
      a.href = waLink(msg, n);
    });
  }

  /* ---------- 4. formulário ------------------------------------------- */
  var form = formEl && formEl.querySelector('form');
  var KIND = (formEl && formEl.dataset.kind) || 'lead';
  var started = false;
  function err(msg) {
    formEl.querySelectorAll('.form__err').forEach(function (e) { e.textContent = ''; });
    var pane = formEl.querySelector('.pane:not([hidden])') || formEl, e = pane.querySelector('.form__err');
    if (e) e.textContent = msg || '';
  }
  function goStep(n) {
    formEl.dataset.step = n;
    formEl.querySelectorAll('.pane').forEach(function (p) { p.hidden = p.dataset.pane !== String(n); });
    var s = formEl.querySelector('.form__step'); if (s) s.textContent = fill(u('step'), { n: n });
    err('');
    if (n === 2) { var f = formEl.querySelector('input[name="nome"]'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60); track('form_step', { step: 2, lp: CFG.lp }); }
  }
  function chosen(name) { var c = form && form.querySelector('input[name="' + name + '"]:checked'); return c; }
  // Texto da opção escolhida, sempre em PT (o CV recebe o mesmo rótulo em qualquer idioma).
  function label(input, cur) {
    if (!input) return '';
    var b = input.closest('label') && input.closest('label').querySelector('b');
    if (!b) return input.value;
    var tmp = D.createElement('span'); tmp.innerHTML = cur ? b.innerHTML : (b._pt || b.innerHTML);
    return tmp.textContent.trim();
  }
  function setDdiByLang() {
    var s = form && form.querySelector('select[name="ddi"]');
    if (s && !s.dataset.touched) s.value = lang === 'pt' ? '55' : lang === 'es' ? '595' : s.value;
  }
  function dataFromForm() {
    var fd = new FormData(form), o = {};
    fd.forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    return o;
  }
  if (form) {
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start', { lp: CFG.lp }); } });
    form.querySelectorAll('select[name="ddi"]').forEach(function (s) { s.addEventListener('change', function () { s.dataset.touched = '1'; }); });
  }
  if (form && KIND === 'lead') {
    form.querySelectorAll('input[name="interesse"]').forEach(function (i) {
      i.addEventListener('change', function () { if (formEl.dataset.step === '1' && !form.querySelector('.pane[data-pane="1"] [name="perfil"]')) setTimeout(function () { goStep(2); }, 180); });
    });
    form.querySelector('[data-next]').addEventListener('click', function () {
      if (!chosen('interesse')) { err(u('pick')); return; }
      var needPerfil = form.querySelector('.pane[data-pane="1"] input[name="perfil"]');
      if (needPerfil && !chosen('perfil')) { err(u('pick')); return; }
      goStep(2);
    });
    form.querySelector('[data-back]').addEventListener('click', function (e) { e.preventDefault(); goStep(1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formEl.dataset.step !== '2') { form.querySelector('[data-next]').click(); return; }
      var o = dataFromForm();
      var bad = function (name, msg) { var f = form.querySelector('[name="' + name + '"]'); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } err(msg); };
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if ((o.nome || '').length < 2) return bad('nome', u('name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email || '')) return bad('email', u('email'));
      var tel = String(o.telefone || '').replace(/\D/g, '');
      if (tel.length < 7) return bad('telefone', u('phone'));
      if (!form.querySelector('input[name="consentimento"]').checked) return bad('consentimento', u('consent'));
      var ci = chosen('interesse');
      var produto = (ci && ci.dataset.produto) || CFG.produto;
      var interesse = label(ci);
      var perfil = label(chosen('perfil'));
      var body = {
        lp: CFG.lp, produto: produto, idioma: lang, pagina: location.pathname + location.search,
        nome: o.nome, email: o.email, telefone: tel, ddi: o.ddi, empresa: o.empresa || '', mensagem: o.mensagem || '',
        interesse: interesse, perfil: perfil, prazo: label(chosen('prazo')),
        consentimento: true, hp: o.website || '', t: Date.now() - T0,
        attrib: (W.bpAttribution && W.bpAttribution()) || {}
      };
      formEl.classList.add('is-busy');
      var btn = form.querySelector('button[type="submit"]'); var btnTxt = btn.innerHTML; btn.textContent = u('busy');
      var waMsg = fill(u('waLead'), { nome: o.nome, lp: CFG.nome || CFG.lp, int: label(ci, true) + (chosen('perfil') ? ' (' + label(chosen('perfil'), true) + ')' : ''), email: o.email });
      var finish = function (ok) {
        formEl.classList.remove('is-busy'); btn.innerHTML = btnTxt;
        var first = esc(o.nome.split(' ')[0]);
        var box = formEl.querySelector('.done');
        box.innerHTML = ok
          ? '<span class="eyebrow">' + esc(CFG.nome || '') + '</span><p class="h3">' + fill(u('okT'), { nome: first }) + '</p><p>' + esc(u('okP')) + '</p>' +
            '<a class="btn btn--ink js-wa-done" target="_blank" rel="noopener" href="' + esc(waLink(waMsg)) + '">' + esc(u('okWa')) + '</a>' +
            (CFG.maquete ? '<a class="btn btn--line" href="' + esc(CFG.maquete) + '">' + esc(u('ok3d')) + '</a>' : '')
          : '<p class="h3">' + esc(u('failT')) + '</p><p>' + esc(u('failP')) + '</p>' +
            '<a class="btn btn--ink" target="_blank" rel="noopener" data-track="lead_whatsapp_fallback" href="' + esc(waLink(waMsg)) + '">' + esc(u('failWa')) + '</a>';
        form.hidden = true; box.hidden = false;
        formEl.querySelector('.form__head').hidden = true; formEl.querySelector('.form__bar').hidden = true;
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (d) {
          if (d && d.ok) { track('generate_lead', { lp: CFG.lp, produto: produto, interesse: interesse, value: 1, currency: 'USD' }); finish(true); }
          else { track('lead_error', { lp: CFG.lp, erro: d && d.erro }); finish(false); }
        })
        .catch(function () { track('lead_error', { lp: CFG.lp, erro: 'rede' }); finish(false); });
    });
  }
  var T0 = Date.now();

  /* ---------- 4b. cadastro de corretor ---------------------------------- */
  // Um passo só. O WhatsApp abre no próprio toque de enviar (depois de um fetch o
  // navegador bloquearia a janela); o cadastro segue em segundo plano com keepalive,
  // que termina mesmo se a página sair. Se a janela for bloqueada (navegador de app),
  // a página vai para o WhatsApp no mesmo separador. Se a planilha falhar, a mensagem
  // chega ao Sydney do mesmo jeito, com nome e imobiliária, e a função grava no log.
  function imobFrase(x) {
    if (/^(aut[oô]nom|independ|freelanc|por conta|cuenta propia)/i.test(x)) return u('cAuto');
    var ja = /^(imob|inmob|im[oó]veis|real estate|realty)/i.test(x);   // já começa com "Imobiliária…"
    return fill(u(ja ? 'cDe' : 'cDa'), { x: x });
  }
  if (form && KIND === 'corretor') {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var o = dataFromForm();
      var bad = function (name, msg) { var f = form.querySelector('[name="' + name + '"]'); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } err(msg); };
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
      var nome = String(o.nome || '').replace(/\s+/g, ' '), imob = String(o.imobiliaria || '').replace(/\s+/g, ' ');
      var tel = String(o.telefone || '').replace(/\D/g, '');
      if (nome.length < 2) return bad('nome', u('name'));
      if (tel.length < (o.ddi === '55' ? 10 : 7)) return bad('telefone', u('phone'));
      if (imob.length < 2) return bad('imobiliaria', u('imob'));
      var url = waLink(fill(u('cMsg'), { nome: nome, imob: imobFrase(imob) }), CFG.wa || WA.br);
      var win = null;
      try { win = W.open(url, '_blank'); if (win) win.opener = null; } catch (x) { win = null; }
      track('whatsapp_click', { lp: CFG.lp, destino: 'cadastro_corretor' });
      var body = {
        lp: CFG.lp, idioma: lang, pagina: location.pathname + location.search,
        nome: nome, telefone: tel, ddi: o.ddi, imobiliaria: imob,
        hp: o.website || '', t: Date.now() - T0, attrib: (W.bpAttribution && W.bpAttribution()) || {}
      };
      var req = fetch(CFG.envio || '/api/corretor', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .catch(function () { return { ok: false, erro: 'rede' }; });
      req.then(function (d) { track(d && d.ok ? 'corretor_cadastro' : 'corretor_erro', { lp: CFG.lp, erro: d && d.erro }); });
      var first = esc(nome.split(' ')[0]);
      var box = formEl.querySelector('.done');
      box.innerHTML = '<span class="eyebrow">' + esc(CFG.nome || '') + '</span><p class="h3">' + fill(u('cOkT'), { nome: first }) + '</p><p>' + esc(u('cOkP')) + '</p>' +
        '<a class="btn btn--ink" target="_blank" rel="noopener" data-track="corretor_whatsapp" href="' + esc(url) + '">' + esc(u('cOkWa')) + '</a>' +
        '<a class="btn btn--line" href="#produtos">' + esc(u('cOk2')) + '</a>';
      form.hidden = true; box.hidden = false;
      ['.form__head', '.form__bar', '.form__sub'].forEach(function (s) { var n = formEl.querySelector(s); if (n) n.hidden = true; });
      if (!win) location.href = url;
      else formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // CTAs que já escolhem a opção do formulário: <a href="#form" data-pick="valor">
  D.querySelectorAll('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var i = form && form.querySelector('input[name="interesse"][value="' + a.dataset.pick + '"]');
      if (i) { i.checked = true; if (!form.querySelector('.pane[data-pane="1"] input[name="perfil"]')) goStep(2); }
    });
  });

  /* ---------- 5. preço dos lotes --------------------------------------- */
  var P = null;
  var SIZES = [1250, 2500, 3750, 5000, 7500, 10000, 15000, 20000, 30000, 40000];
  function today() { var q = new URLSearchParams(location.search).get('hoje'); return q || new Date().toISOString().slice(0, 10); }
  function janelaIdx() {
    var t = today(), js = P.janelas;
    for (var i = 0; i < js.length; i++) if ((!js[i].de || t >= js[i].de) && (!js[i].ate || t <= js[i].ate)) return i;
    return js.length - 1;
  }
  function faixa(n) { for (var i = 0; i < P.faixas.length; i++) if (n >= P.faixas[i].de && (P.faixas[i].ate == null || n <= P.faixas[i].ate)) return i; return P.faixas.length - 1; }
  function dt(iso) { var p = iso.split('-'); return lang === 'en' ? new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : p[2] + '/' + p[1] + '/' + p[0]; }
  var tabWin = null;
  function renderPrices() {
    var box = D.querySelector('[data-lot-prices]'); if (!box || !P) return;
    var cur = janelaIdx(); if (tabWin == null) tabWin = cur;
    var tabs = P.janelas.map(function (j, i) {
      if (i < cur) return '';
      var q = j.ate ? fill(u('until'), { d: dt(j.ate) }) : fill(u('from'), { d: dt(j.de) });
      return '<button type="button" data-win="' + i + '" aria-pressed="' + (i === tabWin) + '">' + esc(j.nome[lang] || j.nome.pt) + ' · ' + esc(q) + '</button>';
    }).join('');
    var j = P.janelas[tabWin], cats = ['V', 'B', 'P', 'I'];
    var head = '<tr><th>' + esc(u('size')) + '</th>' + cats.map(function (c) {
      return '<th>' + esc(u('cat')[c]) + '<small>' + esc(fill(u('perm2'), { v: P.precos[j.id][c][0][0] })) + ' · ×' + esc(P.categorias[c].fator) + '</small></th>';
    }).join('') + '</tr>';
    var rows = SIZES.map(function (s) {
      var n = s / 1250, f = faixa(n);
      return '<tr><td><b>' + num(s) + ' m²</b> <span class="small">· ' + esc(fill(u('lots'), { n: n })) + '</span></td>' + cats.map(function (c) {
        return '<td' + (c === 'P' ? ' class="hl"' : '') + '>US$ ' + num(s * P.precos[j.id][c][f][0]) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    box.innerHTML = '<div class="tabs" role="group">' + tabs + '</div><div class="tablewrap"><table class="prices"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div><p class="note">' + esc(u('tblNote')) + '</p>';
    box.querySelectorAll('[data-win]').forEach(function (b) { b.addEventListener('click', function () { tabWin = Number(b.dataset.win); renderPrices(); track('price_window', { janela: P.janelas[tabWin].id }); }); });
  }
  var clockT = null;
  function renderRibbon() {
    var r = D.querySelector('[data-ribbon]'); if (!r || !P) return;
    var i = janelaIdx(), j = P.janelas[i], nx = P.janelas[i + 1];
    if (!j.ate) { r.hidden = true; return; }
    var end = new Date(j.ate + 'T23:59:59-03:00');
    var q = fill(u('until'), { d: dt(j.ate) });
    var txt = fill(u('ribbon'), { nome: esc(j.curto[lang] || j.curto.pt), v: P.precos[j.id].P[0][0], quando: esc(q) }) +
      (nx ? ' ' + esc(fill(u('ribbonNext'), { v: P.precos[nx.id].P[0][0] })) : '');
    r.innerHTML = '<span>' + txt + '</span><span class="ribbon__clock" aria-live="off"></span><a href="#form" data-track="ribbon_cta">' + esc(u('ribbonCta')) + ' →</a>';
    r.hidden = false;
    var clock = r.querySelector('.ribbon__clock');
    clearInterval(clockT);
    var tick = function () {
      var ms = end - Date.now(); if (ms <= 0) { clock.hidden = true; return; }
      var dd = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), mm = Math.floor(ms % 36e5 / 6e4);
      clock.textContent = u('left') + ' ' + (dd ? dd + u('d') + ' ' : '') + hh + u('h') + ' ' + mm + u('m');
    };
    tick(); clockT = setInterval(tick, 30000);
  }
  if (D.querySelector('[data-lot-prices],[data-ribbon]')) {
    fetch(CFG.precos || '../3dmasterplan/data/precos.json').then(function (r) { return r.json(); })
      .then(function (d) { P = d; renderPrices(); renderRibbon(); }).catch(function () {});
  }

  /* ---------- 6. disponibilidade ao vivo -------------------------------- */
  var LIVE = null, CATMAP = null;
  try { CATMAP = JSON.parse((D.getElementById('lp-lotes') || {}).textContent || 'null'); } catch (e) {}
  function renderLive() {
    var box = D.querySelector('[data-live]'); if (!box) return;
    var total = CATMAP ? Object.keys(CATMAP).length : Number(box.dataset.total || 0);
    var c = { r: 0, v: 0, b: 0 }, livres = { V: 0, B: 0, P: 0, I: 0 };
    if (CATMAP) Object.keys(CATMAP).forEach(function (id) { var s = LIVE && LIVE.lotes && LIVE.lotes[id]; if (s) c[s]++; else livres[CATMAP[id]]++; });
    var av = total - c.r - c.v - c.b;
    var ok = LIVE && LIVE.ok;
    var cell = function (n, t, col) { return '<div><b>' + (ok ? num(n) : '—') + '</b><span>' + (col ? '<i style="background:' + col + '"></i>' : '') + esc(t) + '</span></div>'; };
    box.querySelector('.live').innerHTML = cell(av, u('liveAv'), '#7fb069') + cell(c.r, u('liveR'), '#6b4a22') + cell(c.v, u('liveV'), '#2b2620') + cell(c.b, u('liveB'), '#77736b');
    var meta = box.querySelector('[data-live-meta]');
    if (meta) {
      meta.innerHTML = ok
        ? '<span class="live__dot"></span>' + esc(fill(u('liveAt'), { h: new Date(LIVE.atualizado).toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit' }) })) +
          (CATMAP ? ' · ' + ['V', 'B', 'P', 'I'].map(function (k) { return esc(fill(u('catAv'), { n: num(livres[k]), cat: u('cat')[k] })); }).join(' · ') : '')
        : esc(u('liveOff'));
    }
  }
  if (D.querySelector('[data-live]')) {
    var getLive = function () {
      fetch('/api/lotes-status', { headers: { accept: 'application/json' } }).then(function (r) { return r.json(); })
        .then(function (d) { LIVE = d; renderLive(); }).catch(function () { LIVE = { ok: false }; renderLive(); });
    };
    getLive(); setInterval(function () { if (!D.hidden) getLive(); }, 120000);
  }

  /* ---------- início ---------------------------------------------------- */
  D.addEventListener('lp:lang', function () { paintWa(); setDdiByLang(); renderPrices(); renderRibbon(); renderLive();
    if (formEl) { var s = formEl.querySelector('.form__step'); if (s) s.textContent = fill(u('step'), { n: formEl.dataset.step || 1 }); } });
  setLang(LOCALE[qs] ? qs : LOCALE[saved] ? saved : LOCALE[nav] ? nav : 'pt');
  if (formEl && KIND === 'lead') goStep(1);
  onScroll();
})();
