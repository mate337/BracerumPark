#!/usr/bin/env python3
"""
Tabela de valores do Bracerum Residence (aptos e casas) no modelo de importação de unidades do CV CRM.

Modelo: os arquivos `unidades_*.csv` da pasta "BRACERUM PARK - CV" do Drive (mesmas 126 colunas, separador
";", UTF-8 com BOM). A coluna "Id (Unidade)" leva o id da unidade que já existe no CV, para a importação
atualizar a unidade em vez de criar outra; as unidades novas (5º andar das torres de 1 e 2 quartos) vão sem id.

Fontes:
  - Aptos: "Bracerum Residence — Apresentação para investidores", nov/2026 (P5), págs. 4, 5, 9–13:
    1.452 aptos em 67 torres. 3 quartos: 12 torres × 16 (4 por andar, 4 andares; o 4º é a cobertura duplex).
    2 quartos: 39 torres × 20 (4 por andar, 5 andares, sem cobertura). 1 quarto: 16 torres × 30
    (6 por andar, 5 andares, sem cobertura; plantas 48,16 e 49,20 m²).
    Preço = US$ 1.150/m² do apartamento (vagas incluídas), arredondado à centena; cobertura soma o terraço
    a US$ 460/m² + US$ 6.800 da área gourmet. Os valores conferem com a tabela da pág. 12.
  - Casas: os 31 lotes residenciais (Q01–Q04 do Resort) do CV, áreas iguais às do Masterplan V14 rev. 02/11/2026,
    a US$ 1.150/m² (definido pelo cliente em 2026-11-10).
  - Estrutura atual do CV: `cv_unidades_2026-11-10.json` (lido da API em 2026-11-10).

Uso: python3 docs/cv/build_tabela_cv.py   (grava os CSV e o resumo em docs/cv/)
"""
import csv, json, os
from collections import OrderedDict

AQUI = os.path.dirname(os.path.abspath(__file__))
SNAP = json.load(open(os.path.join(AQUI, 'cv_unidades_2026-11-10.json'), encoding='utf-8'))

