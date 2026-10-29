# Masterplan 3D (`3dmasterplan/`)

Maquete 3D interativa do Bracerum Park, montada a partir do **Masterplan V14 (28/10/2026, "lotes
identificados")** — registro da planta em `docs/masterplan-v14.md`. É uma aplicação **fora do site**:
nenhuma página do site aponta para ela ainda. Publicada junto com o site, abre em
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
- **Clica num dos pontos do mapa** (no prédio, no chão, no pino ou na lista "Conheça o Bracerum
  Park"): a câmera voa até lá, o ponto fica em areia, o resto esmaece, e abre o cartão com números,
  texto, fotos do site e o link para a página do site sobre o assunto. São os 21 pontos da legenda do
  folheto do cliente, mais dois que o V14 trouxe — ver "Os pontos do mapa" abaixo.
- **Lotes à venda (com preço):** o botão "Lotes à venda" pinta os 615 lotes pela categoria de preço,
  rotula as quadras Q01–Q42 e mantém os galpões ilustrativos no meio dos terrenos (pedido do cliente
  em 2026-10-20); o lote escolhido aparece por cima do galpão. Clicar num lote (em qualquer modo,
  inclusive no telhado do galpão) mostra o nome oficial (`LTIND.Q07.L014`), a área de contrato, a
  categoria, se é de esquina, a forma e as frentes, e o **valor final** — preço por m² × área —, com
  janela de preço, forma de pagamento, sinal e parcelas. Shift + clique (ou "Somar lotes" no cartão)
  junta lotes numa simulação; "Quadra Q07 inteira" seleciona a quadra. A faixa de quantidade (1–8,
  9–16, 17–32, 33+) muda sozinha e o cartão avisa quanto cai o m² na faixa seguinte. "Pedir proposta"
  abre um e-mail para a equipe comercial já com os nomes completos dos lotes e a simulação.
- **Ferramentas:** vista geral, de cima (na orientação da prancha: rodovia em cima, pista embaixo),
  girar sozinho, tour pelos pontos, medir distância no chão, ligar/desligar rótulos, hora do sol
  (as sombras andam; posição solar real para Villeta na data de hoje) e tela cheia. A bússola gira
  com a câmera; clicar nela põe o norte para cima.
- **Idioma:** PT, EN e ES, com a mesma chave `bp-lang` do `localStorage` do site.
- **Endereço por ponto:** `…/3dmasterplan/#hotel`, `#eventos`, `#club`, `#heliponto`… (os `id` em
  `AREAS`; `#condominio`, `#aeroporto` e `#infra` continuam valendo); `#lotes` abre o modo de lotes;
  `#lote-Q07.L014` abre um lote e `#lotes-Q22.L012-Q22.L013-Q05` uma simulação (um `Qxx` sozinho = a
  quadra inteira). A barra de endereço acompanha a seleção, então dá para mandar o link.

## Arquivos

| Arquivo | O que é |
|---|---|
| `3dmasterplan/index.html` | A página. As imagens do site entram por `../assets/` (meta `bp-assets`) e os links para o site por `../` (meta `bp-site`). |
| `3dmasterplan/app.js` | A aplicação: cena, volumes, interação, os pontos do mapa (`AREAS`: polígono, âncora, textos nos três idiomas, fotos, link), a regra que liga cada volume a um ponto (`pontoDoVolume`) e os textos da interface. |
| `3dmasterplan/app.css` | A interface, com a marca do site (preto/papel/areia/marrom, Noto Serif + Helvetica, cantos retos, zero vermelho). |
| `3dmasterplan/data/scene.json` | Gerado: volumes, casas, casca, árvores e o contorno do parque. |
| `3dmasterplan/data/lotes.json` | Gerado: os 615 lotes à venda (nome oficial completo, quadra, categoria, área de contrato, contorno) e as quadras; Q37 (recinto alfandegado) e Q11 (Administração) marcadas como fora da oferta. |
| `3dmasterplan/data/precos.json` | **Editado à mão:** a Tabela de Preços (janelas, faixas, pagamentos, US$/m² por categoria), nomes das categorias nos três idiomas, cores e o contato comercial. |
| `3dmasterplan/data/parque.webp` | Gerado: o chão do parque (a planta V14 sem texto, nas cores da maquete, com sombreado no pé dos prédios). 4096 px. |
| `3dmasterplan/data/entorno.webp` | Gerado: 10 × 9,5 km de entorno real (OpenStreetMap), esmaecido nas bordas. |
| `3dmasterplan/data/poster.jpg` | A imagem que aparece se o navegador não tiver WebGL. |
| `3dmasterplan/vendor/` | three.js 0.169.0 (licença MIT, em `three-LICENSE.txt`) — servido daqui, sem CDN. |
| `docs/3dmasterplan/build_data.py` | Gera `scene.json`, `parque.webp` e `entorno.webp` a partir do PDF do V14. |
| `docs/3dmasterplan/build_lotes.py` | Gera `lotes.json` a partir do mesmo PDF (nomes e áreas escritos em cada lote). |
| `docs/masterplan-v14/` | O PDF do V14 enviado pelo cliente em 2026-10-29. |
| `docs/lotes-p1/` | Tabela de Preços P1 (versão pública, v3.1) e o Mapa de Lotes MP14 (V14-02, superado pelo V14 de 28/10). |

## Regerar os dados

```sh
python3 docs/3dmasterplan/build_data.py        # da raiz; ~5 min na primeira vez (renderiza o PDF)
python3 docs/3dmasterplan/build_lotes.py       # ~30 s, usa a planta em cache
```

Reaproveita `docs/prompt-aerea-v12/build_refs.py` (leitura do PDF sem texto, georreferência pela
curva da PY-19). O V14 usa a mesma prancha e as mesmas coordenadas do V12, então o encaixe vale
igual. Os volumes saem de `Maquete14.montar()` no `build_data.py`: as mesmas regras e alturas da
maquete anterior, com caixas (em % da prancha) que dizem onde está cada coisa no V14. Precisa de
`pip install numpy pillow scipy pikepdf opencv-python-headless` e do `poppler-utils`; na primeira vez
baixa o OpenStreetMap (Overpass) e guarda em cache.

**Planta nova:** trocar `PLANTA` no `build_data.py`, conferir as caixas de `Maquete14.montar()` (o
script imprime quantos volumes achou de cada tipo — compare com o quadro de áreas) e rodar os dois
scripts. Os textos e números dos cartões ficam no `app.js` (`AREAS`) — mudar texto não precisa
regerar nada.

## O que é da planta e o que é estimativa

- **Da planta V14:** posição e contorno de tudo, os 615 lotes com nome e área de contrato, as 67 torres
  do Condo (16 de 1 quarto, desenhadas em três peças; 39 em cruz; 12 retangulares), os 31 lotes do
  Resort (uma casa em cada), os 7 hangares, os 10 lotes do recinto alfandegado e os 8 do Hub (um
  galpão em cada), a casca do Centro de Convenções, o desenho do chão, as árvores e todos os números
  dos cartões (quadro de áreas do V14 + respostas do cliente: pista de 1.460 m, venda a partir de
  1.250 m², "ambulatório").
- **Estimativa (a planta não define):** a altura de todos os prédios (hotel 36 m, Centro Tecnológico
  15 m = 4 pavimentos, torres de 1 quarto 19 m = 6 pavimentos para 24 unidades, demais torres 13 m,
  galpões 9–12 m, casas 7 m…), a arquitetura (fachadas, telhados de quatro águas, vitrines do Outlet,
  que é só mancha) e a divisão dos galpões dentro dos lotes. O V14 não desenha prédio no Posto
  Policial, no Corpo de Bombeiros nem no Posto de Saúde (só o lote ou uma cruz): os volumes ali são
  pequenos e genéricos. A interface avisa no rodapé do índice e no crédito.

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
- Se as fotos de Escola, Condo, Club, Posto de Saúde, Bombeiros, Hub e Grêmio chegarem, entram em
  `photos` do ponto no `app.js`.

## Lotes à venda e preços

**Fontes:** os lotes, nomes e áreas vêm do **Masterplan V14 (28/10/2026, "lotes identificados")**, que
escreve dentro de cada lote o nome oficial com a área de contrato:
`LTIND.Q07.L014.A01250.ESQNAO.RT.L` (quadra, lote, área, esquina, forma, frentes). Os preços e as
categorias vêm da *Tabela de preços — Lotes industriais*, Política Comercial P1 v2.0, Tabela v3.1 (rev.
14/10/2026, versão pública), em `docs/lotes-p1/`.

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

**Os lotes** (`build_lotes.py`): lê os nomes com a posição (`pdftotext -bbox`), separa os lotes na
planta sem texto pela cor e põe cada nome no lote em que ele cai. A categoria sai da **regra escrita
na Tabela de Preços**. Resultado: **615 lotes, 766.693 m²** — exatamente o quadro de áreas do V14
(Q37, recinto alfandegado, e Q11, da Administração, ficam fora). Por categoria: 145 Vitrine (181.650
m²), 64 Business, 256 Padrão, 150 Interna. Todas as áreas são as de contrato (nenhuma medida).

**O PDF do V14 tem rótulos repetidos** (o script resolve e avisa): as quadras Q15, Q28, Q30, Q33 e Q34
têm cada nome duas vezes no mesmo lugar; a Q38, que virou uma quadra só com a Q39 (38.194 m², a via
entre elas sumiu), ficou com os rótulos da versão anterior por baixo dos novos — o script numera os
lotes dela pela posição (faixa de cima, da esquerda para a direita, depois a de baixo) e os nomes
novos fecham os 38.194 m². Ver `docs/masterplan-v14.md` §4.

**A confirmar com o cliente:**
1. **Q04.L017** aparece com duas áreas empilhadas no PDF: 1.410 m² e 1.650 m². O app usa **1.650 m²**,
   que bate com o desenho (~1.705 m² medidos), com a área da quadra (21.650 m²) e com o total do quadro
   (766.693 m²). A Tabela de Preços v3.1 usava 1.410 (por isso a Vitrine dela soma 181.410 m²).
2. A **Tabela de Preços v3.1** é da época do V14-02 (612 lotes, 765.960 m²); o V14 tem 615 lotes. Os
   preços por m² e a regra de categoria continuam valendo; o app aplica a regra aos lotes novos da
   Q38+Q39 (Interna). Se a próxima tabela mudar a categoria de algum lote, ajustar `categoria()` no
   `build_lotes.py`.
3. A **Q11** (Administração) tem nome de lote no PDF e entrava como Interna na tabela v3.1, mas o
   quadro do V14 não a conta. O app a deixa fora da oferta.

**Disponibilidade:** a tabela diz que a disponibilidade é confirmada na proposta; o app não marca lote
vendido ou reservado. Se o cliente quiser, dá para pôr um campo `status` em `lotes.json`.

## Os pontos do mapa

Os **21 primeiros** são os da legenda "Conheça o BracerumPark" do folheto do cliente (2026-10-20), com
o nome e a ordem dele: 01 Entrada Parque · 02 Posto de Gasolina · 03 Clube do Caminhoneiro · 04
Portaria · 05 Bracerum Outlet · 06 Bracerum Market · 07 Centro tecnológico · 08 Hotel · 09 Centro de
eventos · 10 Escola · 11 Bracerum Resort · 12 Bracerum Condo · 13 Bracerum Market · 14 Ambulatório ·
15 Bombeiro Civil · 16 Lotes industriais · 17 Pista de Pouso · 18 Hangares · 19 Heliponto · 20 ETE/ETA
· 21 Administração Parque. A seção "Tempos & Distâncias" do folheto ficou de fora, a pedido. Os
**dois últimos** são coisas do V14 que a legenda não tem: **22 Bracerum Club** (40.706 m², com o Salão
de Eventos) e **23 Refeitório, Grêmio e Hub de serviços** (junto à pista).

As posições seguem o V14. Nele, o Ambulatório (14, Posto de Saúde de 4.113 m²) e o Bombeiro Civil (15,
Corpo de Bombeiros de 620 m² com o Posto Policial de 506 m² ao lado) ficam no vértice norte — isso
resolve a dúvida que o folheto deixava. O Resort (11) passou para a borda leste, junto à pista (31
lotes), e o Condo (12) ocupa o miolo da ponta norte.

**A confirmar com o cliente:** a legenda tem "Bracerum Market" duas vezes (06 e 13). O 13 é o
Supermercado + 12 lojas; o 06 ficou na faixa comercial vertical, onde o folheto põe o número — mas o
V14 chama essa faixa de "Bracerum Outlet". O desenho do folheto também estava um número atrás da
legenda a partir do 09 (a maquete segue a legenda).
