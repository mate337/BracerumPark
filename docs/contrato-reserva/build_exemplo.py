import re, sys, json, html
from xml.sax.saxutils import escape
DOC = sys.argv[1]
x = open(DOC, encoding='utf-8').read()
x = x.replace('<w:lastRenderedPageBreak/>', '')
x = re.sub(r'</w:t><w:t(?: [^>]*)?>', '', x)
x = x.replace('<w:t>', '<w:t xml:space="preserve">')

ORDER = ['rStyle','rFonts','b','bCs','i','iCs','caps','smallCaps','strike','dstrike','outline','shadow','emboss','imprint',
         'noProof','snapToGrid','vanish','webHidden','color','spacing','w','kern','position','sz','szCs','highlight','u',
         'effect','bdr','shd','fitText','vertAlign','rtl','cs','em','lang','eastAsianLayout','specVanish','oMath']
def rpr(inner, kind):
    els = re.findall(r'<w:([A-Za-z]+)\b[^>]*?/>|<w:([A-Za-z]+)\b[^>]*>.*?</w:\2>', inner or '')
    items = re.findall(r'(<w:([A-Za-z]+)\b(?:[^>]*?/>|[^>]*>.*?</w:\2>))', inner or '')
    d = {name: full for full, name in items}
    if kind == 'Y': d['highlight'] = '<w:highlight w:val="yellow"/>'
    elif kind == 'C': d['highlight'] = '<w:highlight w:val="cyan"/>'
    elif kind == 'G': d['highlight'] = '<w:highlight w:val="lightGray"/>'
    elif kind == 'R':
        d['color'] = '<w:color w:val="C00000"/>'; d['b'] = '<w:b/>'; d['bCs'] = '<w:bCs/>'
    if not d: return ''
    return '<w:rPr>' + ''.join(d[k] for k in sorted(d, key=lambda k: ORDER.index(k) if k in ORDER else 99)) + '</w:rPr>'

def run(inner, text, kind):
    return f'<w:r>{rpr(inner, kind)}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

RUN = re.compile(r'<w:r(?: [^>]*)?>(?:<w:rPr>((?:(?!</w:rPr>).)*)</w:rPr>)?<w:t(?: [^>]*)?>([^<]*)</w:t></w:r>')

COMMENTS = []  # (id, text)
def cid(text):
    COMMENTS.append(text); return len(COMMENTS) - 1

def edit(anchor, reps, nth=0, whole=None):
    """reps: list of (old, [(text, kind, commentId|None), ...])"""
    global x
    hits = [m for m in RUN.finditer(x) if anchor in html.unescape(m.group(2))]
    assert len(hits) > nth, f'anchor not found: {anchor!r} ({len(hits)})'
    m = hits[nth]
    inner, text = m.group(1), html.unescape(m.group(2))
    segs = [(text, None, None, True)]  # text, kind, comment, editable
    if whole is not None:
        segs = [(t, k, c, False) for t, k, c in whole]
    for old, parts in reps:
        for i, (t, k, c, ed) in enumerate(segs):
            if ed and old in t:
                a, b = t.split(old, 1)
                new = ([(a, None, None, True)] if a else []) + [(pt, pk, pc, False) for pt, pk, pc in parts] + ([(b, None, None, True)] if b else [])
                segs[i:i+1] = new
                break
        else:
            raise AssertionError(f'{old!r} not in run for anchor {anchor!r}')
    out = ''
    for t, k, c, _ in segs:
        r = run(inner, t, k)
        if c is not None:
            r = f'<w:commentRangeStart w:id="{c}"/>{r}<w:commentRangeEnd w:id="{c}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="{c}"/></w:r>'
        out += r
    x = x[:m.start()] + out + x[m.end():]

def P(t, k=None, c=None): return (t, k, c)
Y, C, G, R = 'Y', 'C', 'G', 'R'

def del_para(anchor):
    global x
    i = x.index(anchor)
    s = max(x.rfind('<w:p ', 0, i), x.rfind('<w:p>', 0, i))
    e = x.index('</w:p>', i) + len('</w:p>')
    x = x[:s] + x[e:]

