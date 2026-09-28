# Filmes de motion design do Bracerum Park — como foram feitos e como refazer

Dois filmes de marca feitos **inteiramente em código**: HTML + CSS + GSAP, com uma timeline única
pausada que o `render.js` posiciona quadro a quadro no Chromium headless (Playwright) e entrega ao
ffmpeg. Os dois dividem o mesmo motor (`motor.js`) e cada um mora num módulo em `filmes/`:

| Filme | Duração | Módulo | O que é |
|---|---|---|---|
| **park-67s** | 67 s | `filmes/park-67s.js` + `.css` | rápido, no ritmo do primeiro preview, sobre o roteiro do cliente (2026-09-28) |
| **motion-48s** | 48 s | `filmes/motion-48s.js` | a v2: abertura com o parque real, mapa e fotos por mais tempo |

Qual filme renderizar vem de `--filme=` (padrão `motion-48s`). Comando de origem da série:
[`PROMPT-MOTION-24S.md`](PROMPT-MOTION-24S.md), que pedia 24 s. A v1 de 24 s não foi versionada;
a v2 e o park-67s saíram do retorno do cliente.

---

## park-67s — o filme rápido do roteiro do cliente

Base: o primeiro preview (v1, 24 s), mais duas referências de motion enviadas pelo cliente e três
imagens de referência. As referências:
- um showreel de interface (cursor clicando, telas, cortes rápidos);
- o filme do Studio DADO (editorial, lista com destaque);
- as três imagens: carrossel de ícones com o do centro em preto e os vizinhos esmaecidos, e medidor
  em meia-lua sobre fundo preto.

Nasceu com 52 s, com o nome `park-52s`. Na **revisão do cliente** (mesmo dia):
- **números novos** com +1 s de tela cada;
- **fotos por ambiente mais devagar**, com o som das transições 60 % mais baixo;
- **10 tópicos** no carrossel.

Com isso foi para **67 s** e mudou de nome.

| # | Cena | Quadros | Tempo | Roteiro do cliente → o que o filme faz |
|---|---|---|---|---|
| s1 | Bracerum Park | 0–74 | 0:00 | "Bracerum" cresce, estoura e vira a composição **Bracerum / Park** |
| s2 | subtítulo | 75–149 | 0:02,5 | **Cidade *industrial* em Villeta, [PY]** — letras saltando, selo PY |
| s3 | telas | 150–239 | 0:05 | *zoom out em várias telas do parque*: 15 janelas com fotos reais + a do símbolo |
| s4 | símbolo 3D | 240–314 | 0:08 | *elemento do preview com o ícone do logo no meio*: os 6 triângulos extrudados, girando entre órbitas, voam para a câmera |
| s5 | busca | 315–404 | 0:10,5 | **"A melhor localização do PY para sua nova fábrica"** digitada; o cursor clica e o botão abre a tela |
| s6 | letreiros | 405–479 | 0:13,5 | atributos do parque passando em plano inclinado |
| s7 | pranchetas | 480–569 | 0:16 | parede de fotos, **pranchas técnicas** (corte viário, infográfico das vias, estudo de clima, implantação do resort) e rótulos |
| s8 | masterplan | 570–704 | 0:19 | planta com os 10 pontos de interesse; título "Planejado como uma *cidade*" |
| s9 | números | 705–1004 | 0:23,5 | **1.820.000 m²** de área total · **1.480 m** de pista com **8 hangares** · **142.000 m²** no Bracerum Resort · **802.640 m²** de área industrial — 2,5 s cada |
| s10 | ambientes | 1005–1424 | 0:33,5 | 3 fotos por ambiente (~1,2 s cada), **selo à esquerda, título à direita**: Park (lotes + hangares), Hotel + Centro de convenções, Resort (condomínio + clubhouse), Select (shopping, market e posto) |
| s11 | frase | 1425–1499 | 0:47,5 | **"A cidade pronta para o *futuro* da sua indústria"** |
| s12 | ícones | 1500–1724 | 0:50 | **"Tudo que você precisa em um só lugar"**: hotel → condomínio de casas → centro de convenções → creche → ambulatório → pista de pouso → hangares → academia → shopping → lazer |
| s13 | Brasil × Paraguai | 1725–1844 | 0:57,5 | fundo preto, dois medidores em meia-lua: **"Sua indústria lucrando ainda mais"** |
| s14 | consultores | 1845–1904 | 1:01,5 | **"Fale com um de nossos consultores"** + botão "Fale conosco" clicado pelo cursor |
| s15 | assinatura | 1905–2009 | 1:03,5 | construção do símbolo, grade de quadrados, Bracerum Park |

