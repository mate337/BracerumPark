# Comando de execução — filme de motion design do Bracerum Park (24 s, feito em código)

> **Executado em 2026-09-28. Depois do retorno do cliente o filme virou a v2, de 48 s:** abertura com o
> parque real, masterplan e fotos por mais tempo, pausas de leitura. A linha do tempo da §5 abaixo é a
> da v1. **A v2 vigente está em [`LEIA-ME.md`](LEIA-ME.md)** — não "corrija" o filme de volta para 24 s.

> **Como usar:** abra uma sessão do Claude Code neste repositório, anexe o vídeo de referência se
> ainda o tiver, e mande: *"Leia `docs/motion/PROMPT-MOTION-24S.md` inteiro e execute."*
>
> Arquivo autossuficiente. Leia inteiro antes de começar e execute sem pedir confirmação, porque
> todas as decisões já estão tomadas aqui. Onde este arquivo divergir de outra fonte, **ele vence**,
> exceto nas regras de marca do `CLAUDE.md`, que vencem tudo.

## 1. O trabalho

Criar **inteiramente em código, dentro deste container**, um filme de marca de **24 s** do
**Bracerum Park** (cidade industrial em Villeta, Paraguai), com a mesma linguagem de um vídeo de
motion design de referência: tipografia cinética, cortes no tempo da música, contadores, mockups e a
construção do símbolo no final. O material é o que já está no repositório: fotos finalizadas do
cliente, a planta do masterplan, os logos e os números oficiais do site.

Não é o filme institucional de 60 s (`docs/roteiro-video-60s.md`, que depende de takes 3D ainda não
produzidos). É uma peça curta, gráfica, para redes e para abrir apresentações, que fica pronta
**hoje**, só com o que existe.

**Stack:** HTML + CSS + **GSAP** (a mesma do site), com uma timeline única pausada que é
posicionada quadro a quadro no Chromium headless (Playwright) e capturada para o ffmpeg. Não use
Remotion (a licença gratuita não cobre empresas desse porte) nem After Effects.

## 2. A referência: o que copiar e o que não copiar

A referência é um filme 16:9 de ~20 s (marca fictícia "Brabo Space", preto/branco/amarelo) filmado
num monitor. O que faz ele parecer caro, **nesta ordem de importância**:

1. **Tudo corta no tempo.** Cada cena dura 1, 2 ou 3 batidas. Nada fica parado mais de meia batida,
   e mesmo as pausas têm uma deriva lenta de escala.
2. **Corte no meio do movimento.** A cena seguinte entra enquanto a anterior ainda se mexe; nenhum
   movimento chega ao fim e espera.
3. **Motion blur de verdade** nos movimentos rápidos (a palavra que cresce, o objeto que voa para a
   câmera, os dígitos que rolam).
4. **Três cores, alternadas com disciplina:** cada corte troca o fundo (claro → escuro → cor).
5. **Uma família de gestos repetida:** a mesma curva de easing (expo) no filme inteiro.

Os momentos da referência, em ordem, e em que cena da §5 cada um vira:

| Referência | Técnica | Vira no Park |
|---|---|---|
| "Brabo." miúda cresce até estourar a tela, desfocada | escala 1→12 com blur direcional | S1 |
| Vira composição editorial "Brabo / Space / para criar", `.01`, seta | layout em escada, metadado miúdo | S1 |
| A composição se multiplica numa grade 4×4 de variações de cor | câmera recua sobre a grade | S2 |
| Fundo amarelo, "criar" com letras entrando em cascata vertical | stagger por letra | S3 |
| Losango 3D amarelo girando, partículas em órbita, voa para a câmera | objeto CSS 3D + órbitas | S4 |
| Campo de busca digitando "O que vamos criar hoje?", botão amarelo cresce e cobre a tela | typewriter + wipe circular | S5 |
| Letreiro amarelo inclinado com nomes dos produtos em linhas alternadas | marquee em plano 3D | S6 |
| Parede de cartões de interface montando em perspectiva | stagger 3D | S7 |
| — (não existe na referência) | — | S8, masterplan com pinos |
| "+10.000 alunos", "+400h de conteúdo" em rolagem de caça-níquel | contador com blur | S9 |
| "Criatividade. Direção. Repertório. Senso crítico. Bom gosto.", um por fundo | cortes secos de 0,4 s | S10 |
| Boné, moletom, mochila e caderno com o logo, luz varrendo | mockups com luz | S11 |
| "Uma identidade." → "Infinitas criações." | frase curta, depois frase gigante que desliza | S12 |
| O símbolo se desenha a partir de pontos e traços | construção do símbolo | S13 |
| Grade de pixels cobre a tela, "Um espaço [logo] para criar", assinatura final | transição de grade + lockup | S14 |

