# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v6 — 2026-09-03)

O site tem **7 páginas**: `index.html`, `tributacao.html`, `bracerum.html`, `hotel.html`,
`resort.html`, `select.html` e `qualidade.html`, mais `i18n.js`, `style.css`, `script.js` e
`home.js`. **`home.js` só a home carrega**: são os 52 KB do masterplan e do mapa (áreas, POIs,
rotas) que as seis páginas internas baixavam e interpretavam à toa. Ele roda depois do
`script.js` porque usa `hasGsap`, `reduceMotion` e `tr()`.

### Regras de design **obrigatórias** (definidas pelo cliente)
- **Paleta: preto, branco e bege/marrom** (`--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315`). **Zero vermelho.** Azul só nos três casos pedidos pelo cliente: a faixa institucional da Bracerum (`--brc-blue #1c4d9d`), a água do mapa (semântica) e a iluminação cênica do render do hero.
- **Tipografia: Helvetica** (UI/corpo, stack de sistema) **+ Noto Serif** (display/títulos, itálico como ênfase no lugar de cor).
- **Cantos quadrados** — sem border-radius chamativo.
- **Nav oculta enquanto o hero está em tela cheia**; entra deslizando após rolar. **Não existe menu lateral/painel** (removido a pedido).
- Referências de motion aprovadas: zoom por área do masterplan estilo **oftheoak.co.uk/oak-species**, infográfico com destaque no scroll estilo **freehand.ai**, qualidade geral estilo **oryzo.ai**.

### Entrada de idioma
Na primeira visita aparece uma tela (`#langGate`) com EN/PT/ES antes do site. Ao escolher, ela sai e o loader assume. Quem já escolheu entra direto. O fluxo é: `i18n.js` dispara `bp:langready` → `script.js` anima a saída da entrada e roda o loader. Há um timeout de segurança de 4s que **não** dispara enquanto a entrada estiver aberta.

### Idiomas (i18n.js)
O HTML carrega **português**; `i18n.js` traz dicionários **EN** e **ES** que sobrescrevem via `data-i18n="chave"`. Chave ausente cai no PT original — a página nunca quebra. Conteúdo dinâmico (pinos, POIs, listas do mapa) usa objetos `{pt,en,es}` lidos pelo helper `tr()` e re-renderiza no evento `langchange`.
**Atenção:** o helper chama-se `tr()` e **não** `L()`, porque `L` é o global do Leaflet. Ao adicionar texto novo, incluir a chave nos dois dicionários (há um script de conferência no histórico da sessão).

### Estrutura do index (ordem definida pelo cliente na v5)
loader → hero → **respiro** → masterplan com zoom por área (`AREAS` no home.js, coordenadas em %
sobre `assets/web/vista-aerea-park-02.jpg`; o palco `#mpStage` tem a **proporção da própria imagem** e é
dimensionado para cobrir o viewport — é isso que mantém os pinos no lugar em qualquer tela. Quando a
planta é mais larga que a tela, o bloco fica **arrastável na horizontal** e as bordas esmaecem; no
celular a faixa é mais baixa, `clamp(420px,68svh,600px)`) → galeria sanfona "Fotos do Parque" (o
**Clube saiu** — está dentro do Select) → **bloco Hotel** → **bloco Resort** → **bloco Select** →
"Como funciona" (seção de exatamente `100svh` fixada com `ScrollTrigger.pin`. **A altura fixa é o que
evita a sobreposição e o espaço em branco da v2** — se mudar o conteúdo, manter o bloco cabendo em uma
tela) → mapa Leaflet dark full-bleed → **Villeta** (um ato só: as quatro razões em sanfona, a prova
em números e a esteira de logos) → **Tributação** (um ato só: o argumento, as quatro cifras que
contam ao entrar na tela e a conclusão em marrom com o CTA) → faixa Bracerum → footer.

### Masterplan novo e passador de fotos (v6.1 — 2026-09-03)
- **A planta mudou** para `assets/Vista Aerea Park 02.png` (3570×2080, enviada pelo cliente). A
  versão web é `assets/web/vista-aerea-park-02.jpg`, 2600×1515 a 80% — 2200 px ficava mole no zoom
  de 2,2× e 2800 px não compensava os 60 KB a mais. A vista antiga saiu do repositório.