**Dados:**
- **Os quatro números da s9 foram definidos pelo cliente para o filme (2026-09-28):** 1.820.000 m²,
  1.480 m de pista com 8 hangares, 142.000 m² no Bracerum Resort e 802.640 m² de área industrial.
  Eles substituem, no filme, os do R04 e os do site. **O site ainda mostra outros números:**
  1.819.856 m² (`mp.title`), 142.067 m² (`pr.s1v`) e 989.642 m² de lotes (`AREAS`). A pista não cita
  os 8 hangares. Alinhar o site depende do ok do cliente.
- **Medidores:** comparativo "Brasil × Paraguai" de `tributacao.html` (`tp.b2`/`tp.b3`). A carga
  tributária é 33 % do PIB no Brasil e 10 % no Paraguai; os encargos sobre a folha são 75 % contra
  33 %. A nota "1% de tributo único no regime de Maquila" vem da mesma página. O rosa da imagem de
  referência virou bege (zero vermelho).
- **Legendas das fotos, letreiros e rótulos:** `AREAS` (`home.js`), `tributacao.html` e os fatos de
  Villeta (`index.html`). Os 10 tópicos do carrossel são a lista do cliente.

**Decisões deste filme:**
- **Símbolo em 3D:** extrudado por 22 camadas de SVG a 1,3 px, porque CSS não faz sólido de
  triângulo. A câmera das telas pousa nele no último quadro, então o corte para o 3D não tem salto.
- **Título do mapa sem número:** com o 1.820.000 m² no contador logo depois, repetir o número no
  mapa ficava redundante.
- **Ícones desenhados no traço do filme:** 8 px, pontas quadradas, sem curvas. Os 6 novos são centro
  de convenções (tela no tripé), creche (blocos com o losango do site), ambulatório (cruz), hangares,
  academia (halter) e lazer (guarda-sol).
- **Consultores sem dados pessoais:** o rodapé do site tem dois consultores com telefone e e-mail. O
  filme usa só o botão "Fale conosco". Para pôr os contatos na tela, é um ajuste na cena s14.
- `select-shopping-lago.jpg` ficou de fora (letreiro laranja acusa vermelho) e
  `select-market-interior.jpg` também (0,05 % de vermelho, no limite do QA).

---

## motion-48s — a v2

Retorno sobre a v1 (24 s): *"deixar a primeira parte mais autêntica; as imagens podem aparecer por mais
tempo, o mapa do parque também; as imagens do meio com mais respiro entre elas, mais tempo de tela; as
frases iniciais também precisam de tempo para leitura."*

- **Abertura autêntica.** A v1 abria com gestos copiados da referência (grade de cartões com o título,
  letras de "industrial" saltando, losango 3D girando), sem nenhuma imagem do parque. A v2 abre com o
  **Park de verdade**:
  1. a palavra "Bracerum" cresce e estoura na vista aérea real (`park-aereo-rio.jpg`);
  2. o título fica ~3 s em tela;
  3. a câmera recua para um **mosaico de 16 lugares do parque** e mergulha no losango do pino;
  4. vem a pergunta "Onde instalar a sua próxima fábrica?";
  5. o botão da pergunta **abre em círculo e revela o masterplan** — o mapa é a resposta.