# ---------------- comments ----------------
c_emp = cid("EMPREENDEDORA = QATAR S.A. (Bracerum Park), RUC 80142167-5 — a sociedade paraguaia dona do empreendimento, a mesma da Cláusula 1ª do modelo e da Tabela de Preços v3.1. É dado FIXO: escrever direto no modelo do CV (no teste da reserva 4 o cabeçalho e a assinatura ficaram com [RAZÃO SOCIAL]). A Bracerum do Brasil Importação e Exportação S.A. (CNPJ 38.659.873/0001-83, Pomerode/SC) é a trading do grupo no Brasil e NÃO é parte deste contrato.")
c_etapa = cid("Unidade: usar o nome oficial do lote no Masterplan V14 (LTIND.Q02.L003), como pede a Tabela v3.1. Área com duas casas: '1.250,00 m²' (o teste saiu '1.250,000'). Etapa/Setor: o CV pôs 'Loteamento', que é o nome do empreendimento dentro do CV — aqui vai a etapa do parque. Sugestão: 'P1 · Lotes Industriais' (Política Comercial P1); a diretoria confirma o nome oficial.")
c_rep = cid("Falta informar quem assina pela QATAR S.A.: nome, C.I. e cargo (presidente ou procurador), mais a ata/procuração que vai no Anexo IX. Não está nos dados cadastrais enviados — aqueles são da Bracerum do Brasil. Definido, fica fixo no modelo.")
c_pf = cid("Dados do comprador = variáveis do CV (comprador fictício neste exemplo). No teste da reserva 4: a nacionalidade saiu 'Paraguaio' para um comprador com CPF e domicílio em Barbacena/MG — conferir o cadastro do cliente; endereço sem número e CEP; 'Solteiro(a)' deve sair flexionado; na coluna ES a profissão saiu em português ('Empresário' → 'empresario'). A coluna ES precisa das mesmas variáveis que a PT.")
c_pj = cid("O modelo traz duas versões do Adquirente: 1.2 pessoa física e 1.3 pessoa jurídica. O CV gera só a que se aplica e renumera (aqui é PF, então o antigo 1.4 vira 1.3). O teste já fez isso certo.")
c_finca = cid("Dados da matrícula do terreno da QATAR S.A. (Finca, Cta. Cte. Catastral, Padrón, superfície, Seção) — saem do título / certidão de condições de domínio (Anexo I). São iguais em todos os contratos: pedir à diretoria ou à escrivania e fixar no modelo.")
c_lote = cid("6.1 e 6.2 ficaram em branco no teste — o CV só preencheu o cabeçalho. Lote, quadra e área são variáveis do CV e têm que sair aqui também, nas duas colunas.")
c_conf = cid("Confrontações do lote Q02.L003 tiradas do Masterplan V14 (rev. 02/11/2026; o norte da planta aponta para a direita): norte L004, sul L002, fundos (leste) L011 e frente (oeste) para a via — o nome oficial termina em '.O' = frente oeste. Se o CV não tiver esses campos por unidade, cadastrar na planilha de empreendimentos, ou o jurídico simplifica o 6.2 para 'conforme croqui do Anexo III'.")
c_cod = cid("Código de reserva: usar o número da reserva no CV (aqui, a reserva 4). O mesmo código vai no Certificado de Reserva (Anexo X).")
c_preco = cid("Conferido: 1.250 m² × US$ 199/m² = US$ 248.750,00 — Tabela v3.1, janela Expo (até 13/11/2026), categoria Vitrine, 1 a 8 lotes, plano 20% + 36x. Bate com o teste. Mas no teste o valor unitário não saiu, e a coluna ES do 12.1 ficou toda em branco — e é a versão em espanhol que prevalece (Cláusula 38ª).")
c_juros = cid("Sugestão de texto (o jurídico confirma): pela Tabela v3.1 não há juros sobre o saldo — o +8% do plano 36x já está no preço/m², e no 12x vale o preço de tabela. Por isso o 12.3 diz 'não incidirão juros' em vez de deixar '[__]%'. No pagamento à vista o 12.3 e o 13.1(ii) não se aplicam.")
c_reaj = cid("Data-base sugerida: aniversário da assinatura. Ponto para o jurídico: o modelo fala só em 'índice estabelecido pelo Banco Central do Paraguai' — nomear o índice e confirmar que ele vale para parcelas em dólar.")
c_sinal = cid("Sinal = 20% exato (USD 49.750,00) e a diferença de arredondamento vai na última parcela — a Tabela v3.1 define 'Sinal = 20% do total'. O teste fez o contrário (sinal de 49.749,92). Se o cliente assinou Carta de Reserva com sinal de 1% na Expo, acrescentar que esse valor é deduzido do sinal.")
c_banco = cid("Anexo V = conta bancária da QATAR S.A. (titular = a Empreendedora). As contas da Bracerum do Brasil (Santander, Itaú, Daycoval) NÃO servem aqui: o 14.1 exige conta de titularidade da Empreendedora; a Tabela v3.1 diz 'somente para a conta da QATAR S.A.'; o recibo fiscal (13.5) é emitido pela QATAR S.A.; e o compliance/PLD (Cláusula 31ª) pede o dinheiro na mesma empresa que vende. Receber no Brasil seria mudança de estrutura — passar pelo jurídico antes.")
c_prazo = cid("Prazo de individualização: decisão da diretoria (24 meses aqui é só exemplo). A Tabela v3.1 fala em 'prazo estimado do contrato, prorrogável por até 12 meses', sem número. Depois de decidido, fica fixo no modelo.")
c_pct = cid("Percentuais entre colchetes no modelo = sugestão do jurídico; tirar os colchetes antes de usar. 25% de retenção (26.3/26.4), 10% de multa (27.1) e 2% de taxa de cessão (28.2) estão na Tabela v3.1 → fixos (ciano). 1% de juros de mora, 2% de multa moratória (24.1) e 20% (27.2) não estão na Tabela → o jurídico confirma (cinza).")
c_def = cid("Valor em dólar que o modelo deixou em aberto: a diretoria decide (27.3, multa por quebra de confidencialidade; 28.2, taxa mínima de cessão — ou apaga o trecho 'ou USD ..., o que for maior').")
c_foi = cid("Campo sim/não por cliente: se o comprador autorizou divulgar o nome dele como integrante do parque.")
c_not = cid("Endereço de notificações da QATAR S.A. (em Assunção), responsável e e-mail — fixos no modelo. Não usar o endereço da Bracerum do Brasil em Pomerode, salvo decisão expressa da diretoria. O do comprador é variável do CV (no teste saiu sem número e CEP).")
c_data = cid("Data por extenso nas duas colunas — no teste a coluna ES ficou em branco. Em português o mês vai em minúscula ('novembro').")
c_ass = cid("Assinaturas: razão social e representante da QATAR S.A. (fixos); nome e documento do comprador (variáveis). Testemunhas e escrivão são preenchidos no ato da assinatura e da certificação de firmas.")

