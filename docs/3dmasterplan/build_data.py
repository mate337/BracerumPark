#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera os dados do Masterplan 3D (3dmasterplan/data/) a partir da planta V14 (28/10/2026).

    python3 docs/3dmasterplan/build_data.py      # da raiz do repositório

Escreve em 3dmasterplan/data/:
  scene.json     volumes (polígono + altura + tipo), casas do resort, casca do centro de convenções,
                 árvores e o contorno do parque
  parque.webp    o chão do parque: a planta V14 sem texto, nas cores da maquete, com oclusão no pé
                 dos prédios e das árvores, sobre o entorno real
(os lotes à venda saem do mesmo PDF, por docs/3dmasterplan/build_lotes.py)
  entorno.webp   o entorno real (OpenStreetMap) em volta, 10 x 9,5 km, esmaecido nas bordas

Reaproveita de docs/prompt-aerea-v12/build_refs.py a leitura do PDF, a georreferência pela curva
da PY-19 e a maquete de volumes (as mesmas alturas estimadas da vista aérea — a planta não define
altura de nada). O V14 usa a mesma prancha e as mesmas coordenadas do V12 (os rótulos "20.000 m²"
caem no mesmo lugar), então o encaixe na PY-19 vale igual; o que muda é onde procurar cada prédio,
em Maquete14.montar(). Coordenadas em metros da prancha: X para a direita, Y para baixo, origem no canto
superior esquerdo; o norte aponta para a direita (ver `north` no scene.json).

