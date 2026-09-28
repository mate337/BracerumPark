#!/usr/bin/env node
/* Render do filme — captura quadro a quadro no Chromium e codifica com ffmpeg.
 *
 *   node docs/motion/render.js stills  --frames=0,22,59-90:10 [--tag=nome]   quadros avulsos em out/stills/<tag>/
 *   node docs/motion/render.js preview [--lang=es]                1 captura por quadro, CRF 23
 *   node docs/motion/render.js final   [--lang=es]                4 subquadros (obturador 180°), CRF 18
 *   node docs/motion/render.js cues | pins | safe                  eventos de som (cues.csv) e QA
 *
 * Opções: --lang=pt|es|en  --from=N --to=N (quadros)  --out=arquivo.mp4  --port=8765
 * ffmpeg: BP_FFMPEG, ou o binário do pacote pip imageio-ffmpeg.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { once } = require('events');

const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const MODE = process.argv[2] || 'preview';
const args = Object.fromEntries(process.argv.slice(3).map(a => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
}));
const LANG = args.lang || 'pt';
const PORT = +(args.port || 8765);
const pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FFMPEG = process.env.BP_FFMPEG ||
  execSync('python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())"').toString().trim();

function serve() {
  return new Promise((resolve, reject) => {
    const p = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: REPO, stdio: 'ignore' });
    const t0 = Date.now();
    const ping = () => http.get(`http://127.0.0.1:${PORT}/docs/motion/filme.html`, r => { r.resume(); resolve(p); })
      .on('error', () => (Date.now() - t0 > 10000 ? reject(new Error('o servidor HTTP não subiu')) : setTimeout(ping, 150)));
    ping();
  });
}

function frameList(spec, total) {
  const out = [];
  for (const part of String(spec).split(',')) {
    const m = part.match(/^(\d+)(?:-(\d+)(?::(\d+))?)?$/);
    if (!m) continue;
    const a = +m[1], b = m[2] ? +m[2] : a, st = m[3] ? +m[3] : 1;
    for (let f = a; f <= b; f += st) if (f < total) out.push(f);
  }
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const browser = await pw.chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('[página]', m.text()); });
    page.on('pageerror', e => console.error('[página] erro:', e.message));
    await page.goto(`http://127.0.0.1:${PORT}/docs/motion/filme.html?lang=${LANG}`);
    await page.waitForFunction(() => window.FILME_READY || window.FILME_ERROR, null, { timeout: 120000 });
    const err = await page.evaluate(() => window.FILME_ERROR);
    if (err) throw new Error(err);
    const info = await page.evaluate(() => window.FILME);
    // duração e cenas para o check.py e o audio.py
    fs.writeFileSync(path.join(OUT, LANG === 'pt' ? 'filme.json' : `filme-${LANG}.json`), JSON.stringify(
      { FPS: info.FPS, BPM: info.BPM, DURATION: info.DURATION, FRAMES: info.FRAMES, SCENES: info.SCENES }, null, 1));
    const BASE = `bracerum-motion-${Math.round(info.DURATION)}s`;
    const cdp = await page.context().newCDPSession(page);
    const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot',
      { format: 'jpeg', quality: 95, optimizeForSpeed: true })).data, 'base64');
    const seek = t => page.evaluate(x => window.seek(x), t);

    if (MODE === 'cues') {
      // eventos de som e de corte → out/cues.csv (quadro, TC, cena, tipo, parâmetros)
      const rows = ['quadro,tc,segundos,cena,tipo,parametros'];
      for (const c of info.CUES) {
        const f = c.t * info.FPS, s = Math.floor(c.t), fr = (f - s * info.FPS).toFixed(1).padStart(4, '0');
        const extra = Object.entries(c).filter(([k]) => !['q', 't', 'type', 'scene'].includes(k)).map(([k, v]) => `${k}=${v}`).join(' ');
        rows.push([f.toFixed(2), `00:00:${String(s).padStart(2, '0')}:${fr}`, c.t, c.scene, c.type, extra].join(','));
      }
      const name = args.out || `cues${LANG === 'pt' ? '' : '-' + LANG}.csv`;
      fs.writeFileSync(path.join(OUT, name), rows.join('\n') + '\n');
      console.log(`${info.CUES.length} eventos →`, path.join(OUT, name));
      return;
    }

    if (MODE === 'pins') {
      // QA: o centro de cada losango, em % da planta, tem que bater com o site
      const measure = ([imgSel, dotSel]) => {
        const r = document.querySelector(imgSel).getBoundingClientRect();
        return [...document.querySelectorAll(dotSel)].map(d => {
          const b = d.getBoundingClientRect();
          return [((b.left + b.width / 2) - r.left) / r.width * 100, ((b.top + b.height / 2) - r.top) / r.height * 100];
        });
      };
      await seek(500 / info.FPS);
      const film = await page.evaluate(measure, ['.map-plan img', '#s4 .pin__dot']);
      const site = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      await site.goto(`http://127.0.0.1:${PORT}/index.html`);
      await site.waitForFunction(() => document.querySelectorAll('#mpPins .pin').length === 10, null, { timeout: 30000 });
      await site.evaluate(() => document.getElementById('masterplan').scrollIntoView());
      await site.waitForTimeout(800);
      const ref = await site.evaluate(measure, ['#mpStage img', '#mpPins .pin__dot']);
      let worst = 0;
      film.forEach((p, i) => {
        const e = Math.hypot(p[0] - ref[i][0], p[1] - ref[i][1]);
        worst = Math.max(worst, e);
        console.log(`pino ${i}: filme ${p[0].toFixed(2)}/${p[1].toFixed(2)} · site ${ref[i][0].toFixed(2)}/${ref[i][1].toFixed(2)} · Δ ${e.toFixed(3)}%`);
      });
      console.log(`maior desvio: ${worst.toFixed(3)}% da planta → ${worst < 0.5 ? 'OK' : 'REPROVA'}`);
      if (worst >= 0.5) process.exitCode = 2;
      return;
    }

    if (MODE === 'safe') {
      // QA: texto pequeno e logos dentro da área segura (96 px nas laterais, 54 px em cima/embaixo)
      const CHECK = [[100, '#s1 .comp__meta, #s1 .comp__idx, #s1 .comp__brand'], [296, '.ask-field, .ask-eyebrow'],
        [500, '#s4 .eyebrow, #s4 .map-title, #s4 .pin__tag'], [700, '#s7a .cnt'], [745, '#s7b .cnt'], [790, '#s7c .cnt'],
        [820, '#s8a .word-w, #s8a .word-k'], [850, '#s8b .word-w, #s8b .word-k'], [880, '#s8c .word-w, #s8c .word-k'],
        [935, '#s9a .shot-cap'], [995, '#s9b .shot-cap'], [1055, '#s9c .shot-logo'], [1115, '#s9d .shot-logo'],
        [1175, '#s9e .shot-logo'], [1210, '.phr-a'], [1370, '.fim-tx'], [1439, '.fim-svg']];
      let bad = 0;
      for (const [f, sel] of CHECK) {
        await seek(f / info.FPS);
        const rs = await page.evaluate(s => [...document.querySelectorAll(s)].map(e => {
          const r = e.getBoundingClientRect();
          return [e.className.baseVal ?? e.className, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
        }), sel);
        for (const [c, l, t, r, b] of rs) {
          const ok = l >= 96 && r <= 1824 && t >= 54 && b <= 1026;
          if (!ok) bad++;
          console.log(`${ok ? 'ok ' : 'FORA'} q${f} ${c}: x ${l}–${r} · y ${t}–${b}`);
        }
      }
      console.log(bad ? `${bad} elemento(s) fora da área segura` : 'área segura OK');
      if (bad) process.exitCode = 2;
      return;
    }

    if (MODE === 'stills') {
      const dir = path.join(OUT, 'stills', String(args.tag || 'avulsos'));
      fs.mkdirSync(dir, { recursive: true });
      for (const f of frameList(args.frames || '0', info.FRAMES)) {
        await seek(f / info.FPS);
        fs.writeFileSync(path.join(dir, `${LANG}_f${String(f).padStart(3, '0')}.jpg`), await shot());
      }
      console.log('stills em', dir);
      return;
    }

    const SUB = MODE === 'final' ? 4 : 1;
    const from = +(args.from || 0), to = +(args.to || info.FRAMES);
    const sfx = LANG === 'pt' ? '' : '-' + LANG;
    const name = args.out || (MODE === 'final' ? `${BASE}${sfx}_mudo.mp4` : `preview${sfx}.mp4`);
    // 180°: os 4 subquadros cobrem meio intervalo de quadro; tmix tira a média e select fica com 1 a cada 4
    const vf = SUB > 1
      ? ['-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${info.FPS}*TB)`]
      : [];
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.FPS * SUB),
      '-c:v', 'mjpeg', '-i', '-', ...vf, '-r', String(info.FPS),
      '-c:v', 'libx264', '-preset', MODE === 'final' ? 'slow' : 'medium', '-crf', MODE === 'final' ? '18' : '23',
      '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-movflags', '+faststart', path.join(OUT, name)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = once(ff, 'close');
    const t0 = Date.now();
    for (let f = from; f < to; f++) {
      for (let k = 0; k < SUB; k++) {
        await seek(f / info.FPS + k / (info.FPS * SUB * 2));
        if (!ff.stdin.write(await shot())) await once(ff.stdin, 'drain');
      }
      if ((f + 1) % 60 === 0 || f === to - 1) {
        const el = (Date.now() - t0) / 1000;
        console.log(`quadro ${f + 1}/${to} · ${el.toFixed(0)} s · ${((f + 1 - from) / el).toFixed(1)} q/s`);
      }
    }
    ff.stdin.end();
    const [code] = await done;
    if (code !== 0) throw new Error('ffmpeg saiu com código ' + code);
    console.log('ok →', path.join(OUT, name));
  } finally {
    await browser.close();
    srv.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