CABECALHO = """Nome (Empreendimento);Sigla (Empreendimento);Matrícula (Empreendimento);Empresa (Empreendimento);Situação Comercial (Empreendimento);Situação da Obra (Empreendimento);Região (Empreendimento);CEP (Empreendimento);Logradouro (Empreendimento);Endereço (Empreendimento);Bairro (Empreendimento);Número (Empreendimento);Complemento (Empreendimento);Estado (Empreendimento);Cidade (Empreendimento);Segmento (Empreendimento);Tipo (Empreendimento);Ativo no painel (Empreendimento);Código Viva Real (Empreendimento);Código Zap (Empreendimento);Código Anúncio OLX (Empreendimento);Código Anúncio ImovelWeb (Empreendimento);Código Anúncio Phonetrack (Empreendimento);Data da Entrega (Empreendimento);Dias de tolerância (Empreendimento);Percentual custo de escrituração (Empreendimento);Dos serviços de intermediação imobiliária (Empreendimento);Empreendimento Legado/Novo (Empreendimento);Insira o texto (Empreendimento);Insira o texto para distrato (Empreendimento);Insira o texto de Observação (Empreendimento);Insira o texto jurídico (Empreendimento);Insira as informações (Empreendimento);Dados da incorporação (Empreendimento);Dados do terreno (Empreendimento);Dados do empreendimento (Empreendimento);Centro de custo (Empreendimento);Conta contábil (Empreendimento);Departamento (Empreendimento);Custo total do terreno (Empreendimento);Engenheiro (Empreendimento);Supervisor (Empreendimento);Área construída (Empreendimento);Área privativa (Empreendimento);Início das vendas (Empreendimento);Término das vendas (Empreendimento);Valor pretendido (Empreendimento);Código interno (Empreendimento);Nome interno (Empreendimento);Id Contrato Linkpay (Empreendimento);Nome (Etapa);Data de lançamento (Etapa);Data de início de obra (Etapa);Data de conclusão (Etapa);Previsão de entrega (Etapa);Ativo no painel (Etapa);Contabilizar (Etapa);Código interno (Etapa);% de medição de obra (Etapa);Data base para o cálculo de juros futuro (Etapa);Nome (Bloco);Ativo no painel (Bloco);Data de liberação do lote para cadastrar agendamento (Bloco);A partir de qual data o agendamento pode ser cadastrado (Bloco);Contabilizar (Bloco);Código interno (Bloco);Data base para o cálculo de juros futuro (Bloco);Id (Unidade);Nome (Unidade);Complemento (Unidade);Nº matrícula (Unidade);Cadastro Imobiliário Brasileiro (CIB) (Unidade);Andar (Unidade);Descrição do andar (Unidade);Coluna (Unidade);Posição (Unidade);Tipologia (Unidade);Empresa de Terceirização (Unidade);Vagas de garagem (Unidade);Quantidade de depósitos (Unidade);Jardim (Unidade);Área privativa m² (Unidade);Área de garagem (Unidade);Área comum (Unidade);Outras áreas privativas (Unidade);Dimensões (Unidade);Área total (Unidade);Área privativa total (Unidade);Área do terreno (Unidade);Fração ideal (Unidade);Valor (Unidade);Tipo (Unidade);Ativo no painel (Unidade);Data de liberação do lote para cadastrar agendamento (Unidade);A partir de qual data o agendamento pode ser cadastrado (Unidade);Data de entrega (Unidade);Qtd. de espaços complementares (Unidade);Código interno (Unidade);Referência Ordenação (Unidade);Descrição do Lote (Unidade);Valor Avaliação (Unidade);Desconto no faturamento (Unidade);Latitude (Unidade);Longitude (Unidade);Valor indexado do Sienge (Unidade);Deseja informar os percentuais de participação? (Unidade);Porcentagem da Incorporadora (Unidade);Nome do Sócio (Unidade);Porcentagem do Sócio (Unidade);Nome do Parceiro (Unidade);Porcentagem da Parceiro (Unidade);Porcentagem do Marketing do parceiro (Unidade);Porcentagem da Permuta (Unidade);Fator de Apropriação (Unidade);Fase (Unidade);Bloqueado via Integração (Unidade);Adimplência Premiada (Unidade);Habilitar envio da reserva para integração (Unidade);Data de entrega das chaves (Unidade);Data base para o cálculo de juros futuro (Unidade);Valor VGV (Unidade);Valor PV (Unidade);Quantidade de Quartos (Unidade);Quantidade de Banheiros (Unidade);Quantidade de Suítes (Unidade);Quantidade vagas de garagem (Unidade)""".split(';')
assert len(CABECALHO) == 126, len(CABECALHO)

PRECO_M2 = 1150          # US$/m² — apartamento (vagas incluídas) e lote residencial
TERRACO_M2 = 460         # US$/m² do terraço da cobertura
GOURMET = 6800           # US$ da área gourmet da cobertura
VAGA = 2.5 * 4.5         # 11,25 m² (vaga de 2,5 × 4,5 m)


def centena(v):
    return int(round(v / 100.0)) * 100


def num(v, casas=2):
    """Número no padrão brasileiro do CV: vírgula decimal, sem separador de milhar."""
    return f'{v:.{casas}f}'.replace('.', ',')


# Tipologias do PDF ---------------------------------------------------------------------------------------
# área do apto, vagas, quartos, banheiros, suítes
TIPOS = {
    '1q-p1': dict(tipologia='1 quarto', area=48.16, vagas=1, q=1, b=1, s=0, desc='1 quarto — planta 1 (48,16 m²) + 1 vaga coberta'),
    '1q-p2': dict(tipologia='1 quarto', area=49.20, vagas=1, q=1, b=1, s=0, desc='1 quarto — planta 2 (49,20 m², com área técnica) + 1 vaga coberta'),
    '2q':    dict(tipologia='2 quartos', area=68.27, vagas=2, q=2, b=2, s=1, desc='2 quartos com suíte (68,27 m²) + 2 vagas (1 coberta e 1 descoberta)'),
    '3q':    dict(tipologia='3 quartos', area=97.40, vagas=2, q=3, b=2, s=1, desc='3 quartos com suíte (97,40 m²) + 2 vagas (1 coberta e 1 descoberta)'),
    '3q-cob': dict(tipologia='3 quartos — cobertura', area=97.40, vagas=2, q=3, b=3, s=1, terraco=97.40,
                   desc='Cobertura duplex de 3 quartos (97,40 m²) + laje privativa de 97,40 m² (lazer com churrasqueira, banheiro e solarium) + 2 vagas'),
}
for t in TIPOS.values():
    t['valor'] = centena(t['area'] * PRECO_M2 + t.get('terraco', 0) * TERRACO_M2 + (GOURMET if 'terraco' in t else 0))
    t['garagem'] = t['vagas'] * VAGA
    t['total'] = t['area'] + t['garagem'] + t.get('terraco', 0)
