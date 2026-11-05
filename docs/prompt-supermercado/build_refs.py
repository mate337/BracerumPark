#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o kit de referências do prompt do Supermercado (Bracerum Market).

    python3 docs/prompt-supermercado/build_refs.py      # da raiz do repositório

Escreve em docs/prompt-supermercado/:
  ref-A-luz-acabamento.jpg   portaria aprovada: luz, câmera, cor e nível de acabamento
  ref-B-arquitetura.jpg      edifício comercial do Select: concreto, ripado de madeira, vidro, beiral escuro
  ref-C-via-paisagismo.jpg   boulevard do parque: asfalto, meio-fio, palmeiras, árvores, escala
  ref-D-implantacao.png      planta-guia do conjunto vista de cima, sem nenhum texto

As três fotos são renders finalizados do cliente (pasta "Imagens BracerumPark Finalizadas"),
com o vermelho neutralizado (regra da marca) e o letreiro da ref B apagado — gerador de imagem
copia texto de referência para a imagem final.

DEPENDÊNCIAS: pip install numpy pillow scipy
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))


def sem_vermelho(im):
    """Dessatura vermelho puro (cancela, lanterna, flor) — mesma regra do kit da vista aérea."""
    a = np.array(im.convert('RGB')).astype(np.float32) / 255
    mx, mn = a.max(-1), a.min(-1)
    dlt = mx - mn + 1e-6
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hue = np.where(mx == r, ((g - b) / dlt) % 6, np.where(mx == g, (b - r) / dlt + 2, (r - g) / dlt + 4)) * 60
    m = ((hue <= 14) | (hue >= 340)) & (dlt / (mx + 1e-6) >= 0.45) & (mx >= 0.30)
    m = ndi.binary_dilation(m, iterations=1)
    lum = (0.30 * r + 0.59 * g + 0.11 * b)[..., None]
    a = np.where(m[..., None], lum, a)
    return Image.fromarray((a * 255).astype(np.uint8))


def apagar(im, caixa, raio=14):
    """Borra um retângulo (x0, y0, x1, y1) em fração da imagem — some com o letreiro."""
    w, h = im.size
    x0, y0, x1, y1 = (int(caixa[0] * w), int(caixa[1] * h), int(caixa[2] * w), int(caixa[3] * h))
    trecho = im.crop((x0, y0, x1, y1))
    # média da caixa + desfoque forte: vira uma placa lisa, sem resto de letra
    cor = tuple(int(c) for c in np.array(trecho).reshape(-1, 3).mean(0))
    liso = Image.new('RGB', trecho.size, cor).filter(ImageFilter.GaussianBlur(raio))
    im.paste(Image.blend(trecho.filter(ImageFilter.GaussianBlur(raio)), liso, 0.6), (x0, y0))
    return im


def fotos():
    a = sem_vermelho(Image.open(os.path.join(ROOT, 'assets/web/fotos/portaria.jpg')))
    a.save(os.path.join(HERE, 'ref-A-luz-acabamento.jpg'), quality=92)

    b = sem_vermelho(Image.open(os.path.join(ROOT, 'assets/park/select-comercial-dia.jpg')))
    b = apagar(b, (0.415, 0.610, 0.528, 0.672))          # totem "GLOBAL INNOVATIONS – ADMIN HQ"
    b.save(os.path.join(HERE, 'ref-B-arquitetura.jpg'), quality=92)

    c = sem_vermelho(Image.open(os.path.join(ROOT, 'assets/web/fotos/vias-boulevard.jpg')))
    c.save(os.path.join(HERE, 'ref-C-via-paisagismo.jpg'), quality=92)


# --------------------------------------------------------------------------- planta-guia
# Metros, origem no canto superior esquerdo do terreno. Lido como na prancha do V14: a faixa
# comercial desce de cima (Via Costeira) e o Supermercado fecha a ponta de baixo, de frente
# para o boulevard. O quadro do V14 dá 4.606 m² para supermercado + lojas.
W_M, H_M, PX = 150, 110, 12            # terreno de 150 x 110 m, 12 px por metro

COR = {
    'fundo':   (236, 232, 222),        # grama seca/terreno
    'asfalto': (78, 78, 80),
    'calcada': (214, 208, 196),
    'mercado': (250, 250, 248),
    'loja':    (222, 214, 198),
    'marquise': (60, 58, 54),
    'docas':   (170, 170, 168),
    'arvore':  (110, 132, 92),
    'grama':   (176, 190, 150),
    'vaga':    (200, 200, 200),
}


def ret(d, x0, y0, x1, y1, cor, borda=None):
    d.rectangle([x0 * PX, y0 * PX, x1 * PX, y1 * PX], fill=cor, outline=borda, width=2 if borda else 0)


def arvore(d, x, y, r=2.6):
    d.ellipse([(x - r) * PX, (y - r) * PX, (x + r) * PX, (y + r) * PX], fill=COR['arvore'])


def implantacao():
    im = Image.new('RGB', (W_M * PX, H_M * PX), COR['fundo'])
    d = ImageDraw.Draw(im)

    # boulevard na frente (embaixo), com canteiro central arborizado
    ret(d, 0, 96, W_M, 110, COR['asfalto'])
    ret(d, 0, 102.2, W_M, 103.8, COR['grama'])
    for x in range(6, W_M, 12):
        arvore(d, x, 103, 1.8)
    # via lateral de serviço (esquerda), que leva às docas
    ret(d, 0, 0, 9, 96, COR['asfalto'])

    # calçada larga sob a marquise, de ponta a ponta
    ret(d, 14, 40, 140, 46, COR['calcada'])

    # supermercado: caixa de ~78 x 36 m
    ret(d, 14, 4, 92, 40, COR['mercado'], (120, 120, 118))
    # três lojas em fila, à direita: farmácia (esquina) + 2 lojas — 16 m de frente cada
    for i, x in enumerate((92, 108, 124)):
        ret(d, x, 18, x + 16, 40, COR['loja'], (120, 120, 118))
    # marquise contínua (faixa escura fina sobre a calçada)
    ret(d, 14, 40, 140, 42.2, COR['marquise'])
    # docas nos fundos, escondidas atrás de um muro verde
    ret(d, 9, 0, 92, 4, COR['docas'])
    for x in (20, 34, 48):
        ret(d, x, 0.6, x + 9, 3.4, (120, 120, 118))
    ret(d, 92, 14, 140, 15.5, COR['grama'])
    for x in range(96, 140, 7):
        arvore(d, x, 9, 2.4)

    # estacionamento em frente: 3 pentes de vagas com fileiras de árvores entre eles
    for y0 in (48, 66, 84):
        ret(d, 14, y0, 140, y0 + 10, COR['asfalto'])
        for x in range(15, 140, 3):
            d.line([x * PX, y0 * PX, x * PX, (y0 + 4.6) * PX], fill=COR['vaga'], width=2)
            d.line([x * PX, (y0 + 5.4) * PX, x * PX, (y0 + 10) * PX], fill=COR['vaga'], width=2)
        if y0 < 84:
            ret(d, 14, y0 + 10, 140, y0 + 18, COR['grama'])
            for x in range(19, 140, 10):
                arvore(d, x, y0 + 14)
    # corredores de circulação entre os pentes
    ret(d, 140, 46, 146, 96, COR['asfalto'])
    ret(d, 9, 46, 14, 96, COR['asfalto'])

    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(os.path.join(HERE, 'ref-D-implantacao.png'), optimize=True)


if __name__ == '__main__':
    fotos()
    implantacao()
    print('pronto.')
