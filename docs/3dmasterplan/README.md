# Masterplan 3D (`3dmasterplan/`)

Maquete 3D interativa do Bracerum Park, montada a partir da **planta V12 (01/10/2026)**. É uma
aplicação **fora do site**: nenhuma página do site aponta para ela ainda (o usuário pediu em
16/10 para não mexer no site). Quando o site for publicado com esta pasta, ela abre em
**`bracerumpark.com/3dmasterplan/`**.

> **Endereço em minúsculas.** A pasta é `3dmasterplan`. Servidores web diferenciam maiúsculas de
> minúsculas, então `/3DMasterplan` não abre a mesma pasta. Se o cliente quiser o endereço com
> maiúsculas, o caminho é um redirecionamento na hospedagem — não duas pastas com o mesmo nome em
> caixas diferentes, que quebra o repositório no Mac e no Windows.

> **Barra final.** O Vercel entrega `/3dmasterplan` sem redirecionar para `/3dmasterplan/`, e sem a
> barra o navegador procura `app.css`, `app.js` e `data/` na raiz do site (foi o que quebrou na primeira
> publicação, 2026-10-20). O primeiro `<script>` do `index.html` leva para o endereço com barra,
> mantendo `#área`, antes de carregar qualquer coisa. Não tirar.

## O que a pessoa faz nela

- **Gira, aproxima e move** a maquete (mouse: arrastar gira, botão direito move, roda aproxima no
  ponto do cursor; toque: um dedo gira, dois dedos movem e aproximam; setas do teclado movem).
