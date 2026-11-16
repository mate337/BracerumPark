#!/usr/bin/env python3
"""Apresentação do Bracerum Park para envio pelo WhatsApp.

Condensa os quatro folders impressos V3 (Park, Residence Aptos, Residence Casas e
Business Center — Drive "Folder Final - Impressão") num PDF de 14 páginas em 4:5
(1080 × 1350), feito para ler no celular. Gera `apresentacao.html` ao lado deste
arquivo; o PDF sai do `imprimir.js` (Playwright/Chromium).

Os preços dos lotes vêm do `3dmasterplan/data/precos.json` (Tabela v3.1) na janela
indicada em JANELA — o folder impresso traz a janela "Expo", que acabou em 13/11/2026.
"""
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.environ.get('BP_RAIZ') or os.path.abspath(os.path.join(AQUI, '..', '..'))
JANELA = 'pos'  # expo | pos | plena

UTM = 'utm_source=whatsapp&utm_medium=apresentacao&utm_campaign=apresentacao-park'
SITE = 'https://bracerumpark.com'
L_MAQUETE = f'{SITE}/3dmasterplan/?{UTM}'
L_DISPON = f'{SITE}/foldermapadisponibilidade/?{UTM}'
L_SITE = f'{SITE}/?{UTM}'
L_INSTA = 'https://www.instagram.com/bracerumpark/'
MSG = 'Olá! Recebi a apresentação do Bracerum Park e gostaria de saber mais.'
def wa(num):
    from urllib.parse import quote
    return f'https://wa.me/{num}?text={quote(MSG)}'

TOTAL = 14

# ---------------------------------------------------------------- logo
def logo(arquivo, marca='#b49350', texto='currentColor', cls='logo'):
    svg = open(os.path.join(RAIZ, 'assets', 'logo', arquivo), encoding='utf-8').read()
    svg = re.sub(r'<\?xml[^>]*>\s*', '', svg)
    svg = re.sub(r'<defs>.*?</defs>', '', svg, flags=re.S)
    svg = svg.replace('class="cls-2"', f'fill="{marca}" fill-rule="evenodd"')
    svg = svg.replace('class="cls-1"', f'fill="{texto}"')
    svg = re.sub(r'<svg ', f'<svg class="{cls}" role="img" aria-label="Bracerum Park" ', svg, count=1)
    return svg

LOGO_H = logo('logo-horizontal-cream.svg')

# ---------------------------------------------------------------- preços
precos = json.load(open(os.path.join(RAIZ, '3dmasterplan', 'data', 'precos.json'), encoding='utf-8'))
jan = next(j for j in precos['janelas'] if j['id'] == JANELA)
TAMANHOS = [1250, 2500, 3750, 5000, 7500, 10000, 15000, 20000, 30000, 40000]
def faixa(n):
    for i, f in enumerate(precos['faixas']):
        if n >= f['de'] and (f['ate'] is None or n <= f['ate']):
            return i
def usd(v):
    return 'US$ ' + f'{v:,.0f}'.replace(',', '.')
def m2(v):
    return f'{v:,.0f}'.replace(',', '.') + ' m²'
linhas_lotes = []
for t in TAMANHOS:
    n = t // 1250; fx = faixa(n)
    cel = [usd(precos['precos'][JANELA][c][fx][0] * t) for c in 'VBPI']
    linhas_lotes.append((m2(t), cel))
m2_padrao = precos['precos'][JANELA]['P'][0][0]
m2_padrao_plena = precos['precos']['plena']['P'][0][0]

OUTLET = [('Praça de alimentação', 30), ('Loja compacta', 40), ('Loja compacta', 60),
          ('Loja padrão', 80), ('Loja padrão', 120), ('Loja ampla', 200),
          ('Megaloja', 500), ('Âncora', 1000)]

# ---------------------------------------------------------------- peças
def head(rotulo, tom='claro'):
    return f'<header class="head head--{tom}">{LOGO_H}<span class="eyebrow">{rotulo}</span></header>'
def foot(n, tom='claro'):
    return (f'<footer class="foot foot--{tom}"><span>Bracerum Park · Villeta, Paraguai</span>'
            f'<span>{n:02d} / {TOTAL:02d}</span></footer>')
