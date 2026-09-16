# Bracerum Park — Roteiro de vídeo institucional (60s)

**Versão:** v4 — 2026-09-16
**Para que serve:** roteiro-base do filme **e** brief de produção dos takes 3D. A equipe de 3D
produz os **20 takes** especificados na seção *Brief dos takes 3D*; os 4 takes de banco e o mograph
entram na montagem.
**Duração:** 0:60 exatos · **Master:** 1920×1080, 30 fps (renders em 3840×2160, ver *Entrega*)
**Idiomas:** locução PT-BR; legendas EN/ES na mesma base de tempo
**Ritmo:** alternância **A/B** — take do parque → take de banco (detalhe humano) → volta ao parque.
Nenhum take de banco passa de 2s.

---

## Lista rápida — o que cada plano mostra

| TC | Take | O que aparece |
|---|---|---|
| 0:00 | T01 | Drone do parque, vista geral em hora dourada |
| 0:03 | banco | Mão de engenheiro sobre a planta impressa |
| 0:05 | T02 + mograph | Zoom out 90º: parque → Villeta → Paraguai → Mercosul |
| 0:09 | T03 | Aérea alta com a planta inteira |
| 0:12 | banco | Barcaças no rio |
| 0:14 | T04 | Rasante sobre as fileiras de galpões |
| 0:16 | T05 | Caminhão encostando na doca |
| 0:18 | banco | Interior de galpão com empilhadeira |
| 0:20 | T06 | Fábrica Bracerum em operação |
| 0:23 | T07 | Aeródromo: pista, heliponto e hangares com jatos |
| 0:27 | cartela | APOIO E BEM-ESTAR |
| 0:28 | T08 | Enfermaria |
| 0:30 | T09 | Creche |
| 0:32 | T10 | Bombeiros civis, viatura saindo do abrigo |
| 0:34 | cartela | BRACERUM SELECT |
| 0:35 | T11 | Setor comercial junto ao lago, vitrines acesas |
| 0:37 | T12 | Academia |
| 0:39 | T13 | Posto e market (insert de maquininha) |
| 0:41 | cartela | BRACERUM HOTEL |
| 0:42 | T14 | Fachada do hotel à noite, subindo para a aérea do conjunto |
| 0:45 | T15 | Auditório cheio |
| 0:47 | T16 | Foyer do centro de convenções |
| 0:48 | cartela | BRACERUM RESORT |
| 0:49 | T17 | Lago e clubhouse |
| 0:52 | T18 | Família à beira do lago |
| 0:54 | T19 | Quadras e campo society |
| 0:55 | T20 | Recuo aéreo do parque no poente, marcas acendendo |
| 0:58 | assinatura | Logo Bracerum Park |

**Só os 20 takes 3D, por ambiente:** parque geral (T01, T02, T03, T20) · galpões e lotes (T04, T05) ·
fábrica (T06) · aeródromo (T07) · apoio (T08, T09, T10) · Select (T11, T12, T13) ·
Hotel (T14, T15, T16) · Resort (T17, T18, T19).

---

## Referência visual — o clipe "Voo de Pássaro 01"

O clipe existente (5s, aérea do parque) **é o padrão de look de todos os takes 3D**: hora dourada,
sol baixo à direita com flare suave, pasto verde saturado em volta, movimento lento e contínuo,
sem giro e sem corte dentro do take. Ele já entrega o enquadramento certo do bloco do aeródromo —
pista no primeiro plano, heliponto, pátio dos hangares com aeronaves, fileiras de galpões, torre do
hotel no horizonte. **Quem for produzir T01, T03, T04 e T20 deve abrir esse arquivo antes**: é a
continuidade de luz e de altitude que amarra o filme.

## Entrega dos takes 3D

- **Resolução:** 3840×2160 (o master é 1080p; a folga é para reenquadrar em 9:16 e 1:1 sem perda).
- **Frame rate:** 30 fps, obturador 180° (motion blur ligado — take de arquitetura sem blur denuncia CG).
- **Codec:** ProRes 422 HQ ou sequência PNG/EXR. Nada de H.264 na entrega.
- **Sobra:** **+12 frames em cada ponta** de cada take, além da duração pedida. É o que permite
  ajustar o corte na montagem sem voltar para o render.
