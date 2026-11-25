#!/usr/bin/env python3
"""
Lojas do Bracerum Outlet (Premium Outlet, 1ª fase) para a maquete 3D: 3dmasterplan/data/outlet.json.

De onde vem cada coisa
  • Contorno de cada loja: a planta "Premium Outlet · 1º fase" da página 2 do folder digital do Outlet
    (portalcorretores/materiais/bracerum-outlet-premium-folder-digital.pdf). É desenho vetorial: cada loja
    é um retângulo (pares de retângulos — contorno claro + miolo escuro; vale o miolo). São 57 lojas:
    faixa de cima com 2 fileiras (10 + 8 na da frente; 10 + 1 dupla + 4 + 3 mais fundas na de trás) e a
    faixa vertical com 2 colunas (8 na de dentro, ao lado da doca, e 13 na de fora).
  • Posição na maquete: a planta do folder é cópia em escala do V14 rev. 02/11 — o vão "ACESSO" da faixa
    de cima cai exatamente no núcleo de 20 m da maquete. Duas âncoras dão a escala (0,808 nos dois eixos):
    canto da 1ª loja = (1507,97; 143,03) e canto de baixo da coluna de fora = (1768,95; 333,53).
  • Numeração (out/01 … out/57) e valores: o CV CRM (empreendimento 9, "tabela de valores (nov/2026)"),
    pelo retrato api/_portal-tabelas-retrato.json. A ordem do CV segue a planta: fileira da frente da
    esquerda para a direita (01–18), fileira de trás (19–28, a dupla 29, 30–33, as três fundas 34–36),
    coluna de dentro de cima para baixo (37–44) e coluna de fora (45–57). O script confere: a área do
    desenho de cada loja tem de acompanhar a área do CV (correlação ≥ 0,9), senão não grava.

Rodar:  python3 docs/3dmasterplan/build_outlet.py      (precisa de pdfplumber)
Rodar de novo quando o CV mudar preço ou unidade (depois de reler o CV: node docs/build_tabelas_pdf.js --cv).
"""
import json
import math
import pathlib
import sys

import pdfplumber

RAIZ = pathlib.Path(__file__).resolve().parents[2]
FOLDER = RAIZ / 'portalcorretores/materiais/bracerum-outlet-premium-folder-digital.pdf'
RETRATO = RAIZ / 'api/_portal-tabelas-retrato.json'
CENA = RAIZ / '3dmasterplan/data/scene.json'
SAIDA = RAIZ / '3dmasterplan/data/outlet.json'

# âncoras folder (pt) -> maquete (unidades da prancha)
F0, F1 = (1365.5, 179.7), (1688.5, 415.2)
M0, M1 = (1507.97, 143.03), (1768.95, 333.53)
SX = (M1[0] - M0[0]) / (F1[0] - F0[0])
SY = (M1[1] - M0[1]) / (F1[1] - F0[1])
LINHA = 0.72          # meia espessura do traço: o limite entre duas lojas é o meio da linha


def para_maquete(x, y):
    return round(M0[0] + (x - F0[0]) * SX, 2), round(M0[1] + (y - F0[1]) * SY, 2)


def celulas():
    pg = pdfplumber.open(FOLDER).pages[1]
    x0, x1, y0, y1 = pg.width * 0.53, pg.width * 0.95, pg.height * 0.1, pg.height * 0.55
    rs = [r for r in pg.rects if x0 < r['x0'] < x1 and y0 < r['top'] < y1]

    def contem(b, a):
        return (b['x0'] <= a['x0'] + .01 and b['x1'] >= a['x1'] - .01 and b['top'] <= a['top'] + .01
                and b['bottom'] >= a['bottom'] - .01 and b['width'] * b['height'] > a['width'] * a['height'] + .5)
    miolos = [a for a in rs if any(contem(b, a) for b in rs if b is not a) and not any(contem(a, b) for b in rs if b is not a)]
    # só células de loja (fora: tracinhos, o bloco "ACESSO" quadrado e a doca estreita)
    return [dict(x=a['x0'], y=a['top'], w=a['width'], h=a['height']) for a in miolos
            if a['width'] > 8 and a['height'] > 8 and not (a['width'] > 40 and a['height'] > 40) and not (25 < a['width'] < 35)]