- **Os 10 pinos foram remarcados** sobre a nova imagem, conferidos com recortes ampliados e um
  grid em % (o script está no histórico da sessão). Coordenadas atuais: Clube 33/30 · Portaria
  39,5/33,5 · Fábricas 32/42,5 · Lotes 55/45 · ETE-ETA 27/42 · Hangares 20/58,5 · Pista 33/71 ·
  Convenções 77/32,5 · Hotel 77,5/27,5 · Resort 72/40.
- **O losango passou a marcar o ponto.** O pino é uma linha (losango + rótulo) e o
  `translate(-50%,-50%)` centrava a linha inteira, jogando o losango para o lado do lugar real.
  Agora o deslocamento é de meio losango (`-7px`), e `.pin--left` usa `calc(-100% + 7px)`.
- **O cartão virou um passador de fotos.** Cada área tem `imgs: []` em vez de `img` — Hotel com 6,
  Centro de Convenções com 7, Resort com 6. Setas, pontos de posição, arrasto e setas do teclado.
  Só a foto atual e as vizinhas recebem `src` (o resto fica em `data-src`), senão abrir o cartão
  do Hotel puxaria seis imagens de uma vez.
- **O palco cabe numa tela.** `.masterplan__viewport` era `100svh` *mais* o respiro do topo, então
  a seção era mais alta que a tela e o rodapé do cartão nascia fora do enquadramento. Agora é
  `calc(100svh - respiro)`.
- Cartão e botão "vista geral" alinhados à mesma coluna do resto da página (`--pad-align`).

### Fusão de blocos e alinhamento geral (v6 — 2026-09-03)
- **Villeta virou um ato só.** "Empresas" e "Futuro de Villeta" eram duas seções sobre o mesmo
  assunto, separadas por 300 px de vazio. Agora: argumento (`.fatos`, sanfona de quatro razões com
  `<button>` + `aria-expanded`, altura animada por `grid-template-rows:0fr→1fr` — nada de medir
  `scrollHeight`), prova (`.prova`, eyebrow e números na mesma linha) e a `.esteira`, marquee CSS
  dos logos com máscara nas pontas, que para no hover e some com `html.no-motion`.
- **Tributação virou um ato só.** O teaser e o bloco de assessoria tinham dois CTAs concorrendo.
  Agora: argumento → `.cifras` (1% · 100% · 20 anos · 10 anos, que contam ao entrar na tela;
  o texto do HTML é a fonte da verdade se o JS não rodar) → `.tax__close` marrom com o CTA
  principal (`.btn--paper`) e o secundário (`.linkarrow`). Os quatro números saíram de
  `tributacao.html` — não invente outros.
- **Uma coluna só, no site inteiro.** Na home o conteúdo nascia em 70 px (masterplan, galeria,
  mapa), 120 px (etapas, footer) e 190 px (blocos de projeto) na mesma página. O `--pad-align`
  agora vale também para `.masterplan__head`, `.gallery/.loc .section__head`, `.steps__pin` e
  `.footer` — todas as seções de todas as páginas começam na mesma coluna (medido com
  `alinha.js` no histórico da sessão).
- **Véu no masterplan.** O título dividia espaço com os rótulos dos pinos e os dois ficavam
  ilegíveis; `.masterplan__head` ganhou degradê próprio.
- **CSS morto removido** (`.img-reveal`, `.on-dark`, `.btn--solid-dark`, `.contact-card__phone`,
  `.section--light`) e **5 chaves de i18n órfãs** (`nav.companies`, `loc.routeOn`, `loc.parkAt`,
  `loc.away`, `gal.6`). Os dicionários EN/ES estão com 486 chaves cada, em paridade e sem órfãs.
- **Peso.** Páginas internas: 206 KB → 160 KB de código próprio (-22%).

