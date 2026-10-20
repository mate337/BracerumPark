#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera os 612 lotes à venda do Masterplan 3D (3dmasterplan/data/lotes.json).

    python3 docs/3dmasterplan/build_lotes.py      # da raiz; depois do build_data.py

Fonte: o "Mapa de Lotes — Bracerum Park" da Política Comercial P1 (MP14, Masterplan V14-02 de
09/10/2026, Tabela v3.1 rev. 14/10/2026), em docs/lotes-p1/. O PDF é uma imagem só (A3 a 300 dpi):
cada lote aparece pintado na cor da categoria e separado dos vizinhos por um traço. Este script:
  1. separa os lotes pela cor (Vitrine, Business, Padrão, Interna);
  2. encaixa o mapa na planta V12 da maquete pelas 32 quadras-padrão (é o mesmo desenho: o erro
     do encaixe fica em ~1 px, 0,4 m);
  3. põe cada lote na sua quadra (Q01–Q42, pela correspondência com os lotes do V12) e numera
     como o mapa: faixa de cima para baixo, da esquerda para a direita (L001, L002…);
  4. aplica a categoria pela regra escrita na Tabela de Preços (e avisa onde a cor do mapa diverge);
  5. calcula a área: 1.250 m² nos lotes-padrão; nos irregulares, a área medida no mapa, ajustada para
     a soma bater com a área da quadra escrita no mapa. Essas áreas são aproximadas (a área de
     contrato está no nome oficial do lote, que o mapa não deixa ler) e saem marcadas com "ex": 0.