def lista(itens, cls='dots'):
    return f'<ul class="{cls}">' + ''.join(f'<li>{i}</li>' for i in itens) + '</ul>'
def seta():
    return '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'

P = []

# 01 — capa
P.append(f'''
<section __ID__ class="page bg-ink capa">
  <img class="capa__img" src="img/capa.jpg" alt="">
  <div class="veu veu--topo"></div><div class="veu veu--capa"></div>
  <header class="head head--claro capa__head">{LOGO_H}<span class="eyebrow">Apresentação</span></header>
  <div class="capa__txt">
    <p class="eyebrow">Villeta · Paraguai · no centro do Mercosul</p>
    <h1 class="display capa__t">Cidade<br><em>Industrial</em></h1>
    <p class="capa__sub">Lotes industriais, Business Center, apartamentos e casas num só endereço, às margens da PY-19.</p>
    <ol class="capa__idx">
      <li><a href="#p02"><b>02</b>O Parque</a></li><li><a href="#p06"><b>06</b>Lotes industriais</a></li><li><a href="#p07"><b>07</b>Business Center</a></li>
      <li><a href="#p10"><b>10</b>Residence · aptos</a></li><li><a href="#p12"><b>12</b>Residence · casas</a></li><li><a href="#p14"><b>14</b>Contato</a></li>
    </ol>
  </div>
  {foot(1, 'escuro')}
</section>''')

# 02 — o parque
P.append(f'''
<section __ID__ class="page bg-cream">
  <img class="topo-img" style="height:470px" src="img/hangar.jpg" alt="">
  <div class="veu veu--topo"></div>
  {head('O Parque', 'claro')}
  <div class="miolo" style="top:520px">
    <h2 class="display t-xl">Tudo o que uma indústria precisa, <em>num só endereço</em></h2>
    <p class="txt">Às margens da PY-19, o Bracerum Park reúne lotes e galpões, aeroporto, recinto alfandegado, centro de negócios, condomínio, escola e clube. Cada detalhe foi planejado para que a operação comece mais cedo, custe menos e chegue mais longe.</p>
    <div class="nums">
      <div><b>1%</b><span>Regime de Maquila</span></div>
      <div><b>20 anos</b><span>de benefícios fiscais</span></div>
      <div><b>1.460 m</b><span>pista de pouso exclusiva</span></div>
      <div><b>23 km</b><span>do porto de contêineres</span></div>
    </div>
    {lista(['Galpões Triple A', 'Recinto alfandegário', 'Vias largas para grandes transportes', 'Balança nos gates', 'Gate de acesso controlado', 'Bombeiros e posto policial', 'Escola, creche e ambulatório', 'Hotel e Centro de Convenções'], 'dots dots--2')}
  </div>
  {foot(2)}
</section>''')

# 03 — localização
P.append(f'''
<section __ID__ class="page bg-mapa">
  <img class="mapa__img" src="img/mapa.jpg" alt="Mapa: Bracerum Park, Terport, Villeta, Assunção e o aeroporto ASU">
  {head('Localização', 'escuro')}
  <div class="mapa__txt">
    <h2 class="display t-l">No centro do <em>Mercosul</em></h2>
    <p class="txt txt--s">Em Villeta, no Departamento Central, à margem do Rio Paraguai — a hidrovia que liga o país ao Atlântico.</p>
    <dl class="fatos">
      <div><dt>23 km</dt><dd>do Terport, terminal de contêineres de Villeta, pela estrada</dd></div>
      <div><dt>1 hora</dt><dd>até Assunção e o Aeroporto Internacional Silvio Pettirossi (ASU), aproximadamente</dd></div>
      <div><dt>PY-19</dt><dd>frente para a rodovia, com vias largas para grandes transportes</dd></div>
    </dl>
  </div>
  {foot(3)}
</section>''')