### Revisão de acabamento (v5.1 — 2026-09-03)
Passagem de QA nas páginas novas, com render real no Chromium em 1600×900, 1800×700 e 390×844.
O que mudou e **por que não voltar atrás**:
- **Coluna única.** `--pad-align` (`max(--gap, (100% - --max)/2 + --gap)`) alinha à coluna do
  `.section` tudo que sangra de borda a borda: `.pagehero__in`, `.specbar`, `.strip`, `.proj__body`,
  `.proj__mark` e `.img-band__copy`. Antes o texto do hero começava 120 px à esquerda do corpo.
- **`.section--dark` sangra.** O `.section` é uma coluna de 1360 px; o bloco escuro pintado só nela
  deixava tarja bege dos dois lados em tela larga. Agora um `::before` de `100vw` pinta o fundo
  inteiro e só o conteúdo fica na coluna.
- **Grade de cartões sem buracos.** A linha era o `gap:1px` sobre um fundo pintado — com 6 cartões em
  4 colunas as células que sobravam viravam retângulos pretos. Agora cada `.card` desenha a própria
  borda e a coluna é explícita (`--cols`, `.cards--3` para blocos de 3 e 6).
- **Tira de fotos.** A barra de rolagem nativa saiu. O JS envolve cada `.strip` num `.striprail`,
  esconde a barra e monta régua de posição + setas (`.strip__ui`); a tira arrasta com o mouse, anda
  com a roda e a régua é clicável. **Sem JS a barra nativa volta** (a regra que a esconde é
  `.striprail > .strip`) — é o único jeito de andar com a tira nesse caso.
- **Hero.** `min-height` em vez de `height`: em janela baixa e larga o título subia por baixo da nav.
  Dois véus (vertical + lateral a 100°, vertical no celular) garantem contraste sobre render claro.
  A imagem é 114% da altura porque o parallax do GSAP a desloca ±6% — no tamanho exato aparecia
  faixa de fundo no topo (vale também para `.proj__media img`).
- **Ritmo.** Duas seções seguidas do mesmo tom somavam 300 px de vazio; agora 66 px no mesmo tom e
  110 + 110 na troca de tom.
- **Legibilidade.** Parágrafos do `.split` ganharam respiro (vinham colados). Desenho técnico usa
  `.split__media--plan` (proporção natural, `object-fit:contain`) — o recorte 4:3 cortava o título e
  as notas do corte viário.
- **Ligações mortas.** `#contato` não existia em hotel/resort/select/qualidade: o botão "Fale
  conosco" da nav não fazia nada. O id está no `<footer>`. Dois botões estavam sem modificador de
  cor (`class="btn "`) e sumiam no hover.
- **Recado interno fora do ar.** A seção de tipologias do Resort publicava três cartões "Aguardando
  dados — a preencher com o quadro de áreas do cliente" e o hotel dizia "assim que o cliente fechar
  esse escopo". Virou convite comercial ("Pedir as plantas das casas") com âncora no contato.
- **Legendas da galeria** (18) e o `aria-label` da tira agora têm chave em EN e ES — estavam em
  português no site inglês.
- **Selo dos sub-projetos.** Os heros de hotel/resort/select usam o lockup `.sublogo`
  (BRACERUM + nome em serifada). **Os logos/selos enviados pelo usuário não chegaram a esta sessão**
  (árvore limpa, nenhum branch remoto os traz) — quando chegarem, trocar o `<p class="sublogo">` pelo
  `<img>` do SVG.

### Páginas de projeto (v5)
Cada sub-projeto tem página própria, montada a partir do **masterplan R04** (PDF do OTIFF, set/2026):
- `hotel.html` — Bracerum Hotel + Centro de Convenções + auditório de 1.200 lugares.
- `resort.html` — condomínio fechado, 142.067 m², clubhouse, lago e quadras.
- `select.html` — curadoria de comércio (shopping, academia, posto, market) e de serviços de apoio.
- `qualidade.html` — hierarquia viária, drenagem, áreas verdes e sustentabilidade.

Os blocos `.proj` da home e os heros `.pagehero` usam a mesma regra: **a imagem é link e o botão
também é link de verdade** — o cliente reclamou de botão sem ação, os dois navegam.

