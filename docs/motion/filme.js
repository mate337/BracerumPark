/* Bracerum Park — filme de motion (v2, 48 s) em HTML + GSAP.
 *
 * Uma timeline mestre pausada (TL) mais ganchos (HOOKS) para o que é procedural:
 * revelação circular, letreiro, digitação, contadores, pulsos dos pinos, grade de
 * quadrados e grão. Tudo é função do tempo t. Nada de relógio, Math.random(),
 * setTimeout ou animação CSS: o render.js chama window.seek(t) quadro a quadro.
 *
 * Tempo: a timeline é escrita em "quadros de referência" (q) de uma grade de
 * 120 BPM — 1 batida = 15 q, 1 q = 1/30 s. Mudar BPM reescala o filme inteiro.
 *
 * v2 (pedido do cliente): abertura com o parque de verdade (vista aérea, mosaico
 * de fotos, pergunta que abre o masterplan), mapa e fotos por mais tempo, e tempo
 * de leitura para as frases. De 24 s para 48 s.
 */
(() => {
'use strict';

const FPS = 30;
const BPM = 120;
const BEAT = 60 / BPM;
const q = n => n * BEAT / 15;            // n quadros de referência → segundos

// Início de cada cena, em q. A cena vai até o início da seguinte (o mapa começa
// antes do fim da pergunta: é revelado de dentro do botão).
const CUT = { s1: 0, s2: 150, s3: 240, s4: 302, s5: 510, s6: 570, s7: 660, s8: 795, s9: 885, s10: 1185, s11: 1260, END: 1440 };
const TOTAL_Q = CUT.END;                  // 96 batidas
const DURATION = q(TOTAL_Q);

const PARAMS = new URLSearchParams(location.search);
const LANG = ['pt', 'es', 'en'].includes(PARAMS.get('lang')) ? PARAMS.get('lang') : 'pt';
const T = v => (v == null ? '' : typeof v === 'string' ? v : v[LANG]);

/* ---------------------------------------------------------------- textos */
const COPY = {
  open: { a: 'Bracerum', b: 'Park',
          c: { pt: 'cidade industrial', es: 'ciudad industrial', en: 'industrial city' },
          meta: 'Villeta · Paraguay · 2026', brand: 'Bracerum Park' },
  ask: { pt: 'Onde instalar a sua próxima fábrica?', es: '¿Dónde instalar su próxima fábrica?',
         en: 'Where will your next plant be?' },
  askK: 'Bracerum Park',
  map: { pt: 'O Masterplan', es: 'El Masterplan', en: 'The Masterplan' },
  // título do masterplan no site (mp.title), em duas linhas
  mapTitle: { pt: ['1.819.856 m² planejados', 'como uma <em>cidade</em>'],
              es: ['1.819.856 m² planificados', 'como una <em>ciudad</em>'],
              en: ['1,819,856 m² planned', 'as a <em>city</em>'] },
  wall: [ // rótulos extras da parede (os outros vêm de AREAS)
    { pt: 'Bracerum Select', es: 'Bracerum Select', en: 'Bracerum Select' },
    { pt: 'Auditório · 1.200 lugares', es: 'Auditorio · 1.200 lugares', en: 'Auditorium · 1,200 seats' },
    { pt: 'Resort · 142.067 m²', es: 'Resort · 142.067 m²', en: 'Resort · 142,067 m²' },
    { pt: 'Villeta · Paraguay', es: 'Villeta · Paraguay', en: 'Villeta · Paraguay' },
  ],
  counters: [
    { n: { pt: '1.200', es: '1.200', en: '1,200' }, u: '',
      l: { pt: 'lugares no<br><em>auditório</em>', es: 'lugares en el<br><em>auditorio</em>', en: 'seats in the<br><em>auditorium</em>' } },
    { n: { pt: '1.480', es: '1.480', en: '1,480' }, u: 'm',
      l: { pt: 'de pista<br><em>própria</em>', es: 'de pista<br><em>propia</em>', en: '<em>private</em><br>runway' } },
    { n: '1', u: '%',
      l: { pt: 'de tributo único,<br>regime de <em>Maquila</em>', es: 'de tributo único,<br>régimen de <em>Maquila</em>', en: 'single tax,<br><em>Maquila</em> regime' } },
  ],
  words: [
    { w: { pt: 'Rodovia.', es: 'Ruta.', en: 'Highway.' }, k: { pt: 'PY02 duplicada', es: 'PY02 duplicada', en: 'PY02 dual carriageway' } },
    { w: { pt: 'Hidrovia.', es: 'Hidrovía.', en: 'Waterway.' }, k: { pt: 'Atlântico e Pacífico', es: 'Atlántico y Pacífico', en: 'Atlantic and Pacific' } },
    { w: { pt: 'Mercosul.', es: 'Mercosur.', en: 'Mercosur.' }, k: { pt: 'Villeta · Paraguai', es: 'Villeta · Paraguay', en: 'Villeta · Paraguay' } },
  ],
  phrase: { a: { pt: 'Um parque.', es: 'Un parque.', en: 'A park.' },
            b: { pt: 'Uma cidade <em>inteira</em>.', es: 'Una ciudad <em>entera</em>.', en: 'A <em>whole</em> city.' } },
  tag: { a: { pt: 'Construímos', es: 'Construimos', en: 'Building' },
         b: { pt: 'o futuro <em>industrial</em>', es: 'el futuro <em>industrial</em>', en: 'the <em>industrial</em> future' } },
};

const IMG = f => `/assets/web/fotos/${f}.jpg`;

/* ------------------------------------------------------------- utilidades */
const STAGE = document.getElementById('stage');
const FXDEFS = document.querySelector('#fx defs');
const SVGNS = 'http://www.w3.org/2000/svg';

function h(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function sv(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const css = (e, o) => (Object.assign(e.style, o), e);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const EASES = {};
const EZ = name => EASES[name] || (EASES[name] = gsap.parseEase(name));
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// progresso de uma janela [a,b] (em q) no instante t (s), com easing opcional
const win = (t, a, b, ease) => {
  const p = clamp((t - q(a)) / (q(b) - q(a)), 0, 1);
  return ease ? EZ(ease)(p) : p;
};
const fq = t => t / q(1);                 // instante t → quadro de referência (fracionário)
const vis = (t, a, b) => t + 1e-6 >= q(a) && t + 1e-6 < q(b);

/* timeline + ganchos */
gsap.config({ force3D: false });
const TL = gsap.timeline({ paused: true });
const HOOKS = [], LATE = [];
const hook = fn => HOOKS.push(fn);
const lateHook = fn => LATE.push(fn);      // roda depois de todos os ganchos (ex.: aplicar blur calculado)
const SCENES = [];
// eventos de som e de corte — exportados para cues.csv (render.js cues) e lidos pelo audio.py
const CUES = [];
const cue = (qf, type, scene, extra) => CUES.push(Object.assign({ q: +qf.toFixed(3), type, scene }, extra || {}));

function scene(id, a, b, bg) {
  const s = h('section', 'sc', STAGE);
  s.id = id;
  if (bg) s.style.background = bg;
  SCENES.push({ el: s, a, b });
  return s;
}
// estado inicial (aplicado no build) e tween com início/fim explícitos
const init = (target, vars) => gsap.set(target, vars);
function tw(target, from, to, at, dur, ease) {
  TL.fromTo(target, from, Object.assign({ duration: q(dur), ease: ease || 'expo.out', immediateRender: false, lazy: false }, to), q(at));
}
const at = (target, vars, when) => TL.set(target, Object.assign({ immediateRender: false, lazy: false }, vars), q(when));

/* blur direcional (SVG) — devolve um proxy {v}; o gancho aplica o filtro */
let FXN = 0;
function dirBlur(el, axis) {
  const id = 'fx' + (FXN++);
  const f = sv('filter', { id, x: '-15%', y: '-15%', width: '130%', height: '130%', 'color-interpolation-filters': 'sRGB' }, FXDEFS);
  const g = sv('feGaussianBlur', { stdDeviation: '0 0', edgeMode: 'none' }, f);
  const p = { v: 0 };
  let last = -1;
  lateHook(() => {
    const v = Math.round(p.v * 10) / 10;
    if (v === last) return;
    last = v;
    if (v < 0.35) { el.style.filter = 'none'; return; }
    g.setAttribute('stdDeviation', axis === 'x' ? `${v} 0` : `0 ${v}`);
    el.style.filter = `url(#${id})`;
  });
  return p;
}

/* ------------------------------------------------------------ componentes */
// Composição editorial da abertura: três linhas em escada, metadados miúdos.
function makeComp() {
  const el = css(h('div', 'comp'), { color: 'var(--cream)' });
  const X = [110, 370, 630], Y = [168, 378, 588];
  const txt = [T(COPY.open.a), T(COPY.open.b), `<em>${T(COPY.open.c)}</em>`];
  const lines = txt.map((s, i) => {
    const m = css(h('div', 'comp__l', el), { left: X[i] + 'px', top: Y[i] + 'px' });
    const sp = h('span', '', m, s);
    if (i === 1) sp.style.color = 'var(--sand)';
    return sp;
  });
  const bits = [h('div', 'comp__brand', el, COPY.open.brand), h('div', 'comp__meta', el, COPY.open.meta),
    h('div', 'comp__arrow', el, '→'), h('div', 'comp__idx', el, '.01')];
  const rule = h('div', 'comp__rule', el);
  return { el, lines, bits, rule };
}

/* ======================================================= S1 · abertura
   A palavra cresce e estoura na vista aérea real do parque; o título entra
   por cima e fica tempo suficiente para ser lido. */
function S1() {
  const A = CUT.s1, B = CUT.s2;
  const s = scene('s1', A, B, 'var(--paper)');
  const punch = h('div', 'fill', s);
  const word = h('div', 'open-word', punch, T(COPY.open.a));
  init(word, { xPercent: -50, yPercent: -50, scale: 0.04 });
  tw(word, { scale: 0.04 }, { scale: 0.043 }, A, 4, 'none');
  tw(word, { scale: 0.043 }, { scale: 1.2 }, A + 4, 18, 'expo.in');
  const mb = dirBlur(punch, 'x');
  tw(mb, { v: 0 }, { v: 46 }, A + 12, 10, 'expo.in');
  cue(A + 22, 'whoosh', 's1', { dur: 14, pan: 0 });

  // Q22: a vista aérea do parque, recuando
  const photo = h('div', 'fill', s);
  init(photo, { autoAlpha: 0 });
  at(photo, { autoAlpha: 1 }, A + 22);
  at(punch, { autoAlpha: 0 }, A + 22);
  const kb = h('div', 'fill', photo);
  const im = h('img', 'photo', kb); im.src = IMG('park-aereo-rio'); im.alt = '';
  init(kb, { scale: 1.3, transformOrigin: '50% 50%' });
  tw(kb, { scale: 1.3 }, { scale: 1.07 }, A + 22, 40, 'expo.out');
  tw(kb, { scale: 1.07 }, { scale: 1 }, A + 62, B - A - 62, 'power1.inOut');
  const veil = h('div', 'open-veil', photo);
  tw(veil, { autoAlpha: 1 }, { autoAlpha: 0 }, B - 16, 14, 'power2.in');

  const c = makeComp();
  photo.appendChild(c.el);
  c.lines.forEach((ln, i) => {
    init(ln, { yPercent: 105 });
    tw(ln, { yPercent: 105 }, { yPercent: 0 }, A + 22 + i * 4, 16, 'expo.out');
    tw(ln, { yPercent: 0 }, { yPercent: -108 }, B - 20 + i * 2, 12, 'expo.in');
    tw(ln.parentNode, { x: 0 }, { x: [10, -14, -60][i] }, A + 22, B - A - 22, 'none');   // paralaxe
  });
  c.bits.forEach((b, i) => {
    init(b, { autoAlpha: 0, y: 14 });
    tw(b, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0 }, A + 30 + i * 3, 12, 'expo.out');
    tw(b, { autoAlpha: 1 }, { autoAlpha: 0 }, B - 20, 8, 'power2.in');
  });
  init(c.rule, { scaleX: 0, transformOrigin: '0 50%' });
  tw(c.rule, { scaleX: 0 }, { scaleX: 1 }, A + 28, 24, 'expo.out');
  tw(c.rule, { autoAlpha: 1 }, { autoAlpha: 0 }, B - 20, 8, 'power2.in');
}

/* ======================================================= S2 · mosaico
   A câmera recua da vista aérea e mostra 16 lugares do parque; depois mergulha
   na célula escura do losango, que vira o fundo da pergunta. */
function S2() {
  const A = CUT.s2, B = CUT.s3;
  const s = scene('s2', A, B, 'var(--ink)');
  const persp = css(h('div', 'fill', s), { perspective: '1600px', perspectiveOrigin: '960px 540px' });
  const G = 48, CW = 1920, CH = 1080;
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
    const cell = css(h('div', 'mos-cell', plane), { left: (i % 4) * (CW + G) + 'px', top: Math.floor(i / 4) * (CH + G) + 'px' });
    if (f) { const im = h('img', 'photo', cell); im.src = IMG(f); im.alt = ''; }
    else h('div', 'mos-dia', cell);
  });
  const ctr = i => ({ x: (i % 4) * (CW + G) + CW / 2, y: Math.floor(i / 4) * (CH + G) + CH / 2 });
  const o = ctr(ORIG), tg = ctr(TARGET);
  const cam = { s: 1, rx: 0, rz: 0, cx: o.x, cy: o.y };
  tw(cam, { s: 1, rx: 0, rz: 0, cx: o.x, cy: o.y }, { s: 0.25, rx: 14, rz: -6, cx: PW / 2, cy: PH / 2 }, A, 24, 'expo.inOut');
  tw(cam, { s: 0.25, rx: 14, rz: -6 }, { s: 0.278, rx: 11, rz: -4 }, A + 24, 48, 'power1.inOut');
  tw(cam, { s: 0.278, rx: 11, rz: -4, cx: PW / 2, cy: PH / 2 }, { s: 1.7, rx: 0, rz: 0, cx: tg.x, cy: tg.y }, A + 72, B - A - 72, 'expo.in');
  cue(A + 10, 'whoosh', 's2', { dur: 16, pan: -0.2, grave: 1 });
  cue(B, 'whoosh', 's2', { dur: 16, pan: 0.2 });
  hook(t => {
    if (!vis(t, A, B)) return;
    plane.style.transform = `translate(960px,540px) rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`;
  });
}

/* ======================================================= S3 · pergunta */
const ASK = {};
function S3() {
  const A = CUT.s3, B = CUT.s4 + 28;          // fica por baixo enquanto o mapa se abre
  const s = scene('s3', A, B, 'var(--ink)');
  const cam = h('div', 'fill', s);             // push-in lento enquanto digita
  init(cam, { scale: 1, transformOrigin: '50% 50%' });
  tw(cam, { scale: 1 }, { scale: 1.07 }, A - 1, B - A + 1, 'power1.inOut');
  ASK.cam = cam;
  const eb = h('div', 'ask-eyebrow', cam, `<i></i>${COPY.askK}`);
  const field = h('div', 'ask-field', cam);
  const txt = h('span', '', field);
  const cur = h('span', 'ask-cur', field);
  const btn = h('div', 'ask-btn', cam);
  const arrow = h('div', 'ask-arrow', cam, '→');
  init(field, { clipPath: 'inset(0% 100% 0% 0%)' });
  tw(field, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, A - 1, 10, 'expo.out');
  init(eb, { autoAlpha: 0, y: 10 });
  tw(eb, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0 }, A + 2, 10, 'expo.out');
  init(btn, { scale: 0 });
  tw(btn, { scale: 0 }, { scale: 1 }, A + 3, 8, 'expo.out');
  init(arrow, { xPercent: -50, yPercent: -50, autoAlpha: 0, x: -12 });
  tw(arrow, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0 }, CUT.s4 - 8, 6, 'expo.out');
  const full = T(COPY.ask);
  const T0 = A + 8, RATE = 1.35;
  const fEnd = T0 + full.length / RATE;
  for (let k = 1; k <= full.length; k++) if (full[k - 1] !== ' ') cue(T0 + k / RATE, 'tick', 's3');
  let lastN = -1;
  hook(t => {
    if (!vis(t, A, B)) return;
    const f = fq(t);
    const n = clamp(Math.floor((f - T0) * RATE), 0, full.length);
    if (n !== lastN) { txt.textContent = full.slice(0, n); lastN = n; }
    const on = f < fEnd ? f >= T0 - 4 : Math.floor((f - fEnd) / 8) % 2 === 0;
    cur.style.opacity = on && f < CUT.s4 ? 1 : 0;
  });
}

