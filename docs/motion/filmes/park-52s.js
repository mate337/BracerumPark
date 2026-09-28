/* Bracerum Park — filme rápido de 52 s (park-52s), a partir do roteiro do cliente
 * (2026-09-28) sobre a linguagem do primeiro preview (v1, 24 s) e de duas referências
 * de motion: um showreel de interface (cursor, telas, cortes rápidos) e o filme do
 * Studio DADO (editorial, lista com destaque). Carrossel de ícones e medidor em
 * meia-lua vêm das imagens de referência do cliente.
 *
 * Roteiro: Bracerum Park → Cidade industrial em Villeta, PY → zoom out de telas →
 * símbolo em 3D → busca → letreiros de atributos → pranchetas → masterplan →
 * números → fotos por ambiente → frase → "tudo em um só lugar" → Brasil × Paraguai
 * → consultores → assinatura.
 */
(() => {
'use strict';
const M = window.MOTOR;
const { q, T, IMG, h, sv, css, clamp, lerp, EZ, mulberry32, win, fq, vis, hook, scene, init, tw, at, cue, dirBlur } = M;

// Início de cada cena, em q (15 q = 1 batida de 120 BPM). 1560 q = 52 s.
const CUT = { s1: 0, s2: 75, s3: 150, s4: 240, s5: 315, s6: 405, s7: 480, s8: 570, s9: 705, s10: 840,
              s11: 1080, s12: 1155, s13: 1275, s14: 1395, s15: 1455, END: 1560 };

/* ---------------------------------------------------------------- textos */
const COPY = {
  brand: 'Bracerum Park',
  meta: 'Villeta · Paraguay · 2026',
  sub: { a: { pt: 'Cidade', es: 'Ciudad', en: 'Industrial' },
         b: { pt: 'industrial', es: 'industrial', en: 'city' },
         c: { pt: 'em Villeta,', es: 'en Villeta,', en: 'in Villeta,' } },
  ask: { pt: 'A melhor localização do PY para sua nova fábrica', es: 'La mejor ubicación de PY para su nueva fábrica',
         en: 'The best location in PY for your new plant' },
  // atributos do parque (todos no site: tributacao.html, fatos de Villeta, AREAS)
  attrs: [
    { pt: 'Pista de pouso própria', es: 'Pista de aterrizaje propia', en: 'Private airstrip' },
    { pt: 'Heliponto', es: 'Helipuerto', en: 'Helipad' },
    { pt: 'Regime de Maquila', es: 'Régimen de Maquila', en: 'Maquila regime' },
    { pt: 'Hidrovia Paraná–Paraguai', es: 'Hidrovía Paraná–Paraguay', en: 'Paraná–Paraguay waterway' },
    { pt: 'Ruta PY02', es: 'Ruta PY02', en: 'Route PY02' },
    { pt: '65 km de Assunção', es: '65 km de Asunción', en: '65 km from Asunción' },
    { pt: 'Built-to-Suit', es: 'Built-to-Suit', en: 'Built-to-Suit' },
    { pt: 'Centro de convenções', es: 'Centro de convenciones', en: 'Convention centre' },
    { pt: 'Hotel', es: 'Hotel', en: 'Hotel' },
    { pt: 'Resort', es: 'Resort', en: 'Resort' },
    { pt: 'Shopping', es: 'Shopping', en: 'Shopping' },
    { pt: 'Clube do Caminhoneiro', es: 'Club del Camionero', en: "Truck Drivers' Club" },
  ],
  wallExtra: [{ pt: 'Bracerum Select', es: 'Bracerum Select', en: 'Bracerum Select' }],
  map: { pt: 'O Masterplan', es: 'El Masterplan', en: 'The Masterplan' },
  mapTitle: { pt: ['1.819.856 m² planejados', 'como uma <em>cidade</em>'],
              es: ['1.819.856 m² planificados', 'como una <em>ciudad</em>'],
              en: ['1,819,856 m² planned', 'as a <em>city</em>'] },
  counters: [
    { n: { pt: '1.480', es: '1.480', en: '1,480' }, u: 'm',
      l: { pt: 'de pista<br><em>própria</em>', es: 'de pista<br><em>propia</em>', en: '<em>private</em><br>airstrip' } },
    { n: { pt: '1.200', es: '1.200', en: '1,200' }, u: '',
      l: { pt: 'lugares no<br><em>auditório</em>', es: 'lugares en el<br><em>auditorio</em>', en: 'seats in the<br><em>auditorium</em>' } },
    { n: { pt: '142.067', es: '142.067', en: '142,067' }, u: 'm²',
      l: { pt: 'de setor residencial<br>e <em>recreativo</em>', es: 'de sector residencial<br>y <em>recreativo</em>', en: 'residential and<br><em>recreational</em> sector' } },
  ],
  amb: [
    { logo: 'logo-horizontal-cream', hgt: 84, k: { pt: 'Bracerum Park', es: 'Bracerum Park', en: 'Bracerum Park' },
      t: { pt: 'Lotes industriais + hangares', es: 'Lotes industriales + hangares', en: 'Industrial lots + hangars' },
      photos: ['galpao-docas', 'park-boulevard-aereo', 'hangar-bracerum'] },
    { logo: 'hotel-cream', hgt: 116, k: { pt: 'Bracerum Hotel', es: 'Bracerum Hotel', en: 'Bracerum Hotel' },
      t: { pt: 'Hotel + Centro de convenções', es: 'Hotel + Centro de convenciones', en: 'Hotel + Convention centre' },
      photos: ['hotel-cupula-dia', 'convencoes-auditorio', 'hotel-suite'] },
    { logo: 'resort-cream', hgt: 160, k: { pt: 'Bracerum Resort', es: 'Bracerum Resort', en: 'Bracerum Resort' },
      t: { pt: 'Condomínio fechado + clubhouse', es: 'Condominio cerrado + clubhouse', en: 'Gated community + clubhouse' },
      photos: ['resort-lago', 'resort-casa', 'amen-piscina-quincho'] },
    { logo: 'select-cream', hgt: 160, k: { pt: 'Bracerum Select', es: 'Bracerum Select', en: 'Bracerum Select' },
      t: { pt: 'Shopping, market e posto', es: 'Shopping, market y estación', en: 'Shopping, market and fuel' },
      photos: ['/assets/park/select-comercial-dia.jpg', '/assets/park/select-comercial-noite.jpg', 'posto-caminhoes'] },
  ],
  fut: { pt: ['A cidade pronta para', 'o <em>futuro</em> da sua indústria'],
         es: ['La ciudad lista para', 'el <em>futuro</em> de su industria'],
         en: ['The city ready for', 'the <em>future</em> of your industry'] },
  all: { pt: ['Tudo que você precisa', 'em <em>um só lugar</em>'],
         es: ['Todo lo que necesita', 'en <em>un solo lugar</em>'],
         en: ['Everything you need', 'in <em>one place</em>'] },
  icons: [
    { k: 'casa', l: { pt: 'Condomínio de casas', es: 'Condominio de casas', en: 'Gated homes' } },
    { k: 'hotel', l: { pt: 'Hotel', es: 'Hotel', en: 'Hotel' } },
    { k: 'shop', l: { pt: 'Shopping', es: 'Shopping', en: 'Shopping' } },
    { k: 'aviao', l: { pt: 'Pista de pouso', es: 'Pista de aterrizaje', en: 'Airstrip' } },
  ],
  chart: {
    title: { pt: ['Sua indústria lucrando', '<em>ainda mais</em>'], es: ['Su industria ganando', '<em>todavía más</em>'],
             en: ['Your industry earning', '<em>even more</em>'] },
    note: { pt: '1% de tributo único<br>no regime de Maquila', es: '1% de tributo único<br>en el régimen de Maquila', en: '1% single tax<br>under the Maquila regime' },
    br: { pt: 'Brasil', es: 'Brasil', en: 'Brazil' }, py: { pt: 'Paraguai', es: 'Paraguay', en: 'Paraguay' },
    // comparativo "Brasil × Paraguai" de tributacao.html (tp.b2 / tp.b3)
    g: [ { l: { pt: 'Carga tributária (% do PIB)', es: 'Carga tributaria (% del PIB)', en: 'Tax burden (% of GDP)' }, br: 33, py: 10 },
         { l: { pt: 'Encargos sobre a folha (%)', es: 'Cargas sobre la nómina (%)', en: 'Payroll charges (%)' }, br: 75, py: 33 } ],
  },
  cta: { a: { pt: 'Fale com um de nossos', es: 'Hable con uno de nuestros', en: 'Talk to one of our' },
         b: { pt: '<em>consultores</em>', es: '<em>consultores</em>', en: '<em>consultants</em>' },
         btn: { pt: 'Fale conosco', es: 'Contáctenos', en: 'Get in touch' } },
};
const PHOTO = f => (f.startsWith('/') ? f : IMG(f));

/* ------------------------------------------------------------ componentes */
let MARK = null;                            // símbolo do Park: 6 triângulos, lidos do SVG do cliente
async function loadMark() {
  const t = await (await fetch('/assets/FavIconBranco.svg')).text();
  const vb = t.match(/viewBox="([^"]+)"/)[1].split(/[\s,]+/).map(Number);
  const polys = [...t.matchAll(/points="([^"]+)"/g)].map(m => m[1].trim().split(/[\s,]+/).map(Number));
  MARK = { w: vb[2], h: vb[3], polys };
}
function markSVG(parent, fill, cls) {
  const s = sv('svg', { viewBox: `0 0 ${MARK.w} ${MARK.h}` }, parent);
  if (cls) s.setAttribute('class', cls);
  const ps = MARK.polys.map(p => sv('polygon', { points: p.join(' '), fill }, s));
  return { svg: s, ps };
}
const mixHex = (a, b, p) => {
  const A = a.match(/\w\w/g).map(x => parseInt(x, 16)), B = b.match(/\w\w/g).map(x => parseInt(x, 16));
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`;
};
function masked(parent, cls, lines) {       // linhas de texto com máscara, para entrar de baixo
  const box = h('div', cls, parent);
  return lines.map(l => h('span', '', h('div', 'm', box), l));
}
const CURSOR = '<svg viewBox="0 0 22 31"><path d="M1.5 1.5 L1.5 25 L7.2 19.6 L11.2 29 L15.2 27.3 L11.2 18.1 L19.4 18.1 Z" fill="#fff8ef" stroke="#0e0d0b" stroke-width="1.6" stroke-linejoin="miter"/></svg>';

/* ======================================================= 1 · Bracerum Park */
function S1() {
  const A = CUT.s1, B = CUT.s2;
  const s = scene('s1', A, B, 'var(--paper)');
  const punch = h('div', 'fill', s);
  const word = h('div', 'open-word', punch, 'Bracerum');
  init(word, { xPercent: -50, yPercent: -50, scale: 0.04 });
  tw(word, { scale: 0.04 }, { scale: 0.043 }, A, 4, 'none');
  tw(word, { scale: 0.043 }, { scale: 1.2 }, A + 4, 18, 'expo.in');
  const mb = dirBlur(punch, 'x');
  tw(mb, { v: 0 }, { v: 46 }, A + 12, 10, 'expo.in');
  cue(A + 22, 'whoosh', 's1', { dur: 14, pan: 0 });

  const comp = css(h('div', 'comp', s), { background: 'var(--paper)', color: 'var(--ink)' });
  init(comp, { autoAlpha: 0, transformOrigin: '50% 50%' });
  at(comp, { autoAlpha: 1 }, A + 22);
  at(punch, { autoAlpha: 0 }, A + 22);
  [['Bracerum', 110, 236], ['Park', 420, 490]].forEach(([txt, x, y], i) => {
    const m = css(h('div', 't-line', comp), { left: x + 'px', top: y + 'px' });
    const sp = h('span', '', m, txt);
    if (i === 1) sp.style.color = 'var(--brown)';
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A + 19 + i * 3, 15, 'expo.out');
    tw(m, { x: 0 }, { x: [8, -30][i] }, A + 22, B - A - 22, 'none');
  });
  const bits = [h('div', 'comp__brand', comp, 'Villeta · PY'), h('div', 'comp__meta', comp, COPY.meta),
    h('div', 'comp__arrow', comp, '→'), h('div', 'comp__idx', comp, '.01')];
  css(bits[0], { top: '80px', left: '132px' }); css(bits[1], { top: '80px', right: '132px' }); css(bits[2], { right: '126px' }); css(bits[3], { bottom: '92px', right: '132px' });
  bits.forEach((b, i) => {
    init(b, { autoAlpha: 0, y: 14 });
    tw(b, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0 }, A + 25 + i * 2, 12, 'expo.out');
  });
  const rule = css(h('div', 'comp__rule', comp), { top: '130px', left: '132px', right: '132px' });
  init(rule, { scaleX: 0, transformOrigin: '0 50%' });
  tw(rule, { scaleX: 0 }, { scaleX: 1 }, A + 24, 20, 'expo.out');
  tw(comp, { scale: 1 }, { scale: 1.025 }, A + 22, B - A - 22, 'power1.inOut');
}

/* ======================================================= 2 · Cidade industrial em Villeta, PY */
function S2() {
  const A = CUT.s2, B = CUT.s3;
  const s = scene('s2', A, B, 'var(--sand)');
  const cam = h('div', 'fill', s);
  init(cam, { scale: 1, transformOrigin: '20% 50%' });
  tw(cam, { scale: 1 }, { scale: 1.05 }, A, B - A, 'none');
  const a = h('span', '', h('div', 'sub-a', cam), T(COPY.sub.a));
  init(a, { yPercent: 105 });
  tw(a, { yPercent: 105 }, { yPercent: 0 }, A - 1, 14, 'expo.out');
  const bBox = h('div', 'sub-b', cam);
  const letters = [...T(COPY.sub.b)].map(ch => h('span', '', bBox, ch));
  letters.forEach((l, i) => {
    init(l, { yPercent: 120, autoAlpha: 0 });
    tw(l, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1 }, A + 3 + i * 1.5, 11, 'back.out(1.2)');
  });
  [[2, A + 44], [5, A + 50]].forEach(([i, t0]) => {   // duas letras saltam de novo
    if (!letters[i]) return;
    tw(letters[i], { yPercent: 0 }, { yPercent: -22 }, t0, 4, 'power2.out');
    tw(letters[i], { yPercent: -22 }, { yPercent: 0 }, t0 + 4, 5, 'power2.in');
  });
  const c = h('div', 'sub-c', cam);
  const cS = h('span', '', h('div', 'm', c), T(COPY.sub.c));
  const tag = h('div', 'py-tag', c, 'PY');
  init(cS, { yPercent: 105 });
  tw(cS, { yPercent: 105 }, { yPercent: 0 }, A + 18, 14, 'expo.out');
  init(tag, { scale: 0, transformOrigin: '0% 50%' });
  tw(tag, { scale: 0 }, { scale: 1 }, A + 26, 10, 'expo.out');
  cue(A, 'hit', 's2');
  cue(A + 26, 'tick', 's2', { forte: 1 });
}

/* ======================================================= 3 · zoom out das telas do parque */
const MARKW_CELL = 420, MARKW_3D = 560;
function S3() {
  const A = CUT.s3, B = CUT.s4;
  const s = scene('s3', A, B, 'var(--ink)');
  const persp = css(h('div', 'fill', s), { perspective: '1600px', perspectiveOrigin: '960px 540px' });
  const G = 64, CW = 1920, CH = 1080;
  const PW = 4 * CW + 3 * G, PH = 4 * CH + 3 * G;
  const plane = css(h('div', '', persp), { position: 'absolute', left: 0, top: 0, width: PW + 'px', height: PH + 'px', transformOrigin: '0 0' });
  const CELLS = [
    'hotel-cupula-dia', 'galpao-docas', 'aero-pista-aerea', 'resort-lago',
    'convencoes-foyer', 'park-aereo-rio', 'hangar-bracerum', 'park-boulevard-aereo',
    'amen-piscina-quincho', 'vias-rotatoria', null, 'hotel-fachada-varandas',
    'posto-caminhoes', 'galpao-portico-azul', 'resort-casas-rua', 'convencoes-auditorio',
  ];
  const ORIG = 5, TARGET = 10;
  CELLS.forEach((f, i) => {
    const cell = css(h('div', 'tela' + (f ? '' : ' tela--mark'), plane),
      { left: (i % 4) * (CW + G) + 'px', top: Math.floor(i / 4) * (CH + G) + 'px' });
    if (f) {
      h('div', 'tela__bar', cell, '<i></i><i></i><i></i><b></b>');
      const im = h('img', '', cell); im.src = IMG(f); im.alt = '';
    } else {
      const mh = MARKW_CELL * MARK.h / MARK.w;
      css(markSVG(cell, '#cbb88f').svg, { position: 'absolute', left: 960 - MARKW_CELL / 2 + 'px', top: 540 - mh / 2 + 'px', width: MARKW_CELL + 'px', height: mh + 'px' });
    }
  });
  const ctr = i => ({ x: (i % 4) * (CW + G) + CW / 2, y: Math.floor(i / 4) * (CH + G) + CH / 2 });
  const o = ctr(ORIG), tg = ctr(TARGET);
  const cam = { s: 1, rx: 0, rz: 0, cx: o.x, cy: o.y };
  tw(cam, { s: 1, rx: 0, rz: 0, cx: o.x, cy: o.y }, { s: 0.25, rx: 14, rz: -6, cx: PW / 2, cy: PH / 2 }, A, 24, 'expo.inOut');
  tw(cam, { s: 0.25, rx: 14, rz: -6 }, { s: 0.278, rx: 11, rz: -4 }, A + 24, 48, 'power1.inOut');
  tw(cam, { s: 0.278, rx: 11, rz: -4, cx: PW / 2, cy: PH / 2 }, { s: MARKW_3D / MARKW_CELL, rx: 0, rz: 0, cx: tg.x, cy: tg.y }, A + 70, B - 1 - (A + 70), 'expo.inOut');
  cue(A + 10, 'whoosh', 's3', { dur: 16, pan: -0.2, grave: 1 });
  cue(B, 'whoosh', 's3', { dur: 16, pan: 0.2 });
  hook(t => {
    if (!vis(t, A, B)) return;
    plane.style.transform = `translate(960px,540px) rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`;
  });
  // escala que o símbolo tem no último quadro desta cena — a S4 começa dela
  S3.endScale = () => 1;                     // a câmera pousa no símbolo no último quadro: a S4 começa em escala 1
}

/* ======================================================= 4 · símbolo em 3D com órbitas */
function S4() {
  const A = CUT.s4, B = CUT.s5;
  const s = scene('s4', A, B, 'var(--ink)');
  const wrap = h('div', 'fill', s);
  const back = h('canvas', '', wrap); back.width = 1920; back.height = 1080;
  const persp = h('div', 'm3-persp', wrap);
  const front = h('canvas', '', wrap); front.width = 1920; front.height = 1080;
  const obj = h('div', 'm3-obj', persp);
  const N = 22, GAP = 1.3;                   // extrusão por camadas: 22 × 1,3 px
  const SAND = 'cbb88f', DARK = mixHex('cbb88f', '0e0d0b', 0.5).match(/\d+/g).map(v => (+v).toString(16).padStart(2, '0')).join('');
  const layers = [];
  for (let i = 0; i < N; i++) {
    const edge = i === 0 || i === N - 1;
    const col = edge ? '#' + SAND : mixHex('5f4a26', '2a1e0c', i / (N - 1));
    const m = markSVG(obj, col, 'm3-layer');
    m.svg.style.transform = `translateZ(${(((N - 1) / 2) - i) * GAP}px)`;
    layers.push(m);
  }
  const s0 = S3.endScale();
  const st = { sc: s0, spin: 0, tilt: 0, fly: 0, blur: 0 };
  tw(st, { sc: s0 }, { sc: 1 }, A, 8, 'expo.out');
  tw(st, { tilt: 0 }, { tilt: -20 }, A, 22, 'power2.out');
  tw(st, { spin: 0 }, { spin: 540 }, A + 3, 44, 'power2.inOut');
  tw(st, { sc: 1 }, { sc: 16 }, A + 50, B - A - 50, 'expo.in');
  tw(st, { fly: 0 }, { fly: 1 }, A + 50, B - A - 50, 'expo.in');
  tw(st, { blur: 0 }, { blur: 38 }, A + 56, B - A - 56, 'expo.in');
  cue(B, 'whoosh', 's4', { dur: 18, pan: 0, grave: 1 });

  const R = mulberry32(4);
  const RINGS = [{ r: 400, tilt: -9 }, { r: 540, tilt: 5 }, { r: 700, tilt: -3 }];
  const PARTS = Array.from({ length: 8 }, (_, i) => ({
    ring: i % 3, a0: R() * Math.PI * 2, w: (0.9 + R() * 0.9) * (i % 2 ? -1 : 1), size: 10 + R() * 9,
  }));
  const FLAT = Math.cos(72 * Math.PI / 180);
  const rad = d => d * Math.PI / 180;
  const bctx = back.getContext('2d'), fctx = front.getContext('2d');
  hook(t => {
    if (!vis(t, A, B)) return;
    obj.style.transform = `rotateX(${st.tilt}deg) rotateY(${st.spin}deg) scale3d(${st.sc},${st.sc},${st.sc})`;
    // face da frente e de trás escurecem quando giram para longe da luz
    const c = Math.abs(Math.cos(rad(st.spin))) * Math.cos(rad(st.tilt));
    const col = mixHex(DARK, SAND, 0.35 + 0.65 * c);
    for (const p of layers[0].ps) p.setAttribute('fill', col);
    for (const p of layers[N - 1].ps) p.setAttribute('fill', col);
    wrap.style.filter = st.blur > 0.35 ? `blur(${st.blur.toFixed(1)}px)` : 'none';
    const dt = t - q(A);
    const grow = 1 + st.fly * 2.2, alpha = (1 - st.fly) * win(t, A, A + 10, 'expo.out');
    const open = lerp(0.6, 1, win(t, A, A + 14, 'expo.out'));
    for (const cx of [bctx, fctx]) cx.clearRect(0, 0, 1920, 1080);
    RINGS.forEach((ring, ri) => {
      const rr = ring.r * grow * open, tl = rad(ring.tilt), spin = dt * 0.25 * (ri % 2 ? -1 : 1);
      for (let d = 0; d < 360; d += 3) {
        const a = rad(d) + spin;
        const lx = rr * Math.cos(a), ly = rr * Math.sin(a) * FLAT;
        const x = 960 + lx * Math.cos(tl) - ly * Math.sin(tl), y = 540 + lx * Math.sin(tl) + ly * Math.cos(tl);
        const cx = Math.sin(a) >= 0 ? fctx : bctx;
        cx.fillStyle = `rgba(255,248,239,${(0.3 * alpha).toFixed(3)})`;
        cx.fillRect(x - 1.25, y - 1.25, 2.5, 2.5);
      }
    });
    PARTS.forEach(p => {
      const ring = RINGS[p.ring], tl = rad(ring.tilt), rr = ring.r * grow * open;
      const a = p.a0 + p.w * dt;
      const lx = rr * Math.cos(a), ly = rr * Math.sin(a) * FLAT;
      const x = 960 + lx * Math.cos(tl) - ly * Math.sin(tl), y = 540 + lx * Math.sin(tl) + ly * Math.cos(tl);
      const depth = Math.sin(a), sz = p.size * (1 + 0.18 * depth) * (1 + st.fly * 1.5);
      const cx = depth >= 0 ? fctx : bctx;
      cx.save(); cx.translate(x, y); cx.rotate(Math.PI / 4);
      cx.fillStyle = `rgba(203,184,143,${alpha.toFixed(3)})`;
      cx.fillRect(-sz / 2, -sz / 2, sz, sz); cx.restore();
    });
  });
}

/* ======================================================= 5 · busca + cursor */
function S5() {
  const A = CUT.s5, B = CUT.s6;
  const s = scene('s5', A, B, 'var(--ink)');
  const cam = h('div', 'fill', s);
  init(cam, { scale: 1, transformOrigin: '50% 50%' });
  tw(cam, { scale: 1 }, { scale: 1.06 }, A - 1, B - A + 1, 'power1.inOut');
  const eb = h('div', 'srch-eyebrow', cam, `<i></i>${COPY.brand}`);
  const field = h('div', 'srch-field', cam);
  const txt = h('span', '', field);
  const cur = h('span', 'srch-cur', field);
  const btn = h('div', 'srch-btn', cam);
  const arrow = h('div', 'srch-arrow', cam, '→');
  const circle = h('div', 'srch-circle', cam);
  const mouse = h('div', 'cursor', cam, CURSOR);
  init(field, { clipPath: 'inset(0% 100% 0% 0%)' });
  tw(field, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, A - 1, 10, 'expo.out');
  init(eb, { autoAlpha: 0, y: 10 });
  tw(eb, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0 }, A + 2, 10, 'expo.out');
  init(btn, { scale: 0, transformOrigin: '50% 50%' });
  tw(btn, { scale: 0 }, { scale: 1 }, A + 3, 8, 'expo.out');
  init(arrow, { xPercent: -50, yPercent: -50, autoAlpha: 0, x: -12 });
  tw(arrow, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0 }, A + 40, 6, 'expo.out');
  // o cursor entra, vai ao botão e clica
  const BX = 1508, BY = 540;
  init(mouse, { x: 1800, y: 930, autoAlpha: 0, transformOrigin: '0% 0%' });
  tw(mouse, { x: 1800, y: 930, autoAlpha: 0 }, { x: BX + 6, y: BY + 8, autoAlpha: 1 }, A + 42, 18, 'expo.inOut');
  tw(mouse, { scale: 1 }, { scale: 0.82 }, A + 61, 3, 'power2.out');
  tw(mouse, { scale: 0.82 }, { scale: 1 }, A + 64, 5, 'power2.out');
  tw(btn, { scale: 1 }, { scale: 0.86 }, A + 61, 3, 'power2.out');
  tw(btn, { scale: 0.86 }, { scale: 1 }, A + 64, 5, 'power2.out');
  cue(A + 62, 'tick', 's5', { forte: 1 });
  init(circle, { scale: 64 / 3000, autoAlpha: 0, transformOrigin: '50% 50%' });
  at(circle, { autoAlpha: 1 }, A + 66);
  tw(circle, { scale: 64 / 3000 }, { scale: 1.12 }, A + 66, B - A - 66, 'expo.in');
  tw(arrow, { autoAlpha: 1 }, { autoAlpha: 0 }, A + 68, 4, 'none');
  tw(mouse, { autoAlpha: 1 }, { autoAlpha: 0 }, A + 70, 6, 'none');
  cue(B, 'whoosh', 's5', { dur: 20, pan: 0.35 });
  const full = T(COPY.ask);
  const T0 = A + 6, RATE = 1.6;
  const fEnd = T0 + full.length / RATE;
  for (let k = 1; k <= full.length; k++) if (full[k - 1] !== ' ') cue(T0 + k / RATE, 'tick', 's5');
  let lastN = -1;
  hook(t => {
    if (!vis(t, A, B)) return;
    const f = fq(t);
    const n = clamp(Math.floor((f - T0) * RATE), 0, full.length);
    if (n !== lastN) { txt.textContent = full.slice(0, n); lastN = n; }
    const on = f < fEnd ? f >= T0 - 4 : Math.floor((f - fEnd) / 8) % 2 === 0;
    cur.style.opacity = on && f < A + 62 ? 1 : 0;
  });
}

/* ======================================================= 6 · letreiros com os atributos */
function S6() {
  const A = CUT.s6, B = CUT.s7;
  const s = scene('s6', A, B, 'var(--sand)');
  const persp = h('div', 'marq-persp', s);
  const plane = h('div', 'marq-plane', persp);
  const tags = COPY.attrs.map(T);
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const row = h('div', 'marq-row', plane);
    row.style.color = i === 6 ? 'var(--paper)' : 'var(--ink)';
    const k = (i * 5) % tags.length;
    const order = tags.slice(k).concat(tags.slice(0, k));
    const unitHTML = order.map(tg => `<span>${tg}</span><i class="marq-dia"></i>`).join('');
    const track = h('div', 'marq-track', row);
    const u = h('span', 'marq-unit', track, unitHTML);
    h('span', 'marq-unit', track, unitHTML);
    rows.push({ track, u, dir: i % 2 ? -1 : 1, phase: (i * 677) % 1500 });
  }
  init(plane, { rotationX: 20, rotationZ: -9, x: 0, scale: 1 });
  tw(plane, { x: 0, scale: 1 }, { x: -80, scale: 1.08 }, A, B - A, 'power1.inOut');
  hook(t => {
    if (!vis(t, A, B)) return;
    const dt = t - q(A);
    for (const r of rows) {
      const w = r.u.offsetWidth;
      let x = (r.phase + r.dir * 420 * dt) % w;
      if (x < 0) x += w;
      r.track.style.transform = `translateX(${-x}px)`;
    }
  });
}

/* ======================================================= 7 · pranchetas */
function S7(areas) {
  const A = CUT.s7, B = CUT.s8;
  const s = scene('s7', A, B, 'var(--paper)');
  const persp = h('div', 'wall-persp', s);
  const wall = h('div', 'wall', persp);
  const PHOTOS = ['galpao-docas', 'aero-patio-jato', 'hotel-cupula-dia', 'resort-lago', 'portaria',
    'convencoes-auditorio', 'vias-rotatoria', 'posto-caminhoes', 'park-boulevard-aereo'];
  const BOARDS = ['vias-corte', 'vias-infografia', 'clima-estudo', 'resort-implantacao'];
  const LABELS = areas.map(a => T(a.tag)).concat(COPY.wallExtra.map(T));
  const PAT = ['PLBPLP', 'LPLBPL', 'BLPLLP', 'LPLPBL'];
  const LCOL = [
    { bg: 'var(--ink)', fg: 'var(--cream)' }, { bg: 'var(--sand)', fg: 'var(--ink)' },
    { bg: 'var(--paper)', fg: 'var(--ink)', border: '1px solid rgba(14,13,11,.14)' }, { bg: 'var(--brown)', fg: 'var(--cream)' },
  ];
  let pi = 0, bi = 0, li = 0;
  const cards = [];
  PAT.forEach((row, r) => [...row].forEach((k, c) => {
    const card = css(h('div', 'card', wall), { left: c * 354 + 'px', top: r * 234 + 'px' });
    if (k === 'P') {
      const im = h('img', '', card); im.src = IMG(PHOTOS[pi++]); im.alt = '';
    } else if (k === 'B') {
      card.classList.add('card--board');
      const im = h('img', '', card); im.src = `/assets/park/${BOARDS[bi++]}.jpg`; im.alt = '';
    } else {
      const col = LCOL[(li + r) % LCOL.length];
      card.classList.add('card--lab');
      css(card, { background: col.bg, color: col.fg, border: col.border || 'none' });
      h('div', 'card__top', card, `<span class="card__dia"></span><span>${String(li + 1).padStart(2, '0')}</span>`);
      h('div', 'card__t', card, LABELS[li % LABELS.length]);
      li++;
    }
    cards.push({ el: card, d: Math.hypot(c - 2.5, (r - 1.5) * 1.4) });
  }));
  cards.slice().sort((a, b) => a.d - b.d).forEach((cd, k) => {
    init(cd.el, { rotationX: -90, autoAlpha: 0, transformOrigin: '50% 50%' });
    tw(cd.el, { rotationX: -90, autoAlpha: 0 }, { rotationX: 0, autoAlpha: 1 }, A - 3 + k * 1.1, 16, 'expo.out');
  });
  init(wall, { rotationX: 24, rotationZ: -10, x: 130, y: 70, scale: 1 });
  tw(wall, { x: 130, y: 70, scale: 1 }, { x: -130, y: -70, scale: 1.14 }, A - 3, B - A + 3, 'none');
  cue(A, 'whoosh', 's7', { dur: 10, pan: 0.3 });
}

/* ======================================================= 8 · masterplan com os pontos de interesse */
function S8(areas) {
  const A = CUT.s8, B = CUT.s9;
  const s = scene('s8', A, B, 'var(--ink)');
  const plan = h('div', 'map-plan', s);
  const im = h('img', '', plan); im.src = '/assets/web/vista-aerea-park-02.jpg'; im.alt = '';
  const cx = areas.reduce((a, b) => a + b.x, 0) / areas.length;
  const cy = areas.reduce((a, b) => a + b.y, 0) / areas.length;
  init(plan, { transformOrigin: `${cx}% ${cy}%`, scale: 1.3 });
  tw(plan, { scale: 1.3 }, { scale: 1.06 }, A - 1, 22, 'expo.out');
  tw(plan, { scale: 1.06 }, { scale: 1.17 }, A + 21, B - A - 21, 'power1.inOut');
  cue(A, 'hit', 's8');
  const rings = [];
  areas.forEach((a, i) => {
    const left = a.side === 'left';
    const pin = css(h('div', 'pin' + (left ? ' pin--left' : ''), plan), { left: a.x + '%', top: a.y + '%' });
    const tag = h('span', 'pin__tag', null, T(a.tag));
    const dot = h('span', 'pin__dot', null, '<i></i>');
    const ring = h('span', 'pin__ring', dot);
    if (left) pin.append(tag, dot); else pin.append(dot, tag);
    const a0 = A + 16 + i * 3;
    init(dot, { scale: 0 });
    tw(dot, { scale: 0 }, { scale: 1 }, a0, 9, 'expo.out');
    const hid = left ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    init(tag, { clipPath: hid });
    tw(tag, { clipPath: hid }, { clipPath: 'inset(0% 0% 0% 0%)' }, a0 + 2, 11, 'expo.out');
    rings.push({ el: ring, a0: a0 + 4 });
    cue(a0, 'tick', 's8');
  });
  hook(t => {                                 // o anel de cada pino pulsa de novo, como no site
    if (!vis(t, A, B)) return;
    const f = fq(t);
    for (const r of rings) {
      const l = f - r.a0, ph = l < 0 ? -1 : l % 48;
      if (ph < 0 || ph > 26) { r.el.style.opacity = 0; continue; }
      const p = EZ('power2.out')(ph / 26);
      r.el.style.opacity = (0.9 * (1 - p)).toFixed(3);
      r.el.style.transform = `rotate(45deg) scale(${(0.6 + 1.2 * p).toFixed(3)})`;
    }
  });
  h('div', 'map-veil', s);
  const eb = h('div', 'eyebrow', s, `<i></i>${T(COPY.map)}`);
  init(eb, { autoAlpha: 0, y: 12 });
  tw(eb, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0 }, A + 4, 12, 'expo.out');
  const title = h('div', 'map-title', s);
  T(COPY.mapTitle).forEach((ln, i) => {
    const sp = h('span', '', h('div', 'ln', title), ln);
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A + 8 + i * 4, 16, 'expo.out');
  });
}

/* ======================================================= 9 · números do parque */
function S9() {
  const L = 45;
  const SPEC = [
    { bg: 'var(--paper)', fg: 'var(--ink)', num: 'var(--ink)', fs: 300, us: 0.42, top: 330 },
    { bg: 'var(--ink)', fg: 'var(--cream)', num: 'var(--sand)', fs: 300, us: 0.42, top: 330 },
    { bg: 'var(--sand)', fg: 'var(--ink)', num: 'var(--ink)', fs: 250, us: 0.42, top: 360 },
  ];
  const R = mulberry32(9);
  COPY.counters.forEach((c, k) => {
    const sp = SPEC[k], a = CUT.s9 + k * L;
    const s = scene('s9' + 'abc'[k], a, a + L, sp.bg);
    cue(a, 'hit', 's9');
    const block = css(h('div', 'cnt', s), { top: sp.top + 'px', color: sp.fg });
    const num = css(h('div', 'cnt__num', block), { fontSize: sp.fs + 'px', color: sp.num });
    const cols = [];
    [...T(c.n)].forEach(ch => {
      if (!/\d/.test(ch)) { h('span', 'sep', num, ch); return; }
      const d = +ch, o = Math.floor(R() * 10), N = 20 + ((d - o + 10) % 10);
      const col = h('span', 'dg', num);
      const strip = h('span', 'dg__s', col, Array.from({ length: N + 1 }, (_, j) => `<b>${(o + j) % 10}</b>`).join(''));
      cols.push({ col, strip, N, blur: dirBlur(col, 'y') });
    });
    const DUR = 16, STG = 2;
    cols.forEach((cl, i) => { cl.a = a - 3 + (cols.length - 1 - i) * STG; cl.b = cl.a + DUR; cue(cl.b - 3, 'tick', 's9', { forte: 1 }); });
    const settle = Math.max(...cols.map(x => x.b));
    const ease = EZ('expo.out');
    hook(t => {
      if (!vis(t, a, a + L)) return;
      for (const cl of cols) {
        const p = ease(win(t, cl.a, cl.b));
        cl.strip.style.transform = `translateY(${(-p * cl.N).toFixed(4)}em)`;
        const p2 = ease(win(t + q(0.35), cl.a, cl.b));
        cl.blur.v = clamp((p2 - p) / 0.35 * cl.N * sp.fs * 0.22, 0, 30);
      }
    });
    if (c.u) {
      const um = css(h('span', 'cnt__mask', block), { marginLeft: 0.12 * sp.fs + 'px', marginBottom: 0.1535 * (sp.fs - sp.fs * sp.us) + 'px' });
      const u = css(h('span', 'cnt__unit', um, c.u), { fontSize: sp.fs * sp.us + 'px', color: sp.num });
      init(u, { yPercent: 105 });
      tw(u, { yPercent: 105 }, { yPercent: 0 }, settle - 5, 10, 'expo.out');
    }
    const lm = css(h('span', 'cnt__mask', block), { marginLeft: '36px', marginBottom: 0.1535 * sp.fs - 6 + 'px' });
    const leg = h('span', 'cnt__leg', lm, T(c.l));
    init(leg, { yPercent: 105 });
    tw(leg, { yPercent: 105 }, { yPercent: 0 }, a + 5, 12, 'expo.out');
    init(block, { transformOrigin: '0% 100%', scale: 1 });
    tw(block, { scale: 1 }, { scale: 1.035 }, a, L, 'none');
  });
}

/* ======================================================= 10 · fotos por ambiente
   Três fotos por ambiente, selo à esquerda e título à direita. A foto seguinte
   entra por cortina; na troca de ambiente a cortina leva a linha de areia. */
function S10() {
  const A = CUT.s10, L = 60, P = 20, WIPE = 8;
  COPY.amb.forEach((amb, k) => {
    const a0 = A + k * L;
    amb.photos.forEach((ph, j) => {
      const a = a0 + j * P;
      const first = k === 0 && j === 0;
      const end = k === COPY.amb.length - 1 && j === amb.photos.length - 1 ? CUT.s11 : a + P;
      const s = scene(`s10${'abcd'[k]}${j}`, first ? a : a - WIPE, end, 'var(--ink)');
      const kb = h('div', 'fill', s);
      const im = h('img', 'photo', kb); im.src = PHOTO(ph); im.alt = '';
      init(kb, { scale: 1.1, x: 0, transformOrigin: '50% 50%' });
      tw(kb, { scale: 1.1 }, { scale: 1.02 }, a - WIPE, end - a + WIPE, 'power2.out');
      tw(kb, { x: 0 }, { x: -30 }, a - WIPE, end - a + WIPE, 'none');
      if (first) return;
      const edge = j === 0 ? h('div', 'amb-edge', s) : null;
      const w = { p: 0 };
      tw(w, { p: 0 }, { p: 1 }, a - WIPE, WIPE, 'expo.inOut');
      cue(a - 1, 'whoosh', 's10', { dur: j === 0 ? 14 : 8, pan: -0.3 });
      hook(t => {
        if (!vis(t, a - WIPE, end)) return;
        const x = (1 - w.p) * 1920;
        s.style.clipPath = w.p < 1 ? `inset(0 0 0 ${x.toFixed(1)}px)` : 'none';
        if (edge) { edge.style.opacity = w.p < 1 ? 1 : 0; edge.style.transform = `translateX(${x.toFixed(1)}px)`; }
      });
    });
    // selo + título, por cima das três fotos do ambiente
    const ov = scene(`s10${'abcd'[k]}o`, a0, k === COPY.amb.length - 1 ? CUT.s11 : a0 + L, null);
    h('div', 'amb-veil', ov);
    const logo = h('img', 'amb-logo', ov); logo.src = `/assets/logo/${amb.logo}.svg`; logo.alt = '';
    logo.style.height = amb.hgt + 'px';
    const title = h('div', 'amb-title', ov);
    const kk = h('span', 'k', title, T(amb.k));
    const tS = h('span', '', h('span', 'm', title), T(amb.t));
    init(logo, { autoAlpha: 0, y: 18 });
    tw(logo, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 }, a0 + 2, 12, 'expo.out');
    init(kk, { autoAlpha: 0, x: 20 });
    tw(kk, { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0 }, a0 + 3, 12, 'expo.out');
    init(tS, { yPercent: 105 });
    tw(tS, { yPercent: 105 }, { yPercent: 0 }, a0 + 4, 14, 'expo.out');
  });
}

/* ======================================================= 11 · A cidade pronta para o futuro */
function S11() {
  const A = CUT.s11, B = CUT.s12;
  const s = scene('s11', A, B, 'var(--ink)');
  const cam = h('div', 'fill', s);
  init(cam, { scale: 1, transformOrigin: '10% 50%' });
  tw(cam, { scale: 1 }, { scale: 1.05 }, A, B - A, 'none');
  masked(cam, 'fut', T(COPY.fut)).forEach((sp, i) => {
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A - 2 + i * 5, 16, 'expo.out');
  });
  cue(A, 'hit', 's11');
}

/* ======================================================= 12 · tudo em um só lugar (carrossel de ícones) */
const ICONS = {
  casa: '<path d="M12 48 L50 16 L88 48"/><path d="M24 40 V86 H76 V40"/><path d="M42 86 V62 H58 V86"/>',
  hotel: '<path d="M12 20 V86"/><path d="M12 66 H88 V86"/><path d="M20 48 H40 V66"/><path d="M40 52 H88 V66"/>',
  shop: '<path d="M18 36 H82 L78 88 H22 Z"/><path d="M36 50 V22 H64 V50"/>',
  aviao: '<path d="M50 8 V92"/><path d="M12 58 L50 40 L88 58"/><path d="M32 90 L50 80 L68 90"/>',
};
function S12() {
  const A = CUT.s12, B = CUT.s13;
  const s0 = scene('s12', A, B, 'var(--paper)');
  const s = h('div', 'fill', s0);              // câmera lenta: nenhuma pausa fica parada
  init(s, { scale: 1, transformOrigin: '50% 55%' });
  tw(s, { scale: 1 }, { scale: 1.07 }, A, B - A, 'none');
  masked(s, 'ico-title', T(COPY.all)).forEach((sp, i) => {
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A - 1 + i * 4, 16, 'expo.out');
  });
  const items = COPY.icons, n = items.length;
  const els = [];                             // 3 voltas do carrossel, para os vizinhos nas pontas
  for (let r = -1; r <= 1; r++) items.forEach((it, i) => {
    const e = h('div', 'ico', s, `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter">${ICONS[it.k]}</svg>`);
    els.push({ e, idx: r * n + i });
  });
  const labels = items.map(it => h('div', 'ico-label', s, T(it.l)));
  const car = { i: 0, intro: 0 };
  tw(car, { intro: 0 }, { intro: 1 }, A + 4, 16, 'expo.out');
  const STEP = 25, T0 = A + 34;
  for (let k = 1; k < n; k++) {
    tw(car, { i: k - 1 }, { i: k }, T0 + (k - 1) * STEP, 11, 'expo.inOut');
    cue(T0 + (k - 1) * STEP + 5, 'tick', 's12', { forte: 1 });
  }
  const SP = 440, CY = 620;
  hook(t => {
    if (!vis(t, A, B)) return;
    const off = (1 - car.intro) * 420;
    for (const { e, idx } of els) {
      const d = idx - car.i, ad = Math.abs(d);
      if (ad > 3.2) { e.style.visibility = 'hidden'; continue; }
      e.style.visibility = 'visible';
      const op = ad < 1 ? lerp(1, 0.16, ad) : lerp(0.16, 0.06, Math.min(ad - 1, 1));
      const sc = 1 - 0.14 * Math.min(ad, 1);
      e.style.opacity = (op * car.intro).toFixed(3);
      e.style.transform = `translate(${(960 - 130 + d * SP + off).toFixed(1)}px,${CY - 130}px) scale(${sc.toFixed(3)})`;
    }
    labels.forEach((l, k) => {
      const d = k - car.i, ad = Math.abs(d);
      l.style.opacity = (clamp(1 - ad * 2.2, 0, 1) * car.intro).toFixed(3);
      l.style.transform = `translate(-50%,${(d * 34).toFixed(1)}px)`;
    });
  });
}