**Não copiar:** o amarelo (aqui o papel dele é do `--sand`), a grotesca pesada (aqui é Noto Serif
+ Helvetica), o overshoot em tudo (aqui só na S3) e o monitor filmado (o entregável é o filme em si,
e a versão "no monitor" é opcional, ver §9).

## 3. Regras de marca (não negociáveis, vêm do `CLAUDE.md`)

- **Paleta:** `--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315` e
  `--cream #fff8ef` (cor dos logos). **Zero vermelho em qualquer frame.** Nenhum azul gráfico; o azul
  que já existe dentro das fotos (céu, iluminação do hangar) é fotográfico e pode ficar.
- **Tipografia:** **Noto Serif** para palavras de display e títulos, com **itálico como ênfase no
  lugar de cor**. **Helvetica** para números, metadados e interface. No container não há Helvetica:
  use a pilha `"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif`; a Liberation
  Sans tem as mesmas métricas.
- **Cantos quadrados** em tudo: cartões, campo de busca e fotos. O **único** elemento redondo é o
  botão circular da S5, porque ele vira o wipe circular.
- **Não use** `assets/web/hero-hotel-noturno.jpg` (iluminação vermelha) nem
  `assets/web/fotos/hangar-interior.jpg` (resíduo de vermelho medido; use `hangar-bracerum.jpg`).
  As outras 34 fotos de `assets/web/fotos/` passaram na mesma medição.
- Números: **só os oficiais** listados na §4. Não invente dado, não arredonde, não troque unidade.

## 4. Material

**Fotos** (`assets/web/fotos/`, 1600 px), escolhidas por cena:

| Cena | Arquivos |
|---|---|
| S7, parede de cartões | `galpao-docas`, `aero-patio-jato`, `hotel-cupula-dia`, `resort-lago`, `portaria`, `convencoes-auditorio`, `vias-rotatoria`, `posto-caminhoes`, `park-boulevard-aereo`, `amen-piscina-quincho` |
| S8, masterplan | `assets/web/vista-aerea-park-02.jpg` (2600×1515) |
| S11, mockups | `galpao-docas`, `hangar-bracerum`, `hotel-cupula-dia`, `resort-lago`, `posto-caminhoes` |

**Logos** (SVG, sem texto vivo, prontos para `<img>` ou inline):
- Símbolo solto: `assets/FavIconBranco.svg`, que é **uma grade de triângulos em módulos de 108
  unidades** (viewBox `540.37×216.17`). Inline, cada `<polygon>` vira uma peça animável na S13.
- Assinatura final: `assets/logo/logo-horizontal-cream.svg` (símbolo + BRACERUM PARK + Paraguay 2026).
- Sub-marcas: `assets/logo/{hotel,resort,select}-cream.svg`. O do hotel é visualmente maior dentro
  da caixa: use **~72 %** da altura dos outros dois, a mesma proporção do site
  (`.sublogo--hotel` / `.proj__mark--hotel` em `style.css`).

**Masterplan:** os pinos vêm de `AREAS` em `home.js` (`x`, `y` em % da imagem e `tag` em
`{pt,en,es}`). **Importe o arranjo do arquivo** em vez de redigitar. O pino do site é um losango
de 14 px + rótulo; o losango marca o ponto (deslocamento de meio losango, ver `CLAUDE.md`).