def ordenar(cs):
    perto = lambda v, alvo: abs(v - alvo) < 1.5   # noqa: E731
    frente = sorted([c for c in cs if perto(c['y'], 179.7)], key=lambda c: c['x'])
    tras = sorted([c for c in cs if perto(c['y'], 211.9)], key=lambda c: c['x'])
    dentro = sorted([c for c in cs if perto(c['x'], 1586.0) and c['y'] > 240], key=lambda c: c['y'])
    fora = sorted([c for c in cs if perto(c['x'], 1642.8) and c['y'] > 220], key=lambda c: c['y'])
    assert (len(frente), len(tras), len(dentro), len(fora)) == (18, 18, 8, 13), (len(frente), len(tras), len(dentro), len(fora))
    # fileira de trás: 10 comuns, a dupla, 4 comuns e as 3 mais fundas (já é a ordem por x)
    return frente + tras + dentro + fora


def altura(cx, cy, vols):
    def dentro(px, py, p):
        pts = list(zip(p[::2], p[1::2]))
        ok = False
        for i in range(len(pts)):
            (xa, ya), (xb, yb) = pts[i], pts[i - 1]
            if (ya > py) != (yb > py) and px < (xb - xa) * (py - ya) / (yb - ya) + xa:
                ok = not ok
        return ok
    hs = [v['h'] for v in vols if dentro(cx, cy, v['p'])]
    return max(hs) if hs else 9


def main():
    tab = json.loads(RETRATO.read_text())
    out = tab['produtos']['outlet']
    cv = {u['id']: u for u in out['unidades'] if u['bloco'].lower().startswith('premium')}
    ids = sorted(cv, key=lambda s: int(s.split('/')[-1]))
    cs = ordenar(celulas())
    assert len(cs) == len(ids) == 57, (len(cs), len(ids))

    vols = [v for v in json.loads(CENA.read_text())['vol'] if v['t'] == 'outlet']
    lojas, des, ofi = [], [], []
    for c, uid in zip(cs, ids):
        u = cv[uid]
        xa, ya = para_maquete(c['x'] - LINHA, c['y'] - LINHA)
        xb, yb = para_maquete(c['x'] + c['w'] + LINHA, c['y'] + c['h'] + LINHA)
        des.append((xb - xa) * (yb - ya)); ofi.append(u['area'])
        lojas.append({'id': uid, 'b': u['bloco'], 'a': u['area'], 'h': altura((xa + xb) / 2, (ya + yb) / 2, vols),
                      'p': [xa, ya, xb, ya, xb, yb, xa, yb],
                      'v': {k: [x['total'], x['sinal'], x['n'], x['parcela']] for k, x in u['c'].items()}})

    # conferência: a área desenhada acompanha a do CV
    n = len(des); md, mo = sum(des) / n, sum(ofi) / n
    cor = sum((a - md) * (b - mo) for a, b in zip(des, ofi)) / math.sqrt(sum((a - md) ** 2 for a in des) * sum((b - mo) ** 2 for b in ofi))
    print(f'57 lojas · correlação área do desenho × área do CV = {cor:.3f}')
    if cor < 0.9:
        sys.exit('A ordem das lojas não bate com o CV — nada gravado.')

    nome = ((out.get('tabelas') or [{}])[0].get('nome') or 'tabela de valores').split(' - ')[0]
    dados = {
        'fonte': 'Lojas: planta "Premium Outlet · 1º fase" do folder digital do Outlet (posição, escala do V14 rev. 02/11/2026) · '
                 f'numeração, áreas, situação e valores: CV CRM, empreendimento 9, {nome} (conferida em {tab["ultimoSucesso"][:10]})',
        'tabela': nome, 'em': tab['ultimoSucesso'],
        'cond': {k: {'m2': v['m2'], 'ajuste': v['ajuste']} for k, v in out['cond'].items()},
        'lojas': lojas,
    }
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'gravado {SAIDA.relative_to(RAIZ)} ({SAIDA.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
