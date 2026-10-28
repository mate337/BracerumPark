const { chromium } = require('playwright');
(async () => {
  const [,, inp, out, w, h, pdf] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await p.goto('file://' + inp, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out });
  if (pdf) await p.pdf({ path: pdf, width: w + 'px', height: h + 'px', printBackground: true, pageRanges: '1' });
  await b.close();
})();