**Números oficiais** (fonte: `index.html`, `tributacao.html`, R04):
`1.819.856 m²` planejados como uma cidade · `1.480 m` de pista (confirmado pelo cliente) ·
`987.304 m²` de parcelas industriais · `1.200` lugares no auditório · `142.067 m²` de Resort ·
`1%` de tributo único sobre o valor agregado, no regime de Maquila · `65 km` de Assunção.

**Textos** (PT é o master; ES e EN ficam prontos no mesmo objeto `COPY`, trocados por `?lang=`):

| Chave | PT | ES | EN |
|---|---|---|---|
| s1 | Bracerum / Park / *cidade industrial* | Bracerum / Park / *ciudad industrial* | Bracerum / Park / *industrial city* |
| s1.meta | Villeta · Paraguay · 2026 | = | = |
| s3 | industrial | industrial | industrial |
| s5 | Onde instalar a sua próxima fábrica? | ¿Dónde instalar su próxima fábrica? | Where will your next plant be? |
| s6, s7 | `tag` de cada item de `AREAS` | idem | idem |
| s8 | O Masterplan (`mp.eyebrow`) | El Masterplan | The Masterplan |
| s9.1 | 1.819.856 m² · planejados como uma *cidade* | 1.819.856 m² · planificados como una *ciudad* | 1,819,856 m² · planned as a *city* |
| s9.2 | 1.480 m · de pista própria | 1.480 m · de pista propia | 1,480 m · private runway |
| s9.3 | 1% · de tributo único, regime de Maquila | 1% · de tributo único, régimen de Maquila | 1% · single tax, Maquila regime |
| s10 | Rodovia. *(PY02 duplicada)* · Hidrovia. *(Atlântico e Pacífico)* · Mercosul. *(Villeta · Paraguai)* | Ruta. *(PY02 duplicada)* · Hidrovía. *(Atlántico y Pacífico)* · Mercosur. *(Villeta · Paraguay)* | Highway. *(PY02 dual carriageway)* · Waterway. *(Atlantic and Pacific)* · Mercosur. *(Villeta · Paraguay)* |
| s11 | Fábricas · 987.304 m² de parcelas industriais / Hangares · heliponto no pátio | Fábricas · 987.304 m² de parcelas industriales / Hangares · helipuerto en el patio | Plants · 987,304 m² of industrial plots / Hangars · helipad on the apron |
| s12 | Um parque. → Uma cidade *inteira*. | Un parque. → Una ciudad *entera*. | A park. → A *whole* city. |
| s14 | Construímos [símbolo] o futuro industrial | Construimos [símbolo] el futuro industrial | Building [símbolo] the industrial future |

Os textos de s9.1, s8 e as tags de `AREAS` já existem no `i18n.js`/`home.js`. Os demais em ES/EN
são tradução desta sessão: **marque-os para conferência do cliente** no LEIA-ME.

## 5. Linha do tempo

**24,000 s · 30 fps · 720 quadros · 1920×1080 · grade de 120 BPM (1 batida = 15 quadros).**
Toda a timeline é escrita em **batidas**, com `const BPM = 120` no topo: se o cliente mandar uma
trilha com outro andamento, basta mudar essa constante e o filme inteiro se reajusta.

| # | Quadros | TC | Batidas | Fundo | Cena |
|---|---|---|---|---|---|
| S1 | 0–59 | 0:00,0 | 4 | paper | Palavra que cresce → composição editorial |
| S2 | 60–89 | 0:02,0 | 2 | misto | Grade 4×4 de variações |
| S3 | 90–119 | 0:03,0 | 2 | sand | "industrial" letra a letra |
| S4 | 120–164 | 0:04,0 | 3 | ink | Losango 3D em órbita, voa para a câmera |
| S5 | 165–209 | 0:05,5 | 3 | ink | Campo de busca + wipe circular |
| S6 | 210–254 | 0:07,0 | 3 | sand | Letreiro dos setores em plano inclinado |
| S7 | 255–299 | 0:08,5 | 3 | paper | Parede de cartões (fotos + rótulos) |
| S8 | 300–344 | 0:10,0 | 3 | foto | Masterplan: pinos acendendo, push-in |
| S9 | 345–434 | 0:11,5 | 6 | paper / ink / sand | Três contadores, 2 batidas cada |
| S10 | 435–479 | 0:14,5 | 3 | sand / ink / paper | Três palavras, 1 batida cada |
| S11 | 480–554 | 0:16,0 | 5 | fotos | Cinco "mockups" com luz, 1 batida cada |
| S12 | 555–599 | 0:18,5 | 3 | ink → sand | "Um parque." → "Uma cidade inteira." |
| S13 | 600–659 | 0:20,0 | 4 | ink | Construção do símbolo |
| S14 | 660–719 | 0:22,0 | 4 | ink | Grade de módulos → tagline → assinatura |

