#!/usr/bin/env python3
"""Tira dos folders impressos V3 as fotos e plantas usadas na apresentação e grava as
versões leves em docs/apresentacao/img/.

Uso: python3 docs/apresentacao/preparar_imagens.py <pasta com park.pdf, aptos.pdf, casas.pdf e bc.pdf>
(os PDFs do Drive "Folder Final - Impressão", 23–50 MB cada, não ficam no repositório;
pip install pymupdf pillow). Os nomes "<folder>-p<página>-x<xref>" são os objetos de
imagem dentro de cada PDF — se o cliente reexportar um folder, os xref mudam: rode
listar() e refaça o mapa JOBS. O masterplan e o mapa são recortes renderizados da página
(têm rótulos vetoriais por cima).
"""
import os, sys
import pymupdf
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
CREAM = (252, 243, 230); BROWN = (65, 54, 46)
JOBS = {
  'capa':        ('park-p2-x171.jpg', 1400, None, None),
  'hangar':      ('park-p1-x208.jpg', 1400, None, None),
  'convencoes':  ('park-p2-x176.jpg', 1400, None, None),
  'bc-boulevard':('bc-p1-x206.jpg', 1400, None, None),
  'outlet':      ('bc-p2-x5.jpg', 1000, None, None),
  'tech':        ('bc-p2-x21.jpg', 1300, None, None),
  'market':      ('bc-p1-x41.jpg', 1300, None, None),
  'res-torre':   ('aptos-p1-x53.jpg', 700, None, None),
  'res-praia':   ('aptos-p1-x52.jpg', 1100, None, None),
  'casa':        ('casas-p2-x169.jpg', 1400, None, None),
  'piscina':     ('casas-p1-x202.jpg', 1400, None, None),
  'surf':        ('casas-p1-x199.jpg', 800, None, None),
  'quadra':      ('casas-p2-x167.jpg', 800, None, None),
  'plan-1q':     ('aptos-p2-x4.png', 900, CREAM, None),
  'plan-2q':     ('aptos-p2-x17.png', 900, CREAM, None),
  'plan-3q':     ('aptos-p2-x15.png', 900, CREAM, None),
  'plan-cob2':   ('aptos-p1-x49.png', 800, CREAM, None),
  'plan-casa':   ('casas-p1-x198.png', 1300, BROWN, None),
  'masterplan':  ('mp-masterplan.png', 2200, None, None),
  'mapa':        ('mp-mapa.png', 1100, None, (0, 0, 1301, 1860)),
}

RECORTES = {  # nome: (folder, página, retângulo em pt, largura em px)
    'mp-masterplan.png': ('park', 1, (900, 54.7, 1893.6, 601.9), 2600),
    'mp-mapa.png':       ('park', 2, (328.3, 31.7, 715.7, 622.1), 1300),
}

def extrair(pasta, tmp):
    for nome in ['park', 'aptos', 'casas', 'bc']:
        doc = pymupdf.open(os.path.join(pasta, nome + '.pdf'))
        for pno, page in enumerate(doc, 1):
            for info in page.get_images(full=True):
                xref, smask, w, h = info[:4]
                if w * h > 60_000_000 or w < 900: continue
                pix = pymupdf.Pixmap(doc, xref)
                if pix.colorspace and pix.colorspace.n == 4: pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                if smask: pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, smask))
                fn = os.path.join(tmp, f'{nome}-p{pno}-x{xref}.' + ('png' if smask else 'jpg'))
                if smask: pix.save(fn)
                else: Image.frombytes('RGB', (pix.width, pix.height), pix.samples).save(fn, quality=92)
    for fn, (nome, pno, r, larg) in RECORTES.items():
        page = pymupdf.open(os.path.join(pasta, nome + '.pdf'))[pno - 1]
        rect = pymupdf.Rect(*r); z = larg / rect.width
        page.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=rect, colorspace=pymupdf.csRGB).save(os.path.join(tmp, fn))

def preparar(tmp):
    out = os.path.join(AQUI, 'img'); os.makedirs(out, exist_ok=True)
    for name, (src, maxw, bg, box) in JOBS.items():
        im = Image.open(os.path.join(tmp, src))
        if box: im = im.crop(box)
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA'); base = Image.new('RGBA', im.size, (bg or (255, 255, 255)) + (255,))
            base.alpha_composite(im); im = base
        im = im.convert('RGB')
        if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        q = 84 if name in ('masterplan', 'mapa') or name.startswith('plan') else 78
        im.save(os.path.join(out, name + '.jpg'), quality=q, optimize=True)
        print(name, im.size)
    im = Image.open(os.path.join(RAIZ, 'assets/web/fotos/park-aereo-rio.jpg')).convert('RGB')
    im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, 'aereo.jpg'), quality=76, optimize=True)

if __name__ == '__main__':
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        extrair(sys.argv[1], tmp); preparar(tmp)