- **Continuidade obrigatória entre os exteriores:** mesmo HDRI, mesma posição de sol (elevação baixa,
  **azimute à direita do quadro**, como no clipe), mesma estação de vegetação. Um take com sol do
  outro lado quebra a sequência inteira.
- **Sem vermelho.** Regra de marca do projeto, vale também no 3D: veículos, sinalização, toldos e
  fachadas na paleta preto / branco / bege-marrom. Atenção ao **T10 (bombeiros)** — a viatura
  vermelha é a exceção que mais salta; especificar livrea branca com faixa `--ink`, ou enquadrar
  de forma que o vermelho não domine o quadro.
- **Nomear os arquivos pelo ID do take** (`T07_aerodromo_v01.mov`), que é como o roteiro se refere
  a eles.

---

## Linha do tempo

`3D` = take a produzir (ver brief) · `STOCK` = banco de imagens · `MOGRAPH` = animação de dados/mapa

### Bloco 1 — BRACERUM PARK (0:00 – 0:27)

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:00 | 3s | **3D · T01** | Voo de pássaro em hora dourada, avanço lento sobre o parque — a pista entra no quadro, o flare à direita. Entra já em movimento, sem fade. | — (tela limpa) |
| 0:03 | 2s | **STOCK** | Close de mão de engenheiro sobre planta impressa apoiada no capô; vento move o papel. Hora dourada. `engineer blueprint hands golden hour close` | **VILLETA · PARAGUAI** |
| 0:05 | 4s | **3D · T02 + MOGRAPH** | **Zoom out 90º.** T02 sobe do parque à vertical (2s); daí o mograph assume e continua: satélite → Villeta → Rio Paraguai → Departamento Central → Paraguai → Mercosul. Pinos acendem: Hidrovia, Terport, Assunção, São Paulo. Paleta do mapa do site (`--ink`, água `#1b4a6e`, vias em areia). | `65 km de Assunção` · `Hidrovia Paraná–Paraguai` · `Ruta PY19 · Acceso Sur` |
| 0:09 | 3s | **3D · T03** | Volta da vertical para a aérea alta com a **planta inteira** em quadro: os 12 setores lidos de uma vez. | **1.819.856 m²** *planejados* |
| 0:12 | 2s | **STOCK** | Barcaças no rio, plano aéreo **fechado** no convés/carga — não abrir a paisagem. `barge convoy cargo deck aerial close` | — |
| 0:14 | 4s | **3D · T04 + T05** | 2s rasante sobre as fileiras de galpões (T04) → 2s no pátio, caminhão encostando na doca (T05). Mesmo eixo de movimento nos dois, para ler como continuidade. | **989.642 m²** de lotes · módulos de **40.000 m²** |
| 0:18 | 2s | **STOCK** | Interior de galpão: empilhadeira cruza o plano, pé-direito alto. `warehouse interior forklift high bay` | — |
| 0:20 | 3s | **3D · T06** | Fábrica Bracerum em operação, fim de tarde: caminhão carregando, movimento no pátio. | **Built-to-Suit** · Steel Frame próprio |
| 0:23 | 4s | **3D · T07** | **O plano mais forte do filme.** Descida contínua sobre a pista → heliponto → pátio dos hangares com jatos. **Sem corte dentro do take** — a descida ininterrupta é o que dá a sensação de pouso. | **Pista de 1.480 m** · hangares **7.686 m²** · **heliponto** junto aos hangares |

### Bloco 2 — APOIO E BEM-ESTAR (0:27 – 0:34)