### Detalhe por cena

Coordenadas em px no quadro de 1920×1080. **Coluna de texto a 110 px da borda esquerda** (a mesma
do roteiro de 60 s), exceto tipografia gigante e assinaturas, que são centradas ou sangram de
propósito.

**S1 (0–59).** Fundo paper. "Bracerum" em Noto Serif 500, 28 px, ink, centrada. Q0–4: aparece
(opacity 0→1). Q4–22: escala 1→14 com `expo.in`, e blur horizontal (SVG `feGaussianBlur`
`stdDeviation="X 0"`) proporcional à velocidade, com pico de ~40 px. A palavra atravessa a tela.
**Q22: corte no meio do movimento** para a composição: três linhas em escada à esquerda,
"Bracerum" (190 px) / "Park" (190 px, recuada 260 px) / "*cidade industrial*" (itálico, 190 px,
sangrando pela direita), entrando de baixo com máscara por linha, stagger 3 q, `expo.out` 14 q.
Metadados em Helvetica 18 px: `Villeta · Paraguay · 2026` no canto superior direito, `.01` no
inferior direito e uma seta → a 110 px da direita. Q40–59: deriva de escala 1→1,03.

**S2 (60–89).** A composição da S1 (em miniatura, **o mesmo componente**, não um print) vira uma
célula de uma grade 4×4 com 12 px de gutter. Cada célula troca as cores (ink/paper/sand/brown,
com texto em contraste) e mostra `.01`…`.16`. A câmera começa com a célula original enchendo o
quadro e recua (scale 4→1, `expo.inOut`, 18 q), com o plano inclinado `rotateX(14deg)
rotateZ(-6deg)` em perspectiva de 1600 px. Q78–89: zoom rápido para uma célula sand, que vira o
fundo da S3.

**S3 (90–119).** Fundo sand. "industrial" em Noto Serif itálico 330 px, ink, sangrando embaixo.
Letras entram de baixo (y 120 %→0), stagger 2 q, `back.out(1.2)`, 12 q. **Único overshoot do
filme.** Q108–119: as letras "c" e "l" saltam de novo, desencontradas (como o "c" da referência),
e a palavra sobe para fora.

**S4 (120–164).** Fundo ink. Um **losango 3D** sand (quadrado de 150 px rotacionado 45°, extrudado:
frente, verso e quatro faces laterais de 18 px em CSS 3D, faces laterais em `--brown`) no centro.
Três anéis de órbita finos (1 px, cream a 18 %, pontilhados) inclinados `rotateX(72deg)` e 6
pontos sand de 6–12 px em órbita, com PRNG semeado. Losango gira Y 0→540° (`expo.inOut`). Q150–164:
voa para a câmera (translateZ / escala 1→16) com blur crescente e cobre a tela em sand desfocado.
**Corte seco para ink** no Q165.

**S5 (165–209).** Fundo ink. Campo de busca retangular (canto quadrado), 760×76 px, borda cream a
14 %, centralizado. Texto em Helvetica 24 px cream, digitado a **1 caractere por quadro** com
cursor piscando a cada 8 q: "Onde instalar a sua próxima fábrica?". Botão circular sand de 44 px
à direita, dentro do campo. Q196: o cursor para, a seta → aparece no botão. Q198–209: o círculo
cresce (`expo.in`) até cobrir o quadro inteiro em sand, e a S6 já está atrás.

