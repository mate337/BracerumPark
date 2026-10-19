/* Gera o Livro de Produtos em PDF a partir de livro.html.

   Uso (da raiz do repositório):
     node docs/livro-produtos/build.js            -> Bracerum_Park_Livro_Produtos_PT.pdf
     node docs/livro-produtos/build.js --png      -> e também png/pNN.png, para revisar página a página

   Precisa do Playwright (Chromium). As fontes não ficam no repositório, como em
   docs/build_logos.py: na primeira execução o script baixa para fonts/
     - Noto Serif Display variável (OFL), usada em wdth 62.5 — a mesma das peças de mídia;
     - TeX Gyre Heros (licença GUST), o clone livre da Helvetica, para o corpo de texto.

   As imagens de img/ são as renders da pasta do Drive "Imagens BracerumPark Finalizadas"
   (PNG 1672 px convertidos em JPG 84%); img/ORIGEM.json liga cada arquivo ao nome original.
   As que não têm equivalente na pasta (Select, fábrica, ETE, corte viário, implantação do
   Resort e a planta do masterplan) vêm de ../../assets/. A assinatura da capa e da
   contracapa (assets/sig-dark.svg) foi extraída do PDF "Variações Assinaturas Bracerum Park". */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const OUT = path.join(HERE, 'Bracerum_Park_Livro_Produtos_PT.pdf');
const FONTS = {
  'noto-serif-display.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifdisplay/NotoSerifDisplay%5Bwdth%2Cwght%5D.ttf',
  'noto-serif-display-italic.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifdisplay/NotoSerifDisplay-Italic%5Bwdth%2Cwght%5D.ttf',
  'texgyreheros-regular.otf': 'https://mirrors.mit.edu/CTAN/fonts/tex-gyre/opentype/texgyreheros-regular.otf',
  'texgyreheros-bold.otf': 'https://mirrors.mit.edu/CTAN/fonts/tex-gyre/opentype/texgyreheros-bold.otf',
  'texgyreheros-italic.otf': 'https://mirrors.mit.edu/CTAN/fonts/tex-gyre/opentype/texgyreheros-italic.otf',
};

function fetchFonts() {
  const dir = path.join(HERE, 'fonts');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, url] of Object.entries(FONTS)) {
    const dest = path.join(dir, name);
    if (fs.existsSync(dest)) continue;
    console.log('baixando', name);
    execFileSync('curl', ['-sSfL', '-o', dest, url]);
  }
}

(async () => {
  fetchFonts();
  const png = process.argv.includes('--png');
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => console.log('erro na página:', e.message));
  await page.goto('file://' + path.join(HERE, 'livro.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const broken = await page.evaluate(() =>
    [...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')));
  if (broken.length) { console.error('imagens quebradas:', broken); process.exit(1); }

  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
  console.log('PDF:', path.relative(process.cwd(), OUT));

  if (png) {
    const dir = path.join(HERE, 'png');
    fs.mkdirSync(dir, { recursive: true });
    await page.addStyleTag({ content: '@media screen{body{padding:0!important}.pg{margin:0!important;box-shadow:none!important}}' });
    const pages = await page.$$('.pg');
    for (let i = 0; i < pages.length; i++)
      await pages[i].screenshot({ path: path.join(dir, `p${String(i + 1).padStart(2, '0')}.png`) });
    console.log(pages.length, 'páginas em', path.relative(process.cwd(), dir));
  }
  await browser.close();
})();
