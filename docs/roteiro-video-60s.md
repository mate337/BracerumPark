# Bracerum Park — Roteiro de vídeo institucional (60s)

**Versão:** v5 — 2026-09-16 · tratamento cinematográfico, 6 takes
**Duração:** 0:60 exatos · **Master:** 1920×1080, 30 fps
**Comando de execução no After Effects:** `docs/ae/PROMPT-ASTRA-AE.md`

## O que mudou da v4 para a v5

A v4 tinha 28 planos curtos — ritmo de apresentação, não de filme. A v5 troca isso por **poucos
planos longos, tipografia grande e transições desenhadas**. São **6 takes 3D** (um deles usado duas
vezes), e o que preenche o tempo entre eles é motion design, não mais imagem.

**Os 6 takes, e só eles:**

| ID | Take | Onde aparece |
|---|---|---|
| **A** | Aérea drone do parque | abertura (0:03) e fecho (0:55) |
| **B** | Vista 90º / planta | 0:09, e é dele que nasce o mapa |
| **F** | Pista de pouso | 0:24 |
| **C** | Hotel | 0:31 |
| **D** | Centro de convenções | 0:36 |
| **E** | Resort | 0:41 |

**Bracerum Select não tem take** — é resolvido com o logo e tipografia cinética. Os blocos de apoio
(enfermaria, creche, bombeiros) saíram do filme de 60 s: sem take e sem projeto, eram 7 segundos de
nada. Voltam numa versão longa.

## Gramática de transição

Quatro transições, cada uma com função — **nenhuma entra "porque ficou bonito"**:

- **Match cut** — corta no meio do mesmo movimento. Liga a aérea à vista 90º (0:09) e o fecho de
  volta à aérea (0:55). É a transição que sustenta o filme.
- **Masking / reveal** — o logo do sub-projeto abre e revela o take atrás dele (0:30, 0:40, 0:46).
  É o que dá identidade aos capítulos.
- **Gradient wipe** — máscara de degradê desfocado. Troca de bloco quando não há movimento em comum
  (0:03, 0:36, 0:50).
- **Glitch** — **uma vez só**, em 0:23, na virada da chamada para a pista. A referência Spider-Verse
  é enérgica e o público aqui é investidor industrial: usada uma vez, é acento; usada a cada corte,
  o filme vira peça de varejo. Se o cliente pedir mais, o segundo lugar é 0:50.

## Linha do tempo

