#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o kit de referências do prompt da vista aérea do Masterplan V14 (rev. 02/11/2026).

    python3 docs/prompt-aerea-v14/build_refs_v14.py      # da raiz do repositório

Escreve em docs/prompt-aerea-v14/:
  ref-A-camera-volumes-v14.png  a câmera da aérea aprovada (gerada-v1, 16/10) com os volumes do V14
  ref-A90-zenital-volumes-v14*.png  a mesma maquete vista de cima (variação 90°), na orientação da prancha:
                                1536 x 1024, 4K 3:2 (3840 x 2560) e 4K 16:9 (3840 x 2160), os 4K a 300 dpi
  ref-B-planta-v14.png          a planta V14 vista de cima, sem nenhum texto
  ref-C-aerea-aprovada.jpg      a aérea aprovada (V12): referência de estilo, cor, luz e entorno
  ref-D-situacao.jpg            o terreno no entorno real, de cima
  ref-E-hotel-convencoes.jpg … ref-H-servicos.jpg   renders do cliente, com o vermelho neutralizado

DE ONDE VEM CADA COISA
  - A leitura do PDF sem texto, a maquete de volumes, o render por marcha de raios e as colagens são os
    do kit do V12 (docs/prompt-aerea-v12/build_refs.py).
  - Onde fica cada prédio no V14 é a Maquete14 da maquete 3D (docs/3dmasterplan/build_data.py) — a mesma
    leitura que gera o 3dmasterplan/. Aqui ela só ganha a 2ª fase do Outlet construída: a aérea mostra o
    masterplan completo, como mostra todos os lotes industriais já ocupados.
  - O entorno é o 3dmasterplan/data/entorno.webp, já desenhado do OpenStreetMap (© colaboradores do OSM,
    ODbL) no mesmo referencial e na mesma escala (CTX_BOX a 2,5 m/px). Assim o script não depende da
    Overpass API, que pode estar fora do ar ou bloqueada na rede.

A CÂMERA
  Não é a câmera da guia A do V12. É a câmera ajustada ao enquadramento da aérea que o Astra-6 gerou e o
  cliente aprovou (gerada-v1-obliqua.webp): cinco pontos da imagem (as duas cabeceiras da pista, os dois
  cantos do parque e a ponta norte) casados com a planta por mínimos quadrados, erro médio de 15 px em
  1536 px. Dá uma câmera mais alta e mais longe, com lente mais fechada (~47 mm equivalente) — o
  parque enche a largura do quadro, como na imagem aprovada.

DEPENDÊNCIAS
  pip install numpy pillow scipy pikepdf opencv-python-headless      e o poppler-utils (pdftoppm)
  A primeira execução renderiza a prancha (~3 min) e guarda em cache ($TMPDIR/bp-aerea-v12).