/* ======================================================= S4 · masterplan
   Aberto de dentro do botão da pergunta: é a resposta. Fica ~7 s em tela. */
function S4(areas) {
  const A = CUT.s4, B = CUT.s5;
  const s = scene('s4', A, B, 'var(--ink)');
  // revelação circular a partir do botão (que acompanha o push-in da S3)
  const rev = { r: 30 };
  tw(rev, { r: 30 }, { r: 2300 }, A, 28, 'expo.in');
  cue(A + 28, 'whoosh', 's4', { dur: 24, pan: 0.3, grave: 1 });
  hook(t => {
    if (!vis(t, A, B)) return;
    if (fq(t) >= A + 28) { s.style.clipPath = 'none'; return; }
    const k = gsap.getProperty(ASK.cam, 'scale');
    const cx = 960 + (1430 - 960) * k;
    s.style.clipPath = `circle(${(rev.r * k).toFixed(1)}px at ${cx.toFixed(1)}px 540px)`;
  });

  const plan = h('div', 'map-plan', s);
  const im = h('img', '', plan); im.src = '/assets/web/vista-aerea-park-02.jpg'; im.alt = '';
  const cx = areas.reduce((a, b) => a + b.x, 0) / areas.length;
  const cy = areas.reduce((a, b) => a + b.y, 0) / areas.length;
  init(plan, { transformOrigin: `${cx}% ${cy}%`, scale: 1.02 });
  tw(plan, { scale: 1.02 }, { scale: 1.2 }, A, B - A, 'power1.inOut');
  const rings = [];
  areas.forEach((a, i) => {
    const left = a.side === 'left';
    const pin = css(h('div', 'pin' + (left ? ' pin--left' : ''), plan), { left: a.x + '%', top: a.y + '%' });
    const tag = h('span', 'pin__tag', null, T(a.tag));
    const dot = h('span', 'pin__dot', null, '<i></i>');
    const ring = h('span', 'pin__ring', dot);
    if (left) pin.append(tag, dot); else pin.append(dot, tag);
    const a0 = A + 50 + i * 4;
    init(dot, { scale: 0 });
    tw(dot, { scale: 0 }, { scale: 1 }, a0, 9, 'expo.out');
    const hid = left ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    init(tag, { clipPath: hid });
    tw(tag, { clipPath: hid }, { clipPath: 'inset(0% 0% 0% 0%)' }, a0 + 2, 11, 'expo.out');
    rings.push({ el: ring, a0: a0 + 4 });
    cue(a0, 'tick', 's4');
  });
  // o anel de cada pino pulsa de novo a cada 1,6 s, como no site
  hook(t => {
    if (!vis(t, A, B)) return;
    const f = fq(t);
    for (const r of rings) {
      const l = f - r.a0;
      const ph = l < 0 ? -1 : l % 48;
      if (ph < 0 || ph > 26) { r.el.style.opacity = 0; continue; }
      const p = EZ('power2.out')(ph / 26);
      r.el.style.opacity = (0.9 * (1 - p)).toFixed(3);
      r.el.style.transform = `rotate(45deg) scale(${(0.6 + 1.2 * p).toFixed(3)})`;
    }
  });
  h('div', 'map-veil', s);
  const eb = h('div', 'eyebrow', s, `<i></i>${T(COPY.map)}`);
  init(eb, { autoAlpha: 0, y: 12 });
  tw(eb, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0 }, A + 30, 12, 'expo.out');
  const title = h('div', 'map-title', s);
  T(COPY.mapTitle).forEach((ln, i) => {
    const sp = h('span', '', h('div', 'ln', title), ln);
    init(sp, { yPercent: 105 });
    tw(sp, { yPercent: 105 }, { yPercent: 0 }, A + 34 + i * 4, 16, 'expo.out');
  });
}

