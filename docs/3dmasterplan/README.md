# Masterplan 3D (`3dmasterplan/`)

Maquete 3D interativa do Bracerum Park, montada a partir da **planta V12 (01/10/2026)**. É uma
aplicação **fora do site**: nenhuma página do site aponta para ela ainda (o usuário pediu em
16/10 para não mexer no site). Quando o site for publicado com esta pasta, ela abre em
**`bracerumpark.com/3dmasterplan/`**.

> **Endereço em minúsculas.** A pasta é `3dmasterplan`. Servidores web diferenciam maiúsculas de
> minúsculas, então `/3DMasterplan` não abre a mesma pasta. Se o cliente quiser o endereço com
> maiúsculas, o caminho é um redirecionamento na hospedagem — não duas pastas com o mesmo nome em
> caixas diferentes, que quebra o repositório no Mac e no Windows.

## O que a pessoa faz nela

- **Gira, aproxima e move** a maquete (mouse: arrastar gira, botão direito move, roda aproxima no
  ponto do cursor; toque: um dedo gira, dois dedos movem e aproximam; setas do teclado movem).
- **Clica numa área** (no prédio, no chão, no pino ou na lista à esquerda): a câmera voa até lá, a
  área fica em areia, o resto esmaece, e abre o cartão com números do V12, texto, fotos do site e o
  link para a página do site sobre o assunto.
- **Clica num lote industrial**: o lote é contornado e o cartão mostra a metragem da planta, se é
  quadra-padrão (200 × 100 m, 16 módulos) e a regra de venda (a partir de 1.250 m²), com o botão
  para a equipe comercial (`index.html#contato`).
- **Ferramentas:** vista geral, de cima (na orientação da prancha: rodovia em cima, pista embaixo),
  girar sozinho, tour pelas 12 áreas, medir distância no chão, ligar/desligar rótulos, hora do sol
  (as sombras andam; posição solar real para Villeta na data de hoje) e tela cheia. A bússola gira
  com a câmera; clicar nela põe o norte para cima.
- **Idioma:** PT, EN e ES, com a mesma chave `bp-lang` do `localStorage` do site — quem escolheu
  inglês no site abre a maquete em inglês.
- **Endereço por área:** `…/3dmasterplan/#hotel`, `#resort`, `#industrial`… e por lote:
  `#lote-C3-L4`, `#lote-frente`, `#lote-borda`. A barra de endereço acompanha a seleção, então dá
  para mandar o link de uma área.

## Arquivos

| Arquivo | O que é |
|---|---|
| `3dmasterplan/index.html` | A página. As imagens do site entram por `../assets/` (meta `bp-assets`) e os links para o site por `../` (meta `bp-site`). |
| `3dmasterplan/app.js` | A aplicação: cena, volumes, interação, as 12 áreas (polígono, âncora, textos nos três idiomas, fotos, link) e os textos da interface. |
| `3dmasterplan/app.css` | A interface, com a marca do site (preto/papel/areia/marrom, Noto Serif + Helvetica, cantos retos, zero vermelho). |
| `3dmasterplan/data/scene.json` | Gerado: volumes, casas, casca, árvores, os 41 lotes e o contorno do parque. |
| `3dmasterplan/data/parque.webp` | Gerado: o chão do parque (a planta V12 sem texto, nas cores da maquete, com sombreado no pé dos prédios). 4096 px. |
| `3dmasterplan/data/entorno.webp` | Gerado: 10 × 9,5 km de entorno real (OpenStreetMap), esmaecido nas bordas. |
| `3dmasterplan/data/poster.jpg` | A imagem que aparece se o navegador não tiver WebGL. |
| `3dmasterplan/vendor/` | three.js 0.169.0 (licença MIT, em `three-LICENSE.txt`) — servido daqui, sem CDN. |
| `docs/3dmasterplan/build_data.py` | Gera os três arquivos de `data/` (menos o pôster). |

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
