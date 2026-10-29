#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera os lotes à venda do Masterplan 3D (3dmasterplan/data/lotes.json) a partir da planta V14.

    python3 docs/3dmasterplan/build_lotes.py      # da raiz; depois do build_data.py (usa o mesmo cache)

Fonte: "Masterplan BRACERUM PARK V14 — 28/10/2026 — lotes identificados" (docs/masterplan-v14/). O PDF é
vetorial e traz, dentro de cada lote, o nome oficial completo, com a área de contrato:
LTIND.Q07.L014.A01250.ESQNAO.RT.L (quadra, lote, área, esquina, forma, frentes). Este script:
  1. lê os nomes e a posição de cada um (pdftotext -bbox);
  2. separa os lotes na planta sem texto (a mesma do build_data.py), pela cor de lote, e põe cada
     nome no lote em que ele cai;
  3. tira as cópias empilhadas (o desenho repete os rótulos de algumas quadras no mesmo lugar). Onde
     sobraram rótulos da versão anterior por cima dos novos (a Q38, que virou uma quadra só com a
     Q39), numera os lotes pela posição — faixa de cima, da esquerda para a direita, depois a de
     baixo — e, entre duas áreas para o mesmo lote, fica com a que bate com a área medida no desenho;
  4. aplica a categoria de preço pela regra escrita na Tabela de Preços P1 (docs/lotes-p1/).
A quadra Q37 (recinto alfandegado) e a Q11 (lote da Administração) têm nome de lote, mas ficam fora da oferta:
sem elas, a conta dá os 615 lotes e 766.693 m² do quadro de áreas do V14.