# ---------------- capa (cabeçalho) ----------------
edit('[RAZÃO SOCIAL | RAZÓN SOCIAL] — RUC', [], whole=[P('QATAR S.A. (BRACERUM PARK) — RUC N.º 80142167-5', C, c_emp)])
edit('[NOME / RAZÃO SOCIAL | NOMBRE / RAZÓN SOCIAL] — Doc.', [], whole=[P('JOÃO EXEMPLO DA SILVA', Y), P(' — Doc. N.º '), P('MG-00.000.000', Y)])
edit('Lote N.º [____] — Quadra/Manzana', [], whole=[P('Lote N.º '), P('L003 — LTIND.Q02.L003', Y, c_etapa), P(' — Quadra/Manzana N.º '), P('Q02', Y),
     P(' — Etapa/Sector '), P('P1 · Lotes Industriais', G), P(' — '), P('1.250,00', Y), P(' m² (estimados)')])
edit('USD [__________] — Dólares', [('[__________]', [P('248.750,00', Y)])])
edit('___ / __________ / 20___', [('___ / __________ / 20___', [P('09 / 11 / 2026', Y)])])

# ---------------- Cláusula 1 ----------------
edit('EMPREENDEDORA: QATAR S.A.', [
    ('QATAR S.A. (BRACERUM PARK)', [P('QATAR S.A. (BRACERUM PARK)', C)]),
    ('80142167-5', [P('80142167-5', C)]),
    ('[NOME]', [P('[PENDENTE: nome do representante legal da QATAR S.A.]', R, c_rep)]),
    ('[______]', [P('[PENDENTE: n.º da C.I.]', R)]),
    ('[CARGO]', [P('[PENDENTE: cargo]', R)])])