**S6 (210–254).** Fundo sand. Cinco linhas de letreiro com as `tag` de `AREAS` separadas por
losangos ◆ de 22 px: Noto Serif 120 px, em ink, com a 3ª linha em paper. Direções alternadas,
velocidade de 380 px/s, linear. O plano inteiro inclina `rotateZ(-9deg) rotateX(20deg)` e deriva
80 px para a esquerda. Escala sobe 1→1,08 no fim.

**S7 (255–299).** Fundo paper. **Parede de cartões** em plano 3D (`rotateX(24deg) rotateZ(-10deg)`),
4 linhas × 6 colunas de 340×220 px com gutter de 14 px: 10 fotos da §4 misturadas com 14 cartões
de rótulo (ink, paper com borda ink a 12 %, sand e brown) que trazem um losango de 12 px e uma
`tag` de `AREAS` em Helvetica 20 px. Entram virando (`rotateX(-90→0)`) a partir do centro, stagger
1 q, `expo.out` 16 q. A câmera anda 220 px na diagonal e aproxima 1→1,12. Corte no Q300 com a
câmera ainda andando.

**S8 (300–344).** A planta `vista-aerea-park-02.jpg` preenche o quadro. Os pinos ficam num
contêiner com **a proporção da própria imagem** (é o que mantém cada pino no lugar, ver
`CLAUDE.md`). Push-in 1,06→1,20 (`power2.inOut`) rumo ao centro de massa dos pinos. Q304–326: os
10 pinos acendem em sequência, a cada 2 q: o losango cream com escala 0→1 e o rótulo em Helvetica
16 px revelado por máscara da esquerda. Véu ink no topo esquerdo (degradê, como o
`.masterplan__head` do site) com "O Masterplan" em Helvetica 18 px caixa-alta espaçada.

**S9 (345–434).** Três contadores de **caça-níquel**, 30 q cada, com corte seco entre eles:
`1.819.856 m²` (paper, ink), `1.480 m` (ink, número em sand) e `1%` (sand, ink, 520 px, quase
enchendo o quadro). Número em Helvetica Bold 300 px, `tabular-nums`, alinhado à coluna. Cada
dígito é uma fita vertical 0–9 que rola pelo menos 2 voltas e para. Os dígitos param da direita
para a esquerda, stagger 2 q, `expo.out` 18 q, com blur vertical proporcional à velocidade.
**O dígito de milhar para por último.** Separadores (pontos) e unidade não rolam: a unidade entra
por máscara quando o último dígito assenta. A legenda (Noto Serif 30 px, itálico na ênfase) fica
colada à base do número, à direita, como o "alunos" da referência.

**S10 (435–479).** Três palavras, 15 q cada, corte seco no tempo: "Rodovia." (sand), "Hidrovia."
(ink, texto sand) e "Mercosul." (paper). Noto Serif 220 px. Entram deslizando 60 px da direita com
blur direcional nos 5 primeiros quadros e seguram. Etiqueta miúda acima, em Helvetica 18 px caixa
alta espaçada (ver `s10` na §4).

**S11 (480–554).** Cinco fotos em tela cheia, 15 q cada: galpão → hangar → hotel → resort →
posto. Em cada uma: Ken Burns 1,04→1,10, **faixa de luz** (degradê paper a 14 %, `mix-blend-mode:
soft-light`, 30° de inclinação) que varre da esquerda para a direita, e vinheta ink a 35 %. Hotel,
resort e posto levam o logo cream da sub-marca (`hotel`/`resort`/`select`) a 110 px da esquerda e
90 px da base, sobre o véu inferior. Galpão e hangar levam a legenda `s11` em Helvetica 20 px.
Troca entre fotos: corte seco com um deslocamento de 1 q (a foto nova entra 40 px deslocada e
assenta).

**S12 (555–599).** Q555–574: fundo ink, "Um parque." em Noto Serif 150 px sand, na coluna, entrando
de baixo por máscara. Q575: corte para sand, "Uma cidade *inteira*." em Noto Serif 340 px ink,
maior que o quadro, que desliza de x=+10 % para x=−45 % (`power1.in`) e sai pelo lado.