"""

import os, shutil, sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'docs', 'prompt-aerea-v12'))
sys.path.insert(0, os.path.join(ROOT, 'docs', '3dmasterplan'))
import build_refs as br                                            # noqa: E402
import build_data as bd                                            # noqa: E402

APROVADA = os.path.join(ROOT, 'docs', 'prompt-aerea-v12', 'gerada-v1-obliqua.webp')
ENTORNO = os.path.join(ROOT, '3dmasterplan', 'data', 'entorno.webp')
PARQUE = os.path.join(ROOT, '3dmasterplan', 'data', 'parque.webp')      # a prancha inteira, entorno em 0,63 m/px
# câmera da aérea aprovada (ajuste por mínimos quadrados; ver a docstring)
CAMERA = dict(Xc=908, Yc=2877, Zc=2345, yaw=6.1, pitch=41.4, hfov=41.4, w=1536, h=1024, ss=2)
COLAGENS = {   # arquivo: (fotos, colunas, linhas, altura do quadro)
    'ref-E-hotel-convencoes.jpg': (['assets/web/fotos/hotel-cupula-dia.jpg', 'assets/park/resort-implantacao.jpg',
                                    'assets/web/fotos/hotel-cupula-piscina.jpg', 'assets/web/fotos/hotel-fachada-varandas.jpg'], 2, 2, 512),
    'ref-F-industrial-vias.jpg': (['assets/web/fotos/park-boulevard-aereo-2.jpg', 'assets/web/fotos/galpao-portico-azul.jpg',
                                   'assets/web/fotos/vias-rotatoria.jpg', 'assets/web/fotos/portaria.jpg'], 2, 2, 512),
    'ref-G-lazer-residencial.jpg': (['assets/web/fotos/amen-piscina-quincho.jpg', 'assets/web/fotos/amen-quadra.jpg',
                                     'assets/web/fotos/resort-casas-rua.jpg', 'assets/web/fotos/resort-lago.jpg'], 2, 2, 512),
    'ref-H-servicos.jpg': (['assets/web/fotos/aero-pista-aerea.jpg', 'assets/web/fotos/hangar-bracerum.jpg',
                            'assets/park/select-posto-cobertura.jpg', 'assets/park/select-fachada-brises.jpg',
                            'assets/park/tec-fachada.jpg', 'assets/park/ete-eta.jpg'], 2, 3, 432),
}


class MaqueteAerea(bd.Maquete14):
    """A maquete do V14 com o masterplan completo: a 2ª fase do Outlet (na maquete 3D, uma laje
    hachurada de 'liberação futura') sai construída, loja por loja, como a 1ª."""

    def montar(self):
        super().montar()
        branco = self.componentes((self.rgb.min(-1) >= 245) & self.dentro, 40, 12000)
        cel = [c for c in branco if 48.5 <= c['cx'] <= 69.5 and 11 <= c['cy'] <= 43.3 and 60 <= c['area'] <= 2000
               and c['fill'] >= 0.6 and max(c['bw'], c['bh']) <= 120 and min(c['bw'], c['bh']) >= 7.5]
        f2 = [c for c in cel if c['cy'] < 16.2 and c['bh'] > 20 and c['cx'] <= 58.6] + \
             [c for c in cel if c['cy'] >= 16.2 and c['cx'] >= 65.5 and c['cy'] > 28.5]
        nucleo = lambda c: 19 <= c['bw'] <= 22 and c['bh'] > 35
        self.extrudar([c for c in f2 if nucleo(c)], 11, 'outlet')
        self.extrudar([c for c in f2 if not nucleo(c)], 9, 'outlet')
        return self


def chao(guia):
    """O entorno pronto da maquete 3D com a planta da guia por cima (o mesmo referencial do V12)."""
    base = Image.open(ENTORNO).convert('RGBA')
    x0, y0, x1, y1 = br.CTX_BOX
    alvo = (round((x1 - x0) / br.MPP), round((y1 - y0) / br.MPP))
    if base.size != alvo:
        base = base.resize(alvo, Image.LANCZOS)
    p = Image.fromarray(guia, 'RGBA')
    s = 1 / (br.K * br.MPP)
    base.alpha_composite(p.resize((int(p.size[0] * s), int(p.size[1] * s)), Image.LANCZOS),
                         (int(-x0 / br.MPP), int(-y0 / br.MPP)))
    return base.convert('RGB')


def entorno_pronto(data, geo, plano_guia, box=br.CTX_BOX, mpp=br.MPP, larguras=None):
    """Faz o papel de br.entorno() na vista de cima sem baixar o OpenStreetMap: o entorno pronto da maquete
    3D (entorno.webp, 2,5 m/px; parque.webp, a prancha inteira a 0,63 m/px) recortado em `box`, com a
    planta da guia por cima. `data`, `geo` e `larguras` ficam só pela assinatura."""
    x0, y0, x1, y1 = box
    W, H = int((x1 - x0) / mpp), int((y1 - y0) / mpp)
    ex0, ey0 = br.CTX_BOX[:2]
    ent = Image.open(ENTORNO).convert('RGB')
    m = (br.CTX_BOX[2] - br.CTX_BOX[0]) / ent.width
    img = ent.resize((W, H), Image.BICUBIC, box=((x0 - ex0) / m, (y0 - ey0) / m, (x1 - ex0) / m, (y1 - ey0) / m))
    img = img.convert('RGBA')
    sw, sh = plano_guia.shape[1] / br.K, plano_guia.shape[0] / br.K           # prancha em metros
    pq = Image.open(PARQUE).convert('RGBA').resize((round(sw / mpp), round(sh / mpp)), Image.LANCZOS)
    img.alpha_composite(pq, (round(-x0 / mpp), round(-y0 / mpp)))
    p = Image.fromarray(plano_guia, 'RGBA')
    s = 1 / (br.K * mpp)
    img.alpha_composite(p.resize((round(p.size[0] * s), round(p.size[1] * s)), Image.LANCZOS),
                        (round(-x0 / mpp), round(-y0 / mpp)))
    return img.convert('RGB')


def main():
    os.makedirs(br.CACHE, exist_ok=True)
    print('planta V14…')
    plano, sheet = bd.planta_v14()
    guia = br.recolorir(plano)
    H, W = guia.shape[:2]
    fundo = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    fundo.alpha_composite(Image.fromarray(guia, 'RGBA'))
    b = fundo.convert('RGB').crop((int(0.008 * W), int(0.05 * H), int(0.995 * W), int(0.98 * H)))
    b.resize((3600, int(3600 * b.height / b.width)), Image.LANCZOS).save(os.path.join(HERE, 'ref-B-planta-v14.png'), optimize=True)

    print('entorno…')
    c = chao(guia)
    x0, y0 = br.CTX_BOX[0], br.CTX_BOX[1]
    s = c.crop((int((-2200 - x0) / br.MPP), int((-5000 - y0) / br.MPP), int((6200 - x0) / br.MPP), int((2400 - y0) / br.MPP)))
    s.resize((2000, int(2000 * s.height / s.width)), Image.LANCZOS).save(os.path.join(HERE, 'ref-D-situacao.jpg'), quality=88, optimize=True)

    print('volumes…')
    maq = MaqueteAerea(plano, sheet, res=1.0).montar()
    for k, n in sorted(maq.conta.items()):
        print(f'  {k:32s} {n}')
    print('render da câmera…')
    br.render(maq, c, **CAMERA).save(os.path.join(HERE, 'ref-A-camera-volumes-v14.png'), optimize=True)
    print('vista de cima (grade de 0,5 m, sombras)…')
    br.entorno = entorno_pronto                    # render_zenital desenha o entorno por br.entorno()
    maq90 = MaqueteAerea(plano, sheet, res=br.RES90).montar()
    for nome, cam, dpi in (('ref-A90-zenital-volumes-v14.png', br.CAMERA90, None),
                           ('ref-A90-zenital-volumes-v14-4k.png', br.CAMERA90_4K, br.DPI_4K),
                           ('ref-A90-zenital-volumes-v14-4k-16x9.png', br.CAMERA90_4K_169, br.DPI_4K)):
        print('  ' + nome)
        im = br.render_zenital(maq90, None, None, guia, sheet, **cam)
        im.save(os.path.join(HERE, nome), optimize=True, **({'dpi': (dpi, dpi)} if dpi else {}))

    print('referências de estilo e fotos do cliente…')
    Image.open(APROVADA).convert('RGB').save(os.path.join(HERE, 'ref-C-aerea-aprovada.jpg'), quality=92)
    for nome, (fotos, cols, linhas, th) in COLAGENS.items():
        br.colagem(fotos, cols, linhas, th).save(os.path.join(HERE, nome), quality=88, optimize=True)
    print('pronto.')


if __name__ == '__main__':
    main()