> Não é marca: é a camada de serviço que faz o parque funcionar como cidade.

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:27 | 1s | **MOGRAPH** | Cartela: fundo `--ink`, letreiro em Noto Serif itálico entrando por máscara. | **APOIO E BEM-ESTAR** |
| 0:28 | 2s | **3D · T08** | Enfermaria/ambulatório: recepção e sala de atendimento, luz natural, figurante de jaleco cruzando o plano. | **Enfermaria** no perímetro |
| 0:30 | 2s | **3D · T09** | Creche: pátio coberto e sala de atividades, mobiliário baixo, brinquedos. Sem rosto em primeiro plano. | **Creche** |
| 0:32 | 2s | **3D · T10** | Bombeiros civis: viatura saindo do abrigo, plano baixo e curto. **Ver a regra do vermelho acima.** | **Bombeiros civis** próprios |

### Bloco 3 — BRACERUM SELECT (0:34 – 0:41)

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:34 | 1s | **MOGRAPH** | Cartela, mesma gramática. | **BRACERUM SELECT** |
| 0:35 | 2s | **3D · T11** | Setor comercial junto ao lago na hora azul, vitrines acesas, gente circulando na galeria. | **Shopping** e lojas |
| 0:37 | 2s | **3D · T12** | Academia: interior em contraluz, esteiras e peso livre, movimento em primeiro plano. | **Academia** |
| 0:39 | 2s | **3D · T13** | Posto sob a cobertura + market. Insert de 0,5s STOCK de cartão em maquininha (`contactless payment terminal close`) para cobrir "banco". | **Posto · market · banco · praça de alimentação** |

### Bloco 4 — BRACERUM HOTEL (0:41 – 0:48)

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:41 | 1s | **MOGRAPH** | Cartela. | **BRACERUM HOTEL** |
| 0:42 | 3s | **3D · T14** | Fachada noturna com a iluminação cênica azul (único azul permitido no filme, fora do mapa e da assinatura), subindo até a aérea do conjunto hotel + convenções. | **384 studios** de 35 m² |
| 0:45 | 2s | **3D · T15** | Auditório cheio visto de trás, palco iluminado ao fundo. **Take mais caro do lote** (multidão) — se não couber, banco: `conference auditorium audience stage`. | **Auditório para 1.200 pessoas** |
| 0:47 | 1s | **3D · T16** | Foyer/pavilhão do centro de convenções em dia de evento. | **Centro de convenções · 13.500 m²** |

### Bloco 5 — BRACERUM RESORT (0:48 – 0:55)

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:48 | 1s | **MOGRAPH** | Cartela. | **BRACERUM RESORT** |
| 0:49 | 3s | **3D · T17** | Aérea baixa sobre o lago ao entardecer, passando o clubhouse e o pórtico. | **141 lotes** · **142.067 m²** |
| 0:52 | 2s | **3D · T18** | Beira do lago: família caminhando em contraluz, silhueta. Se a multidão/figurante não couber, banco: `family walking lakeside sunset silhouette`. | — |
| 0:54 | 1s | **3D · T19** | Quadras e campo society em uso, luz baixa. | Lago · quadras · clubhouse |

### Bloco 6 — FECHAMENTO (0:55 – 1:00)

| TC | Dur | Take | Imagem | Texto na tela |
|---|---|---|---|---|
| 0:55 | 3s | **3D · T20** | Fecha como abriu, invertido: recuo aéreo afastando-se do parque no poente, a planta inteira entrando em quadro. As marcas acendem sobre suas regiões. | `PARK · SELECT · HOTEL · RESORT` |
| 0:58 | 2s | **MOGRAPH** | Fundo `--ink`, logo Bracerum Park (`assets/logo/logo-stacked-wide-cream.svg`) em máscara vertical. Faixa Bracerum (`--brc-blue`) só na última meia-volta. | **bracerumpark.com** · Villeta · Paraguai |

---

## Brief dos takes 3D

Duração = tempo na tela; render com +12 frames em cada ponta. Lentes em equivalente 35 mm.
"Referência" aponta o render já existente no repositório que define o ambiente.

### Exteriores aéreos — hora dourada, sol baixo à direita