**S13 (600–659).** Fundo ink. **A construção do símbolo** com os polígonos de
`assets/FavIconBranco.svg` inline, escalados para ~620 px de largura, centralizados. Q600–608:
três pontos sand aparecem em vértices da grade de 108. Q606–618: as linhas da grade de módulos
se desenham (stroke 1 px cream a 12 %, `stroke-dashoffset`). Q616–644: cada triângulo nasce do
vértice do ângulo reto (escala 0→1 a partir desse vértice e rotação −90°→0), stagger 4 q,
`expo.out`, em sand. Q644–650: tudo vira cream e a grade some. Q650–659: o símbolo encolhe para
~34 % e sobe para a posição que terá na S14.

**S14 (660–719).** Q660–670: uma grade de quadrados do tamanho do módulo (60 px) cobre a tela em
ordem aleatória semeada, em paper e sand. Q670–678: some na mesma ordem, deixando ink. Q678–692:
"Construímos" e "o futuro industrial" (Helvetica 26 px, cream, com "industrial" em Noto Serif
itálico) abrem para os lados a partir do símbolo, que está no meio. Q692–700: as palavras recolhem
para dentro do símbolo e ele desliza para a esquerda até a posição exata que tem dentro de
`logo-horizontal-cream.svg`. "BRACERUM PARK" e "Paraguay 2026" entram por máscara da esquerda.
Q700–719: **assinatura parada**, só com deriva 1→1,02. Sem fade para preto: o último quadro é o
logo.

### Gramática de movimento (vale para todas as cenas)

- **Easing:** `expo.out` para entradas, `expo.in` para saídas e `expo.inOut` para movimentos de
  câmera. `linear` só no marquee e na rotação contínua de órbitas. Nada de `bounce`/`elastic`.
- **Corte no tempo:** toda troca de cena, e todo corte interno da S9, S10 e S11, cai em múltiplo
  de 15 quadros. O movimento da cena que sai **não termina** antes do corte.
- **Nenhum quadro parado:** até as pausas têm deriva de escala de 1–3 %.
- **Grão:** camada de ruído monocromático a 4 % de opacidade, gerada por PRNG semeado **por quadro**
  (nunca `Math.random()`). Mata o banding dos degradês no H.264.
- **Mesmos componentes:** o losango da S4, dos pinos da S8, dos separadores da S6 e dos cartões da
  S7 é um componente só. A composição da S1 e as células da S2 também.

## 6. Pipeline técnico

```
docs/motion/
  filme.html      palco 1920×1080 com todas as cenas; carrega vendor/, fonts/, filme.css, filme.js
  filme.css       tokens da §3 em :root, as cenas e as camadas
  filme.js        COPY, BPM, PRNG, uma função por cena que adiciona à timeline mestre
  render.js       captura quadro a quadro → ffmpeg (modo preview e modo final)
  audio.py        sound design sintetizado + cues.csv
  check.py        QA automático (§7)
  vendor/         gsap.min.js + CustomEase/SplitText, se usar (GSAP ≥ 3.13: todos os plugins são gratuitos)
  fonts/          Noto Serif variável (não versionar, ver LEIA-ME)
  out/            saídas (versionar só os MP4 finais)
  LEIA-ME.md
```

**Preparar o container:**
- **ffmpeg não vem instalado.** `pip install imageio-ffmpeg` traz um binário estático (ffmpeg 7);
  o caminho sai de `python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())"`. O
  `ffmpeg-1011` que vem com o Playwright só grava VP8 e **não serve**.
- **Playwright** já está instalado globalmente e o Chromium está em `/opt/pw-browsers`. Carregue com
  `require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')`.
  **Não rode `playwright install`.**
- **GSAP:** `npm pack gsap@3` numa pasta temporária e copie `dist/gsap.min.js` (e os plugins que
  usar) para `vendor/`. O filme **não pode depender de CDN** no momento do render.
