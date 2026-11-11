#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Confere os preços do CV CRM contra os materiais de investidores (só leitura — não grava nada no CV).

    CVCRM_EMAIL=<login da integração> CVCRM_TOKEN=<token> python3 docs/cv_conferencia_precos.py
    (nas sessões do Claude o proxy injeta o token: CVCRM_TOKEN=proxy-injected)

Lê, pela API v1, as unidades dos empreendimentos 4 (Lotes), 7 (Residence + casas do Resort) e 9 (Outlet + Market)
e TODAS as tabelas de preço de cada um (GET /v1/cadastros/empreendimentos/{e}/tabelasdepreco/{id} — o endpoint
"detalhada" só devolve as tabelas vigentes hoje). Regras conferidas (fontes em docs/cv-precos.md):

  Lotes      área = 3dmasterplan/data/lotes.json; US$/m² = 3dmasterplan/data/precos.json (categoria do lote,
             faixa 1–8), o mesmo arredondamento que o CV usa; "Expo 36x" arredonda o total a US$ 100.
  Residence  20%+12x = área do apto × US$ 1.150 arredondado a US$ 100 (cobertura: + 97,40 × 460 + 6.800);
             à vista × 0,95; 36x × 1,08; o campo "valor" da unidade = preço da 12x.
  Resort     casa = 80% do lote × US$ 1.950, arredondado a US$ 50; à vista × 0,95; 36x × 1,08 (assumido).
  Outlet     loja "out/NN": área × US$ 1.150; à vista × 0,95; 36x × 1,08.
  Parcelas   mensal = total × 80% ÷ nº de parcelas, arredondada a US$ 100; o sinal fica com a diferença.