# conferência com a tabela da pág. 12 do PDF
assert [TIPOS[k]['valor'] for k in ('1q-p1', '1q-p2', '2q', '3q', '3q-cob')] == [55400, 56600, 78500, 112000, 163600]
assert [round(TIPOS[k]['total'], 2) for k in ('1q-p1', '1q-p2', '2q', '3q', '3q-cob')] == [59.41, 60.45, 90.77, 119.90, 217.30]


def tipo_apto(torre, andar, coluna):
    n = int(torre[1:])
    if n <= 12:                       # T01–T12: 3 quartos, 4 andares, o 4º é a cobertura
        return '3q-cob' if andar == 4 else '3q'
    if n <= 51:                       # T13–T51: 2 quartos, 5 andares
        return '2q'
    return '1q-p2' if coluna in (2, 5) else '1q-p1'   # T52–T67: 1 quarto; colunas 2 e 5 = planta 2 (como no CV)


def estrutura(torre):
    n = int(torre[1:])
    if n <= 12:
        return 4, 4
    if n <= 51:
        return 5, 4
    return 5, 6


def linha(emp, etapa, bloco, uid, nome, **u):
    r = OrderedDict((c, '') for c in CABECALHO)
    r['Nome (Empreendimento)'] = emp['empreendimento']
    r['Empresa (Empreendimento)'] = emp['empresa']
    r['Região (Empreendimento)'] = emp['regiao']
    r['Segmento (Empreendimento)'] = emp['segmento']
    r['Tipo (Empreendimento)'] = emp['tipo']
    r['Data da Entrega (Empreendimento)'] = emp['data_entrega']
    r['Nome (Etapa)'] = etapa
    r['Nome (Bloco)'] = bloco
    r['Id (Unidade)'] = uid or ''
    r['Nome (Unidade)'] = nome
    for k, v in u.items():
        r[k] = v
    return r


emp7 = SNAP['7']
etapa_aptos = next(e for e in emp7['etapas'] if e['nome'].startswith('Pré-lançamento'))
etapa_casas = next(e for e in emp7['etapas'] if e['nome'] == 'Fase 1')

# ---- Residence Aptos ------------------------------------------------------------------------------------
aptos, mudancas = [], []
for b in etapa_aptos['blocos']:
    torre = b['nome'].replace('Torre ', '')
    andares, por_andar = estrutura(torre)
    existentes = {u['nome']: u for u in b['unidades']}
    for andar in range(1, andares + 1):
        for col in range(1, por_andar + 1):
            nome = f'{andar}{col:02d}'
            t = TIPOS[tipo_apto(torre, andar, col)]
            cv = existentes.pop(nome, None)
            if cv is None:
                mudancas.append((b['nome'], nome, 'NOVA', '', t['tipologia'], '', t['valor']))
            elif cv['tipologia'] != t['tipologia'] or round(float(cv['valor'] or 0)) != t['valor'] \
                    or abs(float(cv['area_privativa']) - t['area']) > 0.005:
                mudancas.append((b['nome'], nome, 'ALTERADA', cv['tipologia'], t['tipologia'],
                                 round(float(cv['valor'] or 0)), t['valor']))
            aptos.append(linha(emp7, etapa_aptos['nome'], b['nome'], cv and cv['idunidade'], nome, **{
                'Andar (Unidade)': andar, 'Coluna (Unidade)': col, 'Tipologia (Unidade)': t['tipologia'],
                'Vagas de garagem (Unidade)': t['vagas'], 'Área privativa m² (Unidade)': num(t['area']),
                'Área de garagem (Unidade)': num(t['garagem']),
                'Outras áreas privativas (Unidade)': num(t['terraco']) if 'terraco' in t else '',
                'Área privativa total (Unidade)': num(t['total']), 'Valor (Unidade)': num(t['valor']),
                'Tipo (Unidade)': 'Apartamento', 'Descrição do Lote (Unidade)': t['desc'],
                'Quantidade de Quartos (Unidade)': t['q'], 'Quantidade de Banheiros (Unidade)': t['b'],
                'Quantidade de Suítes (Unidade)': t['s'], 'Quantidade vagas de garagem (Unidade)': t['vagas'],
            }))
    assert not existentes, (b['nome'], list(existentes))     # nenhuma unidade do CV fica sem destino
