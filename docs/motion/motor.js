/* Motor dos filmes de motion do Bracerum Park (HTML + GSAP).
 *
 * Uma timeline mestre pausada (TL) mais ganchos (HOOKS) para o que é procedural.
 * Tudo é função do tempo t: nada de relógio, Math.random(), setTimeout ou animação
 * CSS. O render.js chama window.seek(t) quadro a quadro e captura o que foi pintado.
 *
 * Tempo: as cenas são escritas em "quadros de referência" (q) de uma grade de
 * 120 BPM — 1 batida = 15 q, 1 q = 1/30 s. Mudar BPM reescala o filme inteiro.
 *
 * Cada filme mora em filmes/<id>.js e chama MOTOR.film({ id, total, build, ... }).
 * Qual filme carregar vem de ?filme=<id> (padrão: motion-48s).
 */
(() => {
'use strict';

const FPS = 30;
const BPM = 120;
const BEAT = 60 / BPM;
const q = n => n * BEAT / 15;            // n quadros de referência → segundos

const PARAMS = new URLSearchParams(location.search);
const LANG = ['pt', 'es', 'en'].includes(PARAMS.get('lang')) ? PARAMS.get('lang') : 'pt';
const T = v => (v == null ? '' : typeof v === 'string' ? v : v[LANG]);
const FILM_ID = (PARAMS.get('filme') || 'motion-48s').replace(/[^a-z0-9-]/g, '');
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

let DURATION = 0;
window.seek = async t => {
  t = clamp(t, 0, DURATION - 1e-6);
  for (const sc of SCENES) sc.el.style.visibility = vis(t, sc.a, sc.b) ? 'visible' : 'hidden';
  TL.seek(t, false);
  for (const fn of HOOKS) fn(t);
  for (const fn of LATE) fn(t);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
};

async function boot(film) {
  if (film.css) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = `filmes/${film.id}.css`;
    await new Promise((res, rej) => { link.onload = res; link.onerror = () => rej(new Error('css do filme não carregou')); document.head.appendChild(link); });
  }
  const fonts = ['500 100px NSF', 'italic 500 100px NSF', '700 100px "Liberation Sans"', '400 100px "Liberation Sans"'];
  await Promise.all(fonts.map(f => document.fonts.load(f)));
  if (!document.fonts.check('500 100px NSF') || !document.fonts.check('italic 500 100px NSF')) {
    throw new Error('Noto Serif (NSF) não carregou — confira docs/motion/fonts/');
  }
  const areas = await loadAreas();
  DURATION = q(film.total);
  await film.build(areas);
  GRAIN();
  await Promise.all([...document.images].map(i => i.decode().catch(() => { throw new Error('imagem não carregou: ' + i.src); })));
  // cortes de cena (para a edição) e o pulso da grade de 120 BPM
  SCENES.forEach(sc => cue(sc.a, 'corte', sc.el.id));
  for (let b = 0; b < (film.pulseUntil || 0) / 15; b++) cue(b * 15, 'pulso', '', { tempo: b % 4 === 0 ? 1 : 0 });
  CUES.sort((a, b) => a.q - b.q);
  TL.seek(0);
  const tq = parseFloat(PARAMS.get('t'));
  await window.seek(isFinite(tq) ? tq : 0);
  window.FILME = {
    ID: film.id, FPS, BPM, DURATION, FRAMES: Math.round(DURATION * FPS), LANG,
    SCENES: SCENES.map(sc => ({ id: sc.el.id, a: Math.round(q(sc.a) * FPS), b: Math.round(q(sc.b) * FPS) })),
    CUES: CUES.map(c => Object.assign({ t: +q(c.q).toFixed(4) }, c)),
    SAFE: film.safe || [], PINS: film.pins || null,
  };
  window.FILME_READY = true;
}

window.MOTOR = {
  FPS, BPM, q, LANG, T, IMG, h, sv, css, clamp, lerp, EZ, mulberry32, win, fq, vis,
  TL, hook, lateHook, scene, init, tw, at, cue, dirBlur,
  film: def => boot(def).catch(e => { console.error(e); window.FILME_ERROR = String(e && e.stack || e); }),
};

// carrega o filme pedido em ?filme=
const s = document.createElement('script');
s.src = `filmes/${FILM_ID}.js`;
s.onerror = () => { window.FILME_ERROR = 'filme não encontrado: ' + FILM_ID; };
document.body.appendChild(s);
})();