# 04 — masterplan
P.append(f'''
<section __ID__ class="page bg-preto">
  {head('Masterplan', 'claro')}
  <div class="miolo" style="top:140px">
    <h2 class="display t-l">Uma cidade <em>planejada</em></h2>
    <p class="txt txt--s txt--claro">Indústria, logística, aviação, negócios e moradia no mesmo traçado.</p>
  </div>
  <img class="mp__img" src="img/masterplan.jpg" alt="Masterplan do Bracerum Park">
  <p class="mp__dica">Amplie a imagem para ler os detalhes</p>
  <div class="mp__leg">
    <div><h3>Indústria</h3>{lista(['Lotes industriais', 'Recinto alfandegário e logístico', 'Hub de serviços de apoio', 'Subestação elétrica e ETE'])}</div>
    <div><h3>Aviação</h3>{lista(['Aeródromo de carga', 'Hangares e heliponto', 'Abastecimento de aeronaves'])}</div>
    <div><h3>Cidade</h3>{lista(['Business Center e Outlet', 'Hotel e Convenções', 'Condomínios e Clube', 'Bombeiros e Polícia'])}</div>
  </div>
  <a class="cta cta--ouro mp__cta" href="{L_MAQUETE}">Explorar a maquete 3D interativa {seta()}</a>
  {foot(4, 'escuro')}
</section>''')

# 05 — infraestrutura
P.append(f'''
<section __ID__ class="page bg-brown">
  <img class="topo-img" style="height:500px" src="img/convencoes.jpg" alt="">
  <div class="veu veu--topo"></div><div class="veu veu--base-brown" style="top:300px;height:200px"></div>
  {head('Infraestrutura', 'claro')}
  <div class="miolo" style="top:540px">
    <h2 class="display t-xl">O entorno trabalha <em>a favor da operação</em></h2>
    <div class="blocos">
      <div><h3>Segurança 24 horas</h3><p>Acesso controlado, posto policial e corpo de bombeiros dentro do próprio perímetro: menos riscos para a carga, para as instalações e para a equipe.</p></div>
      <div><h3>Hotel &amp; Convenções</h3><p>O Bracerum Hotel tem <b>384 studios</b> a poucos minutos das fábricas. O Centro de Convenções tem auditório para <b>1.200 pessoas</b> e espaços para feiras, lançamentos e treinamentos.</p></div>
      <div><h3>Equipe por perto</h3><p>O Centro Tecnológico recebe clientes e diretoria sem ninguém ir até a capital; Outlet Premium e supermercado resolvem o dia a dia; creche e escola ajudam a reter talentos.</p></div>
    </div>
  </div>
  {foot(5, 'escuro')}
</section>''')

# 06 — lotes
tb = ''.join(f'<tr><th>{t}</th>' + ''.join(f'<td>{v}</td>' for v in cel) + '</tr>' for t, cel in linhas_lotes)
P.append(f'''
<section __ID__ class="page bg-cream">
  {head('Lotes industriais · venda', 'escuro')}
  <div class="miolo" style="top:130px">
    <h2 class="display t-l">Preços dos <em>lotes</em></h2>
    <p class="txt txt--s">A partir de um módulo de 1.250 m² (25 × 50 m). Tabela <b>{jan['nome']['pt']}</b>, {jan['quando']['pt']}.</p>
    <table class="tab tab--lotes">
      <thead><tr><th>Tamanho</th><th>Vitrine</th><th>Business</th><th>Padrão</th><th>Interna</th></tr></thead>
      <tbody>{tb}</tbody>
    </table>
    <div class="conds">
      <div><b>À vista</b><span>8% de desconto</span></div>
      <div><b>20% + 12x</b><span>preço de tabela</span></div>
      <div><b>20% + 36x</b><span>acréscimo de 8%</span></div>
    </div>
    <a class="faixa" href="{L_DISPON}"><span>Em 01/04/2027 o m² Padrão passa de <b>US$ {m2_padrao}</b> para <b>US$ {m2_padrao_plena}</b>.</span><span class="faixa__cta">Ver lotes livres {seta()}</span></a>
    <p class="nota">Valores em US$, por lote, conforme a Tabela de Preços v3.1 (rev. 14/10/2026). IVA não incluído. O preço por m² varia conforme a categoria da quadra (Vitrine, Business, Padrão ou Interna) e a quantidade de lotes na operação (faixas de 1 a 8, 9 a 16, 17 a 32 e 33 lotes ou mais). Metragens de referência: a área final de cada lote é a do masterplan vigente. Preços sujeitos à disponibilidade no momento da reserva e a alteração sem aviso prévio. Esta tabela não é oferta vinculante; as condições valem conforme o contrato de compra e venda.</p>
  </div>
  {foot(6)}
</section>''')