assert len(aptos) == 1452, len(aptos)

# ---- Residence Casas (lotes residenciais) ---------------------------------------------------------------
casas = []
for b in etapa_casas['blocos']:
    for u in b['unidades']:
        area = float(u['area_privativa'])
        valor = round(area * PRECO_M2, 2)
        casas.append(linha(emp7, etapa_casas['nome'], b['nome'], u['idunidade'], u['nome'], **{
            'Tipologia (Unidade)': u['tipologia'], 'Área privativa m² (Unidade)': num(area),
            'Área privativa total (Unidade)': num(area), 'Área do terreno (Unidade)': num(area),
            'Valor (Unidade)': num(valor), 'Tipo (Unidade)': 'Lote',
            'Descrição do Lote (Unidade)': f'Lote residencial de {num(area, 0)} m² — US$ 1.150/m²',
        }))
assert len(casas) == 31


def grava(nome, linhas):
    with open(os.path.join(AQUI, nome), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';', quoting=csv.QUOTE_MINIMAL, lineterminator='\r\n')
        w.writerow(CABECALHO)
        for r in linhas:
            w.writerow(r.values())


grava('cv_residence_aptos_valores.csv', aptos)
grava('cv_residence_casas_valores.csv', casas)

# ---- Resumo ---------------------------------------------------------------------------------------------
def v(r):
    return float(r['Valor (Unidade)'].replace(',', '.'))

res = OrderedDict()
for r in aptos:
    k = (r['Tipologia (Unidade)'], r['Área privativa m² (Unidade)'], r['Valor (Unidade)'])
    res[k] = res.get(k, 0) + 1
print('Residence Aptos — %d unidades, US$ %s' % (len(aptos), f'{sum(map(v, aptos)):,.2f}'))
for (tip, area, val), n in res.items():
    print(f'  {n:5d} × {tip:24s} {area:>6s} m²  US$ {val}')
novas = sum(1 for m in mudancas if m[2] == 'NOVA')
print(f'  {novas} unidades novas (sem Id) e {len(mudancas) - novas} unidades existentes alteradas no CV')
area_c = sum(float(r['Área privativa m² (Unidade)'].replace(',', '.')) for r in casas)
print('Residence Casas — %d lotes, %s m², US$ %s' % (len(casas), num(area_c, 0), f'{sum(map(v, casas)):,.2f}'))