- **Fontes:** Noto Serif variável (OFL) e o itálico, pelos mesmos links que
  `docs/build_logos.py` documenta, salvos em `docs/motion/fonts/` e declarados com `@font-face`.
  Liberation Sans já está no sistema.
- **Pillow** (`pip install pillow`) para o `check.py`.
- Sirva a pasta por HTTP (`python3 -m http.server` na raiz do repositório) para os caminhos
  `../../assets/...` e o `import` de `home.js` funcionarem sem problema de CORS. `home.js` depende de
  globais do site: extraia `AREAS` com um regex/eval isolado no `filme.js` em vez de rodar o arquivo.

**Determinismo (é o que separa um render limpo de um render com tremida):**
- Uma timeline mestre `gsap.timeline({ paused: true })` e uma função global
  `window.seek(t)` que faz `TL.seek(t, false)`, redesenha os canvas em função de `t` e resolve depois
  de **dois `requestAnimationFrame`** (garante que o quadro foi pintado antes da captura).
- **Proibido:** transições/animações CSS, `setTimeout`, `Date.now()`, `Math.random()` e qualquer
  coisa que dependa do relógio. O marquee, as órbitas e o cursor piscando são funções de `t`.
- Antes do quadro 0: `await document.fonts.ready`, conferir `document.fonts.check('500 100px "Noto
  Serif"')` e `await img.decode()` em todas as imagens. Se uma fonte não carregar, **pare com erro**
  em vez de renderizar com fallback.
- `viewport 1920×1080`, `deviceScaleFactor: 1`.

**Captura** (em `render.js`): abra uma sessão CDP e, para cada instante, `await page.evaluate(t =>
window.seek(t), t)` e depois `Page.captureScreenshot` com `{format:'jpeg', quality:92,
optimizeForSpeed:true}`, escrevendo o buffer no `stdin` do ffmpeg (`-f image2pipe -c:v mjpeg`).
Nada de PNG em disco: são milhares de quadros.

- **Modo preview:** 1 captura por quadro (720), sem blur de obturador, CRF 23. É o que se usa para
  iterar. ~2 min.
- **Modo final (motion blur real, obturador de 180°):** 4 subquadros por quadro, nos instantes
  `t = f/30 + k/240` (k = 0..3). No ffmpeg: `-framerate 120 -i - -vf
  "tmix=frames=4,select='eq(mod(n\,4)\,3)',setpts=N/(30*TB)" -r 30`. Confira que a saída tem
  **exatamente 720 quadros**: `ffmpeg -i saida.mp4 -map 0:v -f null - 2>&1 | tr '\r' '\n' | grep
  ^frame | tail -1` tem que mostrar `frame=  720` (testado neste container com esse mesmo filtro). São 2.880 capturas: ~10–15 min, então rode em segundo plano e acompanhe.
- **Codificação:** `libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart`, com
  `-color_primaries bt709 -color_trc bt709 -colorspace bt709`.

**Áudio.** **Não baixe música da internet**: trilha é direito autoral, e o site é comercial.
Entregue:
1. `bracerum-motion-24s_mudo.mp4`, o master sem áudio.
2. **Sound design sintetizado** no `audio.py` com ffmpeg `lavfi`: *whoosh* (ruído rosa com
   `bandpass` e fade rápido) em S1-Q22, S2→S3, S4 (voo para a câmera), S5 (wipe) e S12 (a frase
   que desliza); *tick* seco de 8 ms por caractere digitado na S5; *tick* por dígito que assenta na
   S9; *sub hit* (senoide de 48 Hz, decaimento de 250 ms) em cada corte de fundo da S9–S10 e na
   assinatura (Q700); um *riser* de ruído filtrado de Q600 a Q700. Normalize para −14 LUFS
   (`loudnorm`). Mixe no `bracerum-motion-24s.mp4`.
3. `cues.csv` com quadro, TC, cena e tipo de cada evento, para quem for encaixar uma trilha
   licenciada na edição. Como tudo é escrito em batidas, com uma trilha de outro BPM basta mudar
   `BPM` e renderizar de novo.

## 7. QA antes de entregar