# 07 — business center
P.append(f'''
<section __ID__ class="page bg-ink">
  <img class="topo-img" style="height:600px" src="img/bc-boulevard.jpg" alt="">
  <div class="veu veu--topo"></div><div class="veu veu--base-ink" style="top:380px;height:220px"></div>
  {head('Business Center', 'claro')}
  <div class="miolo" style="top:560px">
    <h2 class="display t-xxl">Business <em>Center</em></h2>
    <p class="eyebrow" style="margin-top:16px">Centro comercial &amp; tecnológico integrado</p>
    <p class="txt txt--claro">O ponto de encontro de quem produz, administra e vive o dia a dia do parque. Num mesmo conjunto, o Centro Administrativo, o Centro Tecnológico, o Outlet Premium, o supermercado e a farmácia — uma operação mais ágil e uma equipe mais bem atendida, sem ninguém precisar sair do parque.</p>
    {lista(['Vitrine para a PY-19', 'Estrutura triple A', 'Corredores livres', 'Praça de alimentação', 'Público cativo', 'Metragens flexíveis'], 'dots dots--3 dots--claro')}
  </div>
  {foot(7, 'escuro')}
</section>''')

# 08 — premium outlet
to = ''.join(f'<tr><th>{n}</th><td>{a:,}</td><td>{usd(a*1150)}</td><td>{usd(round(a*1150*0.92))}</td></tr>'.replace(f'{a:,}', f'{a:,}'.replace(',', '.'))
             for n, a in OUTLET)
P.append(f'''
<section __ID__ class="page bg-brown">
  <img class="topo-img" style="height:390px" src="img/outlet.jpg" alt="">
  <div class="veu veu--topo"></div>
  {head('Business Center · Outlet', 'claro')}
  <div class="miolo" style="top:430px">
    <h2 class="display t-l">Premium Outlet <em>1<span class="ord">ª</span> fase</em></h2>
    <p class="txt txt--claro txt--s">Condição de lançamento, reservada a quem chega antes: o m² sai a <b>US$ 1.150</b>, com entrada de 20% e o saldo em 12 parcelas sem acréscimo, ou em 36 parcelas. À vista, 8% de desconto; quem compra mais de uma loja ganha condição especial por volume. São as lojas da frente.</p>
    <table class="tab tab--outlet tab--escura">
      <thead><tr><th>Tipo de loja</th><th>Área (m²)</th><th>Preço base</th><th>À vista (−8%)</th></tr></thead>
      <tbody>{to}</tbody>
    </table>
    <p class="nota nota--claro">Valores de referência em US$, válidos para a Fase 1 e sujeitos a alteração sem aviso prévio. Unidades sujeitas à disponibilidade no momento da reserva. Metragens ilustrativas: a área final de cada loja segue o projeto executivo aprovado. O plano em 36 parcelas tem acréscimo de 8% sobre o preço total. O desconto à vista e o desconto por volume não são cumulativos com outras promoções. Esta tabela não é oferta vinculante.</p>
  </div>
  {foot(8, 'escuro')}
</section>''')

# 09 — centro tecnológico + market
P.append(f'''
<section __ID__ class="page bg-cream">
  {head('Business Center', 'escuro')}
  <div class="par" style="top:140px">
    <img src="img/tech.jpg" alt="">
    <div>
      <h2 class="display t-m">Centro <em>Tecnológico</em></h2>
      <p class="txt txt--s">O lado digital do Bracerum Park: salas corporativas para escritórios e reuniões, incubação para startups e estrutura para empresas de tecnologia e software. A automação, os dados e as soluções digitais nascem perto das fábricas que vão usá-los.</p>
    </div>
  </div>
  <div class="par par--inv" style="top:730px">
    <img src="img/market.jpg" alt="">
    <div>
      <h2 class="display t-m">Bracerum <em>Market</em></h2>
      <p class="eyebrow eyebrow--marrom" style="margin-top:12px">+ de 12 lojas disponíveis</p>
      <p class="txt txt--s">Treze ativos à espera de quem chegar primeiro. O supermercado é a âncora natural de uma cidade em formação; ao lado, o Hub de Serviços Rápidos reúne doze lojas de alta visibilidade — farmácia, café, conveniência e serviços — com clientes que o próprio parque gera.</p>
    </div>
  </div>
  {foot(9)}
</section>''')