PRECISA RODAR DE NOVO SE o cliente mandar outra versão da planta (trocar PLANTA e conferir as caixas
de Maquete14.montar) ou se mudar alguma altura. Dependências: as do build_refs.py + opencv-python-headless.
Entorno: © colaboradores do OpenStreetMap (ODbL).
"""

import base64, json, math, os, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'docs', 'prompt-aerea-v12'))
import build_refs as br                                            # noqa: E402

OUT = os.path.join(ROOT, '3dmasterplan', 'data')
PLANTA = os.path.join(ROOT, 'docs', 'masterplan-v14', 'BRACERUM_PARK_V14_2026-10-28_lotes_identificados.pdf')
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



def planta_v14():
    """A planta V14 sem texto (build_refs.planta), em cache: renderizar a prancha leva ~3 min."""
    br.PDF = PLANTA
    os.makedirs(br.CACHE, exist_ok=True)
    f = os.path.join(br.CACHE, 'planta-v14.npz')
    if os.path.exists(f) and os.path.getmtime(f) > os.path.getmtime(PLANTA):
        d = np.load(f)
        return d['plano'], tuple(float(v) for v in d['sheet'])
    plano, sheet = br.planta()
    np.savez_compressed(f, plano=plano, sheet=np.array(sheet))
    return plano, sheet


def ret_girado(cx, cy, comp, larg, ang):
    """Retângulo em metros, centrado em (cx, cy), girado `ang` radianos."""
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + i * comp / 2 * ca - j * larg / 2 * sa, cy + i * comp / 2 * sa + j * larg / 2 * ca)
            for i, j in ((-1, -1), (1, -1), (1, 1), (-1, 1))]


class Maquete14(Maquete3D):
    """Volumes do V14 (28/10/2026). Mesmas regras e alturas da maquete do V12; as caixas (em % da
    prancha) dizem onde está cada coisa nesta versão. Alturas são estimativas."""

    def encolher(self, comps, margem, h, tag):
        """Prédio dentro do lote: a mancha do lote recuada `margem` metros."""
        for c in comps:
            m = ndi.binary_erosion(c['lab'][c['sl']] == c['i'], iterations=max(1, round(margem * br.K)))
            for pts in contornos(m, c['sl'][1].start, c['sl'][0].start, 1.0):
                self.poligono(pts, h, tag)

    def casa_no_lote(self, c, h=7, tag='casa', larg_max=12, comp_max=15):
        gy, gx = self.grade(c)
        gy, gx = gy * self.res, gx * self.res
        cy, cx = gy.mean(), gx.mean()
        ev, vec = np.linalg.eigh(np.cov(np.vstack([gx - cx, gy - cy])))
        L, S = 3.4 * math.sqrt(ev[1]), 3.4 * math.sqrt(ev[0])
        a, b = min(comp_max, L * 0.55) / 2, min(larg_max, S * 0.72) / 2
        self.poligono([(cx + i * a * vec[0, 1] + j * b * vec[0, 0], cy + i * a * vec[1, 1] + j * b * vec[1, 0])
                       for i, j in ((-1, -1), (1, -1), (1, 1), (-1, 1))], h, tag)
        return math.atan2(vec[1, 1], vec[0, 1])

    def montar(self):
        rgb, dentro, res = self.rgb, self.dentro, self.res
        caixa = lambda c, x0, y0, x1, y1: x0 <= c['cx'] <= x1 and y0 <= c['cy'] <= y1
        celulas = lambda metros: max(1, round(metros / res))

        # lotes industriais -> galpões, como no V12 (a quadra de 400 m da Q38+Q39 ganha dois galpões)
        lotes = (np.abs(rgb - np.array([165, 221, 110])).max(-1) <= 14) & dentro
        lotes = self.componentes(ndi.binary_closing(lotes, structure=np.ones((5, 5))), 4000, 40000)
        for n, c in enumerate(sorted(lotes, key=lambda c: (round(c['cy']), c['cx']))):
            gy, gx = self.grade(c)
            M = np.zeros((gy.max() - gy.min() + 1, gx.max() - gx.min() + 1), bool)
            M[gy - gy.min(), gx - gx.min()] = True
            r0, c0, r1, c1 = self.maior_retangulo(ndi.binary_erosion(M, iterations=celulas(2)))
            X0, Y0, X1, Y1 = [v * res for v in (gx.min() + c0, gy.min() + r0, gx.min() + c1, gy.min() + r1)]
            w, d = X1 - X0, Y1 - Y0
            if w < 40 or d < 22:
                continue
            if d < 30:
                self.retangulo(X0 + 8, Y0 + 5, X1 - 8, Y1 - 5, 10, 'galpão'); continue
            mx = 14 if w > 120 else 8
            ya, yb = (8, 26) if n % 2 == 0 else (26, 8)
            bx0, bx1, by0, by1 = X0 + mx, X1 - mx, Y0 + ya, Y1 - yb
            tipo = (n * 37) % 20
            if bx1 - bx0 > 300:
                m = (bx0 + bx1) / 2
                self.retangulo(bx0, by0, m - 12, by1, 12, 'galpão'); self.retangulo(m + 12, by0, bx1, by1, 12, 'galpão')
            elif tipo <= 12 or bx1 - bx0 < 120:
                self.retangulo(bx0, by0, bx1, by1, 12, 'galpão')
            elif tipo <= 16:
                m = (bx0 + bx1) / 2
                self.retangulo(bx0, by0, m - 6, by1, 11, 'galpão'); self.retangulo(m + 6, by0, bx1, by1, 11, 'galpão')
            else:
                p = (bx1 - bx0 + 6) / 4
                for j in range(4):
                    self.retangulo(bx0 + j * p, by0, bx0 + (j + 1) * p - 6, by1, 9, 'galpão')

        branco = self.componentes((rgb.min(-1) >= 245) & dentro, 40, 12000)
        sel = lambda x0, y0, x1, y1, a0, a1, f=0.0: [c for c in branco if caixa(c, x0, y0, x1, y1)
                                                    and a0 <= c['area'] <= a1 and c['fill'] >= f]

        # Bracerum Condo: 67 torres. As de 1 quarto vêm desenhadas em três peças (ala, núcleo, ala),
        # unidas aqui por um fechamento; 16 de 1 quarto (24 unid., 6 pav.), 39 em cruz de 2 quartos e
        # 12 retangulares de 3 quartos (16 unid., 4 pav.)
        pecas = [c for c in sel(65.5, 19.5, 85.5, 63, 140, 460, 0.7) if max(c['bw'], c['bh']) <= 30]
        tm = np.zeros(dentro.shape, bool)
        for c in pecas:
            tm[c['sl']] |= c['lab'][c['sl']] == c['i']
        tl, tn = ndi.label(ndi.binary_closing(tm, structure=np.ones((5, 5))))
        for i, sl in enumerate(ndi.find_objects(tl)):
            m = tl[sl] == i + 1
            area = m.sum() / br.K / br.K
            if area < 200:
                continue
            h, tag = (19, 'torre1') if area > 480 else (13, 'torre')
            for pts in contornos(m, sl[1].start, sl[0].start, 1.0):
                self.poligono(pts, h, tag)

        # Bracerum Resort: 31 lotes na borda de baixo, uma casa por lote; portaria e salão de festas
        for c in sel(65.5, 64, 77, 82.8, 450, 1600, 0.35):
            self.casa_no_lote(c)
        self.extrudar(sel(70.3, 65.3, 70.8, 66.2, 250, 350), 5, 'portaria resort')
        for c in sel(66.2, 82.8, 66.8, 83.8, 1500, 1900):
            X, Y = self.pc(c['cx'], c['cy'])
            self.retangulo(X - 13, Y - 9, X + 13, Y + 9, 7, 'salão de festas')

        # ponta norte: Centro Tecnológico + Espaço Business (4 pavimentos), hotel, casca
        self.extrudar(sel(74, 15, 77, 18.5, 800, 1300), 15, 'centro tecnológico')
        hotel = self.componentes((np.abs(rgb - 190).max(-1) <= 3) & dentro, 1500, 4000)
        self.extrudar([c for c in hotel if caixa(c, 80, 15, 85, 21)], 36, 'hotel')
        casca = (np.abs(rgb - np.array([242, 242, 255])).max(-1) <= 6) & dentro
        for c in [c for c in self.componentes(casca, 3000, 30000) if caixa(c, 80, 6, 96, 22)]:
            gy, gx = self.grade(c)
            M = np.zeros((gy.max() - gy.min() + 1, gx.max() - gx.min() + 1), bool)
            M[gy - gy.min(), gx - gx.min()] = True
            M = ndi.binary_closing(M, iterations=celulas(3))
            dist = ndi.distance_transform_edt(M)
            yy, xx = np.nonzero(M)
            hs = (21 * np.sqrt(np.clip(dist / max(dist.max(), 1), 0, 1)))[yy, xx].astype(np.float32)
            self.mascara(yy + gy.min(), xx + gx.min(), 0, 'casca', hs=hs)
        # canto nordeste: corpo de bombeiros e posto policial (a planta só desenha os lotes), posto de
        # saúde/ambulatório (a planta marca uma cruz), escola em arco, creche e E.T.A.
        bomb = sel(93.3, 13.8, 94, 15, 450, 700)
        ang = self.casa_no_lote(bomb[0], h=7, tag='bombeiros', larg_max=16, comp_max=20) if bomb else 0.6
        X, Y = self.pc(92.86, 13.46)
        self.poligono(ret_girado(X, Y, 18, 13, ang), 6, 'policial')
        X, Y = self.pc(93.58, 17.87)
        self.retangulo(X - 18, Y - 13, X + 18, Y + 13, 8, 'ambulatório')
        self.extrudar(sel(95.4, 18, 97.4, 21.2, 150, 1400), 9, 'escola')
        self.extrudar(sel(95, 22.3, 95.4, 22.8, 300, 450), 6, 'creche')
        self.extrudar(sel(92.5, 24.3, 95.6, 25.6, 60, 200), 5, 'ETA')
        # Bracerum Club: salão de eventos, bar e vestiários junto às quadras
        self.extrudar(sel(89.8, 29.8, 90.6, 30.4, 2500, 3300, 0.9), 9, 'salão de eventos')
        self.extrudar(sel(86.3, 32.8, 86.7, 33.2, 500, 650), 5, 'bar')
        self.extrudar(sel(80.7, 30, 81, 36.2, 150, 250), 4, 'vestiário')

        # comércio: Bracerum Outlet em L (sem prédio desenhado), supermercado + lojas e docas
        self.retangulo_pct(49.8, 12.0, 64.8, 14.4, 8, 'outlet')
        self.retangulo_pct(66.6, 15.5, 68.2, 38.0, 8, 'outlet')
        self.extrudar(sel(66.4, 46, 67, 47, 4000, 5000), 9, 'supermercado')
        self.extrudar(sel(65.8, 40.5, 66.3, 41.3, 900, 1200), 7, 'docas')

        # entrada: posto em L, Gate-1, Gate-2 e apoio do pátio de caminhões
        self.extrudar(sel(39, 13, 49, 20, 150, 1700, 0.3), 6, 'posto e portaria')

        # aeroporto, recinto alfandegado (10 lotes, um galpão em cada) e infraestrutura (como no V12)
        self.extrudar(sel(6, 65.5, 14, 68.3, 450, 1500), 12, 'hangar')
        self.extrudar(sel(14, 66, 16.5, 68.5, 900, 1400), 6, 'abastecimento')
        self.encolher(sel(16.5, 66, 22.8, 77, 1300, 1700, 0.9), 4, 10, 'recinto')
        self.extrudar(sel(7, 61, 9, 62.2, 200, 400) + sel(8.2, 56.8, 8.8, 57.7, 150, 300), 5, 'ETE')
        self.extrudar(sel(10.5, 59.5, 11.3, 61.6, 600, 800) + sel(11.2, 55.2, 11.8, 56.0, 400, 600), 5, 'subestação')
        self.extrudar(sel(12.4, 57.5, 13.0, 59.5, 3500, 4500), 9, 'galpões de manutenção')
        self.retangulo_pct(11.95, 37.2, 12.55, 38.2, 7, 'administração')

        # junto à pista: refeitório, grêmio e o Hub de serviços (8 lotes em faixa, um galpão em cada)
        self.extrudar(sel(50.4, 83.8, 51, 84.6, 2800, 3500, 0.8), 8, 'refeitório')
        self.extrudar(sel(53.3, 83.9, 53.7, 84.7, 350, 500), 6, 'grêmio')
        self.encolher(sel(57, 83, 65, 88, 1000, 1800, 0.8), 4, 10, 'hub de serviços')
        return self

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
    print('planta V14…')
    plano, sheet = planta_v14()
    data = br.osm()
    geo = br.Geo(data, sheet)
    print('volumes…')
    maq = Maquete14(plano, sheet, res=RES).montar()
    vol = []
    for v in maq.vol:
        if v['t'] == 'outlet':
            vol += dividir(v, 52, 9)
        else:
            vol.append(v)
    for k, n in sorted(maq.conta.items()):
        print(f'  {k:32s} {n}')
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
        'fonte': 'BRACERUM PARK — Masterplan V14 (28/10/2026, lotes identificados), escala 1:1000',
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
    }
    with open(os.path.join(OUT, 'scene.json'), 'w', encoding='utf-8') as fh:
        json.dump(cena, fh, ensure_ascii=False, separators=(',', ':'))
    for f in sorted(os.listdir(OUT)):
        print(f'  {f:14s} {os.path.getsize(os.path.join(OUT, f)) / 1024:8.0f} KB')
    print('pronto.')


if __name__ == '__main__':
    main()