with open(os.path.join(AQUI, 'cv_residence_aptos_mudancas.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter=';', lineterminator='\r\n')
    w.writerow(['Bloco', 'Unidade', 'Situação', 'Tipologia no CV', 'Tipologia nova', 'Valor no CV (US$)', 'Valor novo (US$)'])
    w.writerows(mudancas)

# ---- Tabela de valores legível (xlsx) -------------------------------------------------------------------
try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
except ImportError:
    Workbook = None

if Workbook:
    wb = Workbook()
    neg, fundo = Font(bold=True, color='FFFFFF'), PatternFill('solid', fgColor='0E0D0B')
    USD, M2 = '"US$" #,##0', '#,##0.00" m²"'

    def cab(ws, linha, cols, larg):
        ws.append(cols)
        for i, c in enumerate(ws[ws.max_row], 1):
            c.font, c.fill, c.alignment = neg, fundo, Alignment(wrap_text=True, vertical='center')
        for i, w in enumerate(larg):
            ws.column_dimensions[chr(65 + i)].width = w

    ws = wb.active
    ws.title = 'Residence Aptos'
    ws.append(['Bracerum Residence — Apartamentos · tabela de valores (nov/2026)'])
    ws['A1'].font = Font(bold=True, size=13)
    ws.append(['US$ 1.150/m² do apartamento, vagas incluídas; terraço da cobertura a US$ 460/m² + US$ 6.800 da área gourmet; valores arredondados à centena. Fonte: Apresentação para investidores P5, pág. 12.'])
    ws.append([])
    cab(ws, 4, ['Unidade', 'Torres', 'Andares', 'Unidades', 'Área do apto', 'Vagas', 'Área privativa total', 'Preço unitário', 'Total (VGV)'],
        [34, 12, 12, 10, 13, 8, 16, 15, 17])
    linhas = [
        ('3 quartos (1º ao 3º andar)', 'T01–T12', '1º–3º', 144, '3q'),
        ('Cobertura duplex 3 quartos (4º andar)', 'T01–T12', '4º', 48, '3q-cob'),
        ('2 quartos', 'T13–T51', '1º–5º', 780, '2q'),
        ('1 quarto — planta 1', 'T52–T67', '1º–5º', 320, '1q-p1'),
        ('1 quarto — planta 2', 'T52–T67', '1º–5º', 160, '1q-p2'),
    ]
    for rot, tor, an, n, k in linhas:
        t = TIPOS[k]
        ws.append([rot, tor, an, n, t['area'], t['vagas'], t['total'], t['valor'], f'=D{ws.max_row + 1}*H{ws.max_row + 1}'])
    ws.append(['Total', '67 torres', '', f'=SUM(D5:D{ws.max_row})', '', '', '', '', f'=SUM(I5:I{ws.max_row})'])
    for c in ws[ws.max_row]:
        c.font = Font(bold=True)
    for row in ws.iter_rows(min_row=5, max_row=ws.max_row):
        row[4].number_format = row[6].number_format = M2
        row[7].number_format = row[8].number_format = USD
    ws.append([])
    ws.append(['Condições (pág. 12): 20% + 12 parcelas; à vista −5%; 20% + 36 parcelas +8%; investidor 5% a partir de 10 unidades, descontos não cumulativos.'])

    ws = wb.create_sheet('Residence Casas')
    ws.append(['Bracerum Residence — Casas (lotes residenciais) · tabela de valores (nov/2026)'])
    ws['A1'].font = Font(bold=True, size=13)
    ws.append(['US$ 1.150/m² do lote. Áreas do Masterplan V14 rev. 02/11/2026, iguais às do CV.'])
    ws.append([])
    cab(ws, 4, ['Quadra', 'Lote', 'Área do lote', 'US$/m²', 'Valor do lote'], [24, 8, 14, 10, 16])
    for r in casas:
        ws.append([r['Nome (Bloco)'], r['Nome (Unidade)'], float(r['Área privativa m² (Unidade)'].replace(',', '.')),
                   PRECO_M2, f'=C{ws.max_row + 1}*D{ws.max_row + 1}'])
    ws.append(['Total', f'{len(casas)} lotes', f'=SUM(C5:C{ws.max_row})', '', f'=SUM(E5:E{ws.max_row})'])
    for c in ws[ws.max_row]:
        c.font = Font(bold=True)
    for row in ws.iter_rows(min_row=5, max_row=ws.max_row):
        row[2].number_format, row[3].number_format, row[4].number_format = M2, USD, USD

    ws = wb.create_sheet('Mudanças no CV')
    cab(ws, 1, ['Bloco', 'Unidade', 'Situação', 'Tipologia no CV', 'Tipologia nova', 'Valor no CV', 'Valor novo'],
        [12, 9, 11, 24, 16, 13, 13])
    for m in mudancas:
        ws.append(list(m))
        ws.cell(ws.max_row, 6).number_format = ws.cell(ws.max_row, 7).number_format = USD
    ws.freeze_panes = 'A2'
    wb.save(os.path.join(AQUI, 'Bracerum_Residence_Tabela_de_Valores_2026-11.xlsx'))