/* ======================================================= 13 · Brasil × Paraguai (fundo preto) */
function S13() {
  const A = CUT.s13, B = CUT.s14;
  const s0 = scene('s13', A, B, '#000');
  const s = h('div', 'fill', s0);
  init(s, { scale: 1, transformOrigin: '50% 60%' });
  tw(s, { scale: 1 }, { scale: 1.03 }, A, B - A, 'none');
  masked(s, 'chart-title', T(COPY.chart.title)).forEach((sp, i) => {
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A - 1 + i * 4, 16, 'expo.out');
  });
  const note = h('div', 'chart-note', s, `<i></i><span>${T(COPY.chart.note)}</span>`);
  init(note, { autoAlpha: 0, x: 24 });
  tw(note, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0 }, A + 10, 14, 'expo.out');
  cue(A, 'hit', 's13');
  const svg = sv('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' }, s);
  css(svg, { position: 'absolute', left: 0, top: 0 });
  const CY = 850, RB = 330, RP = 252, W = 62;
  const arc = (cx, r) => `M ${cx - r} ${CY} A ${r} ${r} 0 0 1 ${cx + r} ${CY}`;
  const BRC = 'rgba(255,248,239,.46)', PYC = '#cbb88f', TRK = '#1c1a16';
  COPY.chart.g.forEach((g, k) => {
    const cx = [540, 1380][k];
    [RB, RP].forEach(r => sv('path', { d: arc(cx, r), stroke: TRK, 'stroke-width': W, fill: 'none' }, svg));
    const pb = sv('path', { d: arc(cx, RB), stroke: BRC, 'stroke-width': W, fill: 'none', pathLength: 100, 'stroke-dasharray': '0 1000' }, svg);
    const pp = sv('path', { d: arc(cx, RP), stroke: PYC, 'stroke-width': W, fill: 'none', pathLength: 100, 'stroke-dasharray': '0 1000' }, svg);
    const big = css(h('div', 'gauge-big', s), { left: cx - 200 + 'px', top: CY - 168 + 'px' });
    const lab = css(h('div', 'gauge-lab', s, T(g.l)), { left: cx - 280 + 'px', top: CY + 44 + 'px' });
    const leg = css(h('div', 'gauge-leg', s,
      `<span><i style="background:${BRC}"></i>${T(COPY.chart.br)} <b class="vb">0%</b></span>` +
      `<span><i style="background:${PYC}"></i>${T(COPY.chart.py)} <b class="vp">0%</b></span>`), { left: cx - 280 + 'px', top: CY + 92 + 'px' });
    const vb = leg.querySelector('.vb'), vp = leg.querySelector('.vp');
    [lab, leg].forEach((e, i) => { init(e, { autoAlpha: 0, y: 12 }); tw(e, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0 }, A + 14 + i * 3 + k * 3, 12, 'expo.out'); });
    const g0 = A + 18 + k * 6;
    const st = { br: 0, py: 0, trk: 0 };
    tw(st, { br: 0 }, { br: g.br }, g0, 32, 'expo.out');
    tw(st, { py: 0 }, { py: g.py }, g0 + 8, 32, 'expo.out');
    cue(g0 + 8, 'tick', 's13', { forte: 1 });
    hook(t => {
      if (!vis(t, A, B)) return;
      pb.setAttribute('stroke-dasharray', `${st.br.toFixed(3)} 1000`);
      pp.setAttribute('stroke-dasharray', `${st.py.toFixed(3)} 1000`);
      vb.textContent = Math.round(st.br) + '%';
      vp.textContent = Math.round(st.py) + '%';
      big.innerHTML = `${Math.round(st.py)}<small>%</small>`;
      big.style.opacity = win(t, g0 + 6, g0 + 14).toFixed(3);
    });
  });
}

