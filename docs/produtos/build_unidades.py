#!/usr/bin/env python3
"""Liga cada unidade à venda do Bracerum Park ao seu lugar no Masterplan V14 e ao seu preço.

Gera, no formato do modelo de importação de empreendimentos/unidades do CRM
(`modelo_empreendimentos_unidades.csv`, `;`, UTF-8 com BOM, decimal com vírgula):

  * Bracerum Residence (P5) — 1.200 apartamentos, 67 torres. Torre = Bloco. Preço pela regra da
    Tabela de Preços P5 (rev. 28/10/2026): arredonda a US$ 50 (área × 1.150 + terraço × 460 +
    6.800 nas coberturas). Nas torres de 1 quarto, os finais 02 e 05 são a planta de 49,20 m².
  * Lotes industriais (P1) — 615 lotes do V14. Quadra = Bloco. Preço = área × US$/m² da janela
    vigente na data de geração, categoria do lote, faixa de 1 a 8 lotes, 20% + 12x.

A posição vem de `3dmasterplan/data/scene.json` (torres, lidas do PDF do V14 por build_data.py) e
`3dmasterplan/data/lotes.json` (lotes, por build_lotes.py); a conversão prancha → lat/lon é a mesma
do `build_refs.py` (rotação `A` em torno do centro da prancha, `centro_latlon`).

**Numeração das torres no mapa = PROPOSTA.** O kit comercial só diz T01–T12 = 3 quartos,
T13–T51 = 2 quartos, T52–T67 = 1 quarto; não diz qual torre é qual. Aqui, dentro de cada
tipologia, a ordem é a de leitura da prancha (linha de cima para baixo, da esquerda para a
direita). Trocar quando o cliente mandar a planta numerada.

Uso:  python3 docs/produtos/build_unidades.py [--controle Controle_Unidades_...xlsx]
      (--controle confere cada apartamento contra o Controle interno, se ele estiver à mão)
"""
import argparse, csv, datetime, json, math, os, sys
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AQUI = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.join(ROOT, '3dmasterplan', 'data', 'scene.json')
LOTES = os.path.join(ROOT, '3dmasterplan', 'data', 'lotes.json')
PRECOS = os.path.join(ROOT, '3dmasterplan', 'data', 'precos.json')
MODELO = os.path.join(AQUI, 'modelo_empreendimentos_unidades.csv')
SAIDA = os.path.join(AQUI, 'empreendimentos_unidades_bracerum.csv')
SAIDA_TORRES = os.path.join(AQUI, 'torres_residence.json')
SAIDA_CODIGOS = os.path.join(AQUI, 'registro_codigos.csv')

LAT_PARK = -25.7715                                   # PARK do build_refs.py (base do KX)
KY = 110540
KX = 111320 * math.cos(math.radians(LAT_PARK))

# --- Tabela de Preços P5 (rev. 28/10/2026) -------------------------------------------------
M2, M2_TERRACO, GOURMET, ARRED = 1150, 460, 6800, 50
TIPO = {  # pé-direito comercial de cada tipologia
    '3 quartos': dict(por_andar=4, areas=[97.40] * 4, vagas=(1, 1), quartos=3, banh=2, suites=1, faixa=range(1, 13)),
    '2 quartos': dict(por_andar=4, areas=[68.27] * 4, vagas=(1, 1), quartos=2, banh=2, suites=1, faixa=range(13, 52)),
    '1 quarto': dict(por_andar=6, areas=[48.16, 49.20, 48.16, 48.16, 49.20, 48.16], vagas=(1, 0), quartos=1, banh=1,
                     suites=0, faixa=range(52, 68)),
}
VOL_TIPO = {'3 quartos': lambda v, a: v['t'] == 'torre' and a > 330,
            '2 quartos': lambda v, a: v['t'] == 'torre' and a <= 330,
            '1 quarto': lambda v, a: v['t'] == 'torre1'}


