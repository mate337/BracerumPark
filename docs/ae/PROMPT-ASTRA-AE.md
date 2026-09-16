# Comando de execução — filme de 60 s do Bracerum Park no After Effects (v2)

> Arquivo autossuficiente. Leia inteiro antes de começar e execute sem pedir confirmação — todas as
> decisões já estão tomadas aqui. Onde este arquivo divergir de qualquer outra fonte, **ele vence**.
>
> **Esta é a v2 e ela substitui a v1 inteira.** A v1 gerou 28 planos curtos e o cliente recusou:
> ficou com cara de apresentação, não de filme. O alvo agora é **poucos planos longos, tipografia
> grande e transições desenhadas**. Se o seu resultado tiver mais de 15 cortes, você repetiu o erro.

## 1. O trabalho

Montar o filme institucional de 60 s do **Bracerum Park** — cidade industrial em Villeta, Paraguai —
no After Effects. São **6 takes 3D**, que **ainda não foram produzidos**. O projeto nasce completo,
com cada take num precomp próprio alimentado por um *stand-in* (render estático ou o clipe aéreo de
referência). Quando o take 3D chegar, ele substitui o conteúdo do precomp e **nada na timeline
muda**. Essa estrutura é tão importante quanto o resultado visual.

**Repositório:** `github.com/mate337/BracerumPark` · branch **`claude/park-v5-paginas-projetos`**
**Roteiro completo:** `docs/roteiro-video-60s.md` (v5) — leia para contexto; a tabela da seção 6
**deste** arquivo é a fonte de verdade da timeline.

## 2. Entregáveis

1. **`docs/ae/bracerum-60s.jsx`** — ExtendScript que monta o projeto do zero em
   `Arquivo > Scripts > Executar arquivo de script`. Rodar duas vezes não pode duplicar nada.
2. **`docs/ae/LEIA-ME.md`** — como rodar, o que instalar antes, como trocar um stand-in pelo take 3D.
3. **Com acesso ao AE:** rode, corrija o que falhar, salve `docs/ae/Bracerum_Park_60s.aep` e
   renderize `docs/ae/preview/bracerum-60s_v2.mp4` (H.264, 1920×1080, 30 fps). **Sem acesso:**
   entregue 1 e 2 e diga isso no LEIA-ME — não afirme que renderizou.

## 3. Restrições técnicas que causam retrabalho

- **ExtendScript é ES3.** Nada de `let`, `const`, arrow function, template literal, `JSON.parse`,
  `forEach`. Use `var`, `function`, `+` e `for` clássico.
- Envolva tudo em `app.beginUndoGroup("Bracerum 60s v2") / app.endUndoGroup()`.
- **O After Effects não importa SVG.** Os logos já estão rasterizados a 3000 px em
  `docs/ae/build/`. Não tente importar `assets/logo/*.svg`.
- **Fontes:** *Noto Serif* (Google Fonts, instalar antes) e *Helvetica* (ou **Arial**). Nomes
  PostScript: `NotoSerif-Regular`, `NotoSerif-Italic`, `Helvetica`/`ArialMT`,
  `Helvetica-Bold`/`Arial-BoldMT`.
- **O clipe de referência é 24 fps numa comp de 30.** Interprete como 24 fps e ligue **Frame
  Blending → Pixel Motion** antes de qualquer time-stretch, senão o movimento tranca.
- **Nenhum caminho absoluto no `.jsx`.** Resolva a partir da pasta do próprio script
  (`File($.fileName).parent.parent.parent` = raiz do repo).

## 4. Regras de marca (do cliente, não negociáveis)

- **Paleta:** `--ink #0e0d0b` · `--paper #f7f3ea` · `--sand #cbb88f` · `--brown #473315`.
- **ZERO VERMELHO em qualquer frame.** Vale para gráfico, rótulo de mapa, rota e efeito.
  **Isto elimina o glitch de separação RGB** (o do Spider-Verse, que joga vermelho e ciano na tela).
  O glitch deste filme é de **deslocamento**: fatias horizontais deslocadas em X, ruído de blocos e
  um frame de `--ink` puro, tudo dentro da paleta. Se a sua ferramenta de glitch só faz channel
  split, **não use** — faça o deslocamento à mão com camadas fatiadas.
- **Azul só em dois lugares:** a fachada noturna do hotel (é a iluminação cênica do render) e a
  faixa institucional Bracerum `#1c4d9d` na assinatura final.
- **Tipografia:** Noto Serif nos nomes de marca e ênfases (itálico como ênfase, **nunca cor**);
  Helvetica/Arial em números e dados.
