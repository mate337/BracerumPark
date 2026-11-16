// Imprime apresentacao.html em PDF (1080 × 1350 por página) e, com --previas, grava um PNG por página.
// Uso: node docs/apresentacao/imprimir.js [saida.pdf] [--previas <pasta>]  (padrão: Bracerum-Park-Apresentacao.pdf ao lado deste arquivo)
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const args = process.argv.slice(2);
  const saida = args[0] && !args[0].startsWith('--') ? path.resolve(args[0]) : path.join(__dirname, 'Bracerum-Park-Apresentacao.pdf');
  const iPrev = args.indexOf('--previas');
  const previas = iPrev >= 0 ? path.resolve(args[iPrev + 1]) : null;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'apresentacao.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const faltando = await page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src));
  if (faltando.length) { console.error('imagens que não carregaram:', faltando); process.exit(1); }
  await page.pdf({ path: saida, width: '1080px', height: '1350px', printBackground: true, preferCSSPageSize: true });
  console.log('pdf:', saida);
  if (previas) {
    require('fs').mkdirSync(previas, { recursive: true });
    const secoes = await page.$$('section.page');
    for (let i = 0; i < secoes.length; i++) {
      await secoes[i].screenshot({ path: path.join(previas, `p${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log('prévias:', secoes.length);
  }
  await browser.close();
})();