| ID | Dur | Ambiente | Câmera e movimento | Tem que estar em quadro | Referência |
|---|---|---|---|---|---|
| **T01** | 3s | Parque, vista geral | Aérea a ~200 m, lente 28 mm, avanço lento para a frente com descida suave. Sem giro. | Pista entrando pela base, fileiras de galpões, torre do hotel ao fundo à direita, pasto em volta | `Voo de Pássaro 01` |
| **T02** | 2s | Parque → vertical | Sobe de ~200 m para ~1.200 m inclinando a câmera até **90º (zenital)**. Termina com o parque centrado e nivelado ao norte — o mograph continua daí. | Perímetro inteiro legível no último frame, para casar com o mapa | `assets/web/vista-aerea-park-02.jpg` |
| **T03** | 3s | Parque, planta inteira | Aérea alta a ~800 m, 35 mm, recuo lento com leve paralaxe. | Os 12 setores de uma vez: industrial, aeródromo, resort, hotel, comercial, ETE/ETA | `assets/web/vista-aerea-park-02.jpg` |
| **T04** | 2s | Faixa industrial | Rasante a 25–30 m sobre as coberturas, 24 mm, avanço rápido paralelo às fileiras. | Fileiras regulares de galpão, ruas internas, caminhões nas ruas | `assets/park/vias-galpao.jpg` |
| **T05** | 2s | Doca de galpão | Nível do solo, 35 mm, travelling lateral lento. | Caminhão encostando na doca, operação em curso, portão aberto | `assets/park/vias-caminhoes.jpg` |
| **T06** | 3s | Fábrica Bracerum | Aérea baixa a ~60 m, 35 mm, órbita curta (máx. 20º) no fim de tarde. | Pátio em operação, carga, iluminação acendendo | `assets/park/fabrica-bracerum.jpg` |
| **T07** | 4s | **Aeródromo** | Descida contínua de ~150 m para ~40 m, 28 mm, avanço. Um movimento só, sem corte. | Pista no primeiro plano → heliponto circular → pátio com aeronaves executivas → fileira de hangares | `Voo de Pássaro 01` · `assets/park/aero-pista.jpg` |
| **T20** | 3s | Parque, saída | O inverso de T01: recuo aéreo subindo, 28 mm, poente mais avançado que T01 (âmbar mais forte, sombras longas). | A planta inteira entrando em quadro, com espaço vazio para as marcas acenderem | `Voo de Pássaro 01` |

### Apoio e bem-estar — luz de dia, interiores

| ID | Dur | Ambiente | Câmera e movimento | Tem que estar em quadro |
|---|---|---|---|---|
| **T08** | 2s | Enfermaria | Interior, 35 mm, travelling curto à altura do peito. | Recepção, sala de atendimento, figurante de jaleco cruzando o plano, luz natural |
| **T09** | 2s | Creche | Interior/pátio coberto, 28 mm, push-in lento. | Mobiliário baixo, área de atividades, pátio protegido. Sem rosto em primeiro plano |
| **T10** | 2s | Bombeiros civis | Exterior, 24 mm, plano baixo, viatura saindo do abrigo em direção à câmera. | Abrigo, viatura em movimento, equipe com EPI. **Livrea sem vermelho dominante** |

### Bracerum Select — hora azul e interiores

| ID | Dur | Ambiente | Câmera e movimento | Tem que estar em quadro | Referência |
|---|---|---|---|---|---|
| **T11** | 2s | Setor comercial | Exterior na hora azul, 28 mm, travelling lateral pela galeria. | Vitrines acesas, lago ao fundo, gente circulando | `assets/park/select-shopping-lago.jpg` |
| **T12** | 2s | Academia | Interior em contraluz, 35 mm, plano curto e enérgico. | Esteiras, peso livre, movimento em primeiro plano | `assets/park/select-comercial-noite.jpg` |
| **T13** | 2s | Posto e market | Exterior noturno sob a cobertura, 24 mm, push-in. | Cobertura iluminada, bombas, entrada do market | `assets/park/select-posto-noturno.jpg` · `select-market-interior.jpg` |

### Bracerum Hotel

