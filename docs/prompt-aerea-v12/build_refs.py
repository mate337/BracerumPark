#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o kit de referências do prompt da vista aérea do Masterplan V12.

    python3 docs/prompt-aerea-v12/build_refs.py      # da raiz do repositório

Escreve em docs/prompt-aerea-v12/:
  ref-A-camera-volumes.png   câmera exata + maquete de volumes sobre a planta e o entorno real
  ref-A90-zenital-volumes.png  a mesma maquete vista de cima (variação 90°), na mesma orientação
  ref-B-planta-v12.png       a planta V12 vista de cima, sem nenhum texto
  ref-C-situacao.jpg         o terreno no entorno real (PY-19, rios, matas), vista de cima
  ref-D-estilo.jpg … ref-H-servicos.jpg   renders do cliente, com o vermelho neutralizado

PRECISA RODAR DE NOVO SE:
  - o cliente mandar outra versão da planta (trocar PDF e conferir DOBRA_PLANTA);
  - mudar a câmera (CAMERA, CAMERA90) ou a escolha de fotos (COLAGENS).

POR QUE ELE EXISTE
Gerador de imagem não segue uma planta de 33 setores só com texto. O que segura a
implantação é uma imagem-guia na câmera exata, com os volumes no lugar. Este script:
  1. tira todo o texto do PDF (pikepdf) — senão o gerador copia rótulos para a imagem;
  2. georreferencia a planta: a PY-19 faz uma única curva nesse trecho, e é nela que o V12
     desenha a dobra da rodovia na ponta norte do parque. Com a dobra da planta sobre a curva
     real e a frente alinhada ao rumo do trecho sul (~168,9°), a planta cai no lugar
     (escala 1:1000, 1 mm da prancha = 1 m);
  3. desenha o entorno real a partir do OpenStreetMap (© colaboradores do OSM, ODbL);
  4. levanta um campo de alturas de 1 m com os volumes lidos da própria planta (galpões nos
     41 lotes, 38 torres em H, casas do resort, hotel, casca do centro de convenções…) e
     renderiza por marcha de raios na câmera da vista aérea.
As alturas são estimativas: o V12 não define altura de nada.

DEPENDÊNCIAS
  pip install numpy pillow scipy pikepdf      e o poppler-utils (pdftoppm)
  Internet na primeira execução (Overpass API); a resposta fica em cache em $TMPDIR.
