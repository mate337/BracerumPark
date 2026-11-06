#!/usr/bin/env python3
"""Planta humanizada (vista de cima, estilo maquete) da casa de 2 dorm. + suíte.

Fonte: docs/plantas/casa-planta-cad.png (planta CAD enviada pelo usuário em 2026-11-06).
Estilo: o mesmo da planta do apartamento que o usuário aprovou
(docs/plantas/referencia-apto-humanizada.png): fundo marrom escuro, paredes grafite,
piso de madeira nos quartos, porcelanato claro na área social, cinza nos molhados,
móveis com sombra suave e números brancos em círculos escuros.

Todas as coordenadas estão em pixels da planta CAD original (604 x 459 px,
~49 px por metro). Paredes, portas e janelas foram lidas dos traços da planta.

    python3 docs/plantas/build_planta_casa.py
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 4                     # px de saída por px da planta CAD
M = 26                    # margem em px CAD
X0, Y0 = 10 - M, 12 - M   # canto da planta CAD que vai para (0,0)
W = int((604 - X0 + M) * S)
H = int((463 - Y0 + M) * S)

rng = np.random.default_rng(7)
random.seed(7)


def P(x, y):
    return ((x - X0) * S, (y - Y0) * S)


def R(x0, y0, x1, y1):
    a, b = P(x0, y0)
    c, d = P(x1, y1)
    return [a, b, c, d]


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype('uint8'))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype('float32') / 255


def shift(a, dx, dy):
    out = np.zeros_like(a)
    h, w = a.shape
    xs0, xs1 = max(0, -dx), min(w, w - dx)
    ys0, ys1 = max(0, -dy), min(h, h - dy)
    out[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx] = a[ys0:ys1, xs0:xs1]
    return out


def smooth_noise(h, w, cell_y, cell_x, seed):
    g = np.random.default_rng(seed)
    small = g.random((max(2, h // cell_y + 2), max(2, w // cell_x + 2))).astype('float32')
    im = Image.fromarray((small * 255).astype('uint8')).resize(
        (small.shape[1] * cell_x, small.shape[0] * cell_y), Image.BICUBIC)
    return np.asarray(im).astype('float32')[:h, :w] / 255 - 0.5


# --------------------------------------------------------------------------- texturas
def tex_wood(base, horizontal=True, seed=1):
    """Assoalho de tábuas (0,19 x 1,2-2 m) com veio e emendas."""
    h, w = (H, W) if horizontal else (W, H)
    pw = int(0.19 * 49 * S)
    yy, xx = np.mgrid[0:h, 0:w]
    row = yy // pw
    g = np.random.default_rng(seed)
    nrows = h // pw + 2
    off = g.integers(0, 9 * pw, nrows)
    plen = int(1.6 * 49 * S)
    col = (xx + off[row]) // plen
    pid = (row * 977 + col * 131) % 4096
    tint = g.normal(0, 0.055, 4096).astype('float32')[pid]
    grain = smooth_noise(h, w, 3, 90, seed + 1) * 0.10 + smooth_noise(h, w, 1, 30, seed + 2) * 0.05
    f = 1 + tint + grain
    seam_y = (yy % pw) < 2
    seam_x = ((xx + off[row]) % plen) < 2
    f = np.where(seam_y | seam_x, f * 0.78, f)
    t = np.stack([f * c for c in base], -1)
    if not horizontal:
        t = t.transpose(1, 0, 2)
    return t


def tex_tile(base, size_m, seed, var=0.025, grout=0.9, mott=0.05):
    ts = int(size_m * 49 * S)
    yy, xx = np.mgrid[0:H, 0:W]
    g = np.random.default_rng(seed)
    tid = ((yy // ts) * 389 + (xx // ts) * 97) % 2048
    f = 1 + g.normal(0, var, 2048).astype('float32')[tid]
    f += smooth_noise(H, W, 60, 60, seed + 3) * mott + smooth_noise(H, W, 6, 6, seed + 4) * 0.02
    gl = ((yy % ts) < 2) | ((xx % ts) < 2)
    f = np.where(gl, f * grout, f)
    return np.stack([f * c for c in base], -1)


# --------------------------------------------------------------------------- tela
canvas = np.zeros((H, W, 3), 'float32')
canvas[:] = rgb('#3a2e25')
canvas += smooth_noise(H, W, 200, 200, 99)[..., None] * 10


def mask_rects(rects):
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    for r in rects:
        d.rectangle(R(*r), fill=255)
    return np.asarray(im).astype('float32') / 255


def paint(mask, tex):
    global canvas
    canvas = canvas * (1 - mask[..., None]) + tex * mask[..., None]


# ---- pegada da casa (sombra no fundo)
footprint = mask_rects([(87, 12, 259, 58), (251, 48, 604, 277), (10, 254, 604, 463),
                        (87, 12, 260, 262)])
sh = blur(shift(footprint, 14, 20), 26)
canvas *= (1 - 0.55 * sh)[..., None]

# ---- pisos
WOOD = rgb('#9c7a5a')
PORC = rgb('#e9e4dc')
BATH = rgb('#c9c8c4')
SERV = rgb('#cfccc6')
GOUR = rgb('#d8cdbd')

paint(mask_rects([(167, 221, 596, 455), (222, 221, 320, 264)]), tex_tile(PORC, 0.9, 11))
paint(mask_rects([(95, 86, 251, 254), (251, 221, 320, 264), (222, 221, 251, 254),
                  (259, 58, 390, 213), (347, 213, 390, 221),
                  (464, 58, 596, 269), (457, 225, 464, 269)]), tex_wood(WOOD, True, 3))
paint(mask_rects([(95, 20, 251, 78), (207, 78, 251, 86), (398, 58, 457, 214), (400, 214, 440, 221)]),
      tex_tile(BATH, 0.6, 21, grout=0.86))
paint(mask_rects([(18, 262, 94, 326), (102, 262, 214, 326), (94, 290, 102, 326), (170, 325, 214, 333)]),
      tex_tile(SERV, 0.45, 31, grout=0.86))
paint(mask_rects([(14, 333, 160, 455)]), tex_tile(GOUR, 0.6, 41, var=0.04, grout=0.8, mott=0.07))
paint(mask_rects([(160, 333, 167, 455)]), tex_tile(PORC, 0.9, 11))

# ---- paredes (x0, y0, x1, y1) em px CAD — vãos de porta e janela ficam de fora
WALLS = [
    (87, 12, 259, 20),                                  # topo do BWC da suíte
    (87, 12, 95, 30), (87, 68, 95, 128), (87, 215, 95, 262),  # fachada esquerda da suíte
    (251, 12, 259, 221),                                # suíte | dorm I
    (94, 78, 207, 86),                                  # BWC suíte | suíte
    (251, 48, 289, 58), (360, 48, 408, 58), (447, 48, 495, 58), (565, 48, 604, 58),  # fachada de cima
    (596, 48, 604, 407),                                # fachada direita (porta de entrada abaixo)
    (251, 213, 347, 221),                               # dorm I | circulação
    (390, 58, 398, 221), (457, 58, 464, 225),           # paredes do BWC
    (390, 214, 400, 221), (440, 214, 464, 221),
    (379, 269, 604, 277),                               # dorm II | estar
    (10, 254, 222, 262),                                # suíte | área técnica/serviço
    (10, 254, 18, 262), (10, 326, 18, 334),             # fachada esquerda (janela da área téc.)
    (94, 262, 102, 290),                                # área téc. | serviço
    (214, 254, 222, 334),                               # serviço | armário
    (10, 325, 170, 333),                                # área téc./serviço | gourmet
    (221, 297, 320, 304),                               # armário | nicho
    (320, 264, 328, 342),                               # armário | estar
    (10, 455, 604, 463),                                # fachada de baixo
    (14, 416, 18, 456),
]
wall_m = mask_rects(WALLS)

# oclusão: as paredes escurecem o piso junto delas
inside = mask_rects([(14, 20, 596, 455), (95, 12, 251, 20)])
ao = blur(wall_m, 10) * 0.45 + blur(shift(wall_m, 6, 9), 14) * 0.35
canvas *= (1 - np.clip(ao, 0, 0.6) * inside)[..., None]


# --------------------------------------------------------------------------- objetos
def obj(draw_fn, height=1.0, bevel=0.35, shadow=0.42):
    """Desenha um objeto numa camada, aplica volume (borda escura + luz no alto à
    esquerda) e sombra no chão, e compõe sobre a tela."""
    global canvas
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    arr = np.asarray(layer).astype('float32')
    a = arr[..., 3] / 255
    if not a.any():
        return
    if shadow:
        d = int(5 * height)
        s = blur(shift(a, d, int(d * 1.4)), 5 + 5 * height)
        canvas *= (1 - shadow * s * (1 - a))[..., None]
    col = arr[..., :3]
    if bevel:
        edge = np.clip(a - blur(a, 3), 0, 1) * 2
        hi = np.clip(a - shift(blur(a, 3), 4, 4), 0, 1)
        col = col * (1 - bevel * edge)[..., None] + 255 * 0.12 * hi[..., None]
    canvas = canvas * (1 - a[..., None]) + col * a[..., None]


def rr(d, box, fill, rad=2, outline=None, width=1):
    d.rounded_rectangle(R(*box), radius=rad * S, fill=fill, outline=outline, width=width)


def circ(d, cx, cy, r, fill, outline=None, width=1):
    x, y = P(cx, cy)
    d.ellipse([x - r * S, y - r * S, x + r * S, y + r * S], fill=fill, outline=outline, width=width)


WHITE = rgb('#f4f1ea')
LINEN = rgb('#ebe6dc')
GREEN = rgb('#5f7a55')
TERRA = rgb('#b4603e')
TERRA2 = rgb('#a5532f')
OAK = rgb('#c9a57b')
OAK_D = rgb('#a5825a')
CAB = rgb('#e9e4da')
STEEL = rgb('#b9bcbd')
DARK = rgb('#3c3a38')
SOFA = rgb('#ddd5c6')


def bed(box, head, throw, double=True):
    x0, y0, x1, y1 = box

    def f(d):
        rr(d, box, WHITE, 2)
        # cabeceira
        if head == 'top':
            rr(d, (x0, y0, x1, y0 + 4), OAK_D, 1)
        elif head == 'bottom':
            rr(d, (x0, y1 - 4, x1, y1), OAK_D, 1)
        elif head == 'right':
            rr(d, (x1 - 4, y0, x1, y1), OAK_D, 1)
    obj(f, height=1.0)

    # travesseiros
    def pil(d):
        if head in ('top', 'bottom'):
            w = x1 - x0
            n = 2 if double else 1
            py = y0 + 6 if head == 'top' else y1 - 18
            for i in range(n):
                px = x0 + 3 + i * (w - 6) / n
                rr(d, (px + 1, py, px + (w - 6) / n - 1, py + 12), LINEN, 3)
        else:
            h = y1 - y0
            for i in range(2):
                py = y0 + 3 + i * (h - 6) / 2
                rr(d, (x1 - 18, py + 1, x1 - 6, py + (h - 6) / 2 - 1), LINEN, 3)
    obj(pil, height=0.5, bevel=0.45)

    # manta dobrada nos pés
    def thr(d):
        if head == 'top':
            rr(d, (x0 - 1, y1 - 26, x1 + 1, y1 - 12), throw, 1)
        elif head == 'bottom':
            rr(d, (x0 - 1, y0 + 12, x1 + 1, y0 + 26), throw, 1)
        else:
            rr(d, (x0 + 10, y0 - 1, x0 + 24, y1 + 1), throw, 1)
    obj(thr, height=0.4, bevel=0.3)

    # dobras do edredom
    def fold(d):
        c = (220, 214, 204, 255)
        if head in ('top', 'bottom'):
            yA = y0 + 24 if head == 'top' else y0 + 32
            yB = y1 - 32 if head == 'top' else y1 - 24
            for k in range(3):
                xa = x0 + 6 + k * (x1 - x0 - 12) / 3
                d.line([P(xa, yA), P(xa + 6, (yA + yB) / 2), P(xa + 2, yB)], fill=c, width=3)
        else:
            for k in range(3):
                ya = y0 + 6 + k * (y1 - y0 - 12) / 3
                d.line([P(x0 + 28, ya), P((x0 + x1) / 2, ya + 5), P(x1 - 22, ya + 2)], fill=c, width=3)
    obj(fold, height=0, bevel=0, shadow=0)


def nightstand(box):
    obj(lambda d: rr(d, box, OAK, 1), height=0.6)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    obj(lambda d: (circ(d, cx, cy, 4, (236, 228, 210, 255)), circ(d, cx, cy, 1.5, (200, 190, 170, 255))),
        height=0.4)


def wardrobe(box, vertical):
    x0, y0, x1, y1 = box

    def f(d):
        rr(d, box, CAB, 1)
        c = (205, 199, 188, 255)
        if vertical:
            n = max(2, round((y1 - y0) / 22))
            for i in range(1, n):
                y = y0 + i * (y1 - y0) / n
                d.line([P(x0, y), P(x1, y)], fill=c, width=3)
        else:
            n = max(2, round((x1 - x0) / 22))
            for i in range(1, n):
                x = x0 + i * (x1 - x0) / n
                d.line([P(x, y0), P(x, y1)], fill=c, width=3)
    obj(f, height=1.6, bevel=0.25)


def chair(cx, cy, facing, color=TERRA):
    """Cadeira de jantar redonda vista de cima; facing = lado do encosto."""
    def f(d):
        circ(d, cx, cy, 7.5, color)
        ox, oy = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}[facing]
        x, y = P(cx + ox, cy + oy)
        r = 7.6 * S
        start = {'up': 200, 'down': 20, 'left': 110, 'right': 290}[facing]
        d.arc([x - r, y - r, x + r, y + r], start, start + 140, fill=tuple(int(v * 0.78) for v in color), width=11)
    obj(f, height=0.8, bevel=0.4)


def plant(cx, cy, r, pot=True, seed=0):
    g = random.Random(seed)
    if pot:
        obj(lambda d: circ(d, cx, cy, r * 0.42, (206, 196, 180, 255)), height=0.7)

    def f(d):
        n = 22
        for i in range(n):
            ang = i / n * 2 * math.pi + g.uniform(-0.15, 0.15)
            L = r * g.uniform(0.65, 1.0)
            wdt = r * 0.22
            pts = []
            for t, side in ((0, 0), (0.5, 1), (1, 0), (0.5, -1)):
                px = cx + math.cos(ang) * L * t - math.sin(ang) * wdt * side
                py = cy + math.sin(ang) * L * t + math.cos(ang) * wdt * side
                pts.append(P(px, py))
            shade = g.uniform(0.75, 1.15)
            d.polygon(pts, fill=(int(70 * shade), int(112 * shade), int(62 * shade), 255))
    obj(f, height=1.4, bevel=0.15)


# ---------------------------------------------------------------- SUÍTE (1)
wardrobe((96, 87, 205, 113), vertical=False)
obj(lambda d: rr(d, (113, 150, 198, 252), (212, 202, 186, 255), 1), height=0.05, bevel=0.1, shadow=0.15)  # tapete
bed((120, 166, 191, 252), 'bottom', GREEN)
nightstand((100, 236, 116, 252))
nightstand((195, 236, 211, 252))
plant(110, 130, 9, seed=1)

# ---------------------------------------------------------------- BWC SUÍTE (2)
obj(lambda d: rr(d, (191, 21, 240, 37), CAB, 1), height=0.9)          # bancada
obj(lambda d: (rr(d, (206, 23, 226, 35), WHITE, 5),
               circ(d, 216, 29, 1, (150, 150, 150, 255))), height=0.3, bevel=0.5)
obj(lambda d: (rr(d, (161, 21, 177, 27), WHITE, 1),                     # vaso
               d.ellipse(R(162, 26, 176, 44), fill=WHITE)), height=0.6, bevel=0.45)
obj(lambda d: rr(d, (134, 21, 136, 52), (200, 220, 226, 210), 0), height=0.6, bevel=0)   # box de vidro
obj(lambda d: circ(d, 113, 40, 1.6, (130, 130, 130, 255)), height=0, bevel=0, shadow=0)  # ralo
obj(lambda d: rr(d, (100, 62, 122, 74), (230, 226, 218, 255), 1), height=0.1, bevel=0.2, shadow=0.15)  # tapete

# ---------------------------------------------------------------- DORM I (3)
wardrobe((260, 125, 288, 211), vertical=True)
obj(lambda d: rr(d, (260, 66, 279, 112), OAK, 1), height=1.0)          # escrivaninha
obj(lambda d: (rr(d, (263, 80, 274, 94), (60, 60, 62, 255), 1)), height=0.2, bevel=0.2)  # notebook
chair(287, 89, 'right', color=rgb('#d9d2c4'))
bed((341, 60, 389, 156), 'top', TERRA)
nightstand((321, 60, 338, 77))

# ---------------------------------------------------------------- BWC (4)
obj(lambda d: rr(d, (424, 99, 457, 101), (200, 220, 226, 210), 0), height=0.6, bevel=0)  # box
obj(lambda d: circ(d, 428, 78, 1.6, (130, 130, 130, 255)), height=0, bevel=0, shadow=0)
obj(lambda d: (rr(d, (450, 118, 456, 136), WHITE, 1),                   # vaso
               d.ellipse(R(434, 119, 452, 135), fill=WHITE)), height=0.6, bevel=0.45)
obj(lambda d: rr(d, (440, 150, 456, 188), CAB, 1), height=0.9)          # bancada
obj(lambda d: d.ellipse(R(442, 160, 454, 178), fill=WHITE), height=0.3, bevel=0.5)

# ---------------------------------------------------------------- DORM II (5)
bed((506, 80, 595, 150), 'right', TERRA2)
nightstand((579, 61, 595, 77))
nightstand((579, 152, 595, 168))
wardrobe((567, 172, 595, 268), vertical=True)
obj(lambda d: rr(d, (465, 168, 487, 222), OAK, 1), height=1.0)          # escrivaninha
obj(lambda d: rr(d, (469, 182, 482, 197), (60, 60, 62, 255), 1), height=0.2, bevel=0.2)
chair(496, 195, 'right', color=rgb('#d9d2c4'))
plant(478, 72, 10, seed=5)

# ---------------------------------------------------------------- ARMÁRIO E NICHO
wardrobe((223, 265, 319, 296), vertical=False)
wardrobe((223, 305, 319, 333), vertical=False)

# ---------------------------------------------------------------- ESTAR / JANTAR (6)
obj(lambda d: rr(d, (420, 296, 530, 428), (214, 205, 190, 255), 1), height=0.05, bevel=0.1, shadow=0.15)  # tapete


def sofa(d):
    rr(d, (430, 279, 518, 311), SOFA, 3)
    rr(d, (488, 279, 518, 362), SOFA, 3)
obj(sofa, height=1.1, bevel=0.3)


def sofa_cush(d):
    c = rgb('#e8e1d4')
    rr(d, (432, 281, 516, 289), (205, 196, 182, 255), 2)   # encosto
    rr(d, (509, 281, 516, 360), (205, 196, 182, 255), 2)
    for x in (433, 459, 485):
        rr(d, (x, 290, x + 24, 309), c, 2)
    rr(d, (490, 312, 507, 359), c, 2)
obj(sofa_cush, height=0.3, bevel=0.35)
obj(lambda d: (rr(d, (440, 289, 450, 296), TERRA, 2), rr(d, (494, 297, 503, 306), GREEN, 2)), height=0.3, bevel=0.4)
obj(lambda d: (circ(d, 470, 352, 13, OAK), circ(d, 470, 352, 9, OAK_D)), height=0.6)          # mesa de centro
obj(lambda d: rr(d, (464, 348, 474, 356), (90, 110, 80, 255), 2), height=0.2, bevel=0.3)
obj(lambda d: circ(d, 418, 287, 6, OAK), height=0.6)                                       # mesa lateral
obj(lambda d: rr(d, (436, 440, 515, 454), OAK, 1), height=0.8)                             # rack
obj(lambda d: rr(d, (446, 450, 505, 453), (28, 28, 30, 255), 0), height=0.4, bevel=0)      # TV

# escada (sobe para cima)


def stairs(d):
    tread = rgb('#b38c63')
    rr(d, (555, 300, 595, 390), tread, 0)
    for i in range(9):
        y = 390 - i * 10
        d.line([P(555, y), P(595, y)], fill=(120, 90, 60, 255), width=3)
    # degraus em leque no alto
    d.polygon([P(522, 278), P(595, 278), P(595, 300), P(555, 300)], fill=tread)
    for tx in (534, 548, 563, 579):
        d.line([P(555, 300), P(tx, 278)], fill=(120, 90, 60, 255), width=3)
    d.line([P(555, 300), P(595, 290)], fill=(120, 90, 60, 255), width=3)
    d.line([P(555, 300), P(555, 390)], fill=(70, 66, 62, 255), width=6)   # guarda-corpo
obj(stairs, height=0.6, bevel=0.15)

# mesa de jantar
for y in (343, 375, 407):
    chair(353, y, 'left')
    chair(414, y, 'right')
chair(383.5, 320, 'up')
chair(383.5, 430, 'down')
obj(lambda d: rr(d, (362, 328, 405, 422), OAK, 1), height=0.9)
plant(383.5, 375, 7, pot=False, seed=7)
plant(586, 398, 9, seed=3)                       # junto à escada
plant(338, 290, 9, seed=9)

# ---------------------------------------------------------------- COZINHA (7)
obj(lambda d: rr(d, (167, 426, 279, 455), CAB, 1), height=1.0)                 # bancada


def cook(d):
    rr(d, (175, 431, 199, 451), (34, 34, 36, 255), 1)
    for cx, cy in ((181, 436), (193, 436), (181, 446), (193, 446)):
        circ(d, cx, cy, 3.2, None, outline=(95, 95, 98, 255), width=3)
obj(cook, height=0.1, bevel=0.2)
obj(lambda d: (rr(d, (224, 431, 252, 451), STEEL, 2), rr(d, (227, 434, 249, 448), (160, 164, 166, 255), 2)),
    height=0.1, bevel=0.3)
obj(lambda d: rr(d, (281, 423, 319, 455), (200, 203, 204, 255), 1), height=1.8)  # geladeira
obj(lambda d: d.line([P(300, 424), P(300, 454)], fill=(150, 152, 154, 255), width=3), height=0, bevel=0, shadow=0)
plant(262, 438, 6, seed=11)

# ---------------------------------------------------------------- VARANDA GOURMET (8)
obj(lambda d: rr(d, (14, 333, 17, 416), (200, 216, 222, 200), 0), height=0.8, bevel=0)  # guarda-corpo de vidro
obj(lambda d: rr(d, (67, 426, 158, 455), (190, 180, 165, 255), 1), height=1.0)          # bancada
obj(lambda d: (rr(d, (98, 432, 122, 450), STEEL, 2), rr(d, (101, 435, 119, 447), (160, 164, 166, 255), 2)),
    height=0.1, bevel=0.3)


def grill(d):
    rr(d, (18, 416, 66, 455), (122, 74, 54, 255), 1)
    rr(d, (24, 422, 60, 450), (40, 36, 34, 255), 1)
    for x in range(27, 59, 4):
        d.line([P(x, 424), P(x, 448)], fill=(110, 110, 110, 255), width=2)
obj(grill, height=1.6, bevel=0.3)
chair(47, 345, 'up', color=rgb('#d9d2c4'))
chair(80, 345, 'up', color=rgb('#d9d2c4'))
chair(40, 384, 'left', color=rgb('#d9d2c4'))
chair(86, 384, 'right', color=rgb('#d9d2c4'))
obj(lambda d: circ(d, 63, 368, 19, OAK), height=0.9)
plant(63, 368, 6, pot=False, seed=13)
plant(147, 346, 10, seed=15)

# portas de correr de vidro gourmet | cozinha
obj(lambda d: (rr(d, (160, 333, 167, 455), (205, 220, 226, 200), 0),
               d.line([P(163.5, 333), P(163.5, 455)], fill=(120, 130, 134, 255), width=3)),
    height=0.4, bevel=0)

# ---------------------------------------------------------------- ÁREA TÉCNICA (9) e SERVIÇO (10)
obj(lambda d: (circ(d, 33, 280, 10, (226, 224, 220, 255)), circ(d, 33, 280, 4, (200, 198, 194, 255))),
    height=1.4)                                                     # aquecedor
obj(lambda d: rr(d, (62, 268, 90, 288), (190, 192, 192, 255), 1), height=0.9)  # condensadora
obj(lambda d: (rr(d, (104, 264, 131, 290), WHITE, 1), circ(d, 117.5, 277, 9, (210, 214, 216, 255))),
    height=1.0)                                                     # lavadora
obj(lambda d: (rr(d, (137, 264, 166, 289), (215, 213, 208, 255), 1), rr(d, (141, 268, 162, 285), STEEL, 3)),
    height=1.0)                                                     # tanque
obj(lambda d: rr(d, (196, 264, 213, 324), CAB, 1), height=1.6)     # prateleiras da despensa

# ---------------------------------------------------------------- PORTAS (folhas abertas)
DOOR = (78, 72, 66, 255)
for box in [(246, 40, 250, 78),     # BWC suíte
            (386, 177, 390, 213),   # dorm I
            (398, 177, 402, 214),   # BWC
            (464, 265, 502, 269),   # dorm II
            (282, 221, 320, 225),   # suíte (vestíbulo)
            (208, 289, 212, 325),   # serviço
            (558, 451, 596, 455)]:  # entrada
    obj(lambda d, b=box: rr(d, b, DOOR, 0), height=0.8, bevel=0.1)

# ---------------------------------------------------------------- PAREDES E JANELAS
WIN = [(87, 30, 95, 68), (87, 128, 95, 215), (289, 48, 360, 58), (408, 48, 447, 58),
       (495, 48, 565, 58), (10, 262, 18, 326)]


def windows(d):
    for b in WIN:
        x0, y0, x1, y1 = b
        rr(d, b, (214, 226, 230, 255), 0)
        if x1 - x0 > y1 - y0:
            d.line([P(x0, (y0 + y1) / 2), P(x1, (y0 + y1) / 2)], fill=(150, 162, 168, 255), width=3)
        else:
            d.line([P((x0 + x1) / 2, y0), P((x0 + x1) / 2, y1)], fill=(150, 162, 168, 255), width=3)
    # portal de entrada
    rr(d, (596, 407, 604, 455), (120, 112, 104, 255), 0)
obj(windows, height=0.2, bevel=0.15, shadow=0)

wall_col = np.array(rgb('#4d4a47'), 'float32')
edge = np.clip(wall_m - blur(wall_m, 2), 0, 1)
wc = wall_col[None, None, :] * (1 - 0.25 * edge)[..., None]
canvas = canvas * (1 - wall_m[..., None]) + wc * wall_m[..., None]

# luz geral: leve vinheta
yy, xx = np.mgrid[0:H, 0:W]
vig = 1 - 0.10 * (((xx / W - 0.45) ** 2 + (yy / H - 0.45) ** 2) * 2)
canvas *= vig[..., None]

img = Image.fromarray(np.clip(canvas, 0, 255).astype('uint8'))

# ---------------------------------------------------------------- NÚMEROS
NUMS = [(1, 150, 140), (2, 186, 58), (3, 313, 168), (4, 421, 134), (5, 524, 206),
        (6, 473, 393), (7, 230, 392), (8, 112, 398), (9, 52, 308), (10, 172, 306)]
d = ImageDraw.Draw(img)
font = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 15 * S // 2)
for n, x, y in NUMS:
    cx, cy = P(x, y)
    r = 8.5 * S
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(43, 38, 34), outline=(250, 247, 240), width=2 * S // 2)
    d.text((cx, cy + 1), str(n), font=font, fill=(250, 247, 240), anchor='mm')

out = os.path.join(HERE, 'casa-planta-humanizada.png')
img.save(out, optimize=True)
img.convert('RGB').save(os.path.join(HERE, 'casa-planta-humanizada.jpg'), quality=90)

# ---------------------------------------------------------------- VERSÃO COM LEGENDA
LEG = [('1', 'Suíte', '13,72 m²'), ('2', 'BWC suíte', '3,84 m²'), ('3', 'Dormitório I', '8,50 m²'),
       ('4', 'BWC', '3,78 m²'), ('5', 'Dormitório II', '11,61 m²'), ('6', 'Estar / Jantar', '20,08 m²'),
       ('7', 'Cozinha', '9,07 m²'), ('8', 'Varanda gourmet', '7,50 m²'), ('9', 'Área técnica', '2,01 m²'),
       ('10', 'Serviço / Despensa', '2,99 m²')]
lw = 980
leg = Image.new('RGB', (W + lw, H), (58, 46, 37))
leg.paste(img, (0, 0))
d = ImageDraw.Draw(leg)
f_t = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', 92)
f_i = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 92)
f_l = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 46)
f_s = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 38)
f_n = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 34)
x = W + 40
d.text((x, 150), 'Planta', font=f_t, fill=(247, 243, 234))
d.text((x, 250), 'humanizada', font=f_i, fill=(203, 184, 143))
d.text((x, 380), '2 dormitórios + suíte', font=f_s, fill=(210, 200, 185))
d.line([(x, 450), (W + lw - 60, 450)], fill=(110, 96, 80), width=2)
y = 520
for n, name, area in LEG:
    d.ellipse([x, y - 30, x + 60, y + 30], fill=(43, 38, 34), outline=(250, 247, 240), width=3)
    d.text((x + 30, y + 1), n, font=f_n, fill=(250, 247, 240), anchor='mm')
    d.text((x + 90, y), name, font=f_l, fill=(247, 243, 234), anchor='lm')
    d.text((W + lw - 60, y), area, font=f_s, fill=(203, 184, 143), anchor='rm')
    y += 112
d.text((x, H - 120), 'Imagem ilustrativa. Mobiliário sugerido.', font=f_s, fill=(160, 148, 132))
leg.save(os.path.join(HERE, 'casa-planta-humanizada-legenda.jpg'), quality=90)
print('ok', W, H)