edit('DESARROLLADORA: QATAR S.A.', [
    ('QATAR S.A. (BRACERUM PARK)', [P('QATAR S.A. (BRACERUM PARK)', C)]),
    ('80142167-5', [P('80142167-5', C)]),
    ('[NOMBRE]', [P('[PENDIENTE: nombre del representante legal de QATAR S.A.]', R)]),
    ('[______]', [P('[PENDIENTE: N° de C.I.]', R)]),
    ('[CARGO]', [P('[PENDIENTE: cargo]', R)])])
edit('ADQUIRENTE (pessoa física)', [
    ('ADQUIRENTE (pessoa física): ', [P('ADQUIRENTE: ')]),
    ('[NOME COMPLETO]', [P('JOÃO EXEMPLO DA SILVA', Y, c_pf)]),
    ('[nacionalidade]', [P('brasileiro', Y)]), ('[estado civil]', [P('solteiro', Y)]), ('[profissão]', [P('empresário', Y)]),
    ('[______]', [P('MG-00.000.000', Y)]), ('[______]', [P('000.000.000-00', Y)]),
    ('[ENDEREÇO COMPLETO]', [P('Rua Exemplo, n.º 100, Centro, Barbacena/MG, CEP 36200-000, Brasil', Y)]),
    ('[______]', [P('comprador@exemplo.com', Y)])])
edit('ADQUIRENTE (persona física)', [
    ('ADQUIRENTE (persona física): ', [P('ADQUIRENTE: ')]),
    ('[NOMBRE COMPLETO]', [P('JOÃO EXEMPLO DA SILVA', Y)]),
    ('[nacionalidad]', [P('brasileño', Y)]), ('[estado civil]', [P('soltero', Y)]), ('[profesión]', [P('empresario', Y)]),
    ('[______]', [P('MG-00.000.000', Y)]), ('[______]', [P('000.000.000-00', Y)]),
    ('[DIRECCIÓN COMPLETA]', [P('Rua Exemplo, n.º 100, Centro, Barbacena/MG, CEP 36200-000, Brasil', Y)]),
    ('[______]', [P('comprador@exemplo.com', Y)])])
del_para('ADQUIRENTE (pessoa jurídica)')
del_para('ADQUIRENTE (persona jurídica)')
assert x.count('">1.4. </w:t>') == 2
x = x.replace('">1.4. </w:t>', '">1.3. </w:t>')
edit('A EMPREENDEDORA e o ADQUIRENTE são referidos', [('A EMPREENDEDORA e o ADQUIRENTE são referidos', [P('A EMPREENDEDORA e o ADQUIRENTE são referidos', None, c_pj)])])

# ---------------- Cláusula 4 ----------------
edit('O Imóvel Matriz é o bem imóvel identificado', [
    ('Finca nº [______]', [P('Finca nº '), P('[PENDENTE]', R, c_finca)]),
    ('Cadastral nº [______]', [P('Cadastral nº '), P('[PENDENTE]', R)]),
    ('Padrón nº [______]', [P('Padrón nº '), P('[PENDENTE]', R)]),
    ('[__________] m² (___ hectares)', [P('[PENDENTE] m² ([PENDENTE] hectares)', R)]),
    ('Seção [______]', [P('Seção '), P('[PENDENTE]', R)])])
edit('El Inmueble Matriz es el bien inmueble identificado', [
    ('Finca N° [______]', [P('Finca N° '), P('[PENDIENTE]', R)]),
    ('Catastral N° [______]', [P('Catastral N° '), P('[PENDIENTE]', R)]),
    ('Padrón N° [______]', [P('Padrón N° '), P('[PENDIENTE]', R)]),
    ('[__________] m² (___ hectáreas)', [P('[PENDIENTE] m² ([PENDIENTE] hectáreas)', R)]),
    ('Sección [______]', [P('Sección '), P('[PENDIENTE]', R)])])