/* ======================================================= 14 · fale com um de nossos consultores */
function S14() {
  const A = CUT.s14, B = CUT.s15;
  const s = scene('s14', A, B, 'var(--ink)');
  const cam = h('div', 'fill', s);
  init(cam, { scale: 1, transformOrigin: '10% 50%' });
  tw(cam, { scale: 1 }, { scale: 1.04 }, A, B - A, 'none');
  masked(cam, 'cta', [T(COPY.cta.a), T(COPY.cta.b)]).forEach((sp, i) => {
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A - 2 + i * 4, 16, 'expo.out');
  });
  const btn = h('div', 'cta-btn', cam, `<span>${T(COPY.cta.btn)}</span><span>→</span>`);
  init(btn, { autoAlpha: 0, y: 20 });
  tw(btn, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0 }, A + 8, 14, 'expo.out');
  const mouse = h('div', 'cursor', cam, CURSOR);
  init(mouse, { x: 1500, y: 980, autoAlpha: 0, transformOrigin: '0% 0%' });
  tw(mouse, { x: 1500, y: 980, autoAlpha: 0 }, { x: 360, y: 758, autoAlpha: 1 }, A + 16, 20, 'expo.inOut');
  tw(mouse, { scale: 1 }, { scale: 0.82 }, A + 38, 3, 'power2.out');
  tw(mouse, { scale: 0.82 }, { scale: 1 }, A + 41, 5, 'power2.out');
  tw(btn, { scale: 1 }, { scale: 0.95 }, A + 38, 3, 'power2.out');
  tw(btn, { scale: 0.95 }, { scale: 1 }, A + 41, 5, 'power2.out');
  tw(btn, { backgroundColor: '#cbb88f' }, { backgroundColor: '#f7f3ea' }, A + 38, 4, 'none');
  cue(A, 'hit', 's14');
  cue(A + 39, 'tick', 's14', { forte: 1 });
}