- **Cantos quadrados.** Sem sombra, sem bisel, sem brilho, sem contorno.
- **Nada de efeito de template:** light leak, lens flare artificial, partícula, zoom-blur de
  transição, "cinematic preset". O filme é sóbrio: movimento de câmera, tipografia e as quatro
  transições da seção 5.

## 5. As quatro transições — como fazer cada uma no AE

Cada uma tem função. Nenhuma entra "porque ficou bonito". **Não invente uma quinta.**

**Match cut** (0:09 e 0:55) — corte no meio do movimento, não no fim. Os dois planos precisam ter a
mesma direção e a mesma velocidade aparente na emenda. Ajuste a velocidade do plano seguinte até
que a emenda não seja percebida como corte. Reforce com **Directional Blur** de 4 frames (ângulo do
movimento, comprimento 0→12→0). Nada de dissolve.

**Masking / reveal** (0:30, 0:40, 0:46) — o logo do sub-projeto está em `--paper` sobre `--ink`;
uma máscara retangular sobe revelando o logo em 10 frames, segura 8, e então a **própria forma do
logo vira matte**: duplique a camada do take abaixo, aplique o logo como *Alpha Matte*, e escale o
matte de 100% para 2000% em 14 frames com Easy Ease. O take aparece de dentro das letras.

**Gradient wipe** (0:03, 0:36, 0:50) — camada de rampa como fonte: crie um sólido, aplique
**Gradient Ramp** (preto→branco, ângulo 100°), aplique **Fast Box Blur** de 60 px nela, e use-a como
*Gradient Layer* do efeito **Gradient Wipe** na camada de saída. Anime `Transition Completion`
0→100 em 12 frames, `Transition Softness` em 35.

**Glitch** (0:23, **uma vez só no filme**) — 0,4 s. Três elementos, todos na paleta:
(a) 5 fatias horizontais da imagem deslocadas em X entre −60 e +60 px, mudando a cada 2 frames;
(b) dois frames de `--ink` puro intercalados; (c) um frame com a tipografia duplicada e deslocada
6 px. **Sem separação de canal, sem vermelho.** Se o cliente pedir um segundo glitch, o lugar é 0:50.

## 6. Timeline — fonte de verdade

`IN` = tempo na master. Stand-in = o que usar **agora**, até o take 3D existir.
Todos os caminhos são relativos à raiz do repositório.

| IN | Dur | Precomp | Conteúdo | Stand-in | Saída |
|---|---|---|---|---|---|
| 0:00.0 | 3,0s | `G01_abertura` | Fundo `--ink`. Logo **Bracerum Park** revelado por máscara vertical em 14 frames, segura 1 s. Nada mais em quadro. | `docs/ae/build/logo-stacked-wide-cream.png`, 900 px de largura, centrado | gradient wipe |
| 0:03.0 | 6,0s | `TAKE_A_aerea` | Aérea drone do parque. **O plano mais longo do filme — deixe respirar.** Sobre ele, o número gigante (ver 6.1). | `assets/video/voo-passaro-01.mp4`, trecho 0,0–3,6 s, stretch **166,67%**, Pixel Motion | **match cut** |
| 0:09.0 | 3,0s | `TAKE_B_planta` | Vista 90º: a câmera continua subindo e a aérea vira planta. | `assets/web/vista-aerea-park-02.jpg`, escala **135→100**, sem deriva | contínuo |
| 0:12.0 | 8,0s | `G02_mapa` | **Zoom out estilo Google Earth + traçado de rotas.** Ver 6.2 — é o trecho mais importante do filme. | idem acima, continuando o recuo | corte |
| 0:20.0 | 3,0s | `G03_chamada` | Mapa recuado, escurecido a 55% com sólido `--ink`. Chamada entra **palavra por palavra**, 3 frames entre palavras, em 3 linhas centradas: `A SUA` / `CIDADE INDUSTRIAL` / `NO PARAGUAI`. `CIDADE INDUSTRIAL` em Noto Serif Italic 96 px `--paper`; o resto em Helvetica Bold 72 px `--sand`, tracking 80. | — | **glitch 0,4s** |
| 0:23.0 | 7,0s | `TAKE_F_pista` | Pista de pouso, descida contínua sobre o eixo. | `assets/park/aero-pista.jpg`, escala **104→122**, deriva Y +40 px | reveal |
| 0:30.0 | 1,0s | `G04_logo_hotel` | Logo **Bracerum Hotel** abre e revela o take C atrás. | `docs/ae/build/hotel-cream.png`, 760 px | contínuo |
| 0:31.0 | 5,0s | `TAKE_C_hotel` | Hotel: fachada noturna subindo para a aérea do conjunto. | `assets/park/hotel-noturno.jpg`, escala **110→120**, deriva X **−150 px** (ver 11) | gradient wipe |
| 0:36.0 | 4,0s | `TAKE_D_convencoes` | Centro de convenções: auditório ocupado, push-in para o palco. | `assets/park/hotel-auditorio.jpg`, escala **106→118** | reveal |
| 0:40.0 | 1,0s | `G05_logo_resort` | Logo **Bracerum Resort** abre e revela o take E. | `docs/ae/build/resort-cream.png`, 760 px | contínuo |
| 0:41.0 | 5,0s | `TAKE_E_resort` | Resort: aérea baixa passando pórtico e clubhouse. | `assets/park/resort-lago-aereo.jpg`, escala **118→104** | gradient wipe |
| 0:46.0 | 4,0s | `G06_select` | **Sem take.** Fundo `--ink` com degradê `--brown` na diagonal a 100°. Logo **Bracerum Select** entra centrado, segura 1 s, sobe para o terço superior; as palavras entram em cascata (4 frames entre elas), alinhadas à coluna de 110 px: `SHOPPING` `ACADEMIA` `BANCO` `POSTO` `MARKET`, Helvetica Bold 64 px `--paper`, tracking 60. | `docs/ae/build/select-cream.png`, 700 px | corte |
| 0:50.0 | 5,0s | `G07_tributo` | Fundo `--ink`. **1%** ocupando quase a tela (altura ~640 px), com gradiente e paralaxe lenta (escala 100→106). Abaixo, Helvetica 36 px `--paper` a 85%: *de tributo único sobre o valor agregado, no regime de Maquila*. | — | **match cut** |
| 0:55.0 | 5,0s | `G08_fecho` | **Take A de volta**, em recuo. Aos 0:56 as quatro marcas acendem sobre suas regiões da planta e apagam em 1 s. Aos 0:57.5 entra o logo **Bracerum Park** por cima, com `bracerumpark.com · Villeta · Paraguai` em Helvetica 30 px. Faixa `#1c4d9d` de 10 px na base nos últimos 12 frames. | `assets/video/voo-passaro-01.mp4`, trecho 0,0–2,7 s **Time-Reverse** + stretch 185% | — |