# --- Padrão de códigos (docs/padrao-de-codigos.md): [categoria 1][subcategoria 2][número 4] ----------
CATEGORIAS = {1: 'Hotel', 2: 'Cidade', 3: 'Loteamento', 4: 'Condomínios'}
SUBCATEGORIAS = {
    (1, 0): 'Bracerum Hotel',                     # número = andar 2 + unidade 2
    (2, 1): 'Bracerum Market',                    # número = loja
    (3, 1): 'Outlet Premium', (3, 2): 'Lotes industriais', (3, 3): 'Hangares',
    (4, 1): 'Bracerum Residence', (4, 2): 'Bracerum Resort',
}


def codigo(cat, sub, num):
    """Código de 7 dígitos. `num` é o número de 4 dígitos já montado (ex.: quadra 07 + lote 14 = 714)."""
    assert (cat, sub) in SUBCATEGORIAS, (cat, sub)
    assert 0 < num <= 9999, num
    return f'{cat}{sub:02d}{num:04d}'


def cod_residence(torre, andar, apto):         # T07, 3º andar, apto 02 → 4010732
    assert 1 <= torre <= 99 and 1 <= andar <= 9 and 1 <= apto <= 9
    return codigo(4, 1, torre * 100 + andar * 10 + apto)


def cod_lote(q, l):                             # Q07.L014 → 3020714
    assert 1 <= q <= 99 and 1 <= l <= 99
    return codigo(3, 2, q * 100 + l)


def preco_apto(area, cobertura):
    bruto = area * M2 + (area * M2_TERRACO + GOURMET if cobertura else 0)
    return int(round(bruto / ARRED) * ARRED)


def area_pol(p):
    xs, ys = p[0::2], p[1::2]
    n = len(xs)
    return abs(sum(xs[i] * ys[(i + 1) % n] - xs[(i + 1) % n] * ys[i] for i in range(n))) / 2


def centro(p):
    xs, ys = p[0::2], p[1::2]
    return sum(xs) / len(xs), sum(ys) / len(ys)


class Geo:
    def __init__(self, cena):
        self.W, self.H = cena['sheet']
        self.A = cena['A']
        self.lat0, self.lon0 = cena['centro_latlon']

    def latlon(self, X, Y):
        dx, dy = X - self.W / 2, Y - self.H / 2
        sa, ca = math.sin(self.A), math.cos(self.A)
        dE, dN = -dx * sa + dy * ca, dx * ca + dy * sa
        return self.lat0 + dN / KY, self.lon0 + dE / KX


def br(n, casas=2):
    """Número no formato do CRM brasileiro: vírgula decimal, sem separador de milhar."""
    if n is None or n == '':
        return ''
    s = f'{n:.{casas}f}'.replace('.', ',')
    return s


def torres(cena):
    achadas = {k: [] for k in TIPO}
    for v in cena['vol']:
        if v['t'] not in ('torre', 'torre1'):
            continue
        a = area_pol(v['p'])
        for k, f in VOL_TIPO.items():
            if f(v, a):
                achadas[k].append((centro(v['p']), a))
    out = []
    for k, lista in achadas.items():
        faixa = list(TIPO[k]['faixa'])
        assert len(lista) == len(faixa), f'{k}: {len(lista)} torres na planta, {len(faixa)} no kit'
        lista.sort(key=lambda t: (round(t[0][1] / 20), t[0][0]))     # linha da prancha, depois coluna
        for n, ((x, y), a) in zip(faixa, lista):
            out.append(dict(torre=f'T{n:02d}', codigo_bloco=f'401{n:02d}', tipologia=k, x=round(x, 1), y=round(y, 1), projecao_m2=round(a)))
    return sorted(out, key=lambda t: t['torre'])