| ID | Dur | Ambiente | Câmera e movimento | Tem que estar em quadro | Referência |
|---|---|---|---|---|---|
| **T14** | 3s | Hotel + convenções | Começa na fachada noturna ao nível da entrada e sobe para a aérea do conjunto, 28 mm. | Iluminação cênica azul da fachada, volume do hotel e o centro de convenções ao lado | `assets/web/hero-hotel-noturno.jpg` · `assets/park/hotel-aereo.jpg` |
| **T15** | 2s | Auditório | Interior, 35 mm, da última fila, push-in lento para o palco. | Plateia ocupada, palco iluminado, escala das 1.200 poltronas | `assets/park/hotel-auditorio.jpg` |
| **T16** | 1s | Centro de convenções | Foyer/pavilhão em dia de evento, 24 mm, travelling curto. | Pé-direito, circulação, montagem de evento | `assets/renders/pavilhao-eventos-1.jpg` |

### Bracerum Resort

| ID | Dur | Ambiente | Câmera e movimento | Tem que estar em quadro | Referência |
|---|---|---|---|---|---|
| **T17** | 3s | Lago e clubhouse | Aérea baixa a ~40 m ao entardecer, 28 mm, avanço passando o pórtico e o clubhouse. | Lago, clubhouse, pórtico de entrada, lotes ao redor | `assets/park/resort-lago-aereo.jpg` · `resort-clubhouse.jpg` |
| **T18** | 2s | Beira do lago | Nível do solo, 50 mm, contraluz, câmera parada. | Família em silhueta caminhando, reflexo do sol na água | `assets/park/resort-lago-fonte.jpg` |
| **T19** | 1s | Quadras | Exterior, 35 mm, plano fixo curto com luz baixa. | Quadras e campo society em uso | `assets/park/amen-quadras.jpg` |

**Resumo do lote:** 20 takes, **46 s** de render no total (com as sobras, ~54 s). Oito são exteriores
aéreos que compartilham a mesma cena e o mesmo sol — se produzidos na mesma sessão, o custo real é
bem menor que 20 setups. **Prioridade se o lote precisar ser cortado:** T07, T01, T20, T03 (os quatro
que sustentam o filme) → T04, T14, T17 → o resto.

---

## Locução (PT-BR)

> Tom grave e pausado, sem euforia de comercial — o público é investidor industrial.
> ~120 palavras para 60s; há respiro entre as frases, **não acelerar para caber mais texto**.

| TC | Fala |
|---|---|
| 0:01 | Villeta, Paraguai. Sessenta e cinco quilômetros de Assunção, minutos da Hidrovia. |
| 0:09 | Um milhão, oitocentos e dezenove mil metros quadrados planejados como uma cidade industrial completa. |
| 0:15 | Quase um milhão de metros quadrados de lotes, em módulos de quarenta mil. Galpão pronto, em Steel Frame próprio. |
| 0:23 | Mil quatrocentos e oitenta metros de pista, hangares e heliponto dentro do perímetro: o investidor desce no parque. |
| 0:28 | Enfermaria, creche e bombeiros próprios. O que uma cidade precisa para funcionar. |
| 0:35 | Bracerum Select: shopping, academia, banco e posto. A rotina resolvida sem sair do parque. |
| 0:42 | Bracerum Hotel: trezentos e oitenta e quatro studios e um auditório para mil e duzentas pessoas. |
| 0:49 | Bracerum Resort: cento e quarenta e um lotes à beira do lago, a cinco minutos da operação. |
| 0:56 | Bracerum Park. A porta de entrada industrial do Mercosul. |

**EN/ES:** mesma base de tempo. As linhas 0:09, 0:15, 0:23 e 0:42 são as mais longas — em ES ganham
~8%; encurtar `0:15` para "Casi un millón de metros cuadrados de lotes, en módulos de cuarenta mil"
(cortar "propio" em Steel Frame) e `0:23` para "Mil cuatrocientos ochenta metros de pista, hangares
y helipuerto".

---

## Áudio