/* ======================================================= S5 · letreiro */
function S5(areas) {
  const A = CUT.s5, B = CUT.s6;
  const s = scene('s5', A, B, 'var(--sand)');
  const persp = h('div', 'marq-persp', s);
  const plane = h('div', 'marq-plane', persp);
  const tags = areas.map(a => T(a.tag));
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const row = h('div', 'marq-row', plane);
    row.style.color = i === 6 ? 'var(--paper)' : 'var(--ink)';
    const k = (i * 3) % tags.length;
    const order = tags.slice(k).concat(tags.slice(0, k));
    const unitHTML = order.map(tg => `<span>${tg}</span><i class="marq-dia"></i>`).join('');
    const track = h('div', 'marq-track', row);
    const u = h('span', 'marq-unit', track, unitHTML);
    h('span', 'marq-unit', track, unitHTML);
    h('span', 'marq-unit', track, unitHTML);
    rows.push({ track, u, dir: i % 2 ? -1 : 1, phase: (i * 677) % 1500 });
  }
  init(plane, { rotationX: 20, rotationZ: -9, x: 0, scale: 1 });
  tw(plane, { x: 0, scale: 1 }, { x: -80, scale: 1.08 }, A, B - A, 'power1.inOut');
  cue(A, 'whoosh', 's5', { dur: 8, pan: -0.3 });
  hook(t => {
    if (!vis(t, A, B)) return;
    const dt = t - q(A);
    for (const r of rows) {
      const w = r.u.offsetWidth;
      let x = (r.phase + r.dir * 380 * dt) % w;
      if (x < 0) x += w;
      r.track.style.transform = `translateX(${-x}px)`;
    }
  });
}