/* ======================================================= 15 · símbolo + assinatura */
async function S15() {
  const A = CUT.s15, B = CUT.END;
  const s = scene('s15', A, B, 'var(--ink)');
  const can = h('canvas', '', s); can.width = 1920; can.height = 1080;
  const svgText = await (await fetch('/assets/logo/logo-horizontal-cream.svg')).text();
  const holder = h('div', '', s);
  holder.innerHTML = svgText.replace(/<\?xml[^>]*>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
  const svg = holder.querySelector('svg');
  svg.removeAttribute('id');
  svg.classList.add('fim-svg');
  const [VX, , VW, VH] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const U0 = 4.3;
  svg.setAttribute('width', VW * U0); svg.setAttribute('height', VH * U0);
  const polys = [...svg.querySelectorAll('polygon')];
  const paths = [...svg.querySelectorAll('path')];
  const defs = sv('defs', {}, svg);
  const clip = sv('clipPath', { id: 'fimclip52' }, defs);
  const clipR = sv('rect', { x: 150, y: -5, width: 0, height: VH + 10 }, clip);
  const gw = sv('g', { 'clip-path': 'url(#fimclip52)' }, svg);
  paths.forEach(p => { p.removeAttribute('class'); p.setAttribute('fill', '#fff8ef'); gw.appendChild(p); });
  const pts = polys.map(p => p.getAttribute('points').trim().split(/[\s,]+/).map(Number));
  const xs = pts.flatMap(a => a.filter((_, i) => i % 2 === 0)), ys = pts.flatMap(a => a.filter((_, i) => i % 2 === 1));
  const MX0 = Math.min(...xs), MX1 = Math.max(...xs), MY0 = Math.min(...ys), MY1 = Math.max(...ys);
  const MOD = (MX1 - MX0) / 5, MCX = (MX0 + MX1) / 2, MCY = (MY0 + MY1) / 2, LCX = VX + VW / 2;
  const gridG = sv('g', {}, svg);
  svg.insertBefore(gridG, svg.firstChild);
  const lines = [];
  for (let i = 0; i <= 5; i++) lines.push(sv('line', { x1: MX0 + i * MOD, y1: MY0, x2: MX0 + i * MOD, y2: MY1 }, gridG));
  for (let j = 0; j <= 2; j++) lines.push(sv('line', { x1: MX0, y1: MY0 + j * MOD, x2: MX1, y2: MY0 + j * MOD }, gridG));
  lines.forEach(l => { l.setAttribute('stroke', 'rgba(255,248,239,.42)'); l.setAttribute('stroke-width', (1.5 / U0).toFixed(3)); l.setAttribute('pathLength', '100'); l.setAttribute('stroke-dasharray', '100'); });
  const DOTS = [[MX0, MY0], [MX0 + 3 * MOD, MY0 + MOD], [MX1, MY1]].map(([x, y]) => ({ x, y, el: sv('rect', { width: 2, height: 2, fill: '#cbb88f' }, svg) }));
  const tris = polys.map((p, i) => {
    const a = pts[i];
    const V = [[a[0], a[1]], [a[2], a[3]], [a[4], a[5]]];
    let ra = V[0];
    for (let k = 0; k < 3; k++) {
      const P = V[k], P1 = V[(k + 1) % 3], P2 = V[(k + 2) % 3];
      if (Math.abs((P1[0] - P[0]) * (P2[0] - P[0]) + (P1[1] - P[1]) * (P2[1] - P[1])) < 1e-3) { ra = P; break; }
    }
    p.removeAttribute('class');
    return { el: p, ra, cx: (V[0][0] + V[1][0] + V[2][0]) / 3, cy: (V[0][1] + V[1][1] + V[2][1]) / 3 };
  }).sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  svg.appendChild(gw);
  tris.forEach(tr => svg.appendChild(tr.el));

  const KF = 1000 / (VW * U0);
  const cam = { k: 1, cx: MCX, wm: 0 };
  tw(cam, { k: 1 }, { k: KF }, A + 40, 11, 'expo.inOut');
  tw(cam, { cx: MCX }, { cx: LCX }, A + 64, 11, 'expo.inOut');
  tw(cam, { wm: 0 }, { wm: 1 }, A + 67, 12, 'expo.out');
  tw(cam, { k: KF }, { k: KF * 1.025 }, A + 75, B - A - 75, 'none');
  cue(A + 4, 'riser', 's15', { dur: 63 });
  cue(A + 67, 'hit', 's15', { final: 1 });

  const R = mulberry32(14);
  const SQ = 60, cells = [];
  const markW = (MX1 - MX0) * U0 * KF, markH = (MY1 - MY0) * U0 * KF;
  const free = { x0: 960 - markW / 2 - 50, x1: 960 + markW / 2 + 50, y0: 540 - markH / 2 - 50, y1: 540 + markH / 2 + 50 };
  for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) {
    const px = x * SQ, py = y * SQ;
    if (px + SQ > free.x0 && px < free.x1 && py + SQ > free.y0 && py < free.y1) continue;
    cells.push({ px, py, r: R(), c: R() < 0.62 ? '#f7f3ea' : '#cbb88f' });
  }
  const ctx = can.getContext('2d');
  const sand = [203, 184, 143], cream = [255, 248, 239];
  hook(t => {
    if (!vis(t, A, B)) return;
    const f = fq(t);
    const k = cam.k * U0, tx = 960 - cam.cx * k;
    svg.style.transform = `translate(${tx.toFixed(2)}px,${(540 - MCY * k).toFixed(2)}px) scale(${cam.k.toFixed(5)})`;
    lines.forEach((l, i) => {
      const p = win(t, A + 1 + i * 0.7, A + 10 + i * 0.7, 'expo.out');
      l.setAttribute('stroke-dashoffset', (100 * (1 - p)).toFixed(2));
      l.style.opacity = (1 - win(t, A + 34, A + 42)).toFixed(3);
    });
    DOTS.forEach((d, i) => {
      const p = win(t, A - 1 + i * 2, A + 6 + i * 2, 'expo.out') * (1 - win(t, A + 34, A + 40));
      const z = 20 / U0 * p;
      d.el.setAttribute('x', d.x - z / 2); d.el.setAttribute('y', d.y - z / 2);
      d.el.setAttribute('width', z); d.el.setAttribute('height', z);
    });
    const cm = win(t, A + 34, A + 40, 'power2.inOut');
    const col = `rgb(${sand.map((v, i) => Math.round(lerp(v, cream[i], cm))).join(',')})`;
    tris.forEach((tri, i) => {
      const p = win(t, A + 8 + i * 3.5, A + 19 + i * 3.5, 'expo.out');
      const [rx, ry] = tri.ra;
      tri.el.setAttribute('transform', `translate(${rx} ${ry}) rotate(${(-90 * (1 - p)).toFixed(3)}) scale(${Math.max(p, 0.0001).toFixed(5)}) translate(${-rx} ${-ry})`);
      tri.el.setAttribute('fill', col);
    });
    clipR.setAttribute('width', (cam.wm * (VW - 150 + 5)).toFixed(3));
    ctx.clearRect(0, 0, 1920, 1080);
    if (f >= A + 49 && f < A + 70) {
      for (const c of cells) {
        const a0 = A + 50 + c.r * 10, d = A + 59.5 + c.r * 8.5;
        if (f >= a0 && f < d) { ctx.fillStyle = c.c; ctx.fillRect(c.px + 2, c.py + 2, SQ - 4, SQ - 4); }
      }
    }
  });
}