**Fecha em 60,0 s exatos.** Soma: 3+6+3+8+3+7+1+5+4+1+5+4+5+5. Se a sua der diferente, você errou.

### 6.1 O número gigante sobre a aérea (0:04–0:09)

O momento de tipografia mais importante do filme.

- Texto: **1.819.856 m²**, Helvetica Bold, **altura de caixa ~420 px**, centrado, tracking −20.
- **Gradiente:** não use "gradient overlay". Crie um sólido com **Gradient Ramp**
  (`--sand #cbb88f` → `--paper #f7f3ea`, ângulo 100°) e aplique a camada de texto como **Alpha Matte**.
- **Entrada:** máscara de degradê varrendo da esquerda para a direita em 16 frames, acompanhando o
  movimento da câmera do take — o número **nasce junto com o movimento**, não aparece em cima dele.
- **Contagem:** os dígitos contam de 0 até o valor em 0,6 s, com desaceleração, mantendo o ponto de
  milhar. Expressão com Slider Control; **não** anime escala nem opacidade do bloco todo.
- Abaixo, Helvetica 34 px `--paper` a 85%: *planejados como uma cidade industrial completa*,
  entrando 6 frames depois.
- **Saída:** o número sai junto com o match cut, deslocando para cima com o movimento da câmera.

Mesma receita, menor, para: `1.480 m` (0:24), `384` (0:32), `1.200` (0:37), `141 lotes` e
`142.067 m²` (0:42, em sequência e **não** juntos), `1%` (0:50, o maior de todos).

### 6.2 O bloco do mapa (0:12–0:20)

É o trecho que mais vende o projeto e o mais fácil de errar.

1. **0:12–0:14** — continua o recuo da vista 90º até o parque virar um ponto. Entra a malha do mapa
   na paleta do site: fundo `--ink`, água `#1b4a6e`, vias em tons de areia, rótulos claros.
   **Zero vermelho, inclusive nas rotas.**
2. **0:14–0:16** — **rota 1**, Park → Assunção. Shape layer com **Trim Paths** `End 0→100`, traçando
   **pela via real** (nunca em reta). Um ponto acompanha a ponta da linha; o contador `0 → 65 km`
   corre junto e trava no fim. Rótulo: `ASSUNÇÃO · 65 km · 1 h 10`.
3. **0:16–0:18** — **rota 2**, Park → fronteira com o Brasil (Ciudad del Este / Foz do Iguaçu),
   mesma mecânica: `FRONTEIRA BR · 360 km · 5 h`.