# 10 — residence apartamentos
P.append(f'''
<section __ID__ class="page bg-beige">
  <img class="res__torre" src="img/res-torre.jpg" alt="">
  <img class="res__praia" src="img/res-praia.jpg" alt="">
  <div class="veu veu--topo"></div>
  {head('Bracerum Residence', 'claro')}
  <div class="miolo" style="top:540px">
    <h2 class="display t-l">Bracerum <em>Residence</em></h2>
    <p class="eyebrow eyebrow--marrom" style="margin-top:12px">Apartamentos de 1, 2 e 3 quartos e coberturas</p>
    <p class="txt txt--s">A verdadeira casa suspensa: alto padrão, isolamento térmico e acústico e varanda gourmet, perto de farmácia, mercado, academia, Outlet Premium e do Bracerum Club.</p>
    <table class="tab tab--res">
      <thead><tr><th>Tipologia</th><th>Torres</th><th>Aptos/torre</th><th>Total</th><th>Vagas/apto</th></tr></thead>
      <tbody>
        <tr><th>1 quarto</th><td>16</td><td>30</td><td>480</td><td>1</td></tr>
        <tr><th>2 quartos</th><td>39</td><td>20</td><td>780</td><td>2*</td></tr>
        <tr><th>3 quartos e coberturas</th><td>12</td><td>16</td><td>192</td><td>2*</td></tr>
        <tr class="tot"><th>Total</th><td>67</td><td></td><td>1.452</td><td></td></tr>
      </tbody>
    </table>
    <p class="nota" style="margin-top:8px">*2 vagas: 1 interna e 1 externa.</p>
    {lista(['Sacada com churrasqueira', 'Ar-condicionado split em todos os aptos', 'Piso em porcelanato', 'Praia artificial entre as torres', 'Moradia, negócios e serviços no mesmo parque', 'Em Villeta, a cidade industrial do Paraguai'], 'dots dots--2 dots--s')}
  </div>
  {foot(10)}
</section>''')

# 11 — plantas
def planta(img, nome, area, linhas):
    return (f'<figure class="planta"><div class="planta__img"><img src="img/{img}.jpg" alt="Planta {nome}"></div>'
            f'<figcaption><h3>{nome}</h3><p class="planta__area">{area}</p><p>{linhas}</p></figcaption></figure>')
P.append(f'''
<section __ID__ class="page bg-cream">
  {head('Bracerum Residence · plantas', 'escuro')}
  <div class="miolo" style="top:130px">
    <h2 class="display t-m">As <em>plantas</em></h2>
  </div>
  <div class="plantas">
    {planta('plan-1q', '1 quarto', '48,16 e 49,20 m²', '1 vaga coberta · 30 aptos por torre, 5 pavimentos')}
    {planta('plan-2q', '2 quartos', '68,27 m²', '2 vagas (1 coberta e 1 descoberta) · 20 aptos por torre')}
    {planta('plan-3q', '3 quartos', '97,40 m²', '2 vagas · suíte master · 12 aptos e 4 coberturas por torre')}
    {planta('plan-cob2', 'Cobertura', '194 m² em 2 pisos', '1º piso igual ao 3 quartos; no 2º, terraço gourmet com churrasqueira a carvão e pergolado')}
    <p class="nota plantas__nota">Áreas privativas. Plantas ilustrativas, sujeitas a alterações.</p>
  </div>
  {foot(11)}
</section>''')

# 12 — residence casas
comodos = ['Living integrado', 'Cozinha gourmet', 'Área de serviço', 'Suíte 01', 'Suíte 02',
           'Suíte 03', 'Piscina', 'Depósito', 'Lavabo', 'Garagem']
P.append(f'''
<section __ID__ class="page bg-brown">
  <img class="topo-img" style="height:430px" src="img/casa.jpg" alt="">
  <div class="veu veu--topo"></div>
  {head('Bracerum Residence · casas', 'claro')}
  <div class="miolo" style="top:472px">
    <p class="eyebrow">Condomínio ao lado do Parque industrial</p>
    <h2 class="display t-m1" style="margin-top:14px">Lotes a partir de <em>600 m²</em></h2>
    <p class="txt txt--claro txt--s">Dentro do Bracerum Park, a casa também é investimento: perímetro protegido, com acesso controlado, posto policial e bombeiros, e escola, creche, ambulatório e o Bracerum Club em volta. Um patrimônio em dólar para quem quer viver perto da fábrica.</p>
  </div>
  <div class="casa">
    <img src="img/plan-casa.jpg" alt="Planta da casa modelo">
    <div><h3>Casa modelo</h3><ol>{''.join(f'<li>{c}</li>' for c in comodos)}</ol><p class="nota nota--claro">Planta ilustrativa, sujeita a alterações. Não representa o modelo final.</p></div>
  </div>
  {foot(12, 'escuro')}
</section>''')