Faça nesta ordem e **corrija antes de seguir**. Olhe as imagens de verdade (ferramenta Read), não
só os números.

1. **Folha de contato:** extraia o quadro do meio de cada uma das 14 cenas mais os quadros de
   corte (59/60, 164/165, 344/345, 699/700) e monte um mosaico com o filtro `tile` do ffmpeg.
   Olhe o mosaico. Cada cena tem que se explicar sozinha num quadro parado.
2. **Zero vermelho** (`check.py`): em 1 a cada 3 quadros, conte os pixels com matiz < 12° ou > 340°,
   saturação > 0,55 e valor > 0,35. Acima de 0,05 % do quadro, o quadro reprova e o script aponta a
   cena.
3. **Legibilidade:** nenhum texto com menos de 18 px a 1080p. Todo texto (exceto a S10 e a S11)
   fica legível e parado por ≥ 12 quadros. Contraste ≥ 4,5:1 nos textos pequenos (sand sobre ink
   passa, sand sobre paper **não passa**: não use).
4. **Área segura:** 96 px nas laterais e 54 px em cima/embaixo para texto pequeno e logos. Só a
   tipografia gigante da S1, S3, S9-`1%` e S12 pode sangrar, de propósito.
5. **Pinos no lugar:** compare um quadro da S8 com o site renderizado (`index.html#masterplan` no
   Playwright). Cada losango tem que cair no mesmo ponto da planta.
6. **Ritmo:** extraia o filme a 6 fps num mosaico por cena (como uma folha de animatic) e confira
   que nenhum trecho de 15 quadros está parado e que todo corte acontece com movimento em curso.
7. **Técnico:** 720 quadros, 30 fps, 1920×1080, yuv420p, sem quadro preto no início ou no fim, e
   áudio com exatamente 24,000 s.

## 8. Entregáveis e commit

1. O código de `docs/motion/` (§6), renderizável do zero pelo LEIA-ME.
2. `docs/motion/out/bracerum-motion-24s.mp4` (com sound design), `..._mudo.mp4`, `cues.csv` e
   `contato.jpg` (a folha de contato do QA).
3. `docs/motion/LEIA-ME.md`: como preparar o container, como renderizar preview e final, como gerar
   ES/EN (`?lang=es`), como trocar a trilha (BPM), **a lista de textos ES/EN a conferir com o
   cliente** e as decisões tomadas fora deste comando.
4. Um parágrafo em `CLAUDE.md` registrando o filme, onde mora e o que não pode mudar sem rever o
   restante (a grade de 120 BPM e a coluna de 110 px).
5. Mande o preview para o usuário (SendUserFile) assim que a primeira versão completa renderizar,
   e continue iterando sem esperar resposta. No fim, mande o final.

`docs/motion/.gitignore` ignora `fonts/`, subquadros e intermediários. Versione os MP4 finais só se
cada um tiver **menos de 20 MB**. Se passar, versione o preview em CRF 26 e diga isso no LEIA-ME.
Commit em português, no mesmo estilo dos anteriores (`docs(motion): …`), no branch da sessão.

## 9. Depois do master aprovado (opcional, só se sobrar tempo)

- **ES e EN:** renderize `?lang=es` e `?lang=en`. O público do parque fala espanhol e português,
  então o ES vem antes do EN.
- **9:16 para Reels/Stories:** não é reenquadrar o 16:9. É o master **dentro de um monitor em
  perspectiva** (moldura ink de 14 px, `rotateY(-16deg) rotateX(4deg)`), sobre fundo brown escuro
  com luz quente lateral, a 1080×1920. Ainda mais convincente: exibir o master num monitor de verdade
  e filmar com o celular, como na referência.

## 10. O que reprova a entrega

- Qualquer quadro com vermelho, azul gráfico ou canto arredondado (fora o botão da S5).
- Número que não esteja na §4.
- Mais de 15 quadros seguidos sem movimento.
- Timeline que dependa do relógio (dois renders seguidos têm que sair **idênticos**: compare o hash
  MD5 de um quadro qualquer entre duas capturas).
- Afirmar que renderizou sem ter olhado a folha de contato.