- **Trilha:** peça única, sem trocas. Piano/cordas em construção lenta até 0:27, percussão grave
  entrando no bloco de apoio, ápice em 0:55, resolve em 0:58. Textura tipo *oryzo.ai* — nada de EDM
  corporativo.
- **Sound design:** ar/drone na abertura; um *whoosh* só, no zoom out de 0:05; turbina ao longe
  entrando em 0:23 (o take do aeródromo pede e aguenta); clique discreto em cada cartela; 0,3s de
  silêncio antes do logo.
- Os takes 3D entram **mudos** — o som todo é construído na pós.
- **Mix:** locução −6 LUFS acima da trilha; master −14 LUFS.

## Grafismo

- **Noto Serif** (marcas, itálico como ênfase) + Helvetica/stack de sistema (números e legendas).
  Cantos quadrados, sem sombra.
- Paleta `--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315`. **Zero vermelho.**
  Azul só na fachada noturna do hotel (T14), na água do mapa e na assinatura Bracerum do fim.
- Sobre a aérea dourada o texto claro some: véu inferior em `--ink` a 45%, como o degradê do
  `.masterplan__head` no site.
- Números com *count-up* de 0,4s, mesma lógica das cifras da home.
- Legendas queimadas no 9:16 (autoplay mudo é a regra em social).

## Cortes derivados

- **9:16 (Reels/Shorts):** mesmos TCs; é para isso que os takes vêm em 4K — reenquadrar dentro do
  quadro em vez de ampliar. Nas aéreas horizontais, recentrar no pátio dos hangares (T07) e no
  bloco de galpões (T04), não na pista. Cartelas de marca no terço superior, fora da área da UI.
- **1:1:** cortar o bloco de apoio para 4s (T08 e T09) e fechar em 0:50.
- **15s (paid):** T01, T02+mograph, T04, T07, T20 e a assinatura — sem nenhum take de banco.

---

## Takes de banco a licenciar (4)

São os planos de gente e detalhe que saem caro em 3D e convincentes em filmagem. **Todos fechados** —
plano aberto de banco inventa um segundo lugar e o filme vira estoque com participação do parque.

| TC | Busca | Observação |
|---|---|---|
| 0:03 | `engineer blueprint hands golden hour close` | Só mãos e planta; casar a luz com T01 |
| 0:12 | `barge convoy cargo deck aerial close` | Fechado no convés — não abrir a paisagem do rio |
| 0:18 | `warehouse interior forklift high bay` | Interior genérico, sem marca visível |
| 0:39 | `contactless payment terminal close` | Insert de 0,5s dentro de T13, para cobrir "banco" |

Licença comercial com direito a mídia paga. Não usar imagem de busca comum (mesma regra dos POIs do
mapa, em `assets/pois/CREDITOS.md`). Se T15 e T18 saírem do lote 3D por causa dos figurantes, entram
mais dois takes de banco: `conference auditorium audience stage` e
`family walking lakeside sunset silhouette` — com *model release* no pacote.

---

## Pendências

1. **Creche (T09)** — enfermaria e bombeiros civis constam do masterplan; creche não aparece no R04
   nem no site. É a única palavra do VO sem lastro no projeto: confirmar com o cliente, ou trocar por
   "ambulatório" e cair para 19 takes.
2. **Enfermaria e bombeiros (T08, T10)** — previstos no masterplan como programa (ver `select.html`),
   mas **sem projeto arquitetônico no R04**. A equipe 3D precisa de definição volumétrica antes de
   modelar, ou os três takes do bloco 2 viram banco de imagens.
3. **Tipologias do Resort** — segue pendente no projeto; não afeta este roteiro (T17–T19 são áreas
   comuns), mas afeta qualquer versão longa que mostre casas.

### Decidido
- **Pista: 1.480 m** (o catálogo V15 vale sobre os 1.280 m do R04) e **heliponto no pátio dos
  hangares**, não na cabeceira da pista — é o que a filmagem de referência mostra.
- O bloco "Bracerum City" virou **Apoio e bem-estar** e deixou de ser tratado como marca.