def apartamentos(torre):
    t = TIPO[torre['tipologia']]
    for andar in range(1, 5):
        cob = andar == 4
        for i, area in enumerate(t['areas'], 1):
            yield dict(cod7=cod_residence(int(torre['torre'][1:]), andar, i),
                       codigo=f"RES {torre['torre']} – {andar}{i:02d}", apto=f'{andar}{i:02d}', andar=andar, coluna=i,
                       cobertura=cob, area=area, terraco=area if cob else 0.0, preco=preco_apto(area, cob))


def janela_vigente(precos, hoje):
    for j in precos['janelas']:
        if hoje <= j.get('ate', '9999-12-31'):
            return j
    return precos['janelas'][-1]


def poi(cena, tag):
    vs = [v for v in cena['vol'] if v['t'] == tag]
    xs = [centro(v['p'])[0] for v in vs]
    ys = [centro(v['p'])[1] for v in vs]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--controle', help='Controle_Unidades_Bracerum_Residence_MP14.xlsx para conferência')
    ap.add_argument('--hoje', default=datetime.date.today().isoformat())
    args = ap.parse_args()

    cena = json.load(open(SCENE, encoding='utf-8'))
    geo = Geo(cena)
    cab = open(MODELO, encoding='utf-8-sig').read().strip().split(';')
    col = {nome: i for i, nome in enumerate(cab)}
    linhas = []

    def linha(**campos):
        r = [''] * len(cab)
        for k, v in campos.items():
            r[col[k]] = v
        linhas.append(r)

    comum = {
        'Empresa (Empreendimento)': 'QATAR S.A. (Bracerum Park)',
        'Região (Empreendimento)': 'Grande Assunção',
        'Logradouro (Empreendimento)': 'Rodovia PY-19',
        'Estado (Empreendimento)': 'Central',
        'Cidade (Empreendimento)': 'Villeta',
        'Empreendimento Legado/Novo (Empreendimento)': 'Novo',
    }

    registro = []                                     # todo código gerado, para o registro e a checagem

    # ---------------------------------------------------------------- Residence
    T = torres(cena)
    vgv, aptos = 0, []
    for t in T:
        tp = TIPO[t['tipologia']]
        lat, lon = geo.latlon(t['x'], t['y'])
        t['lat'], t['lon'] = round(lat, 6), round(lon, 6)
        t['vgv'] = 0
        for a in apartamentos(t):
            aptos.append(a)
            registro.append(dict(codigo=a['cod7'], cat=4, sub=1, nome=a['codigo'], ref=f"{t['torre']}-{a['apto']}",
                                 lat=lat, lon=lon))
            t['vgv'] += a['preco']
            vgv += a['preco']
            vc, vd = tp['vagas']
            linha(**comum, **{
                'Nome (Empreendimento)': 'Bracerum Residence', 'Sigla (Empreendimento)': 'RES',
                'Situação Comercial (Empreendimento)': 'Pré-lançamento', 'Situação da Obra (Empreendimento)': 'Não iniciada',
                'Segmento (Empreendimento)': 'Residencial', 'Tipo (Empreendimento)': 'Condomínio vertical',
                'Área privativa (Empreendimento)': br(79927.84),
                'Nome (Etapa)': 'Pré-lançamento (fases a definir)',
                'Código interno (Empreendimento)': '401', 'Código interno (Etapa)': '401',
                'Nome (Bloco)': f"Torre {t['torre']}", 'Código interno (Bloco)': a['cod7'][:5],
                'Nome (Unidade)': a['codigo'], 'Andar (Unidade)': str(a['andar']),
                'Descrição do andar (Unidade)': '4º andar (cobertura)' if a['cobertura'] else f"{a['andar']}º andar",
                'Coluna (Unidade)': f"{a['coluna']:02d}", 'Posição (Unidade)': a['apto'],
                'Tipologia (Unidade)': t['tipologia'] + (' — cobertura' if a['cobertura'] else ''),
                'Vagas de garagem (Unidade)': str(vc + vd),
                'Área privativa m² (Unidade)': br(a['area']),
                'Outras áreas privativas (Unidade)': br(a['terraco']) if a['terraco'] else '',
                'Área privativa total (Unidade)': br(a['area'] + a['terraco']),
                'Valor (Unidade)': br(a['preco']), 'Valor VGV (Unidade)': br(a['preco']),
                'Tipo (Unidade)': 'Apartamento',
                'Código interno (Unidade)': a['cod7'],
                'Referência Ordenação (Unidade)': f"{t['torre']}-{a['apto']}",
                'Descrição do Lote (Unidade)': (f"{tp['quartos']} quarto(s), {tp['suites']} suíte(s); vagas: {vc} coberta"
                                                + (f" + {vd} descoberta" if vd else '')
                                                + ('; terraço gourmet privativo' if a['cobertura'] else '')),
                'Latitude (Unidade)': f"{lat:.6f}", 'Longitude (Unidade)': f"{lon:.6f}",
                'Quantidade de Quartos (Unidade)': str(tp['quartos']),
                'Quantidade de Banheiros (Unidade)': str(tp['banh']),
                'Quantidade de Suítes (Unidade)': str(tp['suites']),
                'Quantidade vagas de garagem (Unidade)': str(vc + vd),
            })
    assert len(aptos) == 1200 and vgv == 103_144_800, (len(aptos), vgv)

    # ---------------------------------------------------------------- Lotes
    L = json.load(open(LOTES, encoding='utf-8'))['lotes']
    P = json.load(open(PRECOS, encoding='utf-8'))
    jan = janela_vigente(P, args.hoje)
    cats = P['categorias']
    vgv_lotes = 0
    for l in sorted(L, key=lambda l: l['id']):
        pm = P['precos'][jan['id']][l['cat']][0][0]
        valor = pm * l['a']
        vgv_lotes += valor
        x, y = centro(l['p'])
        lat, lon = geo.latlon(x, y)
        q, n = l['id'].split('.L')
        c7 = cod_lote(int(q[1:]), int(n))
        registro.append(dict(codigo=c7, cat=3, sub=2, nome=l['nome'], ref=l['id'], lat=lat, lon=lon))
        linha(**comum, **{
            'Nome (Empreendimento)': 'Bracerum Park — Lotes industriais', 'Sigla (Empreendimento)': 'LTIND',
            'Situação Comercial (Empreendimento)': 'Em vendas', 'Situação da Obra (Empreendimento)': 'Não iniciada',
            'Segmento (Empreendimento)': 'Industrial', 'Tipo (Empreendimento)': 'Loteamento industrial',
            'Código interno (Empreendimento)': '302', 'Código interno (Etapa)': '302',
            'Nome (Etapa)': 'Fase 1', 'Nome (Bloco)': f"Quadra {l['q']}", 'Código interno (Bloco)': c7[:5],
            'Nome (Unidade)': 'LTIND.' + l['id'], 'Tipologia (Unidade)': cats[l['cat']]['nome']['pt'],
            'Área do terreno (Unidade)': br(l['a']), 'Área total (Unidade)': br(l['a']),
            'Valor (Unidade)': br(valor), 'Valor VGV (Unidade)': br(valor), 'Tipo (Unidade)': 'Lote',
            'Código interno (Unidade)': c7, 'Referência Ordenação (Unidade)': l['id'],
            'Descrição do Lote (Unidade)': (f"{l['nome']} · {cats[l['cat']]['nome']['pt']} (×{cats[l['cat']]['fator']}) · "
                                            f"US$ {pm}/m² — janela {jan['curto']['pt']}, 1 a 8 lotes, 20% + 12x"),
            'Latitude (Unidade)': f"{lat:.6f}", 'Longitude (Unidade)': f"{lon:.6f}",
        })

    # ---------------------------------------------------------------- só código (sem preço ainda)
    # Hangares (7, ao longo do pátio do aeroporto) e casas do Resort (31 lotes): numeração = PROPOSTA,
    # na ordem de leitura da prancha. Entram no registro, não no CSV do CRM (não há preço).
    for sub, tag, nome in ((3, 'hangar', 'Hangar {:02d}'), (2, 'casa', 'Resort — lote {:02d}')):
        cat = 3 if tag == 'hangar' else 4
        vs = sorted((centro(v['p']) for v in cena['vol'] if v['t'] == tag), key=lambda c: (round(c[1] / 20), c[0]))
        for n, (x, y) in enumerate(vs, 1):
            lat, lon = geo.latlon(x, y)
            registro.append(dict(codigo=codigo(cat, sub, n), cat=cat, sub=sub, nome=nome.format(n), ref='proposta',
                                 lat=lat, lon=lon))

    cods = [r['codigo'] for r in registro]
    assert len(cods) == len(set(cods)), 'código repetido'
    assert all(len(c) == 7 and c.isdigit() for c in cods)
    with open(SAIDA_CODIGOS, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\r\n')
        w.writerow(['Código', 'Categoria', 'Subcategoria', 'Unidade', 'Referência', 'Latitude', 'Longitude'])
        for r in sorted(registro, key=lambda r: r['codigo']):
            w.writerow([r['codigo'], f"{r['cat']} {CATEGORIAS[r['cat']]}", f"{r['sub']:02d} {SUBCATEGORIAS[(r['cat'], r['sub'])]}",
                        r['nome'], r['ref'], f"{r['lat']:.6f}", f"{r['lon']:.6f}"])
    print('Códigos:', dict(Counter(f"{r['cat']}{r['sub']:02d}" for r in registro)), '→', os.path.relpath(SAIDA_CODIGOS, ROOT))

    with open(SAIDA, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\r\n')
        w.writerow(cab)
        w.writerows(linhas)

    # ---------------------------------------------------------------- torres + distâncias
    pois = {k: poi(cena, k) for k in ('salão de eventos', 'supermercado', 'outlet', 'escola', 'ambulatório',
                                      'hotel', 'posto e portaria', 'hub de serviços', 'centro tecnológico')}
    for t in T:
        t['dist_m'] = {k: round(math.dist((t['x'], t['y']), p)) for k, p in pois.items()}
    json.dump({'fonte': 'Masterplan V14 (28/10/2026) · Tabela de Preços P5 rev. 28/10/2026 · numeração das torres = PROPOSTA',
               'torres': T}, open(SAIDA_TORRES, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print(f'Residence: {len(T)} torres, {len(aptos)} aptos, VGV US$ {vgv:,}')
    for k in TIPO:
        ts = [t for t in T if t['tipologia'] == k]
        print(f'  {k:10s} {len(ts):2d} torres {ts[0]["torre"]}–{ts[-1]["torre"]}  VGV US$ {sum(t["vgv"] for t in ts):,}')
    print(f'Lotes: {len(L)} lotes, {sum(l["a"] for l in L):,} m², janela {jan["id"]}, VGV US$ {vgv_lotes:,}')
    print(f'  por categoria: {dict(Counter(l["cat"] for l in L))}')
    print(f'→ {os.path.relpath(SAIDA, ROOT)} ({len(linhas)} linhas)  · {os.path.relpath(SAIDA_TORRES, ROOT)}')

    if args.controle:
        import openpyxl
        ws = openpyxl.load_workbook(args.controle, data_only=True)['Unidades']
        X = {r[0]: r for r in ws.iter_rows(min_row=5, values_only=True) if r[0]}
        dif = [a['codigo'] for a in aptos
               if a['codigo'] not in X or abs(X[a['codigo']][6] - a['area']) > 1e-6 or X[a['codigo']][10] != a['preco']]
        print(f'Controle: {len(X)} unidades, {len(dif)} divergências' + (f' — {dif[:5]}' if dif else ''))


if __name__ == '__main__':
    sys.exit(main())