/* ======================================================= S6 · parede de cartões */
function S6(areas) {
  const A = CUT.s6, B = CUT.s7;
  const s = scene('s6', A, B, 'var(--paper)');
  const persp = h('div', 'wall-persp', s);
  const wall = h('div', 'wall', persp);
  const PHOTOS = ['galpao-docas', 'aero-patio-jato', 'hotel-cupula-dia', 'resort-lago', 'portaria',
    'convencoes-auditorio', 'vias-rotatoria', 'posto-caminhoes', 'park-boulevard-aereo', 'amen-piscina-quincho'];
  const LABELS = areas.map(a => T(a.tag)).concat(COPY.wall.map(T));
  const PAT = ['PLLPLP', 'LPLLPL', 'PLPLLP', 'LLPLPL'];
  const LCOL = [
    { bg: 'var(--ink)', fg: 'var(--cream)' }, { bg: 'var(--sand)', fg: 'var(--ink)' },
    { bg: 'var(--paper)', fg: 'var(--ink)', border: '1px solid rgba(14,13,11,.14)' }, { bg: 'var(--brown)', fg: 'var(--cream)' },
  ];
  let pi = 0, li = 0;
  const cards = [];
  PAT.forEach((row, r) => [...row].forEach((k, c) => {
    const card = css(h('div', 'card', wall), { left: c * 354 + 'px', top: r * 234 + 'px' });
    if (k === 'P') {
      const im = h('img', '', card); im.src = IMG(PHOTOS[pi++]); im.alt = '';
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
    tw(cd.el, { rotationX: -90, autoAlpha: 0 }, { rotationX: 0, autoAlpha: 1 }, A - 3 + k * 1.2, 16, 'expo.out');
  });
  init(wall, { rotationX: 24, rotationZ: -10, x: 130, y: 70, scale: 1 });
  tw(wall, { x: 130, y: 70, scale: 1 }, { x: -130, y: -70, scale: 1.14 }, A - 3, B - A + 3, 'none');
  cue(A, 'whoosh', 's6', { dur: 10, pan: 0.3 });
}

/* ======================================================= S7 · contadores */
function S7() {
  const L = 45;
  const SPEC = [
    { bg: 'var(--paper)', fg: 'var(--ink)', num: 'var(--ink)', fs: 300, us: 0.42, top: 330 },
    { bg: 'var(--ink)', fg: 'var(--cream)', num: 'var(--sand)', fs: 300, us: 0.42, top: 330 },
    { bg: 'var(--sand)', fg: 'var(--ink)', num: 'var(--ink)', fs: 540, us: 1, top: 170 },
  ];
  const R = mulberry32(9);
  COPY.counters.forEach((c, k) => {
    const sp = SPEC[k], a = CUT.s7 + k * L;
    const s = scene('s7' + 'abc'[k], a, a + L, sp.bg);
    cue(a, 'hit', 's7');
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
    // param da direita para a esquerda; a casa mais alta assenta por último
    const DUR = 16, STG = 2;
    cols.forEach((cl, i) => { cl.a = a - 3 + (cols.length - 1 - i) * STG; cl.b = cl.a + DUR; cue(cl.b - 3, 'tick', 's7', { forte: 1 }); });
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
      const um = css(h('span', 'cnt__mask', block), { marginLeft: (sp.us < 1 ? 0.12 : 0.02) * sp.fs + 'px', marginBottom: 0.1535 * (sp.fs - sp.fs * sp.us) + 'px' });
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

/* ======================================================= S8 · palavras */
function S8() {
  const L = 30;
  const SPEC = [
    { bg: 'var(--sand)', fg: 'var(--ink)' },
    { bg: 'var(--ink)', fg: 'var(--sand)' },
    { bg: 'var(--paper)', fg: 'var(--ink)' },
  ];
  COPY.words.forEach((c, k) => {
    const a = CUT.s8 + k * L, sp = SPEC[k];
    const s = scene('s8' + 'abc'[k], a, a + L, sp.bg);
    cue(a, 'hit', 's8');
    const wrap = css(h('div', 'fill', s), { color: sp.fg });
    const kk = h('div', 'word-k', wrap, `<i></i>${T(c.k)}`);
    const w = h('div', 'word-w', wrap, T(c.w));
    init(w, { x: 70 });
    tw(w, { x: 70 }, { x: 0 }, a - 1, 10, 'expo.out');
    tw(w, { x: 0 }, { x: -12 }, a + 9, L - 9, 'none');
    init(kk, { autoAlpha: 0, x: 30 });
    tw(kk, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0 }, a, 9, 'expo.out');
    const mb = dirBlur(w, 'x');
    tw(mb, { v: 28 }, { v: 0 }, a - 1, 6, 'power2.out');
  });
}

/* ======================================================= S9 · fotos com as marcas
   Cada foto fica 2 s e entra por cortina, com a linha de areia na borda. */
function S9(areas) {
  const L = 60, WIPE = 14;
  const byTag = pt => areas.find(a => a.tag.pt === pt);
  const fab = byTag('Fábricas Bracerum'), hang = byTag('Hangares');
  const SHOTS = [
    { img: 'galpao-docas', cap: [T(fab.tag), T(fab.val)] },
    { img: 'hangar-bracerum', cap: [T(hang.tag), T(hang.val)] },
    { img: 'hotel-cupula-dia', logo: 'hotel', hgt: 112 },
    { img: 'resort-lago', logo: 'resort', hgt: 156 },
    { img: 'posto-caminhoes', logo: 'select', hgt: 156 },
  ];
  SHOTS.forEach((sh, k) => {
    const a = CUT.s9 + k * L;
    const end = k === SHOTS.length - 1 ? CUT.s10 : a + L;
    const s = scene('s9' + 'abcde'[k], a - WIPE, end, 'var(--ink)');
    const kb = h('div', 'fill', s);
    const im = h('img', 'photo', kb); im.src = IMG(sh.img); im.alt = '';
    init(kb, { scale: 1.1, x: 0, transformOrigin: '50% 50%' });
    tw(kb, { scale: 1.1 }, { scale: 1 }, a - WIPE, end - a + WIPE, 'power2.out');
    tw(kb, { x: 0 }, { x: -36 }, a - WIPE, end - a + WIPE, 'none');
    const band = h('div', 'shot-band', s);
    init(band, { rotation: 30, x: -1000 });
    tw(band, { x: -1000 }, { x: 2400 }, a + 2, 44, 'power1.inOut');
    h('div', 'shot-vig', s);
    h('div', 'shot-veil', s);
    let mark;
    if (sh.logo) {
      mark = h('img', 'shot-logo', s); mark.src = `/assets/logo/${sh.logo}-cream.svg`; mark.alt = '';
      mark.style.height = sh.hgt + 'px';
    } else {
      mark = h('div', 'shot-cap', s, `<b><i></i>${sh.cap[0]}</b><span>${sh.cap[1]}</span>`);
    }
    init(mark, { autoAlpha: 0, y: 18 });
    tw(mark, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 }, a + 6, 14, 'expo.out');
    // cortina da direita para a esquerda com a linha de areia na borda
    const edge = h('div', 'shot-edge', s);
    const w = { p: 0 };
    tw(w, { p: 0 }, { p: 1 }, a - WIPE, WIPE, 'expo.inOut');
    cue(a - 2, 'whoosh', 's9', { dur: WIPE, pan: -0.3 });
    hook(t => {
      if (!vis(t, a - WIPE, end)) return;
      const x = (1 - w.p) * 1920;
      s.style.clipPath = w.p < 1 ? `inset(0 0 0 ${x.toFixed(1)}px)` : 'none';
      edge.style.opacity = w.p < 1 ? 1 : 0;
      edge.style.transform = `translateX(${x.toFixed(1)}px)`;
    });
  });
}

/* ======================================================= S10 · frase */
function S10() {
  const A = CUT.s10, M = A + 30, B = CUT.s11;
  const s1 = scene('s10a', A, M, 'var(--ink)');
  const m = h('div', 'phr-a', s1);
  const sp = h('span', '', m, T(COPY.phrase.a));
  init(sp, { yPercent: 105 });
  tw(sp, { yPercent: 105 }, { yPercent: 0 }, A - 2, 12, 'expo.out');
  init(m, { scale: 1, transformOrigin: '0% 50%' });
  tw(m, { scale: 1 }, { scale: 1.05 }, A, M - A, 'none');
  cue(A, 'hit', 's10');

  const s2 = scene('s10b', M, B, 'var(--sand)');
  const b = h('div', 'phr-b', s2, T(COPY.phrase.b));
  const st = { x: 0 };
  tw(st, { x: 0 }, { x: 1 }, M - 1, B - M + 1, 'none');
  cue(M + 20, 'whoosh', 's10', { dur: 30, pan: -0.5 });
  hook(t => {
    if (!vis(t, M, B)) return;
    const x0 = 150, x1 = Math.min(1920 - 110 - b.offsetWidth - 120, x0 - 400);   // frase curta (EN) ainda desliza
    b.style.transform = `translateX(${lerp(x0, x1, st.x).toFixed(1)}px)`;
  });
}

/* ======================================================= S11 · símbolo + assinatura */
async function S11() {
  const A = CUT.s11, B = CUT.END;
  const s = scene('s11', A, B, 'var(--ink)');
  const can = h('canvas', '', s); can.width = 1920; can.height = 1080;
  const svgText = await (await fetch('/assets/logo/logo-horizontal-cream.svg')).text();
  const holder = h('div', '', s);
  holder.innerHTML = svgText.replace(/<\?xml[^>]*>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
  const svg = holder.querySelector('svg');
  svg.removeAttribute('id');
  svg.classList.add('fim-svg');
  const [VX, , VW, VH] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const U0 = 4.3;                                   // px por unidade no auge da construção
  svg.setAttribute('width', VW * U0); svg.setAttribute('height', VH * U0);
  const polys = [...svg.querySelectorAll('polygon')];
  const paths = [...svg.querySelectorAll('path')];
  const defs = sv('defs', {}, svg);
  const clip = sv('clipPath', { id: 'fimclip' }, defs);
  const clipR = sv('rect', { x: 150, y: -5, width: 0, height: VH + 10 }, clip);
  const gw = sv('g', { 'clip-path': 'url(#fimclip)' }, svg);
  paths.forEach(p => { p.removeAttribute('class'); p.setAttribute('fill', '#fff8ef'); gw.appendChild(p); });
  const pts = polys.map(p => p.getAttribute('points').trim().split(/[\s,]+/).map(Number));
  const xs = pts.flatMap(a => a.filter((_, i) => i % 2 === 0)), ys = pts.flatMap(a => a.filter((_, i) => i % 2 === 1));
  const MX0 = Math.min(...xs), MX1 = Math.max(...xs), MY0 = Math.min(...ys), MY1 = Math.max(...ys);
  const MOD = (MX1 - MX0) / 5;
  const MCX = (MX0 + MX1) / 2, MCY = (MY0 + MY1) / 2;
  const LCX = VX + VW / 2;
  // grade de módulos 5×2
  const gridG = sv('g', {}, svg);
  svg.insertBefore(gridG, svg.firstChild);
  const lines = [];
  for (let i = 0; i <= 5; i++) lines.push(sv('line', { x1: MX0 + i * MOD, y1: MY0, x2: MX0 + i * MOD, y2: MY1 }, gridG));
  for (let j = 0; j <= 2; j++) lines.push(sv('line', { x1: MX0, y1: MY0 + j * MOD, x2: MX1, y2: MY0 + j * MOD }, gridG));
  lines.forEach(l => { l.setAttribute('stroke', 'rgba(255,248,239,.42)'); l.setAttribute('stroke-width', (1.5 / U0).toFixed(3)); l.setAttribute('pathLength', '100'); l.setAttribute('stroke-dasharray', '100'); });
  const DOTS = [[MX0, MY0], [MX0 + 3 * MOD, MY0 + MOD], [MX1, MY1]].map(([x, y]) => ({ x, y, el: sv('rect', { width: 2, height: 2, fill: '#cbb88f' }, svg) }));
  // triângulos: nascem do vértice do ângulo reto
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

  // câmera: escala k sobre U0, ponto (cx, MCY) do SVG no centro do quadro
  const KF = 1000 / (VW * U0);                      // assinatura final com 1000 px de largura
  const cam = { k: 1, cx: MCX, wm: 0 };
  tw(cam, { k: 1 }, { k: KF }, A + 50, 11, 'expo.inOut');
  tw(cam, { k: KF }, { k: KF * 1.08 }, A + 61, 70, 'none');                // aproxima devagar durante a tagline
  tw(cam, { cx: MCX, k: KF * 1.08 }, { cx: LCX, k: KF }, A + 131, 11, 'expo.inOut');
  tw(cam, { wm: 0 }, { wm: 1 }, A + 134, 12, 'expo.out');
  tw(cam, { k: KF }, { k: KF * 1.02 }, A + 142, B - A - 142, 'none');
  cue(A + 30, 'riser', 's11', { dur: 104 });       // termina 0,3 s antes do hit da assinatura
  cue(A + 134, 'hit', 's11', { final: 1 });

  // tagline em volta do símbolo — fica ~1,5 s para leitura
  const markW = (MX1 - MX0) * U0 * KF;
  const tl = h('div', 'fim-tx', s);
  const tlS = h('span', '', tl, T(COPY.tag.a));
  const tr = h('div', 'fim-tx', s);
  const trS = h('span', '', tr, T(COPY.tag.b));
  init(tlS, { xPercent: 102 }); init(trS, { xPercent: -102 });
  tw(tlS, { xPercent: 102 }, { xPercent: 0 }, A + 77, 12, 'expo.out');
  tw(trS, { xPercent: -102 }, { xPercent: 0 }, A + 78, 12, 'expo.out');
  tw(tlS, { xPercent: 0 }, { xPercent: 102 }, A + 126, 6, 'expo.in');
  tw(trS, { xPercent: 0 }, { xPercent: -102 }, A + 126, 6, 'expo.in');

  // grade de quadrados (ordem aleatória semeada, zona livre em volta do símbolo)
  const R = mulberry32(14);
  const SQ = 60, cells = [];
  const markH = (MY1 - MY0) * U0 * KF;
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
    const k = cam.k * U0;
    const tx = 960 - cam.cx * k;
    svg.style.transform = `translate(${tx.toFixed(2)}px,${(540 - MCY * k).toFixed(2)}px) scale(${cam.k.toFixed(5)})`;
    tl.style.right = (1920 - (tx + MX0 * k - 34)).toFixed(1) + 'px';
    tr.style.left = (tx + MX1 * k + 34).toFixed(1) + 'px';
    lines.forEach((l, i) => {
      const p = win(t, A + 2 + i * 0.8, A + 12 + i * 0.8, 'expo.out');
      l.setAttribute('stroke-dashoffset', (100 * (1 - p)).toFixed(2));
      l.style.opacity = (1 - win(t, A + 44, A + 52)).toFixed(3);
    });
    DOTS.forEach((d, i) => {
      const p = win(t, A - 1 + i * 2, A + 6 + i * 2, 'expo.out') * (1 - win(t, A + 44, A + 50));
      const z = 20 / U0 * p;
      d.el.setAttribute('x', d.x - z / 2); d.el.setAttribute('y', d.y - z / 2);
      d.el.setAttribute('width', z); d.el.setAttribute('height', z);
    });
    const cm = win(t, A + 44, A + 50, 'power2.inOut');
    const col = `rgb(${sand.map((v, i) => Math.round(lerp(v, cream[i], cm))).join(',')})`;
    tris.forEach((tri, i) => {
      const p = win(t, A + 12 + i * 4.4, A + 24 + i * 4.4, 'expo.out');
      const [rx, ry] = tri.ra;
      tri.el.setAttribute('transform', `translate(${rx} ${ry}) rotate(${(-90 * (1 - p)).toFixed(3)}) scale(${Math.max(p, 0.0001).toFixed(5)}) translate(${-rx} ${-ry})`);
      tri.el.setAttribute('fill', col);
    });
    clipR.setAttribute('width', (cam.wm * (VW - 150 + 5)).toFixed(3));
    ctx.clearRect(0, 0, 1920, 1080);
    if (f >= A + 59 && f < A + 80) {
      for (const c of cells) {
        const a0 = A + 60 + c.r * 10, d = A + 69.5 + c.r * 8.5;
        if (f >= a0 && f < d) { ctx.fillStyle = c.c; ctx.fillRect(c.px + 2, c.py + 2, SQ - 4, SQ - 4); }
      }
    }
  });
}

/* ------------------------------------------------------------------ grão */
function GRAIN() {
  const c = h('canvas', '', STAGE); c.id = 'grain';
  const W = 960, H = 540;
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  hook(t => {
    const R = mulberry32(Math.round(t * 240) + 1);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (R() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  });
}

/* ------------------------------------------------------------------ boot */
async function loadAreas() {
  const src = await (await fetch('/home.js')).text();
  const m = src.match(/const AREAS = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('AREAS não encontrado em home.js');
  return new Function('return ' + m[1])();
}

window.seek = async t => {
  t = clamp(t, 0, DURATION - 1e-6);
  for (const sc of SCENES) sc.el.style.visibility = vis(t, sc.a, sc.b) ? 'visible' : 'hidden';
  TL.seek(t, false);
  for (const fn of HOOKS) fn(t);
  for (const fn of LATE) fn(t);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
};

async function boot() {
  const fonts = ['500 100px NSF', 'italic 500 100px NSF', '700 100px "Liberation Sans"', '400 100px "Liberation Sans"'];
  await Promise.all(fonts.map(f => document.fonts.load(f)));
  if (!document.fonts.check('500 100px NSF') || !document.fonts.check('italic 500 100px NSF')) {
    throw new Error('Noto Serif (NSF) não carregou — confira docs/motion/fonts/');
  }
  const areas = await loadAreas();
  S1(); S2(); S3(); S4(areas); S5(areas); S6(areas); S7(); S8(); S9(areas); S10();
  await S11();
  GRAIN();
  await Promise.all([...document.images].map(i => i.decode().catch(() => { throw new Error('imagem não carregou: ' + i.src); })));
  // cortes de cena (para a edição) e o pulso da grade de 120 BPM até o símbolo
  SCENES.forEach(sc => cue(sc.a, 'corte', sc.el.id));
  for (let b = 0; b < CUT.s11 / 15; b++) cue(b * 15, 'pulso', '', { tempo: b % 4 === 0 ? 1 : 0 });
  CUES.sort((a, b) => a.q - b.q);
  TL.seek(0);
  const tq = parseFloat(PARAMS.get('t'));
  await window.seek(isFinite(tq) ? tq : 0);
  window.FILME = {
    FPS, BPM, DURATION, FRAMES: Math.round(DURATION * FPS), LANG,
    SCENES: SCENES.map(sc => ({ id: sc.el.id, a: Math.round(q(sc.a) * FPS), b: Math.round(q(sc.b) * FPS) })),
    CUES: CUES.map(c => Object.assign({ t: +q(c.q).toFixed(4) }, c)),
  };
  window.FILME_READY = true;
}
boot().catch(e => { console.error(e); window.FILME_ERROR = String(e && e.stack || e); });
})();