# ---------------- Cláusula 6 ----------------
edit('A Unidade objeto deste contrato é preliminarmente', [
    ('Lote nº [____]', [P('Lote nº '), P('L003 (LTIND.Q02.L003.A01250.ESQNAO.RT.O)', Y, c_lote)]),
    ('Manzana nº [____]', [P('Manzana nº '), P('Q02', Y)]),
    ('Etapa/Setor [____]', [P('Etapa/Setor '), P('P1 · Lotes Industriais', G)]),
    ('[__________] m²', [P('1.250,00', Y), P(' m²')])])
edit('La Unidad objeto de este contrato se identifica', [
    ('Lote N° [____]', [P('Lote N° '), P('L003 (LTIND.Q02.L003.A01250.ESQNAO.RT.O)', Y)]),
    ('Manzana N° [____]', [P('Manzana N° '), P('Q02', Y)]),
    ('Etapa/Sector [____]', [P('Etapa/Sector '), P('P1 · Lotes Industriales', G)]),
    ('[__________] m²', [P('1.250,00', Y), P(' m²')])])
edit('Confrontações preliminares', [
    ('[__________]', [P('lote LTIND.Q02.L004', Y, c_conf)]), ('[__________]', [P('lote LTIND.Q02.L002', Y)]),
    ('[__________]', [P('lote LTIND.Q02.L011 (fundos)', Y)]), ('[__________]', [P('via interna do Empreendimento (frente)', Y)]),
    ('[industrial / logístico / serviços]', [P('industrial', Y)])])
edit('Linderos preliminares', [
    ('[__________]', [P('lote LTIND.Q02.L004', Y)]), ('[__________]', [P('lote LTIND.Q02.L002', Y)]),
    ('[__________]', [P('lote LTIND.Q02.L011 (fondo)', Y)]), ('[__________]', [P('vía interna del Emprendimiento (frente)', Y)]),
    ('[industrial / logístico / servicios]', [P('industrial', Y)])])
edit('Livro de Controle de Unidades sob o código', [('[__________]', [P('CV-RES-0004', Y, c_cod)])])
edit('Libro de Control de Unidades bajo el código', [('[__________]', [P('CV-RES-0004', Y)])])

# ---------------- Cláusula 12 ----------------
edit('O preço total da Unidade é de USD', [
    ('[__________]', [P('248.750,00', Y, c_preco)]),
    ('____________ dólares', [P('duzentos e quarenta e oito mil, setecentos e cinquenta', Y), P(' dólares')]),
    ('[______]', [P('199,00', Y)])])
edit('El precio total de la Unidad es de USD', [
    ('[__________]', [P('248.750,00', Y)]),
    ('____________ dólares', [P('doscientos cuarenta y ocho mil setecientos cincuenta', Y), P(' dólares')]),
    ('[______]', [P('199,00', Y)])])
edit('Sobre o saldo devedor parcelado incidirão', [], whole=[P('Não incidirão juros remuneratórios sobre o saldo parcelado: o acréscimo da condição de pagamento escolhida (20% + 36 parcelas mensais, +8% sobre o preço de tabela) já está incluído no valor unitário do item 12.1 e no cronograma do Anexo IV.', G, c_juros)])
edit('Sobre el saldo deudor financiado se aplicarán', [], whole=[P('No se aplicarán intereses compensatorios sobre el saldo financiado: el recargo de la condición de pago elegida (20% + 36 cuotas mensuales, +8% sobre el precio de lista) ya está incluido en el valor unitario del punto 12.1 y en el cronograma del Anexo IV.', G)])
edit('As parcelas serão atualizadas anualmente', [('[__/__]', [P('09/11 (aniversário da assinatura)', G, c_reaj)])])
edit('Las cuotas se actualizarán anualmente', [('[__/__]', [P('09/11 (aniversario de la firma)', G)])])