- **Masterplan:** de 1,5 s para ~7 s, com o título do site e os 10 pinos acendendo um a um.
- **Fotos do meio:** de 0,5 s para 2 s cada, por cortina com a linha de areia; legenda vinda de `AREAS`.
- **Leitura:** título, pergunta, contadores, palavras, frase e tagline com pausa e deriva lenta.

| Cena | Quadros | Tempo | O que acontece |
|---|---|---|---|
| s1 abertura | 0–149 | 0:00–0:05 | "Bracerum" estoura na vista aérea; título Bracerum / Park / *cidade industrial* |
| s2 mosaico | 150–239 | 0:05–0:08 | recua para 16 fotos do parque; mergulha no losango |
| s3 pergunta | 240–329 | 0:08–0:11 | "Onde instalar a sua próxima fábrica?" digitada |
| s4 masterplan | 302–509 | 0:10–0:17 | aberto de dentro do botão; título do site, 10 pinos |
| s5 letreiro | 510–569 | 0:17–0:19 | nomes das áreas em plano inclinado |
| s6 parede | 570–659 | 0:19–0:22 | 24 cartões (fotos e rótulos) virando em perspectiva |
| s7 contadores | 660–794 | 0:22–0:26,5 | 1.200 lugares · 1.480 m de pista · 1% de tributo |
| s8 palavras | 795–884 | 0:26,5–0:29,5 | Rodovia. · Hidrovia. · Mercosul. |
| s9 fotos | 885–1184 | 0:29,5–0:39,5 | fábrica, hangar, hotel, resort, posto — 2 s cada |
| s10 frase | 1185–1259 | 0:39,5–0:42 | "Um parque." → "Uma cidade *inteira*." |
| s11 símbolo | 1260–1439 | 0:42–0:48 | construção do símbolo, quadrados, tagline, assinatura |

---

## Nos dois filmes

- **Dado divergente fora dos filmes.** O R04 (`CLAUDE.md`) registra **987.304 m² de parcelas
  industriais** e o site mostra **989.642 m² de lotes** (`AREAS`, "Lotes industriais"). Nenhum dos dois
  entra até o cliente conciliar.
- **Formas:** partículas, pontos e separadores são **losangos e quadrados**. A exceção à regra dos
  cantos quadrados é o botão circular da busca/pergunta, que vira a revelação circular.
- **Assinatura:** 1000 px de largura, o tamanho em que o "Paraguay 2026" do próprio logo fica com
  ~20 px. A construção usa as peças do logo horizontal, então o símbolo construído **é** o da assinatura.

## Entregas em `out/`

| Arquivo | O que é | Versionado |
|---|---|---|
| `bracerum-<filme>.mp4` | master 1920×1080, 30 fps, H.264, com sound design, −14 LUFS | não (grão: 80+ MB) |
| `bracerum-<filme>_mudo.mp4` | o mesmo master sem áudio, para montar com trilha licenciada | não |
| `bracerum-<filme>-720p.mp4` | versão leve com som, para enviar e revisar | sim |
| `cues-<filme>.csv` | eventos de corte e de som (quadro, TC, cena, tipo) | sim |
| `contato-<filme>.jpg` | folha de contato do QA: meio de cada cena e os quadros de corte | sim |

## Arquivos

```
filme.html          palco 1920×1080 (filme.html?filme=park-67s&t=12.5 para ver um instante; &lang=es|en)
filme.css           tokens do site e componentes comuns (composição, pinos, contadores, letreiro, parede…)
motor.js            tempo em batidas, timeline, ganchos, blur direcional, grão, boot; carrega filmes/<id>.js
filmes/<id>.js      COPY (pt/es/en), CUT (linha do tempo), as cenas, os cues e a lista de QA do filme
filmes/park-67s.css CSS próprio do filme rápido
render.js           stills | preview | final | cues | pins | safe  (todos com --filme=)
audio.py            sound design só com ffmpeg lavfi, a partir do cues-<filme>.csv
check.py            QA do vídeo (duração, quadros, vermelho, trechos parados, determinismo, folha de contato)
vendor/             gsap.min.js 3.15 (todos os plugins do GSAP são gratuitos desde a 3.13)
fonts/              Noto Serif variável — não versionada, baixar como abaixo
```

