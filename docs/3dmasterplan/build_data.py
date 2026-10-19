#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera os dados do Masterplan 3D (3dmasterplan/data/) a partir da planta V12.

    python3 docs/3dmasterplan/build_data.py      # da raiz do repositório

Escreve em 3dmasterplan/data/:
  scene.json     volumes (polígono + altura + tipo), casas do resort, casca do centro de convenções,
                 árvores, os 41 lotes industriais com a metragem da planta e o contorno do parque
  parque.webp    o chão do parque: a planta V12 sem texto, nas cores da maquete, com oclusão no pé
                 dos prédios e das árvores, sobre o entorno real
  entorno.webp   o entorno real (OpenStreetMap) em volta, 10 x 9,5 km, esmaecido nas bordas

Reaproveita de docs/prompt-aerea-v12/build_refs.py a leitura do PDF, a georreferência pela curva
da PY-19 e a maquete de volumes (as mesmas alturas estimadas da vista aérea — o V12 não define
altura de nada). Coordenadas em metros da prancha: X para a direita, Y para baixo, origem no canto
superior esquerdo; o norte aponta para a direita (ver `north` no scene.json).

PRECISA RODAR DE NOVO SE o cliente mandar outra versão da planta ou se mudar alguma altura/regra
de volume em build_refs.py. Dependências: as do build_refs.py + opencv-python-headless.
Entorno: © colaboradores do OpenStreetMap (ODbL).
"""

import base64, csv, json, math, os, re, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'docs', 'prompt-aerea-v12'))
import build_refs as br                                            # noqa: E402

OUT = os.path.join(ROOT, '3dmasterplan', 'data')
ROTULOS = os.path.join(ROOT, 'docs', 'masterplan-v12', 'rotulos-v12.tsv')
TEX_W = 4096                       # largura da textura do parque (0,63 m/px)
CTX_MPP = 2.5                      # m/px do entorno
RES = 1.0                          # grade de alturas (só para oclusão e para afastar árvores de prédio)

# cores da maquete: planta (origem -> destino, tolerância)
PALETA_PLANTA = [
    ((162, 216, 108), (233, 229, 218), 16),     # lote industrial -> papel
    ((252, 252, 252), (246, 244, 239), 6),      # área branca (uso coletivo)
    ((114, 114, 114), (152, 148, 141), 8),      # via / pátio
    ((126, 126, 126), (162, 158, 151), 4),
    ((0, 180, 0), (138, 164, 106), 30),         # verde
    ((48, 198, 48), (126, 154, 98), 34),        # ícones de árvore (degradê verde)
    ((72, 180, 246), (120, 162, 186), 30),      # água
    ((0, 186, 252), (120, 162, 186), 20),
    ((240, 240, 252), (232, 233, 238), 6),      # casca
    ((0, 126, 126), (108, 150, 120), 20),       # campos (verde-petróleo)
    ((0, 0, 0), (98, 94, 88), 40),              # traço
    ((144, 108, 0), (176, 158, 120), 30),
]
CORES_ENTORNO = {'fundo': (219, 217, 200), 'meadow': (212, 214, 192), 'farmland': (225, 220, 200),
                 'wood': (156, 170, 136), 'scrub': (196, 201, 175), 'wetland': (202, 208, 189),
                 'water': (150, 178, 192), 'residential': (221, 215, 205), 'farmyard': (221, 215, 205),
                 'industrial': (212, 210, 208), 'orchard': (190, 197, 163), 'via': (152, 148, 141),
                 'estrada': (205, 197, 177)}
NEVOA = (231, 227, 216)            # cor do horizonte no visualizador (app.js: COR_NEVOA)


class Maquete3D(br.Maquete):
    """A maquete do build_refs, guardando cada volume como polígono (não só no campo de alturas)."""

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.vol = []

    def poligono(self, pts, h, tag):
        super().poligono(pts, h, tag)
        self.vol.append(dict(t=tag, h=h, p=[(float(x), float(y)) for x, y in pts]))

    def extrudar(self, comps, h, tag):
        super().extrudar(comps, h, tag)
        for c in comps:
            for pts in contornos(c['lab'][c['sl']] == c['i'], c['sl'][1].start, c['sl'][0].start, 1.0):
                self.vol.append(dict(t=tag, h=h, p=pts))


def contornos(mask, ox, oy, eps_px, min_px=20):
    """Contornos externos de uma máscara da planta (px a 80 dpi) -> polígonos em metros da prancha."""
    m = np.pad(mask.astype(np.uint8), 1)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for ct in cs:
        if cv2.contourArea(ct) < min_px:
            continue
        ap = cv2.approxPolyDP(ct, eps_px, True)[:, 0, :].astype(float)
        if len(ap) < 3:
            continue
        out.append([((x - 1 + ox + 0.5) / br.K, (y - 1 + oy + 0.5) / br.K) for x, y in ap])
    return out


def recolorir_3d(rgba):
    """Planta nas cores da maquete; o que não está na paleta perde 70% da saturação."""
    rgb = rgba[..., :3].astype(np.float32)
    out = rgb.copy()
    feito = np.zeros(rgb.shape[:2], bool)
    for de, para, tol in PALETA_PLANTA:
        m = ~feito & (np.abs(rgb - np.array(de, np.float32)).max(-1) <= tol)
        out[m] = para
        feito |= m
    lum = (rgb * np.array([0.30, 0.59, 0.11], np.float32)).sum(-1, keepdims=True)
    resto = 0.3 * rgb + 0.7 * lum
    out[~feito] = resto[~feito] * 0.96 + np.array([10, 9, 6], np.float32)
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), rgba[..., 3]])


def dividir(v, comprimento, vao):
    """Quebra um retângulo comprido (outlet) em blocos com vãos — o V12 só desenha a mancha."""
    xs = [p[0] for p in v['p']]; ys = [p[1] for p in v['p']]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    horiz = (x1 - x0) >= (y1 - y0)
    L = (x1 - x0) if horiz else (y1 - y0)
    n = max(1, round((L + vao) / (comprimento + vao)))
    passo = (L + vao) / n
    out = []
    for i in range(n):
        a, b = i * passo, i * passo + passo - vao
        r = (x0 + a, y0, x0 + b, y1) if horiz else (x0, y0 + a, x1, y0 + b)
        out.append(dict(t=v['t'], h=v['h'] + (1.5 if i % 3 == 1 else 0),
                        p=[(r[0], r[1]), (r[2], r[1]), (r[2], r[3]), (r[0], r[3])]))
    return out


def lotes(plano, sheet):
    """Os 41 lotes: contorno pela cor da planta e metragem pelo rótulo que cai dentro de cada um."""
    rgb, dentro = plano[..., :3].astype(int), plano[..., 3] > 0
    H, W = dentro.shape
    m = ndi.binary_closing((np.abs(rgb - np.array([165, 221, 110])).max(-1) <= 14) & dentro, structure=np.ones((5, 5)))
    lab, n = ndi.label(m)
    areas = ndi.sum(m, lab, index=np.arange(1, n + 1)) / br.K / br.K
    rot = []
    with open(ROTULOS, encoding='utf-8') as fh:
        for r in csv.DictReader(fh, delimiter='\t'):
            t = r['rotulo'].strip()
            if re.fullmatch(r'[\d.]+m[²2]', t):
                rot.append((float(r['x_%']), float(r['y_%']), int(t[:-2].replace('.', ''))))
    col = lambda x: 'borda' if x < 14 else ('C1' if x < 21 else 'C2' if x < 30 else 'C3' if x < 38 else
                                            'C4' if x < 47 else 'C5' if x < 55.5 else 'C6')
    lin = lambda y: 'L1' if y < 20 else 'L2' if y < 30 else 'L3' if y < 40 else 'L4' if y < 50 else \
        'L5' if y < 60 else 'L6' if y < 69 else 'L7'
    out, usados = [], set()
    for i, sl in enumerate(ndi.find_objects(lab)):
        if not (4000 <= areas[i] <= 40000):
            continue
        mask = lab[sl] == i + 1
        ys, xs = np.nonzero(mask)
        cx, cy = (xs.mean() + sl[1].start) / W * 100, (ys.mean() + sl[0].start) / H * 100
        # o rótulo da planta fica no meio do lote (âncora à esquerda do texto)
        cand = [(math.hypot(rx + 1.6 - cx, (ry - cy) * 0.46), j) for j, (rx, ry, a) in enumerate(rot)
                if j not in usados and lab[min(H - 1, int(ry / 100 * H)), min(W - 1, int((rx + 1.6) / 100 * W))] == i + 1]
        if not cand:
            print(f'  lote sem rótulo em ({cx:.1f}%, {cy:.1f}%) — {areas[i]:.0f} m² medidos')
            continue
        j = min(cand)[1]
        usados.add(j)
        rx, ry, a = rot[j]
        ref = 'frente' if a == 21650 else ('borda' if col(rx) == 'borda' else f'{col(rx)}-{lin(ry)}')
        pol = contornos(mask, sl[1].start, sl[0].start, 2.0)
        pol = max(pol, key=lambda p: abs(cv2.contourArea(np.array(p, np.float32))))
        out.append(dict(id=ref, a=a, med=round(areas[i]), p=[round(v, 1) for xy in pol for v in xy]))
    out.sort(key=lambda l: (l['id'] in ('frente', 'borda'), l['id'][-2:], l['id']))
    return out


def arvores(plano, maq, sheet):
    """Árvores nas áreas verdes da planta (canteiros, faixa da rodovia, paisagismo) e uma em cada
    palmeira desenhada nos estacionamentos. Sem árvore na faixa da pista nem no pátio do aeroporto."""
    rgb, dentro = plano[..., :3].astype(int), plano[..., 3] > 0
    H, W = dentro.shape
    verde = dentro & (((rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])) > 90) & (rgb[..., 1] > 150))
    yy, xx = np.mgrid[0:H, 0:W]
    px, py = xx / W * 100, yy / H * 100
    pista = ((py > 72) & (px < 66)) | ((px < 17) & (py > 62)) | ((py > 70) & (px < 70) & (py > 0.25 * px + 66))
    verde &= ~pista
    dist = ndi.distance_transform_edt(verde) / br.K                     # metros até a borda do verde
    rng = np.random.default_rng(12)
    pts = []
    passo = 10.5
    for gy in np.arange(passo / 2, sheet[1], passo):
        for gx in np.arange(passo / 2 + (gy // passo % 2) * passo / 2, sheet[0], passo):
            x, y = gx + rng.uniform(-3, 3), gy + rng.uniform(-3, 3)
            i, j = int(y * br.K), int(x * br.K)
            if not (0 <= i < H and 0 <= j < W) or dist[i, j] < 2.0:
                continue
            g = int(y / maq.res), int(x / maq.res)
            if maq.HF[min(g[0], maq.GH - 1), min(g[1], maq.GW - 1)] > 0:
                continue
            pts.append((x, y, rng.uniform(0.8, 1.25)))
    # palmeiras dos estacionamentos: manchas verdes pequenas e isoladas
    lab, n = ndi.label(verde)
    ar = ndi.sum(verde, lab, index=np.arange(1, n + 1)) / br.K / br.K
    cms = ndi.center_of_mass(verde, lab, index=np.arange(1, n + 1))
    for k in range(n):
        if 2.5 <= ar[k] <= 70:
            y, x = cms[k][0] / br.K, cms[k][1] / br.K
            pts.append((x, y, rng.uniform(0.7, 0.9) if ar[k] < 30 else rng.uniform(0.9, 1.1)))
    # árvores floridas dos boulevards: o ícone tem pétalas magenta (na maquete a copa fica verde)
    flor = dentro & ((rgb[..., 0] - rgb[..., 1]) > 60) & ((rgb[..., 2] - rgb[..., 1]) > 60)
    lab, n = ndi.label(ndi.binary_dilation(flor, iterations=4))
    if n:
        ar = ndi.sum(flor, lab, index=np.arange(1, n + 1)) / br.K / br.K
        cms = ndi.center_of_mass(flor, lab, index=np.arange(1, n + 1))
        for k in range(n):
            if 1 <= ar[k] <= 60:
                pts.append((cms[k][1] / br.K, cms[k][0] / br.K, rng.uniform(0.95, 1.15)))
    return pts


def oclusao(maq, arv, w, h, sheet):
    """Escurecimento suave no pé dos prédios e debaixo das árvores (a sombra do sol é em tempo real)."""
    pe = (maq.HF > 0).astype(np.float32)
    ao = 1 - 0.30 * np.clip(ndi.gaussian_filter(pe, 2.6 / maq.res), 0, 1)
    ao[maq.HF > 0] = 1
    im = Image.fromarray((ao * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
    sob = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(sob)
    k = w / sheet[0]
    for x, y, s in arv:
        r = 3.2 * s * k
        d.ellipse((x * k - r, y * k - r, x * k + r, y * k + r), fill=70)
    sob = sob.filter(ImageFilter.GaussianBlur(2.2 * k))
    return np.array(im, np.float32) / 255 * (1 - np.array(sob, np.float32) / 255 * 0.55)


def contorno_parque(plano):
    dentro = ndi.binary_opening(plano[..., 3] > 0, iterations=2)
    lab, n = ndi.label(dentro)
    maior = np.argmax(ndi.sum(dentro, lab, index=np.arange(1, n + 1))) + 1
    pol = contornos(lab == maior, 0, 0, 3.0)
    return max(pol, key=len)


def casca(maq):
    """A cobertura em casca do Centro de Convenções como campo de alturas (decímetros, 1 m de grade)."""
    m = maq.MAT == maq.MATS['casca']
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min() - 1, ys.max() + 2, xs.min() - 1, xs.max() + 2
    z = np.where(m[y0:y1, x0:x1], maq.HF[y0:y1, x0:x1], 0)
    z = np.round(np.clip(z, 0, 25.5) * 10).astype(np.uint8)
    return dict(x0=x0 * maq.res, y0=y0 * maq.res, res=maq.res, w=int(x1 - x0), h=int(y1 - y0),
                z=base64.b64encode(z.tobytes()).decode())


def esmaecer(im, cor, margem):
    """Funde as bordas do entorno na cor do horizonte."""
    a = np.array(im, np.float32)
    H, W = a.shape[:2]
    fy = np.clip(np.minimum(np.arange(H), H - 1 - np.arange(H)) / (margem * H), 0, 1)
    fx = np.clip(np.minimum(np.arange(W), W - 1 - np.arange(W)) / (margem * W), 0, 1)
    f = np.minimum(fy[:, None], fx[None, :])
    f = (f * f * (3 - 2 * f))[..., None]
    return Image.fromarray((a * f + np.array(cor, np.float32) * (1 - f)).astype(np.uint8))


def main():
    os.makedirs(br.CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    print('planta…')
    plano, sheet = br.planta()
    data = br.osm()
    geo = br.Geo(data, sheet)
    print('volumes…')
    maq = Maquete3D(plano, sheet, res=RES).montar()
    vol = []
    for v in maq.vol:
        if v['t'] == 'outlet':
            vol += dividir(v, 52, 9)
        else:
            vol.append(v)
    for k, n in sorted(maq.conta.items()):
        print(f'  {k:32s} {n}')
    print('lotes…')
    lts = lotes(plano, sheet)
    print(f'  {len(lts)} lotes · {sum(l["a"] for l in lts):,} m² pelos rótulos'.replace(',', '.'))
    print('árvores…')
    arv = arvores(plano, maq, sheet)
    print(f'  {len(arv)} árvores')

    print('chão do parque…')
    br.CORES.update(CORES_ENTORNO)
    W, H = sheet
    th = round(TEX_W * H / W)
    chao = br.entorno(data, geo, recolorir_3d(plano), box=(0, 0, W, H), mpp=W / TEX_W, larguras=br.LARGURAS_HD)
    chao = chao.resize((TEX_W, th), Image.LANCZOS) if chao.size != (TEX_W, th) else chao
    a = np.array(chao, np.float32) * oclusao(maq, arv, TEX_W, th, sheet)[..., None]
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'parque.webp'), quality=88, method=6)
    print('entorno…')
    vazio = np.zeros((64, 64, 4), np.uint8)
    ctx = br.entorno(data, geo, vazio, box=br.CTX_BOX, mpp=CTX_MPP, larguras=br.LARGURAS_HD)
    esmaecer(ctx, NEVOA, 0.16).save(os.path.join(OUT, 'entorno.webp'), quality=84, method=6)

    nlat, nlon = geo.latlon(W / 2, H / 2)
    cena = {
        'fonte': 'BRACERUM PARK — Masterplan V12 (01/10/2026), escala 1:1000',
        'sheet': [round(W, 2), round(H, 2)],
        'north': [round(math.cos(geo.A), 5), round(math.sin(geo.A), 5)],     # direção do norte na prancha
        'A': round(geo.A, 6),
        'centro_latlon': [round(nlat, 6), round(nlon, 6)],
        'parque': {'tex': 'parque.webp', 'box': [0, 0, round(W, 2), round(H, 2)]},
        'entorno': {'tex': 'entorno.webp', 'box': list(br.CTX_BOX), 'nevoa': NEVOA},
        'contorno': [round(v, 1) for xy in contorno_parque(plano) for v in xy],
        'vol': [dict(t=v['t'], h=v['h'], p=[round(c, 2) for xy in v['p'] for c in xy]) for v in vol],
        'casca': casca(maq),
        'arvores': [round(c, 1) if i % 3 < 2 else round(c, 2) for t in arv for i, c in enumerate(t)],
        'lotes': lts,
    }
    with open(os.path.join(OUT, 'scene.json'), 'w', encoding='utf-8') as fh:
        json.dump(cena, fh, ensure_ascii=False, separators=(',', ':'))
    for f in sorted(os.listdir(OUT)):
        print(f'  {f:14s} {os.path.getsize(os.path.join(OUT, f)) / 1024:8.0f} KB')
    print('pronto.')


if __name__ == '__main__':
    main()
