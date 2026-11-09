/* =====================================================================
   Cartão de visita digital — idioma e mensagens pré-preenchidas.
   O HTML de cada cartão é a versão PT completa (links funcionam sem JS).
   Este script só troca os textos para EN/ES pela mesma chave do site
   ("bp-lang") e refaz o texto do WhatsApp e o assunto do e-mail no
   idioma ativo, com o primeiro nome da pessoa (<body data-first="…">).
   ===================================================================== */
(function () {
  var first = document.body.getAttribute('data-first') || '';
  var D = {
    pt: {
      wa: 'Olá, ' + first + '. Recebi seu cartão do Bracerum Park e gostaria de saber mais sobre o projeto.',
      subject: 'Bracerum Park'
    },
    en: {
      place: 'Villeta Industrial City — Paraguay · Mercosur',
      save: 'Save contact',
      'g.contact': 'Contact', 'g.park': 'Bracerum Park',
      py: 'Paraguay', br: 'Brazil', 'mail.t': 'E-mail',
      'site.t': 'Discover <em>Bracerum Park</em>',
      rights: '© 2026 Bracerum Park. All rights reserved.',
      wa: 'Hello, ' + first + '. I got your Bracerum Park card and would like to know more about the project.',
      subject: 'Bracerum Park',
      title: ' — Bracerum Park · Digital card'
    },
    es: {
      place: 'Villeta Industrial City — Paraguay · Mercosur',
      save: 'Guardar contacto',
      'g.contact': 'Contacto', 'g.park': 'Bracerum Park',
      py: 'Paraguay', br: 'Brasil', 'mail.t': 'Correo electrónico',
      'site.t': 'Conozca <em>Bracerum Park</em>',
      rights: '© 2026 Bracerum Park. Todos los derechos reservados.',
      wa: 'Hola, ' + first + '. Recibí su tarjeta de Bracerum Park y me gustaría saber más sobre el proyecto.',
      subject: 'Bracerum Park',
      title: ' — Bracerum Park · Tarjeta digital'
    }
  };
  var LANGS = { pt: 'pt-BR', en: 'en', es: 'es' };

  var nodes = document.querySelectorAll('[data-t],[data-en]');  // data-en/data-es: texto próprio do cartão (cargo)
  nodes.forEach(function (n) { n._pt = n.innerHTML; });
  var titlePt = document.title;
  var person = document.body.getAttribute('data-name') || '';

  function apply(lang) {
    if (!LANGS[lang]) lang = 'pt';
    var d = D[lang];
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-t');
      n.innerHTML = (lang !== 'pt' && (n.getAttribute('data-' + lang) || d[k])) || n._pt;
    });
    document.title = lang !== 'pt' && d.title ? person + d.title : titlePt;
    document.documentElement.lang = LANGS[lang];
    document.querySelectorAll('.js-wa').forEach(function (a) {
      a.href = 'https://wa.me/' + a.getAttribute('data-phone') + '?text=' + encodeURIComponent(d.wa);
    });
    document.querySelectorAll('.js-mail').forEach(function (a) {
      a.href = 'mailto:' + a.getAttribute('data-mail') + '?subject=' + encodeURIComponent(d.subject);
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    try { localStorage.setItem('bp-lang', lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem('bp-lang'); } catch (e) {}
  if (!LANGS[saved]) {
    var nav = (navigator.language || 'pt').toLowerCase();
    saved = nav.indexOf('es') === 0 ? 'es' : nav.indexOf('en') === 0 ? 'en' : 'pt';
  }
  apply(saved);

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