A separação do motor foi conferida: a v2 renderiza **idêntica byte a byte** antes e depois (MD5 de
quatro quadros).

## Preparar o container

```bash
pip install imageio-ffmpeg pillow numpy        # ffmpeg estático (o container não traz ffmpeg)
mkdir -p docs/motion/fonts
curl -L -o docs/motion/fonts/NotoSerif-VF.ttf \
  'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif%5Bwdth%2Cwght%5D.ttf'
curl -L -o docs/motion/fonts/NotoSerif-Italic-VF.ttf \
  'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-Italic%5Bwdth%2Cwght%5D.ttf'
```

O Playwright já vem instalado globalmente com o Chromium em `/opt/pw-browsers`: **não rode
`playwright install`**. O `ffmpeg-1011` que vem com ele só grava VP8 e não serve. A Helvetica é
substituída pela Liberation Sans do sistema, que tem as mesmas métricas. Se a Noto Serif não
carregar, o filme **para com erro** em vez de renderizar com fonte de reserva.

## Renderizar

Tudo a partir da raiz do repositório. O `render.js` sobe o próprio servidor HTTP na porta 8765
(`--port=` para rodar dois ao mesmo tempo) e grava `out/filme-<filme>.json` com a duração e as cenas,
que o `check.py` e o `audio.py` leem.

```bash
F=--filme=park-67s
node docs/motion/render.js preview $F              # ~5 min · out/preview-park-67s.mp4, para iterar
node docs/motion/render.js stills $F --frames=0,22,150-240:15 --tag=teste   # quadros avulsos em out/stills/teste/
node docs/motion/render.js final $F                # ~20 min · out/bracerum-park-67s_mudo.mp4
node docs/motion/render.js cues $F                 # out/cues-park-67s.csv
python3 docs/motion/audio.py $F                    # out/audio-park-67s.wav + mux → out/bracerum-park-67s.mp4
```

**Motion blur de verdade:** o modo `final` captura 4 subquadros por quadro, espaçados em 1/240 s
(obturador de 180°), e o ffmpeg tira a média (`tmix`) e fica com um a cada quatro. Os movimentos mais
rápidos levam também blur direcional em SVG, proporcional à velocidade.

**Espanhol e inglês:** `--lang=es` / `--lang=en` em todos os modos, no `audio.py` e no `check.py`. As
saídas ganham o sufixo `-es` / `-en`.

## QA

```bash
python3 docs/motion/check.py docs/motion/out/bracerum-park-67s.mp4 --filme=park-67s --det
python3 docs/motion/check.py docs/motion/out/bracerum-park-67s.mp4 --filme=park-67s --sheet docs/motion/out/contato-park-67s.jpg
node docs/motion/render.js pins --filme=park-67s     # losangos do filme × pinos do site
node docs/motion/render.js safe --filme=park-67s     # texto pequeno e logos na área segura (lista em cada filme)
```

- `check.py` reprova se o vídeo não tiver os quadros e a duração do filme, 1920×1080, 30 fps e
  yuv420p. Também reprova se algum quadro (1 a cada 3) passar de 0,05 % de pixels vermelhos, se o
  primeiro ou o último quadro for preto, ou se houver 15 quadros seguidos sem movimento (exceto a
  assinatura final). "Parado" é medido a 64×36: nenhum bloco de 30×30 px mudando mais de 2,5 níveis.
  Uma comparação direta seria enganada pelo grão, que muda a cada quadro.
- `--det` renderiza três quadros em duas sessões separadas do Chromium e compara o MD5. Tem que dar
  idêntico: é o que garante que nada no filme depende do relógio.
- `pins` compara o centro de cada losango do masterplan com o do site (`index.html#masterplan`), em
  % da planta. Nos dois filmes: desvio máximo de 0,001 %.