### Renders do masterplan R04
`assets/park/` tem 42 renders extraídos do PDF (`pdfimages` pega a maior imagem embutida de cada
página, sem a marca d'água do OTIFF, que é um objeto sobreposto). 7,3 MB no total, 1400 px de largura.
O texto do PDF vem com **fonte subset**: os glifos estão deslocados (ASCII +0x273 numa fonte, +0x1D
noutra) — o decodificador está em `/tmp/pdf/dec.py` no histórico da sessão, se precisar reler o PDF.

**Assets órfãos:** 47 MB de renders originais do cliente em `assets/` (`Hotel.jpg`, `convenco2.jpg`,
`Clube.jpg`, `INTERNAS PARK *.png` etc.) não são referenciados por nenhuma página — as versões
web estão em `assets/web/` e `assets/park/`. São material-fonte do cliente: **não apagar sem
perguntar**. O site entregue tem 2,05 MB na home.

**Dados oficiais do R04** (usar estes, não os do catálogo V15 quando divergirem):
terreno +1.800.000 m² · Resort 142.067 m² · parcelas industriais 987.304 m² · pista de 1.280 m ·
auditório 1.200 pessoas · 12 setores principais.
**Conflito conhecido:** o catálogo V15 dizia pista de **1.480 m**, o R04 diz **1.280 m**. O site ainda
exibe 1.480 m no masterplan — confirmar com o cliente qual vale.

### Mapa
**Basemap:** mapa **vetorial do OpenFreeMap** (estilo `dark`) via `maplibre-gl` + `maplibre-gl-leaflet`,
dentro do Leaflet — **sem chave de API e com uso comercial liberado**. O CARTO foi abandonado em
2026-08 porque passou a carimbar "API KEY REQUIRED" em todas as tiles públicas. O estilo é repintado
em runtime pela função `repaint()` em `script.js` (constante `PALETA`): fundo `--ink`, água `#1b4a6e`,
rios `#3d84b4`, rodovias em tons de areia, rótulos claros — **zero vermelho**. A água e os rios são
desenhados pelo próprio mapa, com traçado real; **não desenhar polilinha de rio por cima**
(foi rejeitado pelo cliente). Sem WebGL, cai para um raster claro (Esri Light Gray) invertido pelo
filtro CSS `.leaflet-pane--base`.
**Rotas:** o traçado real por vias vem de `assets/routes.json`, pré-calculado com o OSRM pelo script em
`docs/` (regerar com `build_routes.py` se os pontos mudarem). Sem chamada a API em runtime. Capitais
brasileiras são trechos aéreos e seguem em arco.
**Nota:** os km/tempo exibidos são os do catálogo (fonte de verdade do cliente) e diferem do OSRM em
alguns trechos curtos (ex.: Terport 23 km/20 min no catálogo vs. 35,7 km/36 min pelas vias públicas do
OSM) — o número exibido é o do cliente, a linha é a real.
**Interação:** clicar no ponto do mapa, no rótulo do ponto ou no item da lista faz a mesma coisa —
abre o cartão (foto + descrição para empresários), traça a rota, destaca o ponto e o item, e abre a
sanfona correspondente na lateral. Os marcadores têm área de toque de 28px (`.poi-marker`) porque o
ponto de 9px era pequeno demais no celular; os rótulos são `interactive: true` pelo mesmo motivo.
Indicador flutuante aponta o Park quando ele sai do enquadramento; rótulos de pontos a menos de 12 km
só aparecem a partir do zoom 11.

### Fotos dos pontos de interesse (v4.1)
Os 27 POIs do mapa têm foto em `assets/pois/`, todas do **Wikimedia Commons** sob licença livre
(CC / CC0 / domínio público) — inventário completo em `assets/pois/CREDITOS.md` e `CREDITOS.json`.
Cada POI tem `img` e `credit: {pt,en,es}` em `script.js`; o crédito é renderizado em texto pequeno
sobre a foto, no rodapé do cartão (`.poi-card__credit`). **Não usar imagem de busca comum do Google**
— são protegidas por direito autoral e o site é comercial.
O critério é **empresarial**: a foto tem que mostrar infraestrutura e escala (cais, guindaste, pátio,
comboio de barcaças) — pôr do sol e paisagem bonita não servem para este público.
Não existe foto livre dos terminais privados (Terport, Puerto Seguro, Caacupemí) — checado no Wikimedia
Commons e no Openverse (Flickr CC). Esses usam foto de contexto, rotulada como "Foto ilustrativa" no
próprio crédito. **O caminho certo é pedir as fotos aos próprios terminais** (terport.com.py,
puertosegurofluvial.com, caacupemi.com.py): eles ganham com a divulgação e uma autorização por e-mail
resolve. Quando chegarem, trocar o arquivo em `assets/pois/` e ajustar o `credit`.
Onde a foto não existe, a **descrição** carrega a escala: Terport e Puerto Seguro trazem investimento,
capacidade e equipamento, apurados nas fontes do setor.

**Pendências conhecidas** (aguardar o usuário):
- **Logos/selos do Bracerum Select, Hotel e Resort** — **chegaram** em `assets/Bracerum Hotel/`,
  `assets/Bracerum Resort/` e `assets/Bracerum Select/` (SVG e PNG). Ainda **não estão aplicados**:
  os heros de hotel/resort/select seguem com o lockup tipográfico `.sublogo`. Trocar o
  `<p class="sublogo">` pelo `<img>` do SVG correspondente.
- **Tipologias das casas do Resort** — o R04 define o setor residencial mas não traz plantas por
  unidade. A seção agora é um convite comercial ("Pedir as plantas das casas"); quando o quadro de
  áreas chegar, ela vira grade de `.cards` com uma tipologia por cartão.
- **Lazer próprio do hotel** (piscina, spa, academia no bloco de hospedagem) — não está no R04.
- **Ciclovias**: o esquema vial do R04 documenta veredas de 1,50 a 3,90 m e franjas técnicas de
  0,80 m, mas **não rotula ciclovia**. Confirmar com o cliente antes de afirmar que existe.
- Fotos próprias dos terminais (Terport, Puerto Seguro, Caacupemí) para substituir as ilustrativas.
- Faixa de história / página Bracerum: falta o número de anos da Bracerum como importadora de aço. O site institucional só traz "2018–2026" no copyright, então usei 2018 como início da operação como trader — **confirmar com o cliente**.
- Pinos do masterplan já seguem as marcações do cliente; refinar se ele apontar ajustes.
- Hero: imagem recuperada da capa do catálogo (+2.2x de exposição). Se o render original em alta for enviado, substituir `assets/web/hero-hotel-noturno.jpg`.

## Stack de design/dev combinada

- Prototipação/handoff: seguir princípios do guia de ferramentas (Figma-like: tokens, componentes, estados) mesmo sem Figma disponível aqui — traduzir isso direto em CSS custom properties e componentes reutilizáveis.
- Animação: **GSAP** (ferramenta adicionada pelo usuário) para scroll, transições e microinterações — inspirado nos padrões Osmo documentados em `docs/design-references.md`.
- Implementação: HTML/CSS/JS (mesma stack do projeto atual, sem framework pesado, a menos que o usuário peça).
- Qualidade: seguir os checklists de UX/UI e visual do guia (acessibilidade WCAG, estados de componente, performance, responsividade mobile-first) antes de considerar qualquer seção "pronta".

## Assets já disponíveis em `/assets`

Imagens reais do projeto (renders): `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`. Logo oficial da Bracerum (grupo): `Bracerum Vertical - Branca.svg`, normalizado em `assets/logo/bracerum-{white,blue,black}.svg` — é um lockup próprio, diferente do logo do Park. Logos de empresas parceiras/validação de mercado: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.

Faltam (mencionados no `LEIA-ME.txt` original, ainda não enviados): `tecnologico.jpg`, `comercial.jpg`.

## Próximo passo

Aguardando o usuário: (1) fotos próprias dos terminais privados, para substituir as ilustrativas; (2) o dado de anos de história da Bracerum como importadora de aço.