Os preços NÃO estão aqui: ficam em 3dmasterplan/data/precos.json, editado à mão quando sair tabela nova.
"""

import json, os, re, subprocess, sys, tempfile
from collections import Counter, defaultdict
import cv2
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import build_data as bd                                             # noqa: E402
br = bd.br

OUT = os.path.join(ROOT, '3dmasterplan', 'data', 'lotes.json')
FORA_DA_OFERTA = {'Q37': 'recinto alfandegado', 'Q11': 'administração'}   # o quadro do V14 conta 615 lotes sem a Q11
PX_POR_PT = 80 / 72                                                 # a planta é renderizada a 80 dpi


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


def nomes():
    """Os rótulos LTIND.Qxx.Lyyy.A0xxxx.ESQ….FORMA.FRENTES com o centro em px da planta, na ordem do PDF."""
    html = subprocess.run(['pdftotext', '-bbox', bd.PLANTA, '-'], capture_output=True, text=True, check=True).stdout
    out = []
    for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', html):
        p = t.split('.')
        if t.startswith('LTIND.') and len(p) == 7:
            out.append(dict(nome=t, q=p[1], l=int(p[2][1:]), a=int(p[3][1:]),
                            x=(float(a) + float(c)) / 2 * PX_POR_PT, y=(float(b) + float(d)) / 2 * PX_POR_PT))
    return out


def poligono(mask, ox, oy, eps=1.2):
    pol = bd.contornos(mask, ox, oy, eps)
    return max(pol, key=lambda p: abs(cv2.contourArea(np.array(p, np.float32)))) if pol else None


def main():
    plano, sheet = bd.planta_v14()
    rgb, dentro = plano[..., :3].astype(int), plano[..., 3] > 0
    H, W = dentro.shape
    lote = (np.abs(rgb - np.array([165, 221, 110])).max(-1) <= 14) & dentro
    lab, n = ndi.label(lote)
    branco = (rgb.min(-1) >= 245) & dentro                          # os lotes do recinto são brancos
    labb, _ = ndi.label(branco)
    objs = ndi.find_objects(lab)

    def onde(r, labels):
        """Componente sob o centro do rótulo (procura em volta se o centro cair num traço)."""
        x, y = int(r['x']), int(r['y'])
        for d in range(0, 9, 2):
            v = labels[max(0, y - d):y + d + 1, max(0, x - d):x + d + 1]
            v = v[v > 0]
            if v.size:
                return Counter(v.tolist()).most_common(1)[0][0]
        return 0

    rot = nomes()
    print(f'{len(rot)} rótulos LTIND, {len(set(r["nome"] for r in rot))} nomes distintos')
    objsb = ndi.find_objects(labb)
    por_comp, fora, avisos = defaultdict(list), defaultdict(list), []
    for r in rot:
        if r['q'] in FORA_DA_OFERTA:
            fora[r['q']].append((r, onde(r, labb) or onde(r, lab))); continue
        c = onde(r, lab)
        chave = ('g', c) if c else ('b', onde(r, labb))             # a Q11 (Administração) é branca
        if not chave[1]:
            avisos.append(f'{r["nome"]}: rótulo fora de lote'); continue
        por_comp[chave].append(r)

    def mancha(k):
        tipo, c = k
        L_, O_ = (lab, objs) if tipo == 'g' else (labb, objsb)
        sl = O_[c - 1]
        return L_[sl] == c, sl

    def medida(k):
        m, _ = mancha(k)
        return m.sum() / br.K / br.K / 0.95                          # a mancha perde ~5% para o traço

    def topo_x(k):
        m, sl = mancha(k)
        ys, xs = np.nonzero(m)
        return (ys.min() + sl[0].start) / br.K, (xs.mean() + sl[1].start) / br.K

    # quadras com rótulos de duas versões: numeração pela posição
    confusas = {r['q'] for rs in por_comp.values() for r in rs if len({(x['q'], x['l']) for x in rs}) > 1}
    numero = {}
    for q in sorted(confusas):
        ks = [k for k, rs in por_comp.items() if any(r['q'] == q for r in rs) and Counter(r['q'] for r in rs).most_common(1)[0][0] == q]
        ks.sort(key=lambda k: topo_x(k)[0])
        faixas, atual = [], [ks[0]]
        for k in ks[1:]:
            if topo_x(k)[0] - topo_x(atual[0])[0] > 4:
                faixas.append(atual); atual = [k]
            else:
                atual.append(k)
        faixas.append(atual)
        for i, k in enumerate(kk for f in faixas for kk in sorted(f, key=lambda k: topo_x(k)[1])):
            numero[k] = (q, i + 1)
        avisos.append(f'{q}: rótulos de duas versões empilhados — {len(ks)} lotes numerados pela posição')

    lotes, vistos = [], {}
    for k, rs in por_comp.items():
        q, l = numero.get(k) or Counter((r['q'], r['l']) for r in rs).most_common(1)[0][0]
        cands = [r for r in rs if (r['q'], r['l']) == (q, l)] or rs
        med = medida(k)
        if len({r['a'] for r in cands}) > 1:                        # duas áreas para o mesmo lote
            r = min(cands, key=lambda r: (abs(r['a'] - med), -rs.index(r)))
            avisos.append(f'{q}.L{l:03d}: {" / ".join(sorted({x["nome"] for x in cands}))} — medido ≈ {med:.0f} m², usado {r["nome"]}')
        else:
            r = cands[-1]                                           # o último no PDF é o que fica por cima
        chave = f'{q}.L{l:03d}'
        if chave in vistos:
            avisos.append(f'{chave} aparece em dois lotes diferentes'); continue
        vistos[chave] = k
        m, sl = mancha(k)
        pol = poligono(m, sl[1].start, sl[0].start)
        lotes.append(dict(id=chave, q=q, cat=categoria(q, l), a=r['a'], ex=1, nome=r['nome'],
                          p=[round(v, 1) for xy in pol for v in xy]))
    lotes.sort(key=lambda d: d['id'])

    # quadras: a mancha dos lotes de cada uma (para o rótulo Qxx e o contorno)
    quadras = []
    por_q = defaultdict(list)
    for d in lotes:
        por_q[d['q']].append(vistos[d['id']])
    for q, ks in sorted(por_q.items()):
        m = np.isin(lab, [c for t, c in ks if t == 'g']) | np.isin(labb, [c for t, c in ks if t == 'b'])
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        sub = ndi.binary_closing(m[y0:y1, x0:x1], structure=np.ones((7, 7)))
        pol = poligono(sub, x0, y0, 3.0)
        quadras.append(dict(q=q, a=sum(d['a'] for d in lotes if d['q'] == q), p=[round(v, 1) for xy in pol for v in xy]))
    for q, itens in sorted(fora.items()):
        m = np.isin(labb, [c for _, c in itens if c])
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pol = poligono(ndi.binary_closing(m[y0:y1, x0:x1], structure=np.ones((9, 9))), x0, y0, 3.0)
        area = sum({r['nome']: r['a'] for r, _ in itens}.values())
        quadras.append(dict(q=q, a=area, fora=FORA_DA_OFERTA[q], p=[round(v, 1) for xy in pol for v in xy]))

    cont, area = Counter(d['cat'] for d in lotes), Counter()
    for d in lotes:
        area[d['cat']] += d['a']
    print(f'{len(lotes)} lotes à venda · {sum(area.values()):,} m²'.replace(',', '.'))
    for c in 'VBPI':
        print(f'  {c}: {cont[c]} lotes · {area[c]:,} m²'.replace(',', '.'))
    print(f'  lotes de 1.250 m²: {sum(1 for d in lotes if d["a"] == 1250)}; outros: {sum(1 for d in lotes if d["a"] != 1250)}')
    usados = {c for t, c in vistos.values() if t == 'g'}
    for i in range(1, n + 1):
        a = ndi.sum(lote, lab, i) / br.K / br.K
        if i not in usados and a > 300:
            ys, xs = np.nonzero(lab[objs[i - 1]] == i)
            avisos.append(f'mancha de lote sem nome: {a:.0f} m² em ({(xs.mean() + objs[i - 1][1].start) / W * 100:.1f}%, '
                          f'{(ys.mean() + objs[i - 1][0].start) / H * 100:.1f}%)')
    for a in avisos:
        print('  aviso:', a)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({'fonte': 'Masterplan BRACERUM PARK V14 — 28/10/2026 — lotes identificados · categorias: Política Comercial P1, Tabela v3.1',
                   'quadras': quadras, 'lotes': lotes}, fh, ensure_ascii=False, separators=(',', ':'))
    print(f'  {os.path.relpath(OUT, ROOT)}: {os.path.getsize(OUT) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