M.film({
  id: 'park-52s',
  css: true,
  total: CUT.END,
  pulseUntil: CUT.s15,
  build: async areas => {
    await loadMark();
    S1(); S2(); S3(); S4(); S5(); S6(); S7(areas); S8(areas); S9(); S10(); S11(); S12(); S13(); S14();
    await S15();
  },
  safe: [[60, '#s1 .comp__meta, #s1 .comp__idx, #s1 .comp__brand'], [140, '#s2 .sub-c'], [370, '.srch-field, .srch-eyebrow'],
    [690, '#s8 .eyebrow, #s8 .map-title, #s8 .pin__tag'], [740, '#s9a .cnt'], [785, '#s9b .cnt'], [830, '#s9c .cnt'],
    [890, '#s10ao .amb-logo, #s10ao .amb-title'], [950, '#s10bo .amb-logo, #s10bo .amb-title'],
    [1010, '#s10co .amb-logo, #s10co .amb-title'], [1070, '#s10do .amb-logo, #s10do .amb-title'],
    [1140, '.fut'], [1260, '.ico-title, .ico-label'], [1380, '.chart-title, .chart-note, .gauge-lab, .gauge-leg'],
    [1450, '.cta, .cta-btn'], [1559, '#s15 .fim-svg']],
  pins: { frame: 690, img: '#s8 .map-plan img', dots: '#s8 .pin__dot' },
});
})();