"""

import json, math, os, subprocess, tempfile, time, urllib.parse, urllib.request
import numpy as np
import pikepdf
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PDF = os.path.join(ROOT, 'docs', 'masterplan-v12', 'BRACERUM_PARK_V12_2026-10-01.pdf')
CACHE = os.path.join(tempfile.gettempdir(), 'bp-aerea-v12')

DPI = 80
K = DPI / 25.4                          # px por metro da planta renderizada
PARK = (-25.771694, -57.732389)         # ponto do parque no site = a curva da PY-19
DOBRA_PLANTA = (0.908, 0.0738)          # vértice da dobra da rodovia no V12 (fração da prancha)
CAMERA = dict(Xc=880, Yc=2160, Zc=1650, yaw=6, pitch=36.3, hfov=66, w=1536, h=1024, ss=2)
LUZ = (-0.55, 0.45, 0.70)               # só dá volume à guia; a luz da imagem final vem do prompt
CAMERA90 = dict(cx=1289, cy=606, largura=2790, w=1536, h=1024, ss=2)   # vista de cima, metros da prancha
LUZ90 = (-0.62, -0.50, 0.60)            # do canto superior esquerdo, ~37° — a luz da aérea aprovada
CTX_BOX = (-3000, -6500, 7000, 3000)    # entorno desenhado, em metros no referencial da planta
MPP = 2.5                               # metros por pixel do entorno
BBOX = '-25.86,-57.85,-25.68,-57.62'    # sul, oeste, norte, leste
OVERPASS = ('https://maps.mail.ru/osm/tools/overpass/api/interpreter',
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter')
COLAGENS = {   # arquivo: (fotos, colunas, linhas, altura do quadro)
    'ref-E-hotel-convencoes.jpg': (['assets/web/fotos/hotel-cupula-dia.jpg', 'assets/park/resort-implantacao.jpg',
                                    'assets/web/fotos/hotel-cupula-piscina.jpg', 'assets/web/fotos/hotel-fachada-varandas.jpg'], 2, 2, 512),
    'ref-F-industrial-vias.jpg': (['assets/web/fotos/park-boulevard-aereo-2.jpg', 'assets/web/fotos/galpao-portico-azul.jpg',
                                   'assets/web/fotos/vias-rotatoria.jpg', 'assets/web/fotos/portaria.jpg'], 2, 2, 512),
    'ref-G-resort.jpg': (['assets/park/resort-clubhouse.jpg', 'assets/web/fotos/resort-lago.jpg',
                          'assets/web/fotos/resort-casas-rua.jpg', 'assets/web/fotos/amen-piscina-quincho.jpg'], 2, 2, 512),
    'ref-H-servicos.jpg': (['assets/web/fotos/aero-pista-aerea.jpg', 'assets/web/fotos/hangar-bracerum.jpg',
                            'assets/park/select-posto-cobertura.jpg', 'assets/park/select-fachada-brises.jpg',
                            'assets/park/tec-fachada.jpg', 'assets/park/ete-eta.jpg'], 2, 3, 432),
}


# --------------------------------------------------------------------------- planta
def planta():
    """PDF sem texto, a 80 dpi, sem carimbo/logo/quadro, sem vermelho e com o fundo transparente."""
    pdf = pikepdf.open(PDF)
    page = pdf.pages[0]
    keep, intext = [], False
    for operands, op in pikepdf.parse_content_stream(page):
        o = str(op)
        if o == 'BT':
            intext = True
        elif o == 'ET':
            intext = False
        elif not intext:
            keep.append((operands, op))
    page.Contents = pdf.make_stream(pikepdf.unparse_content_stream(keep))
    box = [float(v) for v in page.mediabox]
    sheet = ((box[2] - box[0]) / 72 * 25.4, (box[3] - box[1]) / 72 * 25.4)
    tmp = os.path.join(CACHE, 'planta-sem-texto.pdf')
    pdf.save(tmp)
    subprocess.run(['pdftoppm', '-r', str(DPI), '-png', '-singlefile', tmp, os.path.join(CACHE, 'planta')],
                   check=True, stderr=subprocess.DEVNULL)
    im = Image.open(os.path.join(CACHE, 'planta.png')).convert('RGB')
    W, H = im.size
    d = ImageDraw.Draw(im)
    # carimbo, logo Bracerum, rosa dos ventos, quadro de áreas e moldura
    for x0, y0, x1, y1 in ((0, 0, 100, 5.0), (0, 0, 14.5, 26), (93, 4.4, 100, 12.6), (85.45, 46.3, 100, 100),
                           (0, 97.6, 100, 100), (0, 0, 0.7, 100), (99.3, 0, 100, 100)):
        d.rectangle((x0 * W / 100, y0 * H / 100, x1 * W / 100, y1 * H / 100), fill=(255, 255, 255))
    a = np.array(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = (r > 150) & (r - np.maximum(g, b) > 55)          # cruz, quadras, tracejados, hotel
    hotel = red & (g > 60) & (g < 120) & (b < 90)          # o laranja do hotel vira marcador cinza 190
    a[red] = 214
    a[hotel] = 190
    lab, _ = ndi.label((a >= 250).all(-1))
    borda = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    fora = np.isin(lab, borda[borda > 0])
    return np.dstack([a.astype(np.uint8), np.where(fora, 0, 255).astype(np.uint8)]), sheet


def recolorir(rgba):
    """Cores neutras para a guia: lotes bege (pavimento), verde e água foscos."""
    a = rgba.copy()
    rgb = a[..., :3].astype(int)
    for de, para, tol in (((165, 221, 110), (224, 220, 210), 10), ((0, 184, 0), (118, 158, 84), 25),
                          ((74, 183, 248), (104, 146, 170), 20)):
        a[np.abs(rgb - np.array(de)).max(-1) <= tol, :3] = para
    return a


# --------------------------------------------------------------------------- OSM e georreferência
def osm():
    f = os.path.join(CACHE, 'osm.json')
    if os.path.exists(f):
        with open(f) as fh:
            return json.load(fh)
    q = (f'[out:json][timeout:120];(way["natural"="water"]({BBOX});relation["natural"="water"]({BBOX});'
         f'way["waterway"]({BBOX});way["highway"~"trunk|primary|secondary|tertiary|unclassified|track"]({BBOX});'
         f'way["natural"~"wood|wetland|scrub"]({BBOX});relation["natural"~"wood|wetland"]({BBOX});'
         f'way["landuse"]({BBOX});relation["landuse"]({BBOX}););out geom;')
    body = urllib.parse.urlencode({'data': q}).encode()
    for tentativa in range(3):
        for url in OVERPASS:
            try:
                req = urllib.request.Request(url, data=body, headers={'User-Agent': 'BracerumPark-docs/1.0'})
                with urllib.request.urlopen(req, timeout=180) as resp:
                    data = json.loads(resp.read())
                with open(f, 'w') as fh:
                    json.dump(data, fh)
                return data
            except Exception as e:                                   # servidor ocupado: tenta o próximo
                print('  overpass falhou:', url, type(e).__name__)
        time.sleep(10 * (tentativa + 1))
    raise SystemExit('Overpass indisponível — tente de novo mais tarde.')


LAT0, LON0 = PARK
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110540


def enu(lat, lon):
    return (lon - LON0) * KX, (lat - LAT0) * KY


class Geo:
    """Transformação terreno (E, N em metros a partir do PARK) <-> prancha (X para a direita, Y para baixo)."""

    def __init__(self, data, sheet):
        segs = [[(n, (g['lat'], g['lon'])) for n, g in zip(e['nodes'], e['geometry'])]
                for e in data['elements'] if e['type'] == 'way'
                and e.get('tags', {}).get('ref', '').replace(' ', '').replace('-', '') == 'PY19']
        line = segs.pop(0)
        mudou = True
        while segs and mudou:
            mudou = False
            for s in segs:
                if s[0][0] == line[-1][0]: line += s[1:]
                elif s[-1][0] == line[0][0]: line = s[:-1] + line
                elif s[-1][0] == line[-1][0]: line += s[::-1][1:]
                elif s[0][0] == line[0][0]: line = s[::-1][:-1] + line
                else: continue
                segs.remove(s); mudou = True; break
        P = [enu(la, lo) for _, (la, lo) in line]
        if P[0][1] < P[-1][1]:
            P = P[::-1]                                              # do norte para o sul
        cum = [0.0]
        for i in range(1, len(P)):
            cum.append(cum[-1] + math.dist(P[i - 1], P[i]))
        i0 = min(range(len(P)), key=lambda i: P[i][0] ** 2 + P[i][1] ** 2)

        def em(s):
            s += cum[i0]
            for i in range(1, len(P)):
                if cum[i] >= s:
                    t = (s - cum[i - 1]) / (cum[i] - cum[i - 1])
                    return P[i - 1][0] + t * (P[i][0] - P[i - 1][0]), P[i - 1][1] + t * (P[i][1] - P[i - 1][1])
            return P[-1]
        a1, a2, b1, b2 = em(-1500), em(-500), em(500), em(2000)
        d = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0])
        t = ((a1[0] - b1[0]) * (b1[1] - b2[1]) - (a1[1] - b1[1]) * (b1[0] - b2[0])) / d
        self.B = (a1[0] + t * (a2[0] - a1[0]), a1[1] + t * (a2[1] - a1[1]))     # a curva
        self.rumo_sul = (math.degrees(math.atan2(b2[0] - b1[0], b2[1] - b1[1])) + 360) % 360
        self.A = math.atan2(math.sin(math.radians(self.rumo_sul)), -math.cos(math.radians(self.rumo_sul)))
        self.sheet = sheet
        self.XB, self.YB = DOBRA_PLANTA[0] * sheet[0], DOBRA_PLANTA[1] * sheet[1]

    def para_planta(self, E, N):
        dE, dN = E - self.B[0], N - self.B[1]
        sa, ca = math.sin(self.A), math.cos(self.A)
        return self.XB - dE * sa + dN * ca, self.YB + dE * ca + dN * sa

    def latlon(self, X, Y):
        dx, dy = X - self.XB, Y - self.YB
        sa, ca = math.sin(self.A), math.cos(self.A)
        E, N = self.B[0] - dx * sa + dy * ca, self.B[1] + dx * ca + dy * sa
        return LAT0 + N / KY, LON0 + E / KX


# --------------------------------------------------------------------------- entorno
CORES = {'fundo': (214, 216, 182), 'meadow': (206, 213, 170), 'farmland': (222, 214, 176), 'wood': (104, 132, 88),
         'scrub': (170, 182, 138), 'wetland': (183, 196, 160), 'water': (122, 150, 166), 'residential': (210, 202, 190),
         'farmyard': (210, 202, 190), 'industrial': (196, 192, 200), 'orchard': (160, 176, 120), 'via': (92, 92, 92),
         'estrada': (180, 168, 140)}


def entorno(data, geo, plano_guia):
    x0, y0, x1, y1 = CTX_BOX
    img = Image.new('RGB', (int((x1 - x0) / MPP), int((y1 - y0) / MPP)), CORES['fundo'])
    dr = ImageDraw.Draw(img)

    def tp(lat, lon):
        X, Y = geo.para_planta(*enu(lat, lon))
        return (X - x0) / MPP, (Y - y0) / MPP

    def aneis(e, papel):
        segs = [[(g['lat'], g['lon']) for g in m['geometry']] for m in e['members']
                if m.get('role', papel) == papel and m.get('geometry')]
        chave = lambda p: (round(p[0], 7), round(p[1], 7))
        out = []
        while segs:
            cur = segs.pop(0)
            while chave(cur[0]) != chave(cur[-1]):
                for s in segs:
                    if chave(s[0]) == chave(cur[-1]): cur = cur + s[1:]
                    elif chave(s[-1]) == chave(cur[-1]): cur = cur + s[::-1][1:]
                    elif chave(s[-1]) == chave(cur[0]): cur = s[:-1] + cur
                    elif chave(s[0]) == chave(cur[0]): cur = s[::-1][:-1] + cur
                    else: continue
                    segs.remove(s); break
                else:
                    break
            out.append(cur)
        return out

    def classe(t):
        if t.get('natural') == 'water' or t.get('landuse') == 'reservoir': return 'water'
        if t.get('natural') == 'wood' or t.get('landuse') == 'forest': return 'wood'
        if t.get('natural') in ('wetland', 'scrub'): return t['natural']
        return t.get('landuse') if t.get('landuse') in CORES else None

    els = data['elements']
    for c in ('meadow', 'farmland', 'orchard', 'residential', 'farmyard', 'industrial', 'scrub', 'wetland', 'wood', 'water'):
        for e in els:
            t = e.get('tags', {})
            if classe(t) != c or 'highway' in t:
                continue
            if e['type'] == 'way':
                pts = [tp(g['lat'], g['lon']) for g in e['geometry']]
                if len(pts) > 2: dr.polygon(pts, fill=CORES[c])
            else:
                for r_ in aneis(e, 'outer'):
                    if len(r_) > 2: dr.polygon([tp(*p) for p in r_], fill=CORES[c])
                for r_ in aneis(e, 'inner'):
                    if len(r_) > 2: dr.polygon([tp(*p) for p in r_], fill=CORES['fundo'])
    for e in els:
        t = e.get('tags', {})
        if e['type'] == 'way' and 'waterway' in t and t.get('natural') != 'water':
            w = {'river': 10, 'stream': 3, 'canal': 3}.get(t['waterway'], 2)
            dr.line([tp(g['lat'], g['lon']) for g in e['geometry']], fill=CORES['water'], width=w, joint='curve')
    for nivel in ('estrada', 'via'):
        for e in els:
            hw = e.get('tags', {}).get('highway')
            if e['type'] != 'way' or not hw or (hw in ('trunk', 'primary')) != (nivel == 'via'):
                continue
            w = 6 if nivel == 'via' else {'tertiary': 4, 'unclassified': 3}.get(hw, 2)
            dr.line([tp(g['lat'], g['lon']) for g in e['geometry']], fill=CORES[nivel], width=w, joint='curve')
    base = img.convert('RGBA')
    p = Image.fromarray(plano_guia, 'RGBA')
    s = 1 / (K * MPP)
    base.alpha_composite(p.resize((int(p.size[0] * s), int(p.size[1] * s)), Image.LANCZOS),
                         (int(-x0 / MPP), int(-y0 / MPP)))
    return base.convert('RGB')


# --------------------------------------------------------------------------- volumes (campo de alturas de 1 m)
class Maquete:
    MATS = {'galpão': 1, 'hotel': 2, 'casca': 3}

    def __init__(self, rgba, sheet):
        self.rgb = rgba[..., :3].astype(int)
        self.dentro = rgba[..., 3] > 0
        self.sheet = sheet
        self.GW, self.GH = int(math.ceil(sheet[0])), int(math.ceil(sheet[1]))
        self.HF = np.zeros((self.GH, self.GW), np.float32)
        self.ID = np.zeros((self.GH, self.GW), np.int32)
        self.MAT = np.zeros((self.GH, self.GW), np.uint8)
        self.n = 0
        self.conta = {}

    def pc(self, x, y):
        return x / 100 * self.sheet[0], y / 100 * self.sheet[1]

    def mascara(self, gy, gx, h, tag, hs=None):
        self.n += 1
        alt = np.full(len(gy), h, np.float32) if hs is None else hs
        sel = alt >= self.HF[gy, gx]
        self.HF[gy[sel], gx[sel]] = alt[sel]
        self.ID[gy[sel], gx[sel]] = self.n
        self.MAT[gy[sel], gx[sel]] = self.MATS.get(tag, 4)
        self.conta[tag] = self.conta.get(tag, 0) + 1

    def poligono(self, pts, h, tag):
        img = Image.new('L', (self.GW, self.GH), 0)
        ImageDraw.Draw(img).polygon([tuple(p) for p in pts], fill=1)
        gy, gx = np.nonzero(np.array(img))
        if len(gx):
            self.mascara(gy, gx, h, tag)

    def retangulo(self, x0, y0, x1, y1, h, tag):
        self.poligono([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], h, tag)

    def retangulo_pct(self, x0, y0, x1, y1, h, tag):
        (a, b), (c, d) = self.pc(x0, y0), self.pc(x1, y1)
        self.retangulo(a, b, c, d, h, tag)

    def componentes(self, mask, min_m2, max_m2):
        lab, n = ndi.label(mask)
        areas = ndi.sum(mask, lab, index=np.arange(1, n + 1))
        H, W = mask.shape
        out = []
        for i, sl in enumerate(ndi.find_objects(lab)):
            ar = areas[i] / K / K
            if sl is None or not (min_m2 <= ar <= max_m2):
                continue
            ys, xs = sl
            out.append(dict(i=i + 1, sl=sl, lab=lab, area=ar,
                            cx=(xs.start + xs.stop) / 2 / W * 100, cy=(ys.start + ys.stop) / 2 / H * 100,
                            bw=(xs.stop - xs.start) / K, bh=(ys.stop - ys.start) / K,
                            fill=areas[i] / ((xs.stop - xs.start) * (ys.stop - ys.start))))
        return out

    def grade(self, c):
        ys, xs = np.nonzero(c['lab'][c['sl']] == c['i'])
        ys = ((ys + c['sl'][0].start) / K).astype(int)
        xs = ((xs + c['sl'][1].start) / K).astype(int)
        ok = (ys >= 0) & (ys < self.GH) & (xs >= 0) & (xs < self.GW)
        return ys[ok], xs[ok]

    def extrudar(self, comps, h, tag):
        for c in comps:
            self.mascara(*self.grade(c), h, tag)

    @staticmethod
    def maior_retangulo(M):
        alt = np.zeros(M.shape[1], int)
        melhor = (0, None)
        for r in range(M.shape[0]):
            alt = np.where(M[r], alt + 1, 0)
            pilha = []
            for c in range(M.shape[1] + 1):
                cur = alt[c] if c < M.shape[1] else 0
                ini = c
                while pilha and pilha[-1][1] >= cur:
                    s, hh = pilha.pop()
                    if hh * (c - s) > melhor[0]:
                        melhor = (hh * (c - s), (r - hh + 1, s, r, c - 1))
                    ini = s
                pilha.append((ini, cur))
        return melhor[1]

    def montar(self):
        rgb, dentro = self.rgb, self.dentro
        caixa = lambda c, x0, y0, x1, y1: x0 <= c['cx'] <= x1 and y0 <= c['cy'] <= y1

        # 41 lotes -> galpões (pátio de caminhões alterna de lado; alguns lotes divididos)
        lotes = (np.abs(rgb - np.array([165, 221, 110])).max(-1) <= 14) & dentro
        lotes = self.componentes(ndi.binary_closing(lotes, structure=np.ones((5, 5))), 4000, 40000)
        for n, c in enumerate(sorted(lotes, key=lambda c: (round(c['cy']), c['cx']))):
            gy, gx = self.grade(c)
            M = np.zeros((gy.max() - gy.min() + 1, gx.max() - gx.min() + 1), bool)
            M[gy - gy.min(), gx - gx.min()] = True
            r0, c0, r1, c1 = self.maior_retangulo(ndi.binary_erosion(M, iterations=2))
            X0, Y0, X1, Y1 = gx.min() + c0, gy.min() + r0, gx.min() + c1, gy.min() + r1
            w, d = X1 - X0, Y1 - Y0
            if w < 40 or d < 22:
                continue
            if d < 30:
                self.retangulo(X0 + 8, Y0 + 5, X1 - 8, Y1 - 5, 10, 'galpão'); continue
            mx = 14 if w > 120 else 8
            ya, yb = (8, 26) if n % 2 == 0 else (26, 8)
            bx0, bx1, by0, by1 = X0 + mx, X1 - mx, Y0 + ya, Y1 - yb
            tipo = (n * 37) % 20
            if tipo <= 12 or bx1 - bx0 < 120:
                self.retangulo(bx0, by0, bx1, by1, 12, 'galpão')
            elif tipo <= 16:
                m = (bx0 + bx1) / 2
                self.retangulo(bx0, by0, m - 6, by1, 11, 'galpão'); self.retangulo(m + 6, by0, bx1, by1, 11, 'galpão')
            else:
                p = (bx1 - bx0 + 6) / 4
                for j in range(4):
                    self.retangulo(bx0 + j * p, by0, bx0 + (j + 1) * p - 6, by1, 9, 'galpão')

        branco = self.componentes((rgb.min(-1) >= 245) & dentro, 60, 12000)
        sel = lambda x0, y0, x1, y1, a0, a1, f=0.0: [c for c in branco if caixa(c, x0, y0, x1, y1)
                                                    and a0 <= c['area'] <= a1 and c['fill'] >= f]
        # condomínio vertical: 38 torres em H (16 aptos, 16 vagas -> 4 pavimentos)
        self.extrudar([c for c in sel(64, 46, 83, 93, 180, 420) if max(c['bw'], c['bh']) <= 32], 13, 'torre')
        # resort: uma casa por lote, alinhada ao eixo do lote
        for c in sel(70.5, 16.5, 85.3, 43.8, 240, 1300, 0.3):
            if c['cx'] > 81.5 and c['cy'] < 26.6:                    # estacionamento do hotel
                continue
            gy, gx = self.grade(c)
            if len(gx) < 50:
                continue
            cy, cx = gy.mean(), gx.mean()
            ev, vec = np.linalg.eigh(np.cov(np.vstack([gx - cx, gy - cy])))
            L, S = 3.4 * math.sqrt(ev[1]), 3.4 * math.sqrt(ev[0])
            if L / max(S, 1) > 4.5:
                continue
            a, b = min(15, L * 0.55) / 2, min(12, S * 0.75) / 2
            self.poligono([(cx + i * a * vec[0, 1] + j * b * vec[0, 0], cy + i * a * vec[1, 1] + j * b * vec[1, 0])
                           for i, j in ((-1, -1), (1, -1), (1, 1), (-1, 1))], 7, 'casa')
        self.extrudar(sel(85.3, 29.5, 88.6, 34.2, 60, 1500, 0.35), 7, 'casa-clube')
        self.extrudar(sel(93, 16, 97.5, 21, 2000, 3500), 9, 'escola')
        self.extrudar(sel(70, 12, 73.5, 15.5, 900, 1300), 10, 'centro tecnológico')
        self.extrudar(sel(81, 11.5, 84, 14, 2500, 3300), 10, 'salão de eventos')
        self.extrudar(sel(39, 13, 49, 20, 150, 1100, 0.3), 6, 'posto e portaria')
        self.extrudar(sel(6, 65.5, 14, 68.3, 450, 1500), 12, 'hangar')
        self.extrudar(sel(14, 66, 16.5, 68.5, 900, 1400), 6, 'abastecimento')
        self.extrudar(sel(7, 61, 9, 62.2, 200, 400) + sel(8.2, 56.8, 8.8, 57.7, 150, 300), 5, 'ETE')
        self.extrudar(sel(10.5, 59.5, 11.3, 61.6, 600, 800) + sel(11.2, 55.2, 11.8, 56.0, 400, 600), 5, 'subestação')
        self.extrudar(sel(12.4, 57.5, 13.0, 59.5, 3500, 4500), 9, 'galpões de manutenção')
        self.extrudar(sel(92.5, 24.8, 94.3, 25.6, 100, 200), 5, 'ETA')
        self.extrudar(sel(50, 83.5, 56, 85.5, 1800, 3400, 0.8), 7, 'refeitório, creche, ambulatório')
        self.extrudar(sel(63, 86.5, 63.8, 87.6, 350, 500), 5, 'grêmio')
        self.extrudar(sel(72.8, 64.8, 73.6, 65.8, 1000, 1300), 7, 'salão de festas')
        hub = sel(59, 84.5, 61.5, 86.5, 8000, 10000)
        if hub:
            gy, gx = self.grade(hub[0])
            self.retangulo(gx.mean() - 55, gy.mean() - 22, gx.mean() + 55, gy.mean() + 22, 10, 'hub de serviços')
        # hotel (era laranja no desenho), conector e a casca do centro de convenções
        hotel = self.componentes((np.abs(rgb - 190).max(-1) <= 3) & dentro, 1500, 4000)
        self.extrudar([c for c in hotel if caixa(c, 83, 15, 89, 20)], 36, 'hotel')
        self.retangulo_pct(87.3, 15.95, 88.05, 18.6, 22, 'hotel')
        casca = (np.abs(rgb - np.array([242, 242, 255])).max(-1) <= 6) & dentro
        for c in [c for c in self.componentes(casca, 3000, 30000) if caixa(c, 80, 8, 96, 22)]:
            gy, gx = self.grade(c)
            M = np.zeros((gy.max() - gy.min() + 1, gx.max() - gx.min() + 1), bool)
            M[gy - gy.min(), gx - gx.min()] = True
            M = ndi.binary_closing(M, iterations=3)
            dist = ndi.distance_transform_edt(M)
            yy, xx = np.nonzero(M)
            hs = (21 * np.sqrt(np.clip(dist / max(dist.max(), 1), 0, 1)))[yy, xx].astype(np.float32)
            self.mascara(yy + gy.min(), xx + gx.min(), 0, 'casca', hs=hs)
        # sem prédio desenhado no V12: posição pela planta, arquitetura a definir
        self.retangulo_pct(49.8, 12.0, 64.8, 14.4, 8, 'outlet')
        self.retangulo_pct(66.6, 15.5, 68.2, 38.5, 8, 'outlet')
        self.retangulo_pct(66.0, 41.0, 69.0, 45.2, 9, 'supermercado')
        self.retangulo_pct(11.95, 37.2, 12.55, 38.2, 7, 'administração')
        return self


# --------------------------------------------------------------------------- render por marcha de raios
def render(maquete, chao, Xc, Yc, Zc, yaw, pitch, hfov, w, h, ss, N=170, M=48):
    HF, ID, MAT = maquete.HF, maquete.ID, maquete.MAT
    GH, GW = HF.shape
    CTX = np.array(chao).astype(np.float32)
    CH, CW = CTX.shape[:2]
    x0, y0 = CTX_BOX[0], CTX_BOX[1]
    hmax = float(HF.max()) + 0.5
    gy_, gx_ = np.gradient(HF)
    NR = np.dstack([-gx_, -gy_, np.ones_like(HF)])
    NR /= np.linalg.norm(NR, axis=-1, keepdims=True)
    ALB = np.array([[0, 0, 0], [222, 224, 226], [232, 220, 200], [234, 238, 243], [241, 239, 235]], np.float32)
    FUNDO = np.array(CORES['fundo'], np.float32)
    CEU0, CEU1 = np.array([236, 232, 218], np.float32), np.array([170, 196, 222], np.float32)
    L = np.array(LUZ, float); L /= np.linalg.norm(L)

    def altura(X, Y):
        gx, gy = np.floor(X).astype(np.int32), np.floor(Y).astype(np.int32)
        ok = (gx >= 0) & (gx < GW) & (gy >= 0) & (gy < GH)
        H = np.zeros(X.shape, np.float32)
        H[ok] = HF[gy[ok], gx[ok]]
        return H, gx, gy

    W2, H2 = w * ss, h * ss
    th, ph = math.radians(yaw), math.radians(pitch)
    f = np.array([math.sin(th) * math.cos(ph), -math.cos(th) * math.cos(ph), -math.sin(ph)])
    r = np.array([math.cos(th), math.sin(th), 0.0]); u = np.cross(f, r)
    tx = math.tan(math.radians(hfov) / 2); ty = tx * H2 / W2
    img = np.zeros((H2, W2, 3), np.float32)
    idb = np.zeros((H2, W2), np.int32); kb = np.zeros((H2, W2), np.int8)
    xs = (np.arange(W2) + 0.5) / W2 * 2 - 1
    passo = 12
    for j0 in range(0, H2, passo):
        jj = 1 - (np.arange(j0, min(H2, j0 + passo)) + 0.5) / H2 * 2
        I, J = np.meshgrid(xs, jj)
        d = f + I[..., None] * tx * r + J[..., None] * ty * u
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        dz = d[..., 2]
        g = dz < -1e-6
        tg = np.where(g, Zc / np.where(g, -dz, 1), 0)
        Xg, Yg = Xc + tg * d[..., 0], Yc + tg * d[..., 1]
        px, py = ((Xg - x0) / MPP).astype(int), ((Yg - y0) / MPP).astype(int)
        ok = g & (px >= 0) & (px < CW) & (py >= 0) & (py < CH)
        col = np.broadcast_to(FUNDO, d.shape).copy()
        col[ok] = CTX[py[ok], px[ok]]
        kind = g.astype(np.int8); ids = np.zeros(g.shape, np.int32)
        HX, HY, HZ = Xg.copy(), Yg.copy(), np.zeros_like(Xg)
        nrm = np.zeros(d.shape, np.float32); nrm[..., 2] = 1
        tt = np.where(g, (Zc - hmax) / np.where(g, -dz, 1), 0)
        Xa, Ya = Xc + tt * d[..., 0], Yc + tt * d[..., 1]
        cand = g & ~(((Xa < 0) & (Xg < 0)) | ((Xa >= GW) & (Xg >= GW)) | ((Ya < 0) & (Yg < 0)) | ((Ya >= GH) & (Yg >= GH)))
        ci = np.nonzero(cand)
        if len(ci[0]):
            dd, t0, t1 = d[ci], tt[ci], tg[ci]
            s = np.linspace(0, 1, N, dtype=np.float32)
            T = t0[:, None] + (t1 - t0)[:, None] * s[None, :]
            X, Y, Z = Xc + T * dd[:, 0:1], Yc + T * dd[:, 1:2], Zc + T * dd[:, 2:3]
            Hs, gx, gy = altura(X, Y)
            hit = (Z <= Hs) & (Hs > 0)
            rows = np.nonzero(hit.any(1))[0]
            k = np.argmax(hit, axis=1)[rows]
            kp = np.maximum(k - 1, 0)
            Hk = Hs[rows, k]
            teto = (Z[rows, kp] > Hk) | (k == 0)
            gxk, gyk = gx[rows, k], gy[rows, k]
            n = np.zeros((len(rows), 3), np.float32)
            n[teto] = NR[gyk[teto], gxk[teto]]
            parede = ~teto
            cx = gx[rows, k] != gx[rows, kp]
            n[parede & cx, 0] = -np.sign(dd[rows, 0])[parede & cx]
            n[parede & ~cx, 1] = -np.sign(dd[rows, 1])[parede & ~cx]
            q = (ci[0][rows], ci[1][rows])
            kind[q] = np.where(teto, 2, 3); ids[q] = ID[gyk, gxk]; col[q] = ALB[MAT[gyk, gxk]]; nrm[q] = n
            HX[q], HY[q], HZ[q] = X[rows, k], Y[rows, k], np.minimum(Z[rows, k], Hk)
        perto = g & (HX >= -50) & (HX < GW + 50) & (HY >= -50) & (HY < GH + 50)
        si = np.nonzero(perto)
        sombra = np.zeros(g.shape, bool)
        if len(si[0]):
            P = np.stack([HX[si], HY[si], HZ[si] + 0.3], -1)
            S = ((hmax - P[:, 2]) / L[2])[:, None] * np.linspace(0.02, 1, M, dtype=np.float32)[None, :]
            Hq, _, _ = altura(P[:, 0:1] + S * L[0], P[:, 1:2] + S * L[1])
            sombra[si] = (P[:, 2:3] + S * L[2] < Hq).any(1)
        lam = np.clip((nrm * L).sum(-1), 0, 1)
        predio = kind >= 2
        luz = np.where(predio, 0.50 + 0.55 * lam, 1.0) * np.where(sombra, np.where(predio, 0.78, 0.66), 1.0)
        col = col * luz[..., None]
        nevoa = np.clip((np.hypot(HX - Xc, HY - Yc) - 3000) / 14000, 0, 0.85)[..., None]
        col = np.where(g[..., None], col * (1 - nevoa) + CEU0 * nevoa, col)
        kk = np.clip(J * 1.5, 0, 1)[..., None]
        col = np.where(g[..., None], col, CEU0 * (1 - kk) + CEU1 * kk)
        img[j0:j0 + passo], idb[j0:j0 + passo], kb[j0:j0 + passo] = col, ids, kind
    borda = np.zeros((H2, W2), bool)
    for a, b in (((slice(None), slice(1, None)), (slice(None), slice(None, -1))),
                 ((slice(1, None), slice(None)), (slice(None, -1), slice(None)))):
        borda[a] |= ((idb[a] != idb[b]) | (kb[a] != kb[b])) & ((kb[a] >= 2) | (kb[b] >= 2))
    img[borda] *= 0.80
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    return im.resize((w, h), Image.LANCZOS) if ss > 1 else im


def render_zenital(maquete, chao, guia, sheet, cx, cy, largura, w, h, ss, M=56):
    """Vista de cima (variação 90°): ortográfica, mesma orientação da prancha, com sombras."""
    HF, ID, MAT = maquete.HF, maquete.ID, maquete.MAT
    GH, GW = HF.shape
    W2, H2 = w * ss, h * ss
    mpp = largura / W2
    fx0, fy0 = cx - largura / 2, cy - H2 * mpp / 2
    fx1, fy1 = fx0 + W2 * mpp, fy0 + H2 * mpp
    bx, by = CTX_BOX[0], CTX_BOX[1]
    base = chao.resize((W2, H2), Image.LANCZOS,
                       box=((fx0 - bx) / MPP, (fy0 - by) / MPP, (fx1 - bx) / MPP, (fy1 - by) / MPP)).convert('RGBA')
    sx0, sy0, sx1, sy1 = max(fx0, 0), max(fy0, 0), min(fx1, sheet[0]), min(fy1, sheet[1])
    planta_alta = Image.fromarray(guia, 'RGBA').resize(
        (round((sx1 - sx0) / mpp), round((sy1 - sy0) / mpp)), Image.LANCZOS, box=(sx0 * K, sy0 * K, sx1 * K, sy1 * K))
    base.alpha_composite(planta_alta, (round((sx0 - fx0) / mpp), round((sy0 - fy0) / mpp)))
    img = np.array(base.convert('RGB')).astype(np.float32)
    hmax = float(HF.max()) + 0.5
    gy_, gx_ = np.gradient(HF)
    NR = np.dstack([-gx_, -gy_, np.ones_like(HF)])
    NR /= np.linalg.norm(NR, axis=-1, keepdims=True)
    ALB = np.array([[0, 0, 0], [222, 224, 226], [232, 220, 200], [234, 238, 243], [241, 239, 235]], np.float32)
    L = np.array(LUZ90, float); L /= np.linalg.norm(L)

    def amostra(X, Y):
        gx, gy = np.floor(X).astype(np.int32), np.floor(Y).astype(np.int32)
        ok = (gx >= 0) & (gx < GW) & (gy >= 0) & (gy < GH)
        H = np.zeros(X.shape, np.float32)
        H[ok] = HF[gy[ok], gx[ok]]
        return H, gx, gy, ok

    X = fx0 + (np.arange(W2) + 0.5) * mpp
    idb = np.zeros((H2, W2), np.int32)
    passo = 16
    for j0 in range(0, H2, passo):
        Y = fy0 + (np.arange(j0, min(H2, j0 + passo)) + 0.5) * mpp
        XX, YY = np.meshgrid(X, Y)
        Hh, gx, gy, ok = amostra(XX, YY)
        teto = Hh > 0
        col = img[j0:j0 + passo]
        ids = np.zeros(teto.shape, np.int32)
        q = np.nonzero(teto)
        n = NR[gy[q], gx[q]]
        col[q] = ALB[MAT[gy[q], gx[q]]] * (0.55 + 0.5 * np.clip(n @ L, 0, 1))[:, None]
        ids[q] = ID[gy[q], gx[q]]
        S = ((hmax - Hh - 0.3) / L[2])[..., None] * np.linspace(0.02, 1, M, dtype=np.float32)
        Hq, _, _, _ = amostra(XX[..., None] + S * L[0], YY[..., None] + S * L[1])
        sombra = ((Hh + 0.3)[..., None] + S * L[2] < Hq).any(-1)
        col *= np.where(sombra, np.where(teto, 0.80, 0.62), 1.0)[..., None]
        img[j0:j0 + passo] = col
        idb[j0:j0 + passo] = ids
    borda = np.zeros((H2, W2), bool)
    for a, b in (((slice(None), slice(1, None)), (slice(None), slice(None, -1))),
                 ((slice(1, None), slice(None)), (slice(None, -1), slice(None)))):
        borda[a] |= (idb[a] != idb[b]) & ((idb[a] > 0) | (idb[b] > 0))
    img[borda] *= 0.80
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    return im.resize((w, h), Image.LANCZOS) if ss > 1 else im


# --------------------------------------------------------------------------- fotos do cliente
def sem_vermelho(im):
    """Dessatura vermelho puro (lanterna, cruz, flor) — regra da marca: zero vermelho."""
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


def cobrir(im, w, h):
    im = im.convert('RGB')
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def colagem(fotos, cols, linhas, th, tw=768, gap=8):
    c = Image.new('RGB', (cols * tw + (cols - 1) * gap, linhas * th + (linhas - 1) * gap), (255, 255, 255))
    for i, f in enumerate(fotos):
        c.paste(sem_vermelho(cobrir(Image.open(os.path.join(ROOT, f)), tw, th)),
                ((i % cols) * (tw + gap), (i // cols) * (th + gap)))
    return c


# ---------------------------------------------------------------------------
def main():
    os.makedirs(CACHE, exist_ok=True)
    print('planta…')
    plano, sheet = planta()
    guia = recolorir(plano)
    H, W = guia.shape[:2]
    fundo = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    fundo.alpha_composite(Image.fromarray(guia, 'RGBA'))
    b = fundo.convert('RGB').crop((int(0.008 * W), int(0.05 * H), int(0.995 * W), int(0.98 * H)))
    b.resize((3600, int(3600 * b.height / b.width)), Image.LANCZOS).save(os.path.join(HERE, 'ref-B-planta-v12.png'), optimize=True)

    print('entorno (OpenStreetMap)…')
    data = osm()
    geo = Geo(data, sheet)
    print(f'  curva da PY-19 em {geo.latlon(geo.XB, geo.YB)} · rumo do trecho sul {geo.rumo_sul:.1f}°')
    chao = entorno(data, geo, guia)
    x0, y0 = CTX_BOX[0], CTX_BOX[1]
    c = chao.crop((int((-2200 - x0) / MPP), int((-5000 - y0) / MPP), int((6200 - x0) / MPP), int((2400 - y0) / MPP)))
    c.resize((2000, int(2000 * c.height / c.width)), Image.LANCZOS).save(os.path.join(HERE, 'ref-C-situacao.jpg'), quality=88, optimize=True)

    print('volumes…')
    maq = Maquete(plano, sheet).montar()
    for k, v in maq.conta.items():
        print(f'  {k:32s} {v}')
    print('render da câmera…')
    render(maq, chao, **CAMERA).save(os.path.join(HERE, 'ref-A-camera-volumes.png'), optimize=True)
    print('render da vista de cima…')
    render_zenital(maq, chao, guia, sheet, **CAMERA90).save(os.path.join(HERE, 'ref-A90-zenital-volumes.png'), optimize=True)

    print('fotos do cliente…')
    sem_vermelho(Image.open(os.path.join(ROOT, 'assets/web/fotos/park-aereo-rio.jpg'))).save(
        os.path.join(HERE, 'ref-D-estilo.jpg'), quality=92)
    for nome, (fotos, cols, linhas, th) in COLAGENS.items():
        colagem(fotos, cols, linhas, th).save(os.path.join(HERE, nome), quality=88, optimize=True)
    print('pronto.')


if __name__ == '__main__':
    main()