# 13 — clube e lazer
P.append(f'''
<section __ID__ class="page bg-cream">
  {head('Clube &amp; Lazer', 'escuro')}
  <div class="miolo" style="top:130px">
    <h2 class="display t-l">A vida a <em>poucos passos</em></h2>
    <p class="txt txt--s">No Bracerum Club estão a piscina olímpica, o simulador de surf, as quadras de tênis e padel e o salão de eventos — a poucos passos de cada casa e de cada apartamento.</p>
  </div>
  <figure class="laz laz--g"><img src="img/piscina.jpg" alt=""><figcaption><b>Piscina artificial</b>Desenhada como um lago, com areia na beira e entrada gradual na água, como numa praia.</figcaption></figure>
  <figure class="laz laz--a"><img src="img/surf.jpg" alt=""><figcaption><b>Simulador de surf</b>Uma onda perfeita a qualquer hora, exclusiva dos moradores.</figcaption></figure>
  <figure class="laz laz--b"><img src="img/quadra.jpg" alt=""><figcaption><b>Quadras e quincho</b>Esporte, deck e quincho para reunir a família e os amigos.</figcaption></figure>
  {foot(13)}
</section>''')

# 14 — contato
P.append(f'''
<section __ID__ class="page bg-ink">
  <img class="topo-img" style="height:520px;opacity:.9" src="img/aereo.jpg" alt="">
  <div class="veu veu--topo"></div><div class="veu veu--base-ink" style="top:300px;height:222px"></div>
  {head('Contato', 'claro')}
  <div class="miolo" style="top:440px">
    <h2 class="display t-l">Vamos <em>conversar</em></h2>
    <p class="txt txt--claro txt--s">Fale com a equipe comercial e receba a tabela completa, o mapa de disponibilidade e uma simulação para a sua operação.</p>
    <div class="cards">
      <a class="card" href="{wa('595985516065')}"><span class="eyebrow">Paraguai</span><b>Cleber Pavão</b><span class="card__tel">+595 985 516 065</span><span class="card__mail">cleber@bracerum.com</span><span class="card__cta">WhatsApp {seta()}</span></a>
      <a class="card" href="{wa('5547988030200')}"><span class="eyebrow">Brasil</span><b>Sydney Savi</b><span class="card__tel">+55 47 98803-0200</span><span class="card__mail">sydney@bracerum.com</span><span class="card__cta">WhatsApp {seta()}</span></a>
    </div>
    <nav class="links">
      <a href="{L_MAQUETE}"><span>Maquete 3D interativa</span><i>bracerumpark.com/3dmasterplan</i>{seta()}</a>
      <a href="{L_DISPON}"><span>Preços e lotes disponíveis</span><i>ao vivo, lote a lote</i>{seta()}</a>
      <a href="{L_SITE}"><span>Site</span><i>bracerumpark.com</i>{seta()}</a>
      <a href="{L_INSTA}"><span>Instagram</span><i>@bracerumpark</i>{seta()}</a>
    </nav>
  </div>
  {foot(14, 'escuro')}
</section>''')

assert len(P) == TOTAL, len(P)
P = [pg.replace('<section __ID__ ', f'<section id="p{i:02d}" ', 1) for i, pg in enumerate(P, 1)]

CSS = open(os.path.join(AQUI, 'apresentacao.css'), encoding='utf-8').read()
html = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Bracerum Park — Apresentação</title>
<style>{CSS}</style></head>
<body>{''.join(P)}
</body></html>'''
open(os.path.join(AQUI, 'apresentacao.html'), 'w', encoding='utf-8').write(html)
print('ok', len(P), 'páginas · janela', JANELA, '· m² Padrão', m2_padrao)
