/* Monta o que se repete: cabeçalho/rodapé corridos, números de página,
   páginas do sumário e os pinos do masterplan. Roda antes do PDF. */
(function () {
  const pages = [...document.querySelectorAll('.pg')];
  const total = String(pages.length).padStart(2, '0');

  pages.forEach((pg, i) => {
    const n = String(i + 1).padStart(2, '0');
    pg.dataset.n = n;
    if (pg.hasAttribute('data-norun')) return;
    const ch = pg.dataset.ch || '';
    if (!pg.hasAttribute('data-notop')) {
      const top = document.createElement('div');
      top.className = 'run run--top';
      top.innerHTML = `<b>Bracerum Park</b><b>${ch}</b>`;
      pg.appendChild(top);
    }
    if (!pg.hasAttribute('data-nobot')) {
      const bot = document.createElement('div');
      bot.className = 'run run--bot';
      bot.innerHTML = `<b>Villeta Industrial City</b><b class="pn">${n} / ${total}</b>`;
      pg.appendChild(bot);
    }
  });

  // sumário: número da página de abertura de cada capítulo
  document.querySelectorAll('[data-toc]').forEach(el => {
    const target = document.querySelector(`[data-id="${el.dataset.toc}"]`);
    if (target) el.textContent = target.dataset.n;
  });

  // masterplan: coordenadas em % sobre assets/web/vista-aerea-park-02.jpg (as mesmas do home.js)
  const AREAS = [
    { x: 39.5, y: 33.5, t: 'Portaria e pátio de caminhões', v: 'Administração e acessos · 3.510 m²' },
    { x: 33,   y: 30,   t: 'Clube do Caminhoneiro', v: '40.065 m² · posto, pátio e restaurante' },
    { x: 32,   y: 42.5, t: 'Fábricas Bracerum', v: 'Steel Frame · concreto · pavers' },
    { x: 27,   y: 42,   t: 'ETE, ETA e subestação', v: '10.650 m² · subestação 11.375 m²', l: 1 },
    { x: 55,   y: 45,   t: 'Lotes industriais', v: '987.304 m² · Built-to-Suit' },
    { x: 20,   y: 58.5, t: 'Hangares e heliponto', v: '7.686 m² · abastecimento no pátio' },
    { x: 33,   y: 71,   t: 'Pista de pouso', v: '1.480 m · aviação executiva' },
    { x: 77.5, y: 27.5, t: 'Hotel', v: '384 studios · 1.700 vagas', l: 1 },
    { x: 77,   y: 32.5, t: 'Centro de Convenções', v: '13.500 m² · auditório de 1.200 lugares', l: 1 },
    { x: 72,   y: 40,   t: 'Bracerum Resort', v: '141 lotes · 142.067 m²', l: 1 }
  ];
  const wrap = document.getElementById('mpwrap');
  const leg = document.getElementById('mplegend');
  if (wrap && leg) {
    AREAS.forEach((a, i) => {
      const k = String(i + 1).padStart(2, '0');
      const p = document.createElement('div');
      p.className = 'pin' + (a.l ? ' l' : '');
      p.style.left = a.x + '%'; p.style.top = a.y + '%';
      p.innerHTML = `<i></i><span>${k}</span>`;
      wrap.appendChild(p);
      const li = document.createElement('li');
      li.innerHTML = `<i>${k}</i><div><b>${a.t}</b><span>${a.v}</span></div>`;
      leg.appendChild(li);
    });
  }
})();