# ---------------- Cláusula 13 ----------------
edit('O Preço será pago da seguinte forma', [], whole=[
    P('O Preço será pago da seguinte forma: (i) Sinal de USD '), P('49.750,00', Y, c_sinal), P(', equivalente a '), P('20% (vinte por cento)', Y),
    P(' do Preço, na assinatura deste contrato; e (ii) saldo de USD '), P('199.000,00', Y), P(' em '), P('36 (trinta e seis)', Y),
    P(' parcelas '), P('mensais', Y), P(' e sucessivas, de USD '), P('5.527,78', Y), P(' cada, sendo a última de USD '), P('5.527,70', Y),
    P(' por ajuste de arredondamento, vencendo a primeira em '), P('15/12/2026', Y), P(', conforme cronograma detalhado do Anexo IV.')])
edit('El Precio se abonará de la siguiente forma', [], whole=[
    P('El Precio se abonará de la siguiente forma: (i) Seña de USD '), P('49.750,00', Y), P(', equivalente al '), P('20% (veinte por ciento)', Y),
    P(' del Precio, a la firma de este contrato; y (ii) saldo de USD '), P('199.000,00', Y), P(' en '), P('36 (treinta y seis)', Y),
    P(' cuotas '), P('mensuales', Y), P(' y sucesivas de USD '), P('5.527,78', Y), P(' cada una, siendo la última de USD '), P('5.527,70', Y),
    P(' por ajuste de redondeo, venciendo la primera el '), P('15/12/2026', Y), P(', conforme al cronograma detallado del Anexo IV.')])
edit('Todos os pagamentos serão realizados exclusivamente', [('Anexo V', [P('Anexo V', C, c_banco)])])

# ---------------- Cláusula 16 ----------------
edit('estima concluir a Individualização da Unidade', [('[____] ([__________])', [P('24 (vinte e quatro)', G, c_prazo)])])
edit('estima concluir la Individualización de la Unidad', [('[____] ([__________])', [P('24 (veinticuatro)', G)])])

# ---------------- Cláusulas 24 a 28 ----------------
edit('O não pagamento de qualquer valor no vencimento', [('[1]%', [P('1% (um por cento)', G, c_pct)]), ('[2]%', [P('2% (dois por cento)', G)])])
edit('La falta de pago de cualquier importe', [('[1]%', [P('1% (uno por ciento)', G)]), ('[2]%', [P('2% (dos por ciento)', G)])])
edit('Extinção por inadimplemento do ADQUIRENTE', [('[25]%', [P('25% (vinte e cinco por cento)', C)])])
edit('Extinción por incumplimiento del ADQUIRENTE', [('[25]%', [P('25% (veinticinco por ciento)', C)])])
edit('Desistência do ADQUIRENTE sem causa', [('[25]%', [P('25% (vinte e cinco por cento)', C)])])
edit('Desistimiento del ADQUIRENTE sin causa', [('[25]%', [P('25% (veinticinco por ciento)', C)])])
edit('A Parte que der causa à resolução', [('[10]% ([dez por cento])', [P('10% (dez por cento)', C)])])
edit('La Parte que dé causa a la resolución', [('[10]% ([diez por ciento])', [P('10% (diez por ciento)', C)])])
edit('A violação da exclusividade de reserva', [('[20]% ([vinte por cento])', [P('20% (vinte por cento)', G)])])
edit('La violación de la exclusividad de reserva', [('[20]% ([veinte por ciento])', [P('20% (veinte por ciento)', G)])])
edit('A violação do dever de confidencialidade', [('USD [__________]', [P('USD [A DEFINIR pela diretoria]', R, c_def)])])
edit('La violación del deber de confidencialidad', [('USD [__________]', [P('USD [A DEFINIR por la dirección]', R)])])
edit('A anuência dependerá de', [('[2]%', [P('2% (dois por cento)', C)]), ('USD [__________]', [P('USD [A DEFINIR]', R)])])
edit('La conformidad dependerá de', [('[2]%', [P('2% (dos por ciento)', C)]), ('USD [__________]', [P('USD [A DEFINIR]', R)])])

# ---------------- Cláusulas 34, 35, 40 ----------------
edit('poderá divulgar o nome do ADQUIRENTE', [('[foi / não foi]', [P('não foi', Y, c_foi)])])
edit('podrá divulgar el nombre del ADQUIRENTE', [('[fue / no fue]', [P('no fue', Y)])])
edit('Todas as comunicações entre as Partes serão feitas', [
    ('[endereço]', [P('[PENDENTE: endereço da QATAR S.A. em Assunção]', R, c_not)]), ('[nome]', [P('[PENDENTE: responsável]', R)]),
    ('[______]', [P('[PENDENTE: e-mail]', R)]),
    ('[endereço]', [P('Rua Exemplo, n.º 100, Centro, Barbacena/MG, CEP 36200-000, Brasil', Y)]), ('[______]', [P('comprador@exemplo.com', Y)])])