- **Clica num dos 21 pontos do mapa** (no prédio, no chão, no pino ou na lista "Conheça o Bracerum
  Park"): a câmera voa até lá, o ponto fica em areia, o resto esmaece, e abre o cartão com números,
  texto, fotos do site e o link para a página do site sobre o assunto. Os 21 pontos, com nome e ordem,
  são os da legenda do folheto do cliente (2026-10-20) — ver "Os 21 pontos" abaixo.
- **Lotes à venda (com preço):** o botão "Lotes à venda" pinta os 612 lotes pela categoria de preço,
  rotula as quadras Q01–Q42 e mantém os galpões ilustrativos no meio dos terrenos (o cliente pediu
  em 2026-10-20 que eles não sumissem); o lote escolhido aparece por cima do galpão. Clicar num lote
  (em qualquer modo, inclusive no telhado do galpão)
  mostra o nome oficial (`LTIND.Q07.L014`), a área, a categoria e o **valor final** — preço por m² ×
  área —, com janela de preço, forma de pagamento, sinal e parcelas. Shift + clique (ou "Somar
  lotes" no cartão) junta lotes numa simulação; "Quadra Q07 inteira" seleciona a quadra. A faixa de
  quantidade (1–8, 9–16, 17–32, 33+) muda sozinha e o cartão avisa quanto cai o m² na faixa seguinte.
  "Pedir proposta" abre um e-mail para a equipe comercial já com os lotes e a simulação. Detalhes na
  seção "Lotes à venda e preços" abaixo.
- **Ferramentas:** vista geral, de cima (na orientação da prancha: rodovia em cima, pista embaixo),
  girar sozinho, tour pelos 21 pontos, medir distância no chão, ligar/desligar rótulos, hora do sol
  (as sombras andam; posição solar real para Villeta na data de hoje) e tela cheia. A bússola gira
  com a câmera; clicar nela põe o norte para cima.
- **Idioma:** PT, EN e ES, com a mesma chave `bp-lang` do `localStorage` do site — quem escolheu
  inglês no site abre a maquete em inglês.
- **Endereço por ponto:** `…/3dmasterplan/#hotel`, `#eventos`, `#posto`, `#heliponto`… (os `id` em
  `AREAS`; os endereços antigos `#condominio`, `#servicos`, `#aeroporto` e `#infra` continuam valendo); `#lotes` abre o modo de
  lotes; `#lote-Q07.L014` abre um lote e `#lotes-Q22.L012-Q22.L013-Q05` uma simulação (um `Qxx`
  sozinho = a quadra inteira). A barra de endereço acompanha a seleção, então dá para mandar o link.

## Arquivos

| Arquivo | O que é |
|---|---|
| `3dmasterplan/index.html` | A página. As imagens do site entram por `../assets/` (meta `bp-assets`) e os links para o site por `../` (meta `bp-site`). |
| `3dmasterplan/app.js` | A aplicação: cena, volumes, interação, os 21 pontos (polígono, âncora, textos nos três idiomas, fotos, link) e a regra que liga cada volume da maquete a um ponto (`pontoDoVolume`) e os textos da interface. |
| `3dmasterplan/app.css` | A interface, com a marca do site (preto/papel/areia/marrom, Noto Serif + Helvetica, cantos retos, zero vermelho). |
| `3dmasterplan/data/scene.json` | Gerado: volumes, casas, casca, árvores, as 41 quadras do V12 e o contorno do parque. |
| `3dmasterplan/data/lotes.json` | Gerado: os 612 lotes à venda (nome, quadra, categoria, área, contorno) e as quadras, com a Q37 marcada como fora da oferta. |
| `3dmasterplan/data/precos.json` | **Editado à mão:** a Tabela de Preços (janelas, faixas, pagamentos, US$/m² por categoria), nomes das categorias nos três idiomas, cores e o contato comercial. |
| `3dmasterplan/data/parque.webp` | Gerado: o chão do parque (a planta V12 sem texto, nas cores da maquete, com sombreado no pé dos prédios). 4096 px. |
| `3dmasterplan/data/entorno.webp` | Gerado: 10 × 9,5 km de entorno real (OpenStreetMap), esmaecido nas bordas. |
| `3dmasterplan/data/poster.jpg` | A imagem que aparece se o navegador não tiver WebGL. |
| `3dmasterplan/vendor/` | three.js 0.169.0 (licença MIT, em `three-LICENSE.txt`) — servido daqui, sem CDN. |
| `docs/3dmasterplan/build_data.py` | Gera `scene.json`, `parque.webp` e `entorno.webp`. |
| `docs/3dmasterplan/build_lotes.py` | Gera `lotes.json` a partir do mapa de lotes MP14. |
| `docs/lotes-p1/` | Os dois PDFs do cliente: Tabela de Preços (versão pública, v3.1) e Mapa de Lotes MP14 (V14-02). |

Tamanho: ~1,5 MB no total, dos quais 690 KB são o three.js.

## Regerar os dados

```sh
python3 docs/3dmasterplan/build_data.py        # da raiz; ~3 min
```

Reaproveita `docs/prompt-aerea-v12/build_refs.py` (leitura do PDF sem texto, georreferência pela
curva da PY-19 e a maquete de volumes), então **as alturas são as mesmas da vista aérea do
Astra-6**. Precisa de `pip install numpy pillow scipy pikepdf opencv-python-headless` e do
`poppler-utils`; na primeira vez baixa o OpenStreetMap (Overpass) e guarda em cache.

Rodar de novo se: o cliente mandar outra planta; mudar uma altura ou regra de volume no
`build_refs.py`; mudar a paleta do chão (`PALETA_PLANTA`, `CORES_ENTORNO`). Os textos e números dos
cartões ficam no `app.js` (`AREAS`) — mudar texto não precisa regerar nada.

## O que é da planta e o que é estimativa

- **Da planta V12:** posição e contorno de tudo, os 41 lotes com a metragem escrita em cada um
  (soma 780.590 m², como no §4 de `docs/masterplan-v12.md`), as 38 torres em H, 7 hangares, a casca
  do Centro de Convenções, o desenho do chão (vias, canal, quadras, estacionamentos, lago), as
  árvores (canteiros, faixa da rodovia, palmeiras dos estacionamentos, árvores floridas dos
  boulevards) e todos os números dos cartões (quadro de áreas + respostas do cliente de 16/10:
  pista de 1.460 m, lotes à venda a partir de 1.250 m², "ambulatório", sem Fábricas Bracerum).
- **Estimativa (o V12 não define):** a altura de todos os prédios (hotel 36 m, galpões 9–12 m,
  torres 13 m = 4 pavimentos, casas 7 m…), a arquitetura (fachadas, telhados de quatro águas das
  casas, vitrines do Outlet, que no V12 é só mancha) e a divisão dos galpões dentro dos lotes. A
  interface diz isso no rodapé do índice e no crédito.
- **Faltam casas:** o leque de lotes na borda de baixo do Resort não fecha polígono na planta, então
  a maquete tem 116 casas para os 141 lotes.
- **Coluna/linha dos lotes** (`C3-L4`) é a referência do `docs/masterplan-v12.md`, **não** a
  numeração oficial — o cartão do lote avisa. Se o cliente tiver numeração própria, trocar o `id`
  em `lotes()` do `build_data.py`.

## Testar localmente

A pasta usa `../assets/`, então o servidor tem que servir a **raiz do repositório**:

```sh
python3 -m http.server 8000      # na raiz
# http://localhost:8000/3dmasterplan/
```

`?q=low` desliga as sombras (útil em máquina fraca ou em navegador sem GPU). No console,
`window.__bp` expõe cena, câmera e as funções de seleção.

## Quando o site for liberado

- Linkar a maquete a partir do masterplan da home (e talvez da nav) — hoje não há link.
- Se as fotos de Escola, Condomínio Vertical, Creche/Ambulatório, Hub e Grêmio chegarem, entram em
  `photos` da área no `app.js`.
- Se o render aéreo do V12 do Astra-6 for aprovado, ele pode virar o pôster/`og:image`.

## Lotes à venda e preços

**Fontes** (`docs/lotes-p1/`, enviadas pelo cliente em 2026-10-20): *Tabela de preços — Lotes
industriais*, Política Comercial P1 v2.0, Tabela v3.1 (rev. 14/10/2026, versão pública), e o *Mapa de
Lotes — Bracerum Park* (MP14), ambos do **Masterplan V14-02 (09/10/2026)**.

**A conta**, como manda a tabela: valor do lote = preço por m² × área do lote. O preço por m² depende
de quatro coisas, todas no cartão: a **janela** (Expo até 13/11/2026, Pós-Expo até 31/03/2027, Fase 1
plena depois — o app abre na janela da data de hoje), a **categoria** do lote (Vitrine ×1,15,
Business ×1,10, Padrão ×1,00, Interna ×0,90), a **faixa de quantidade** da operação (1–8, 9–16, 17–32,
33+ lotes) e o **pagamento** (à vista −8%, 20% + 12x, 20% + 36x +8%). Os valores por m² vêm prontos da
tabela (não são recalculados pelos percentuais). Sinal = 20% do total; parcela = saldo ÷ 12 ou 36.
**Conferido:** os dez exemplos de proposta da própria tabela (Q07.L014, Q22.L012, Q13 L001–L008, Q06
inteira, Q01.L001 de 801 m², Q02 L001–L004 à vista, Q27 L001–L008, Q03, Q10, Q41 + Q42) dão os mesmos
totais, sinais e parcelas no app, nas três janelas.

**Quando sair tabela nova:** editar só `3dmasterplan/data/precos.json` (preços, datas das janelas,
versão). Não precisa regerar nada.

**Os lotes** (`build_lotes.py`): o mapa MP14 é uma imagem (A3, 300 dpi) — cada lote pintado na cor da
categoria. O script separa os lotes pela cor, encaixa o mapa na planta V12 pelas 32 quadras-padrão
(erro de ~1 px, 0,4 m: é o mesmo desenho), põe cada lote na quadra e numera como o mapa (faixa de cima
para baixo, esquerda para a direita — conferido nas quadras irregulares Q01, Q05, Q18, Q38 e Q40). A
categoria sai da **regra escrita na tabela**; a contagem bate com ela: 145 Vitrine, 64 Business, 256
Padrão, 147 Interna = 612.

**As áreas:** 571 lotes são o lote-padrão de 1.250 m² (A01250); a Q01.L001 tem os 801 m² que a tabela publica e a Q11 (lote único, junto à Administração) tem os 1.138 m² da quadra. Os **39 lotes irregulares** (borda do
terreno e da pista: Q01, Q04.L017, Q05, Q18, Q31, Q38, Q39, Q40) não deixam ler a área no mapa — o nome
oficial traz a área, mas a letra é ilegível na imagem —, então a área foi **medida no mapa** e ajustada
para a soma bater com a área da quadra escrita no mapa. O método dá **801 m² na Q01.L001**, exatamente
a área que a tabela publica. Esses lotes aparecem com "≈" e o cartão avisa. **Se o cliente mandar a
lista dos 612 nomes oficiais** (`LTIND.Qxx.Lyyy.A0xxxx…`), trocar pelas áreas de contrato (dicionário
`AREA_CONHECIDA` do script) e regerar.

**Divergências encontradas (para confirmar com o cliente):**
1. A tabela diz Vitrine = 181.410 m², mas a Q04 (frente da entrada) soma 21.650 m² no mapa (16 lotes de
   1.250 + o L017, mais largo, com ~1.650): daria 181.650 m². O estoque total também fica 236 m² acima
   dos 765.960 m² do quadro.
2. No mapa, a Q38.L001 está pintada de verde (Padrão), mas a tabela põe a Q38 inteira como Interna — e
   só com ela Interna fecha 147 lotes. O app segue a tabela.
3. O V14-02 mudou coisas que a maquete (V12) ainda desenha do jeito antigo: a Q37 virou **recinto
   alfandegado** (fora da oferta; a maquete ainda tem galpões ali), a Q31 tem 7.020 m² (era 7.220), a
   Q38 tem 15.732 m² (era 15.445), o Outlet tem 61.850 m² e o Supermercado 4.606 m² (os cartões já usam
   esses números). A planta V14-02 completa não veio — só o mapa de lotes.

**Disponibilidade:** a tabela diz que a disponibilidade é confirmada na proposta; o app não marca lote
vendido ou reservado. Se o cliente quiser, dá para pôr um campo `status` em `lotes.json`.

## Os 21 pontos

Nome e ordem são os da legenda "Conheça o BracerumPark" do folheto que o cliente mandou em
2026-10-20 (a seção "Tempos & Distâncias" do mesmo folheto foi deixada de fora, a pedido): 01 Entrada
Parque · 02 Posto de Gasolina · 03 Clube do Caminhoneiro · 04 Portaria · 05 Bracerum Outlet · 06 Bracerum
Market · 07 Centro tecnológico · 08 Hotel · 09 Centro de eventos · 10 Escola · 11 Bracerum Resort · 12
Bracerum Condo · 13 Bracerum Market · 14 Ambulatório · 15 Bombeiro Civil · 16 Lotes industriais · 17
Pista de Pouso · 18 Hangares · 19 Heliponto · 20 ETE/ETA · 21 Administração Parque.

**O desenho do folheto e a legenda não batem a partir do 09:** o mapa só numera até 19 e, do 09 em
diante, cada número está um atrás da legenda (o "09" do desenho está na Escola, que é o 10 da legenda;
o "15", repetido três vezes na grade, são os Lotes industriais, o 16 da legenda). A maquete segue a
legenda e põe cada ponto onde a coisa está: o 06 é a faixa comercial vertical (no V12, parte do
Outlet), o 13 é o supermercado na ponta dela, o 08 é a torre do hotel e o 09 a casca do centro de
convenções com o Salão de Eventos. **A confirmar com o cliente:** o 14 (Ambulatório) ficou no bloco de
serviços da coluna 5, onde o V12 desenha ambulatório, refeitório e creche; o 15 (Bombeiro Civil) ficou
no bloco da coluna 6 (Hub de serviços e Grêmio), onde o folheto põe um marcador sem nome — no V12 os
bombeiros civis estão no mesmo prédio do ambulatório. Os dois "Bracerum Market" (06 e 13) repetem o
nome da legenda.