Sai com código 1 se achar divergência.
"""
import json, os, re, sys, urllib.request
from collections import Counter, defaultdict
from decimal import Decimal, ROUND_HALF_UP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = os.environ.get('CVCRM_HOST', 'bracerum.cvcrm.com.br')


def get(caminho):
    req = urllib.request.Request(f'https://{HOST}/api{caminho}', headers={
        'accept': 'application/json', 'email': os.environ['CVCRM_EMAIL'], 'token': os.environ['CVCRM_TOKEN']})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def num(s):
    if s is None: return 0.0
    if isinstance(s, (int, float)): return float(s)
    s = str(s)
    return float(s.replace('.', '').replace(',', '.')) if ',' in s else float(s)


def arred(x, passo):
    return float((Decimal(str(x)) / passo).quantize(Decimal('1'), rounding=ROUND_HALF_UP) * passo)


def unidades(emp):
    """Todas as unidades, com a 2ª página dos blocos de mais de 30 (o CV pagina por bloco)."""
    d = get(f'/v1/cadastros/empreendimentos/{emp}')
    out, pags = [], max((b['paginacao_unidade']['paginas_total'] for et in d['etapas'] for b in et['blocos']), default=1)
    vistos = set()
    for p in range(1, pags + 1):
        dd = d if p == 1 else get(f'/v1/cadastros/empreendimentos/{emp}?pagina_unidade={p}')
        for et in dd['etapas']:
            for b in et['blocos']:
                for u in b['unidades']:
                    if u['idunidade'] not in vistos:
                        vistos.add(u['idunidade']); out.append(dict(u, etapa=et['nome'], bloco=b['nome']))
    return out


def tabelas(emp):
    return [get(f'/v1/cadastros/empreendimentos/{emp}/tabelasdepreco/{t["idtabela"]}')[0]
            for t in get(f'/v1/cadastros/empreendimentos/{emp}/tabelasdepreco')]


def fator(nome):
    n = nome.lower()
    return 0.95 if 'vista' in n else 1.08 if '36' in n else 1.0


def main():
    lot = {l['id']: l for l in json.load(open(os.path.join(ROOT, '3dmasterplan/data/lotes.json'), encoding='utf-8'))['lotes']}
    pre = json.load(open(os.path.join(ROOT, '3dmasterplan/data/precos.json'), encoding='utf-8'))['precos']
    JAN = {'Lançamento Expo': 'expo', 'Pós-Expo': 'pos', 'Fase 1 plena': 'plena'}
    PAG = {'20%+12x': 0, 'Á vista': 1, 'À vista': 1, '20%+36x': 2}
    erros = defaultdict(list)

    def idlote(bloco, un):
        q = re.search(r'Q(\d+)', bloco); l = re.search(r'(\d{1,3})\s*$', un)
        return f'Q{int(q.group(1)):02d}.L{int(l.group(1)):03d}' if q and l else None

    def esperado(emp, tab, d, u):
        a = num(d['area_privativa'])
        if emp == 4:
            k = idlote(d['bloco'], d['unidade'])
            if not k: return None
            jan, pag = [s.strip() for s in tab.split(' - ')]
            v = a * pre[JAN[jan]][lot[k]['cat']][0][PAG[pag]]
            return arred(v, 100) if jan == 'Lançamento Expo' and '36' in pag else v
        f = fator(tab)
        if emp == 7 and 'Resort' in d['bloco']:
            return arred(a * 0.8 * 1950, 50) * f
        if emp == 7:
            base = arred(a * 1150, 100)
            if 'cobertura' in (u.get('tipologia') or ''): base = arred(a * 1150 + 97.40 * 460 + 6800, 100)
            return base * f
        if emp == 9 and d['unidade'].startswith('out'):
            return a * 1150 * f
        return None                                   # Market (lojas e supermercado): sem regra fechada

    for emp in (4, 7, 9):
        us = {u['idunidade']: u for u in unidades(emp)}
        if emp == 4:
            for u in us.values():
                k = idlote(u['bloco'], u['nome'])
                if k and k in lot and abs(num(u['area_privativa']) - lot[k]['a']) > 0.01:
                    erros['área do lote ≠ masterplan'].append(f"{k}: CV {num(u['area_privativa']):g} × maquete {lot[k]['a']}")
        for t in tabelas(emp):
            ok = 0
            for d in t['unidades']:
                u = us.get(d['idunidade'], {})
                v, e = num(d['valor_total']), esperado(emp, t['tabela'], d, u)
                s = d['series']
                if len(s) > 1:
                    n, m = s[1]['qtd_parcelas'], num(s[1]['valor'])
                    if m != arred(v * 0.8 / n, 100) or abs(num(s[0]['valor']) + n * m - v) > 0.01:
                        erros[f"{emp} · {t['tabela']} · parcelas fora da regra"].append(f"{d['bloco']} {d['unidade']}")
                if e is None: continue
                if abs(v - e) >= 1:
                    erros[f"{emp} · {t['idtabela']} {t['tabela']}"].append(f"{d['bloco']} {d['unidade']} ({num(d['area_privativa']):g} m²): CV {v:,.2f} × {e:,.2f}")
                else:
                    ok += 1
            print(f"{emp:2d} · {t['idtabela']:3d} {t['tabela']:40s} {ok:5d} certos de {len(t['unidades'])}")
        if emp == 7:   # campo "valor" do cadastro = preço da 12x
            for u in us.values():
                a = num(u['area_privativa'])
                e = arred(a * 0.8 * 1950, 50) if 'Resort' in u['bloco'] else \
                    arred(a * 1150 + 97.40 * 460 + 6800, 100) if 'cobertura' in (u.get('tipologia') or '') else arred(a * 1150, 100)
                if abs(num(u['valor']) - e) >= 1:
                    erros['7 · campo "valor" da unidade'].append(f"{u['bloco']} {u['nome']}: CV {num(u['valor']):,.2f} × {e:,.2f}")

    print()
    for k, v in erros.items():
        print(f'✗ {k}: {len(v)}')
        for x in v[:5]: print('    ', x)
        if len(v) > 5: print(f'     … +{len(v) - 5}')
    if not erros: print('✓ tudo confere')
    return 1 if erros else 0


if __name__ == '__main__':
    sys.exit(main())