4. **0:18–0:20** — **rota 3**, Park → São Paulo. Essa é **aérea**: desenhe em **arco**, não por via,
   e o rótulo diz `SÃO PAULO · 1.130 km · ~2 h de voo`. Não confundir com estrada.
5. As três linhas **ficam acesas** no último frame, formando o leque. É a imagem que fica na cabeça.

**O traçado real já existe:** `assets/routes.json`, pré-calculado com OSRM. Use esse arquivo para
desenhar as rotas 1 e 2 em vez de traçar à mão. (Regerável por `docs/build_routes.py`.)

## 7. Estrutura do projeto

```
01_MASTER/     BP_60s_MASTER   1920×1080 · 30 fps · 60 s · 16 bpc · sRGB
02_TAKES/      TAKE_A_aerea, TAKE_B_planta, TAKE_C_hotel,
               TAKE_D_convencoes, TAKE_E_resort, TAKE_F_pista
03_GRAFISMO/   G01_abertura, G02_mapa, G03_chamada, G04_logo_hotel,
               G05_logo_resort, G06_select, G07_tributo, G08_fecho
04_ASSETS/     imagens, clipe e PNGs importados
05_TRANSICOES/ as rampas e mattes reutilizados
```

Cada precomp tem exatamente a duração da tabela e o tamanho da master. **Um plano = um precomp**,
sempre — é o que permite trocar o stand-in pelo take 3D sem tocar na timeline.

## 8. Locução — só marcadores, não gere áudio

Não sintetize voz nem trilha. Crie um **marcador de comp** na master em cada TC abaixo, com a fala
no comentário:

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

## 9. Entrega no Git

Branch **`claude/park-v5-paginas-projetos`**, commit em português, descritivo. Commitar o `.jsx`, o
`LEIA-ME.md` e, se rodou, o `.aep` e o preview. **Não commitar** cache do AE nem
`Adobe After Effects Auto-Save/`.

## 10. Critérios de aceite

- [ ] Roda numa instalação limpa sem erro nem diálogo; rodar duas vezes não duplica nada.
- [ ] Master fecha em **60,0 s**, sem frame vazio nem sobreposição.
- [ ] **No máximo 15 cortes no filme inteiro.** Mais que isso é o erro da v1 de novo.
- [ ] Os 14 precomps existem com os nomes exatos da seção 7 e a duração da tabela.
- [ ] **Nenhum pixel vermelho em nenhum frame** — confira especialmente o glitch e o mapa.
- [ ] O glitch aparece **uma vez só**, em 0:23, e é de deslocamento, não de canal.
- [ ] As três rotas do mapa traçam com Trim Paths, com contador acompanhando, e ficam acesas no fim.
- [ ] Todo número grande entra contando de 0, com o gradiente por Alpha Matte.
- [ ] Os três logos de sub-projeto viram matte e o take aparece de dentro das letras.
- [ ] Os 8 marcadores de locução estão nos TCs certos.
- [ ] Nenhum caminho absoluto no `.jsx`.

## 11. O que NÃO fazer

- Não invente dado, número, metragem, distância ou nome que não esteja neste arquivo.
- Não use imagem, vídeo, trilha ou fonte fora do repositório.
- **Não use `assets/web/hero-hotel-noturno.jpg`.** Esse render tem iluminação cênica **vermelha**
  dominante e viola a regra de marca. Use `assets/park/hotel-noturno.jpg`, o mesmo conjunto em azul —
  e mesmo nele sobra vermelho na borda direita, por isso o enquadramento leva deriva de −150 px.
- Não acrescente corte para "dar dinamismo". O filme tem 14 planos e é assim de propósito.
- Não mude duração, ordem ou texto "para ficar melhor". Se achar que algo está errado, **monte como
  está e anote no LEIA-ME** — quem decide é o cliente.
- Não adicione marca d'água, assinatura própria ou crédito de ferramenta em nenhum frame.

## 12. Estado do material

- **Os 6 takes 3D não existem** — tudo é stand-in. O clipe `assets/video/voo-passaro-01.mp4` (5 s,
  1284×716, 24 fps) é o único material filmado; numa comp 1080p ele sobe 1,5× e **vai aparecer
  suave**. É esperado. Não corrija com sharpen.
- **Bracerum Select não tem take** e é resolvido com logo e tipografia — é assim de propósito.
- Referência da v1, só para comparar tempo e ordem: `docs/ae/preview/bracerum-60s-animatic.mp4`.
  **Não é o alvo visual** — é justamente o resultado que o cliente achou pouco cinematográfico.