Os preços NÃO estão aqui: ficam em 3dmasterplan/data/precos.json, editado à mão quando sair tabela nova.
"""

import json, math, os, subprocess, tempfile
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MAPA = os.path.join(ROOT, 'docs', 'lotes-p1', 'Bracerum_Park_P1_Mapa_de_Lotes_Categorias_MP14.pdf')
CENA = os.path.join(ROOT, '3dmasterplan', 'data', 'scene.json')
OUT = os.path.join(ROOT, '3dmasterplan', 'data', 'lotes.json')
CACHE = os.path.join(tempfile.gettempdir(), 'bp-lotes-p1')

CORES = {'V': (178, 144, 76), 'B': (97, 136, 180), 'P': (162, 218, 108), 'I': (209, 205, 172)}
# área de cada quadra irregular escrita no mapa MP14; as demais são de 20.000 m² (16 lotes de 1.250)
AREA_QUADRA = {'Q01': 10398, 'Q04': 21650, 'Q05': 16520, 'Q11': 1138, 'Q18': 6965, 'Q31': 7020,
               'Q38': 15732, 'Q39': 20830, 'Q40': 25943}
# áreas que a Tabela de Preços traz por extenso (exemplos de proposta)
AREA_CONHECIDA = {'Q01.L001': 801}
FORA_DA_OFERTA = {'Q37': 'recinto alfandegado'}
# quadras em faixa única, com o fundo inclinado, onde o texto da área cobre o pé de vários lotes:
# a área de cada lote sai da largura dele vezes a profundidade da quadra naquela altura
FAIXAS = ('Q31',)


def categoria(q, l):
    """Regra do Mapa de Quadras da Tabela de Preços v3.1 (rev. 14/10/2026)."""
    n = int(q[1:])
    if q in ('Q02', 'Q03', 'Q04'): return 'V'
    if 19 <= n <= 24 and l >= 9: return 'V'          # frente para a avenida principal
    if 25 <= n <= 30 and l <= 8: return 'V'
    if q in ('Q10', 'Q17', 'Q36'): return 'B'
    if (q == 'Q24' and l <= 8) or (q == 'Q30' and l >= 9): return 'B'
    if 6 <= n <= 9 or 13 <= n <= 16 or 32 <= n <= 35: return 'P'
    if 20 <= n <= 23 and l <= 8: return 'P'
    if 26 <= n <= 29 and l >= 9: return 'P'
    return 'I'                                       # Q01, Q05, Q11, Q12, Q18, Q31, Q38–Q42, Q19 L1–8, Q25 L9–16


def quadra_v12(i):
    """Lote do V12 (id da maquete) -> quadra do V14-02."""
    especiais = {'C1-L1': 'Q01', 'C2-L1': 'Q02', 'C3-L1': 'Q03', 'frente': 'Q04', 'borda': 'Q18'}
    if i in especiais: return especiais[i]
    c, l = i.split('-')
    base = {2: 5, 3: 12, 4: 19, 5: 25, 6: 31, 7: 37}[int(l[1])]
    return f'Q{base + int(c[1]) - 1:02d}'


def imagem():
    os.makedirs(CACHE, exist_ok=True)
    subprocess.run(['pdfimages', '-j', MAPA, os.path.join(CACHE, 'mp')], check=True)
    return np.array(Image.open(os.path.join(CACHE, 'mp-000.jpg')).convert('RGB')).astype(np.int16)


def poligono_centro(p):
    x, y = p[:, 0], p[:, 1]
    x1, y1 = np.roll(x, -1), np.roll(y, -1)
    cr = x * y1 - x1 * y
    a = cr.sum() / 2
    return np.array([((x + x1) * cr).sum() / (6 * a), ((y + y1) * cr).sum() / (6 * a)])


def dentro(x, y, pts):
    ins, j = False, len(pts) - 1
    for i in range(len(pts)):
        (xi, yi), (xj, yj) = pts[i], pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            ins = not ins
        j = i
    return ins


def distribuir(total, pesos):
    """Inteiros proporcionais aos pesos que somam exatamente `total` (maior resto)."""
    pesos = np.asarray(pesos, float)
    bruto = total * pesos / pesos.sum()
    base = np.floor(bruto).astype(int)
    for k in np.argsort(-(bruto - base))[:total - base.sum()]:
        base[k] += 1
    return base.tolist()


def main():
    a = imagem()
    H, W = a.shape[:2]
    mask = {c: np.abs(a - np.array(v)).max(-1) <= (18 if c == 'I' else 30) for c, v in CORES.items()}
    mask['I'] &= (a[..., 0] - a[..., 2]) > 22                   # o bege não é o cinza das vias
    fill = np.zeros((H, W), bool)
    for m in mask.values():
        fill |= m
    fill[:int(0.09 * H)] = False                                # cabeçalho
    fill[int(0.875 * H):] = False                               # legenda
    lab, n = ndi.label(fill)
    px = ndi.sum(fill, lab, index=np.arange(1, n + 1))
    S2 = 2.55 ** 2                                              # px² por m², só para filtrar
    lotes = [i + 1 for i in range(n) if 250 * S2 <= px[i] <= 3200 * S2]
    cms = ndi.center_of_mass(fill, lab, lotes)

    # encaixe: centro das quadras-padrão no V12 (m) x no mapa (px)
    cena = json.load(open(CENA))
    W12, H12 = cena['sheet']
    quad = {}
    for l in cena['lotes']:
        p = np.array(l['p']).reshape(-1, 2)
        quad[quadra_v12(l['id'])] = dict(p=p, area=l['a'], c=poligono_centro(p))
    qmask = ndi.binary_fill_holes(ndi.binary_closing(fill, structure=np.ones((9, 9))))   # textos viram quadra
    ql, qn = ndi.label(qmask)
    qpx = ndi.sum(qmask, ql, index=np.arange(1, qn + 1))
    qids = [i + 1 for i in range(qn) if qpx[i] >= 900 * S2]
    qcm = np.array([[c[1], c[0]] for c in ndi.center_of_mass(qmask, ql, qids)])
    # primeira aproximação por duas quadras de referência (Q06 e Q42), depois mínimos quadrados
    ref = {'Q06': (1977, 886), 'Q42': (4234, 2426)}
    a1, a2 = np.array(ref['Q06'], float), np.array(ref['Q42'], float)
    b1, b2 = quad['Q06']['c'], quad['Q42']['c']
    esc = np.linalg.norm(a2 - a1) / np.linalg.norm(b2 - b1)
    pares = []
    for q, d in quad.items():
        if d['area'] == 20000:
            g = a1 + (d['c'] - b1) * esc
            j = np.linalg.norm(qcm - g, axis=1).argmin()
            pares.append((d['c'], qcm[j]))
    X = np.hstack([np.array([p[0] for p in pares]), np.ones((len(pares), 1))])
    T, *_ = np.linalg.lstsq(X, np.array([p[1] for p in pares]), rcond=None)
    res = np.sqrt(((X @ T - np.array([p[1] for p in pares])) ** 2).sum(1))
    print(f'encaixe: {len(pares)} quadras, erro médio {res.mean():.2f} px, máximo {res.max():.2f} px')
    A2, t = T[:2].T, T[2]
    Ainv = np.linalg.inv(A2)
    m2_px = abs(np.linalg.det(A2))                              # px por m²
    para_planta = lambda P: (np.asarray(P, float) - t) @ Ainv.T

    # cada componente na sua quadra
    comp = {}
    for i, (cy, cx) in zip(lotes, cms):
        X_, Y_ = para_planta([[cx, cy]])[0]
        q = next((q for q, d in quad.items() if dentro(X_, Y_, d['p'])), None)
        if q is None and abs(X_ / W12 * 100 - 11.9) < 2.5 and abs(Y_ / H12 * 100 - 37.5) < 4:
            q = 'Q11'                                           # o lote da Administração (sem par no V12)
        if q is None or q in FORA_DA_OFERTA:
            continue
        comp.setdefault(q, []).append(i)

    objs = ndi.find_objects(lab)
    saida, avisos = [], []
    for q in sorted(comp):
        ids = comp[q]
        y0 = min(objs[i - 1][0].start for i in ids) - 6; y1 = max(objs[i - 1][0].stop for i in ids) + 6
        x0 = min(objs[i - 1][1].start for i in ids) - 6; x1 = max(objs[i - 1][1].stop for i in ids) + 6
        if q == 'Q11' and len(ids) > 1:                         # o texto da planta parte o triângulo em dois
            for i in ids[1:]:
                lab[y0:y1, x0:x1][lab[y0:y1, x0:x1] == i] = ids[0]
            ids = ids[:1]
        # ladrilha a quadra: cada pixel da quadra (traços e textos incluídos) vai para o lote mais próximo
        sub = lab[y0:y1, x0:x1]
        mine = np.isin(sub, ids)
        qs = ql[y0:y1, x0:x1]
        area_q = np.isin(qs, np.unique(qs[mine & (qs > 0)]))     # a mancha da quadra, com os textos
        _, (iy, ix) = ndi.distance_transform_edt(~mine, return_indices=True)
        tile = np.where(area_q, sub[iy, ix], 0)
        info = []
        for i in ids:
            reg = tile == i
            ys, xs = np.nonzero(reg)
            topo = para_planta([[xs.mean() + x0, ys.min() + y0]])[0][1]
            centro = para_planta([[xs.mean() + x0, ys.mean() + y0]])[0][0]
            m = (sub == i).astype(np.uint8)
            cs, _ = cv2.findContours(np.pad(m, 1), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            ct = np.vstack(cs)                                  # todas as partes (a Q11 vem partida pelo texto)
            # contorno limpo: a envoltória convexa (os lotes são convexos; os textos do mapa mordem a borda)
            ap = cv2.approxPolyDP(cv2.convexHull(ct), 1.2, True)[:, 0, :].astype(float) + [x0 - 1 + 0.5, y0 - 1 + 0.5]
            poly = para_planta(ap)
            bx = poly.max(0) - poly.min(0)
            area_px = reg.sum()
            # lote-padrão: a mancha pintada de um lote de 25 x 50 m mede ~23,7 x 49 m (o traço come ~1,3 m)
            # e é um retângulo cheio; a envoltória convexa ignora os furos que os textos do mapa abrem no lote
            lados = sorted(bx)
            casca = cv2.contourArea(cv2.convexHull(ct)) / m2_px
            padrao = abs(lados[0] - 23.7) <= 1.1 and abs(lados[1] - 49.0) <= 1.2 and casca / (lados[0] * lados[1]) > 0.96
            # medida dos irregulares: envoltória + meia largura de traço em volta (os lotes são convexos)
            if padrao or q not in AREA_QUADRA:                  # retângulo limpo: o texto central morde os cantos
                (xa, ya), (xb, yb) = poly.min(0), poly.max(0)
                poly = np.array([[xa, ya], [xb, ya], [xb, yb], [xa, yb]])
            info.append(dict(i=i, topo=topo, cx=centro, m2=casca + 0.65 * cv2.arcLength(cv2.convexHull(ct), True) / math.sqrt(m2_px),
                             poly=poly, ret=padrao,
                             cor=max(CORES, key=lambda c: int((mask[c][y0:y1, x0:x1] & (sub == i)).sum()))))
        # numeração: faixas de cima para baixo (pelo topo do lote, tolerância de 4 m), esquerda -> direita
        info.sort(key=lambda d: d['topo'])
        faixas, atual = [], [info[0]]
        for d in info[1:]:
            if d['topo'] - atual[0]['topo'] > 4:
                faixas.append(atual); atual = [d]
            else:
                atual.append(d)
        faixas.append(atual)
        ordem = [d for f in faixas for d in sorted(f, key=lambda d: d['cx'])]
        if q in FAIXAS:
            P = quad[q]['p']
            def prof(x):
                ys = []
                for k in range(len(P)):
                    (xa, ya), (xb, yb) = P[k], P[(k + 1) % len(P)]
                    if (xa - x) * (xb - x) <= 0 and xa != xb:
                        ys.append(ya + (yb - ya) * (x - xa) / (xb - xa))
                return max(ys) - min(ys) if len(ys) >= 2 else 0
            xs_q = P[:, 0]
            for j, d in enumerate(ordem):
                xa_, xb_ = d['poly'][:, 0].min() - 0.65, d['poly'][:, 0].max() + 0.65
                if j == 0: xa_ = xs_q.min()
                if j == len(ordem) - 1: xb_ = xs_q.max()
                d['m2'] = sum(prof(x) * 0.25 for x in np.arange(xa_ + 0.125, xb_, 0.25))
        # áreas
        total = AREA_QUADRA.get(q, 20000)
        if q not in AREA_QUADRA:
            areas, exatas = [1250] * len(ordem), [1] * len(ordem)
            if len(ordem) != 16:
                avisos.append(f'{q}: {len(ordem)} lotes numa quadra-padrão')
        else:
            k = total / sum(d['m2'] for d in ordem)             # ajusta o medido para a soma da quadra
            areas, exatas = [None] * len(ordem), [0] * len(ordem)
            for j, d in enumerate(ordem):
                nome = f'{q}.L{j + 1:03d}'
                if nome in AREA_CONHECIDA:
                    areas[j], exatas[j] = AREA_CONHECIDA[nome], 1
                elif d['ret']:
                    areas[j], exatas[j] = 1250, 1
            livres = [j for j, v in enumerate(areas) if v is None]
            for j, d in enumerate(ordem):
                nome = f'{q}.L{j + 1:03d}'
                if nome in AREA_CONHECIDA:                      # confere o método com a área publicada
                    est = d['m2'] * (total - 1250 * sum(1 for x in ordem if x['ret'])) / sum(x['m2'] for x in ordem if not x['ret'])
                    print(f'  conferência: {nome} medido ≈ {est:.0f} m², publicado {AREA_CONHECIDA[nome]} m²')
            resto = total - sum(v for v in areas if v is not None)
            if livres:
                for j, v in zip(livres, distribuir(resto, [ordem[j]['m2'] for j in livres])):
                    areas[j] = v
            elif resto:
                avisos.append(f'{q}: sobram {resto} m² com todos os lotes em 1.250 m²')
            if len(ordem) == 1:
                exatas[0] = 1                                   # lote único: a área é a da quadra
        for j, d in enumerate(ordem):
            l = j + 1
            cat = categoria(q, l)
            if cat != d['cor']:
                avisos.append(f'{q}.L{l:03d}: regra da tabela = {cat}, cor no mapa = {d["cor"]} (vale a tabela)')
            saida.append(dict(id=f'{q}.L{l:03d}', q=q, cat=cat, a=int(areas[j]), ex=exatas[j],
                              p=[round(v, 1) for xy in d['poly'] for v in xy]))

    from collections import Counter
    cont = Counter(l['cat'] for l in saida)
    area = Counter()
    for l in saida:
        area[l['cat']] += l['a']
    print(f'{len(saida)} lotes à venda · {sum(area.values()):,} m²'.replace(',', '.'))
    for c in 'VBPI':
        print(f'  {c}: {cont[c]} lotes · {area[c]:,} m²'.replace(',', '.'))
    print(f'  áreas aproximadas: {sum(1 for l in saida if not l["ex"])} lotes')
    for a_ in avisos:
        print('  aviso:', a_)

    quadras = []
    for q in sorted(set(l['q'] for l in saida) | set(FORA_DA_OFERTA)):
        if q in quad:
            p = quad[q]['p']
        else:                                                   # Q11: o próprio lote
            p = np.array(next(l['p'] for l in saida if l['q'] == q)).reshape(-1, 2)
        d = dict(q=q, a=AREA_QUADRA.get(q, quad.get(q, {}).get('area', 20000)), p=[round(v, 1) for xy in p for v in xy])
        if q in FORA_DA_OFERTA:
            d['fora'] = FORA_DA_OFERTA[q]
            d['a'] = quad[q]['area']
        quadras.append(d)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({'fonte': 'Mapa de Lotes MP14 — Masterplan V14-02 (09/10/2026) · Política Comercial P1 · Tabela v3.1 (rev. 14/10/2026)',
                   'quadras': quadras, 'lotes': saida}, fh, ensure_ascii=False, separators=(',', ':'))
    print(f'  {os.path.relpath(OUT, ROOT)}: {os.path.getsize(OUT) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