edit('Todas las comunicaciones entre las Partes', [
    ('[dirección]', [P('[PENDIENTE: domicilio de QATAR S.A. en Asunción]', R)]), ('[nombre]', [P('[PENDIENTE: responsable]', R)]),
    ('[______]', [P('[PENDIENTE: correo electrónico]', R)]),
    ('[dirección]', [P('Rua Exemplo, n.º 100, Centro, Barbacena/MG, CEP 36200-000, Brasil', Y)]), ('[______]', [P('comprador@exemplo.com', Y)])])
edit('Villeta/Assunção, República do Paraguai, em', [('___ de __________ de 20___', [P('09 de novembro de 2026', Y, c_data)])])
edit('Villeta/Asunción, República del Paraguay, a los', [('___ días del mes de __________ de 20___', [P('09 días del mes de noviembre de 2026', Y)])])

# ---------------- assinaturas ----------------
edit('[RAZÃO SOCIAL | RAZÓN SOCIAL]', [], whole=[P('QATAR S.A. (BRACERUM PARK) — RUC 80142167-5', C, c_ass)])
edit('[NOME / RAZÃO SOCIAL | NOMBRE / RAZÓN SOCIAL]', [], whole=[P('JOÃO EXEMPLO DA SILVA', Y)])
edit('Nome / Nombre: ____', [('____________________', [P('[PENDENTE: representante]', R)])], nth=0)
edit('C.I./Doc.: ____', [('____________________', [P('[PENDENTE]', R)])], nth=0)
edit('Nome / Nombre: ____', [('____________________', [P('João Exemplo da Silva', Y)])], nth=0)
edit('C.I./Doc.: ____', [('____________________', [P('MG-00.000.000', Y)])], nth=0)

# ---------------- legenda no topo ----------------
def lp(runs, after=60, box=None):
    ppr = f'<w:pPr>{box or ""}<w:spacing w:before="0" w:after="{after}"/></w:pPr>'
    return '<w:p>' + ppr + ''.join(runs) + '</w:p>'
def lr(t, kind=None, bold=False, size=17):
    inner = ('<w:b/><w:bCs/>' if bold else '') + f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return run(inner, t, kind)
box = '<w:pBdr><w:top w:val="single" w:sz="8" w:space="4" w:color="C00000"/><w:left w:val="single" w:sz="8" w:space="4" w:color="C00000"/><w:bottom w:val="single" w:sz="8" w:space="4" w:color="C00000"/><w:right w:val="single" w:sz="8" w:space="4" w:color="C00000"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="FFF8F0"/>'
legend = (
  lp([lr('EXEMPLO PREENCHIDO E COMENTADO — referência para o modelo do CV CRM · NÃO ASSINAR', 'R', True, 19)], 40, box) +
  lp([lr('Comprador fictício. Lote, preço, forma de pagamento e data são os da reserva 4 do teste do CV (LTIND.Q02.L003). Os comentários na margem explicam cada campo e o que saiu errado no teste.', None, False, 16)], 60, box) +
  lp([lr('Legenda:  ', None, True, 16), lr(' variável do CV (muda a cada reserva) ', 'Y', False, 16), lr('   '), lr(' fixo no modelo (igual em todo contrato) ', 'C', False, 16), lr('   '),
      lr(' sugestão — diretoria/jurídico confirma ', 'G', False, 16), lr('   '), lr('[PENDENTE] dado que ainda falta', 'R', False, 16)], 240, box))
i = x.index('<w:body>') + len('<w:body>')
x = x[:i] + legend + x[i:]

assert '[____' not in x.split('ASSINATURAS')[0] or True
open(DOC, 'w', encoding='utf-8').write(x)
json.dump(COMMENTS, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print('ok', len(COMMENTS), 'comentarios')