| IN | Dur | Conteúdo | Tipografia / motion | Saída |
|---|---|---|---|---|
| 0:00 | 3s | **Abertura.** Fundo `--ink`. Logo **Bracerum Park** revelado por máscara vertical, letra por letra. Nada mais em quadro. | logo `logo-stacked-wide-cream` | gradient wipe |
| 0:03 | 6s | **TAKE A — aérea drone.** O plano mais longo do filme; deixa respirar. | **1.819.856 m²** entra gigante (~420 px de altura), preenchendo a tela, revelado por máscara de degradê que acompanha o movimento da câmera. Embaixo, miúdo: *planejados como uma cidade industrial completa* | **match cut** |
| 0:09 | 3s | **TAKE B — vista 90º.** A câmera continua subindo; a aérea vira planta. O corte acontece **no meio do movimento**, não no fim. | — | contínuo |
| 0:12 | 8s | **MAPA — zoom out estilo Google Earth.** Segue subindo da planta até o continente. Três rotas se traçam em sequência, cada uma com contador de km subindo junto com a linha. | `ASSUNÇÃO · 65 km · 1 h 10` → `FRONTEIRA BR · 360 km · 5 h` → `SÃO PAULO · 1.130 km · ~2 h de voo` | corte |
| 0:20 | 3s | **CHAMADA.** Sobre o mapa já recuado, escurecido. | **A SUA CIDADE INDUSTRIAL NO PARAGUAI** entra palavra por palavra, em 3 linhas, Noto Serif itálico em *cidade industrial* | **glitch** (0,4s) |
| 0:23 | 7s | **TAKE F — pista de pouso.** | **1.480 m** gigante com gradiente `--sand`→`--paper`, contando de 0. Abaixo: *de pista · hangares · heliponto no próprio parque* | reveal |
| 0:30 | 1s | **Logo Bracerum Hotel** abre em máscara e revela o take atrás. | `hotel-cream` | contínuo |
| 0:31 | 5s | **TAKE C — hotel.** | **384** conta de 0 · *studios de 35 m²* | gradient wipe |
| 0:36 | 4s | **TAKE D — centro de convenções.** | **1.200** conta de 0 · *lugares no auditório · 13.500 m²* | reveal |
| 0:40 | 1s | **Logo Bracerum Resort** abre e revela. | `resort-cream` | contínuo |
| 0:41 | 5s | **TAKE E — resort.** | **141 lotes** · **142.067 m²** entram em sequência, não juntos | gradient wipe |
| 0:46 | 4s | **BRACERUM SELECT — sem take.** Fundo `--ink` com degradê `--brown` na diagonal. Logo entra e sobe; as palavras entram em cascata, uma por vez, alinhadas à coluna. | `select-cream` + **SHOPPING · ACADEMIA · BANCO · POSTO · MARKET** | corte |
| 0:50 | 5s | **DADO FINAL.** Fundo `--ink`. | **1%** ocupando quase a tela inteira, com gradiente e leve paralaxe; abaixo: *de tributo único sobre o valor agregado, no regime de Maquila* | **match cut** |
| 0:55 | 5s | **FECHO — TAKE A de volta**, agora em recuo (ou o fim do mesmo take). As quatro marcas acendem sobre suas regiões e apagam. Logo **Bracerum Park** fecha por cima. | `PARK · SELECT · HOTEL · RESORT` → logo + `bracerumpark.com · Villeta · Paraguai` | — |

**Fecha em 60,0 s.** Soma: 3+6+3+8+3+7+1+5+4+1+5+4+5+5.

## O bloco do mapa (0:12–0:20) em detalhe

É o trecho que mais vende o projeto e o mais fácil de errar. Sequência:

1. **0:12–0:14** — continua o recuo da vista 90º. O parque some no meio do verde; entra a malha do
   basemap na paleta do site (fundo `--ink`, água `#1b4a6e`, vias em areia, **zero vermelho**).
2. **0:14–0:16** — rota 1. A linha sai do Park e corre até Assunção **traçando pela via real**, não
   em reta. Contador `0 → 65 km` acompanha a ponta da linha. Rótulo fixa no fim.
3. **0:16–0:18** — rota 2, mesma mecânica, até a fronteira com o Brasil (Ciudad del Este / Foz do
   Iguaçu): `0 → 360 km`.
4. **0:18–0:20** — rota 3 até São Paulo. Essa é **aérea**, então desenha em arco e o rótulo diz
   `~2 h de voo` — não confundir com estrada.
5. As três linhas permanecem acesas no último frame, formando o leque. É a imagem que fica.

O traçado real das rotas já existe no repositório: `assets/routes.json`, pré-calculado com OSRM
(regerável por `docs/build_routes.py`). **Use esse arquivo** em vez de desenhar à mão.

## Locução (PT-BR)

Reescrita para o novo corte — mais curta, mais espaçada. ~95 palavras.

| TC | Fala |
|---|---|
| 0:04 | Um milhão, oitocentos e dezenove mil metros quadrados em Villeta, Paraguai. |
| 0:13 | Sessenta e cinco quilômetros de Assunção. Trezentos e sessenta da fronteira. Duas horas de voo de São Paulo. |
| 0:24 | Pista própria de mil quatrocentos e oitenta metros: o investidor desce dentro do parque. |
| 0:31 | Hotel, centro de convenções e auditório para mil e duzentas pessoas. |
| 0:42 | Resort de cento e quarenta e um lotes à beira do lago, a cinco minutos da operação. |
| 0:47 | Shopping, academia, banco e posto, sem sair do perímetro. |
| 0:51 | E um por cento de tributo único, no regime de Maquila. |
| 0:56 | Bracerum Park. A sua cidade industrial no Mercosul. |

