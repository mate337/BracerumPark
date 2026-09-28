# Filme de motion design do Bracerum Park — como foi feito e como refazer

Filme de marca de **48 s** feito **inteiramente em código**: HTML + CSS + GSAP, com uma timeline
única pausada que o `render.js` posiciona quadro a quadro no Chromium headless (Playwright) e entrega
ao ffmpeg. Comando de origem: [`PROMPT-MOTION-24S.md`](PROMPT-MOTION-24S.md). Ele pedia 24 s; a
**v2 (48 s)** saiu do retorno do cliente, ver abaixo.

## v2 — o que mudou e por quê

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
- **Masterplan:** de 1,5 s para ~7 s, com o título do próprio site ("1.819.856 m² planejados como uma
  cidade"), os 10 pinos acendendo um a um e o anel de cada pino pulsando como no site.
- **Fotos do meio:** de 0,5 s para 2 s cada. Entram por cortina com uma linha de areia na borda, e a
  legenda vem do texto das áreas no site (`AREAS` em `home.js`).
- **Leitura:** título de abertura, pergunta, contadores (1,5 s cada), palavras (1 s cada), frase final e
  tagline (~1,5 s) ganharam pausa. Toda pausa tem uma deriva lenta de câmera.
- **Dado divergente fora do filme.** O R04 (`CLAUDE.md`) registra **987.304 m² de parcelas
  industriais**; o site mostra **989.642 m² de lotes** (`AREAS`, "Lotes industriais"). Até o cliente
  conciliar os dois, nenhum entra no filme. O primeiro contador passou a ser **1.200 lugares no
  auditório** (dado do site).

## Linha do tempo (v2)

Grade de **120 BPM** (1 batida = 15 quadros a 30 fps). Início de cada cena em `CUT`, no topo do `filme.js`.

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

## Entregas em `out/`

| Arquivo | O que é | Versionado |
|---|---|---|
| `bracerum-motion-48s.mp4` | master 1920×1080, 30 fps, H.264, com sound design, −14 LUFS | não (ver abaixo) |
| `bracerum-motion-48s_mudo.mp4` | o mesmo master sem áudio, para montar com trilha licenciada | não |
| `bracerum-motion-48s-720p.mp4` | versão leve com som, para enviar e revisar | sim |
| `cues.csv` | eventos de corte e de som (quadro, TC, cena, tipo) | sim |
| `contato.jpg` | folha de contato do QA: meio de cada cena e os quadros de corte | sim |

Os masters em 1080p passam de 20 MB por causa do grão (ruído que muda a cada quadro custa caro ao
H.264), então não vão para o git. Regenere com os comandos abaixo, em ~16 min.

## Arquivos

```
filme.html   palco 1920×1080 (abra com ?t=12.5 para ver um instante; ?lang=es|en)
filme.css    tokens do site, zero vermelho, cantos quadrados
filme.js     COPY (pt/es/en), CUT (linha do tempo), as cenas, os ganchos e os cues de som
render.js    stills | preview | final | cues | pins | safe
audio.py     sound design só com ffmpeg lavfi, a partir do cues.csv
check.py     QA do vídeo (duração, quadros, vermelho, trechos parados, determinismo, folha de contato)
vendor/      gsap.min.js 3.15 (todos os plugins do GSAP são gratuitos desde a 3.13)
fonts/       Noto Serif variável — não versionada, baixar como abaixo
```

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
(`--port=` para rodar dois ao mesmo tempo) e grava `out/filme.json` com a duração e as cenas, que o
`check.py` e o `audio.py` leem.

```bash
node docs/motion/render.js preview                 # ~3,5 min · out/preview.mp4, para iterar
node docs/motion/render.js stills --frames=0,22,150-240:15 --tag=teste   # quadros avulsos em out/stills/teste/
node docs/motion/render.js final                   # ~14 min · out/bracerum-motion-48s_mudo.mp4
node docs/motion/render.js cues                    # out/cues.csv
python3 docs/motion/audio.py                       # out/audio.wav + mux → out/bracerum-motion-48s.mp4
```

**Motion blur de verdade:** o modo `final` captura 4 subquadros por quadro, espaçados em 1/240 s
(obturador de 180°), e o ffmpeg tira a média (`tmix`) e fica com um a cada quatro. Os movimentos mais
rápidos (a palavra que estoura na abertura, os dígitos dos contadores, a entrada das palavras) levam
também blur direcional em SVG, proporcional à velocidade.

**Espanhol e inglês:** `--lang=es` / `--lang=en` em `preview`, `final`, `cues`, `safe`, no `audio.py` e
no `check.py`. As saídas ganham o sufixo `-es` / `-en`.

## QA

```bash
python3 docs/motion/check.py docs/motion/out/bracerum-motion-48s.mp4 --det   # vídeo + determinismo
python3 docs/motion/check.py docs/motion/out/bracerum-motion-48s.mp4 --sheet docs/motion/out/contato.jpg
node docs/motion/render.js pins                     # losangos do filme × pinos do site
node docs/motion/render.js safe [--lang=es]         # texto pequeno e logos na área segura
```

- `check.py` reprova se o vídeo não tiver os quadros e a duração do filme, 1920×1080, 30 fps e
  yuv420p. Também reprova se algum quadro (1 a cada 3) passar de 0,05 % de pixels vermelhos, se o
  primeiro ou o último quadro for preto, ou se houver 15 quadros seguidos sem movimento (exceto a
  assinatura final). "Parado" é medido a 64×36: nenhum bloco de 30×30 px mudando mais de 2,5 níveis.
  Uma comparação direta seria enganada pelo grão, que muda a cada quadro.
- `--det` renderiza três quadros em duas sessões separadas do Chromium e compara o MD5. Tem que dar
  idêntico: é o que garante que nada no filme depende do relógio.
- `pins` compara o centro de cada losango do masterplan com o do site (`index.html#masterplan`), em
  % da planta. Resultado atual: desvio máximo de 0,001 %.

## Trocar a trilha

A timeline inteira é escrita em batidas de **120 BPM** (`const BPM` no topo do `filme.js`). Com uma
trilha licenciada de outro andamento: mude `BPM`, rode `final` e `cues`, e monte a música sobre o
`_mudo.mp4` usando o `cues.csv` como mapa dos cortes. **Não use música baixada da internet**: o site é
comercial.

O sound design sintetizado tem cinco camadas, todas lidas do `cues.csv`:
- **whoosh:** no pico dos cortes com movimento e em cada cortina das fotos;
- **tick:** cada caractere digitado, cada pino que acende, cada dígito que assenta;
- **hit grave:** cada contador, cada palavra, a frase e a assinatura;
- **riser:** na construção do símbolo, terminando 0,3 s antes do hit final;
- **pulso:** suave, na grade de 120 BPM até o símbolo.

Para usar só os efeitos, sem o pulso, filtre as linhas `pulso` do `cues.csv` antes de rodar o
`audio.py`.

## Textos em espanhol e inglês — conferir com o cliente

Já existiam no site e foram reaproveitados: o título do masterplan (`mp.title`), `mp.eyebrow`, as
`tag` e os `val` de `AREAS` (`home.js`) e "1.200 lugares no auditório" (`ph.s1v/s1k`). **Traduzidos
nesta sessão, a conferir:**

| PT | ES | EN |
|---|---|---|
| cidade industrial | ciudad industrial | industrial city |
| Onde instalar a sua próxima fábrica? | ¿Dónde instalar su próxima fábrica? | Where will your next plant be? |
| de pista própria | de pista propia | private runway |
| de tributo único, regime de Maquila | de tributo único, régimen de Maquila | single tax, Maquila regime |
| Rodovia. · PY02 duplicada | Ruta. · PY02 duplicada | Highway. · PY02 dual carriageway |
| Hidrovia. · Atlântico e Pacífico | Hidrovía. · Atlántico y Pacífico | Waterway. · Atlantic and Pacific |
| Mercosul. · Villeta · Paraguai | Mercosur. · Villeta · Paraguay | Mercosur. · Villeta · Paraguay |
| Auditório · 1.200 lugares | Auditorio · 1.200 lugares | Auditorium · 1,200 seats |
| Um parque. / Uma cidade inteira. | Un parque. / Una ciudad entera. | A park. / A whole city. |
| Construímos o futuro industrial | Construimos el futuro industrial | Building the industrial future |

O "Construimos el futuro Industrial" do ES é a tagline do próprio logo (`logo-tagline-*.svg`).

## Decisões tomadas fora do comando

Além da v2 (acima):

- **Formas:** partículas, pontos e separadores são **losangos e quadrados**, nunca círculos. A regra
  dos cantos quadrados só abre exceção para o botão da pergunta, que vira a revelação circular.
- **Pergunta:** campo de 1040×100 px com texto de 34 px, para ler no celular.
- **Letreiro:** 12 linhas, para o plano inclinado cobrir os cantos do quadro.
- **Assinatura:** 1000 px de largura, o tamanho em que o "Paraguay 2026" do próprio logo fica com
  ~20 px. A construção usa as peças do logo horizontal, então o símbolo construído **é** o da
  assinatura, sem troca.
- **Sound design:** o pulso de 120 BPM foi acrescentado, para os cortes terem chão rítmico sem música.
- **Render:** os modos `stills`, `pins` e `safe` foram acrescentados ao `render.js`. O critério de
  "parado" do `check.py` foi redefinido (ver QA).

## Limites conhecidos

- Os descritores miúdos dentro dos selos do Resort e do Select ("Refugio residencial de alto
  estándar" etc.) ficam com menos de 18 px. Fazem parte do lockup do cliente e não foram redesenhados.
- O áudio foi conferido por medição (loudness por camada, forma de onda e espectrograma alinhados aos
  cues), **não por escuta**. Vale ouvir antes de publicar.
- A versão 9:16 "no monitor" (§9 do comando) não foi feita.