## Trocar a trilha

As timelines são escritas em batidas de **120 BPM** (`const BPM` no topo do `motor.js`). Com uma
trilha licenciada de outro andamento: mude `BPM`, rode `final` e `cues`, e monte a música sobre o
`_mudo.mp4` usando o `cues-<filme>.csv` como mapa dos cortes. **Não use música baixada da
internet**: o site é comercial.

O sound design sintetizado tem cinco camadas, todas lidas do `cues-<filme>.csv`:
- **whoosh:** no pico dos cortes com movimento e em cada cortina das fotos;
- **tick:** cada caractere digitado, cada pino que acende, cada dígito que assenta, cada clique e
  cada passo do carrossel;
- **hit grave:** contadores, palavras, frases e a assinatura;
- **riser:** na construção do símbolo, terminando 0,3 s antes do hit final;
- **pulso:** suave, na grade de 120 BPM até o símbolo.

Para usar só os efeitos, sem o pulso, filtre as linhas `pulso` do csv antes de rodar o `audio.py`.

## Textos em espanhol e inglês — conferir com o cliente

Já existiam no site e foram reaproveitados:
- `mp.title` e `mp.eyebrow`;
- as `tag` e os `val` de `AREAS`;
- `ph.s1v/s1k` e `pr.s1k`;
- `tp.b2`/`tp.b3` e `nav.cta`.

**Traduzidos nesta sessão, a conferir:**

| PT | ES | EN |
|---|---|---|
| Cidade industrial em Villeta, PY | Ciudad industrial en Villeta, PY | Industrial city in Villeta, PY |
| A melhor localização do PY para sua nova fábrica | La mejor ubicación de PY para su nueva fábrica | The best location in PY for your new plant |
| Onde instalar a sua próxima fábrica? | ¿Dónde instalar su próxima fábrica? | Where will your next plant be? |
| de pista própria | de pista propia | private runway / private airstrip |
| Lotes industriais + hangares | Lotes industriales + hangares | Industrial lots + hangars |
| Hotel + Centro de convenções | Hotel + Centro de convenciones | Hotel + Convention centre |
| Condomínio fechado + clubhouse | Condominio cerrado + clubhouse | Gated community + clubhouse |
| Shopping, market e posto | Shopping, market y estación | Shopping, market and fuel |
| A cidade pronta para o futuro da sua indústria | La ciudad lista para el futuro de su industria | The city ready for the future of your industry |
| Tudo que você precisa em um só lugar | Todo lo que necesita en un solo lugar | Everything you need in one place |
| Condomínio de casas / Pista de pouso | Condominio de casas / Pista de aterrizaje | Gated homes / Airstrip |
| Sua indústria lucrando ainda mais | Su industria ganando todavía más | Your industry earning even more |
| Fale com um de nossos consultores | Hable con uno de nuestros consultores | Talk to one of our consultants |
| de tributo único, regime de Maquila | de tributo único, régimen de Maquila | single tax, Maquila regime |
| Rodovia. · Hidrovia. · Mercosul. | Ruta. · Hidrovía. · Mercosur. | Highway. · Waterway. · Mercosur. |
| Um parque. / Uma cidade inteira. | Un parque. / Una ciudad entera. | A park. / A whole city. |
| Construímos o futuro industrial | Construimos el futuro industrial | Building the industrial future |

O "Construimos el futuro Industrial" do ES é a tagline do próprio logo (`logo-tagline-*.svg`).

## Limites conhecidos

- Os descritores miúdos dentro dos selos do Resort e do Select ("Refugio residencial de alto
  estándar" etc.) ficam com menos de 18 px. Fazem parte do lockup do cliente e não foram redesenhados.
- O áudio foi conferido por medição (loudness por camada, forma de onda e espectrograma alinhados aos
  cues), **não por escuta**. Vale ouvir antes de publicar.
- A versão 9:16 "no monitor" (§9 do comando) não foi feita.