## Tipografia e motion

- **Noto Serif** nos nomes de marca e nas ênfases em itálico; **Helvetica/Arial** nos números e dados.
- **Os números são o motion principal.** Todo número grande entra contando de 0 em 0,5 s com
  desaceleração, e o dígito de milhar entra por último. Não usar escala pulsante nem bounce.
- **Gradiente:** `--sand #cbb88f` → `--paper #f7f3ea` a 100°, só em número grande. Nunca em texto
  corrido, nunca em logo.
- **Coluna:** todo texto alinhado a 110 px da borda esquerda, exceto os números gigantes e as
  cartelas de logo, que são centrados.
- **Véu:** legenda sobre take sempre com o degradê `docs/ae/build/veil-bottom.png` por baixo.
- **Zero vermelho** em qualquer frame — inclusive nos rótulos do mapa e nas rotas.

## Áudio

Uma peça só, construção lenta, ápice em 0:50 e resolução em 0:55. Sound design: ar na abertura,
um *whoosh* grave no match cut de 0:09, ruído digital curto no glitch de 0:23, turbina ao longe em
0:24, silêncio de 0,3 s antes do logo final. Locução −6 LUFS acima da trilha; master −14 LUFS.

## Pendências

1. **Os 6 takes 3D não existem** — todos a produzir. Brief de câmera de cada um na seção
   *Brief dos takes* abaixo.
2. **`assets/web/hero-hotel-noturno.jpg` tem iluminação cênica vermelha dominante** e não serve como
   referência para o TAKE C. Usar `assets/park/hotel-noturno.jpg`, que é o mesmo conjunto em azul.
   Vale checar com o cliente se o render vermelho deve sair também do hero do site.
3. **Bracerum Select sem take** — resolvido com logo e tipografia. Se o cliente quiser imagem, é um
   sétimo take (setor comercial junto ao lago, hora azul).

## Brief dos takes

Entrega: **3840×2160, 30 fps, obturador 180°** (motion blur ligado), ProRes 422 HQ ou EXR,
**+12 frames de sobra em cada ponta**. Mesmo HDRI e mesma posição de sol em todos os exteriores —
hora dourada, sol baixo **à direita**, como no clipe de referência `assets/video/voo-passaro-01.mp4`.

| ID | Dur na tela | Câmera e movimento | Tem que estar em quadro |
|---|---|---|---|
| **A** | 6s + 5s no fecho | Aérea a ~200 m, 28 mm, avanço lento com descida suave. Renderizar **12 s corridos** — o fecho usa o trecho final, ou o mesmo trecho invertido. | Pista entrando pela base, fileiras de galpões, torre do hotel ao fundo à direita |
| **B** | 3s | **Continua o movimento de A**: sobe de ~200 m para ~1.200 m inclinando até 90º zenital. Termina nivelado ao norte. O primeiro frame de B tem que casar com o último de A — é o match cut. | Perímetro inteiro legível no último frame, para o mapa assumir daí |
| **F** | 7s | Descida contínua de ~150 m para ~40 m, 28 mm, avanço sobre o eixo da pista. Um movimento só. | Pista no primeiro plano, heliponto, pátio dos hangares com aeronaves executivas |
| **C** | 5s | Começa na fachada ao nível da entrada e sobe para a aérea do conjunto, 28 mm. Noturno. | Iluminação cênica **azul** da fachada (o azul é autorizado aqui), volume do hotel, convenções ao lado |
| **D** | 4s | Interior, 35 mm, da última fila, push-in lento para o palco. Auditório ocupado. | Plateia, palco iluminado, escala das 1.200 poltronas |
| **E** | 5s | Aérea baixa a ~40 m ao entardecer, 28 mm, avanço passando o pórtico e o clubhouse. | Lago, clubhouse, pórtico, lotes ao redor |

**Prioridade se o lote encolher:** A e B (abrem, fecham e geram o mapa) → F → C → E → D.
