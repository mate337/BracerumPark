# Masterplan V12 — Bracerum Park (01/10/2026)

Registro detalhado da planta **"BRACERUM PARK — VERSÃO 12 — 01-10-26"**, enviada pelo cliente em
2026-10-16. **É a fonte de verdade da implantação** a partir desta data: onde ela diverge da planta
do Catálogo V15 (`assets/renders/masterplan-implantacao.jpg`) ou do R04, vale o V12.

Arquivos em `docs/masterplan-v12/`:

| Arquivo | O que é |
|---|---|
| `BRACERUM_PARK_V12_2026-10-01.pdf` | Original do cliente. AutoCAD 2021, **vetorial**, 1 prancha de 7285 × 3345 pt. O texto sai limpo com `pdftotext` (não tem a fonte deslocada do PDF do R04). |
| `planta-v12.jpg` | A prancha inteira renderizada em 3600 px, para consulta rápida. |
| `setores-v12.jpg` | A mesma prancha com os **33 setores numerados** deste documento. |
| `rotulos-v12.tsv` | Todos os rótulos do desenho com a posição em % da prancha (x da esquerda, y do topo). |

Para ver um detalhe em alta, renderizar um recorte direto do PDF (exemplo: Hotel e Convenções a 200 dpi):

```sh
R=200; W=$((7285*R/72)); H=$((3345*R/72))
pdftoppm -r $R -x $((W*80/100)) -y $((H*8/100)) -W $((W*15/100)) -H $((H*14/100)) -png -singlefile \
  docs/masterplan-v12/BRACERUM_PARK_V12_2026-10-01.pdf /tmp/recorte
```

---

## 1. Como ler a prancha

- **Escala 1:1000.** Conferido no próprio desenho: o lote de "-200-" mede 200 mm no papel, e os
  2.100 m de frente para a rodovia ocupam ~80% da largura da prancha. Na prancha, **1% da largura
  ≈ 25,7 m** e **1% da altura ≈ 11,8 m** — é assim que as medidas "≈" deste documento foram tiradas.
- **Orientação.** A rosa dos ventos (N.V., canto superior direito) aponta o **norte para a direita**
  da prancha, ~9° para baixo. Portanto:

  | Na prancha | No terreno | O que tem lá |
  |---|---|---|
  | Topo | **Oeste** (lado do rio Paraguai) | Rodovia PY-19, Via Costeira, entrada, Outlet |
  | Direita | **Norte** | Hotel, Convenções, Escola, ETA, Resort |
  | Baixo | **Leste** | Pista de pouso, bloco de serviços, Hub, Grêmio |
  | Esquerda | **Sul** | Aeroporto de cargas, hangares, ETE, subestação |

  Bate com o estudo climático do R04 (`assets/park/clima-estudo.jpg`, "norte hacia arriba", rio a
  oeste) e com a vista aérea `assets/web/fotos/park-aereo-rio.jpg` (rio além da rodovia).
- **Cores do desenho.** Verde-claro = lote industrial · cinza = via/pátio pavimentado · verde forte =
  área verde/paisagismo · branco = área construída de uso coletivo · laranja = Hotel e quadras ·
  azul = água · linhas vermelhas no quadro de áreas = itens marcados "VALIDAR" — **o cliente validou todos em
  2026-10-16**.
- **Leitura macro.** Um polígono alongado com ~2,1 km de frente para a PY-19, em cinco faixas:
  1. **Frente da rodovia (oeste):** a entrada no meio da frente e o Outlet ao lado dela.
  2. **Miolo:** a grade industrial — 6 colunas × 7 linhas de quadras de 200 × 100 m.
  3. **Ponta norte (direita):** a "cidade" — Hotel, Convenções, Salão de Eventos, Escola, Resort,
     Condomínio Vertical, Centro Tecnológico.
  4. **Borda leste (baixo):** a pista de pouso em diagonal e, no fim dela, os serviços (refeitório,
     creche, resgate, Hub de serviços, Grêmio).
  5. **Ponta sul (esquerda):** aeroporto de cargas (hangares, heliponto, abastecimento) e a
     infraestrutura pesada (ETE, subestação, galpões de manutenção).

---

## 2. Quadro "Índices/Áreas" (transcrição literal)

| Item | Área / dado | Obs. |
|---|---|---|
| Área geral lote | 1.819,856 m² → **1.819.856 m²** | vírgula é erro de digitação do desenho |
| Centro de Convenções | 13.500 m² | |
| Hotel | 30.000 m² (**384 studios**) | |
| Estacionamento cidade/hotel | **2.036 vagas** | era 1.700 no V15 |
| Anfiteatro | **1.200 lugares** | |
| Salão de Eventos | 3.200 m² | |
| Escola | 2.775 m² (por piso) | **novo** |
| Bracerum Resort | **141 lotes · 142.067 m²** | igual ao V15 |
| Condomínio Vertical | 49.704 m² · **38 torres com 16 unidades (608 aptos)** | **novo** |
| Outlet | 57.750 m² (o rótulo na planta diz 58.000 m²) | **novo** |
| Lotes industriais | **781.777 m²** | era 989.642 m² no V15 |
| Aeroporto de Cargas Bracerum — pista de pouso + heliponto + área de escape e manobra | 73.750 m² | |
| Hangar + lounge + abastecimento | 7.686 m² | |
| Espaço Business / Centro Tecnológico | 2.340 m² (por piso) | era 1.140 m² |
| Creche | 2.083 m² | era 3.780 m² |
| Refeitório / Espaço Zen | 4.639 m² | era 5.907 m² |
| Ambulatório / Resgate / Brigadistas | 2.377 m² | era 1.964 m²; na planta está escrito "Hospital" — o nome oficial é **Ambulatório** |
| E.T.E. / Subestação de energia | 14.557 m² | juntas agora |
| E.T.A. | 2.665 m² | **separada da ETE** |
| Administração | 1.150 m² | |
| Área dos galpões de manutenção do Park | 4.125 m² | |
| Gate / acesso indústria | 680 m² | |
| Grêmio Recreativo | 2.975 m² | **novo** |
| Quadras/campos | 5.000 m² | "VALIDAR" no desenho — **validado** (16/10); posição não indicada na planta |
| Quadras esportivas / quiosques + Posto / salão / restaurante | 7.250 m² (os dois juntos) | "VALIDAR" no desenho — **validado** (16/10) |
| Clube do Caminhoneiro | 40.065 m² | "VALIDAR" no desenho — **validado** (16/10) |

Medidas escritas no próprio desenho: **frente para a rodovia 2.100 m** · **Via Costeira L = 13,00 m** ·
**pista de pouso 1.280 m · comprimento total 1.460 m** (o número público é **1.460 m**) · faixa verde de 16 m entre ETE e subestação ·
lote frontal de 433 × 50 m · aeroporto de cargas 42.060 m².

---

## 3. Setores, um a um

A numeração é a de `docs/masterplan-v12/setores-v12.jpg`. Posição em % da prancha (x, y).
"Fotos" lista os arquivos do repositório que mostram aquele espaço (ver §7 para o inventário).

### Frente da rodovia e entrada

**1 · Rodovia PY-19, Via Costeira e frente de 2.100 m** — (52, 6,5). A PY-19 corre por toda a
borda de cima (oeste). Entre ela e o parque há uma faixa verde e a **Via Costeira (13,00 m)**, uma via
paralela de serviço que distribui o acesso sem que o caminhão pare na rodovia. A frente total é de
**2.100 m**. No canto superior direito a faixa verde e a via contornam a ponta do Resort/Escola.
Fotos: `assets/renders/rodovia-acesso.jpg` (rodovia real), `assets/web/fotos/park-aereo-rio.jpg`.

**2 · Alça de acesso** — (42, 6). Laço viário que sai da PY-19, faz o retorno e entra na Via
Costeira bem em frente à entrada — é o único acesso desenhado da rodovia para o parque.

**3 · Clube do Caminhoneiro / pátio de caminhões** — (46,5, 13,5). **A entrada mudou de lugar:**
no V15 ficava no canto superior esquerdo da prancha; no V12 está **no meio da
frente da rodovia, na coluna 4 da grade**. Quadra de ≈ 243 × 119 m (≈ 29.000 m²; os 40.065 m² do
quadro devem incluir a alça e o verde da frente — validados pelo cliente em 16/10). Dentro: uma **rotatória** logo
depois da Via Costeira, três fileiras de **vagas de caminhão em espinha de peixe** (~40, contagem
visual) e uma fileira de vagas menores junto à via de saída.
Fotos: `assets/web/fotos/posto-caminhoes.jpg`, `assets/park/select-apoio-caminhoes.jpg`,
`assets/park/vias-caminhoes.jpg`.

**4 · Posto de combustível + salão/restaurante + quadra do clube** — (41,6, 15,8). No lado esquerdo
do pátio: uma **quadra poliesportiva** (laranja, futsal) e, logo abaixo dela, o **edifício em L**
(dois blocos em L encaixados, com contorno tracejado vermelho por dentro — provavelmente a cobertura
das bombas). É o "Posto / salão / restaurante" do quadro (7.250 m² junto com quadras/quiosques,
validado). À esquerda do L há um bloco branco que encosta na via da coluna 3.
Fotos: `assets/park/select-posto-cobertura.jpg`, `assets/park/select-posto-noturno.jpg`,
`assets/web/fotos/posto-caminhoes.jpg`, `assets/park/select-market-interior.jpg` (conveniência).

**5 · Gate / acesso indústria (680 m²)** — (48,3, 15,9). Bloco no lado direito do pátio, com a
**guarita** (retângulo vermelho) no meio da pista. É a porta da área industrial: depois dele começa
o **boulevard central (vertical na prancha)**, com canteiro arborizado, que atravessa o parque até o bloco de
serviços (setor 31). Foto: `assets/web/fotos/portaria.jpg` (pórtico com caminhão — é exatamente
este uso).

### Comércio na frente da rodovia

**6 · Outlet (57.750 m²; 58.000 m² no rótulo)** — (59,5, 11,5). **Novo.** Ocupa a frente da rodovia
à direita da entrada, nas colunas 5–6, em **L**: uma faixa ao longo da Via Costeira (≈ 433 m de
frente × 55 m) e uma faixa vertical (≈ 110 m de largura) que desce entre a grade industrial e a via
de acesso do Resort até o Supermercado (setor 8). É área branca — o desenho ainda não tem prédio.
Fotos que servem (comércio de rua/fachada): `assets/park/select-comercial-dia.jpg`,
`select-comercial-noite.jpg`, `select-fachada-brises.jpg`; `assets/renders/comercial-servicos-1/2/3.jpg`
(marca d'água OTIFF).

**7 · Lote frontal de 21.650 m²** — (61, 17,6). Faixa verde de **433 × 50 m**, logo abaixo do Outlet,
riscada em cerca de 18 módulos de ~24 m. **É lote industrial, não Outlet**: só com ele a soma dos lotes bate
com os 781.777 m² do quadro (ver §4). Frente para a via interna, fundo para o Outlet.

**8 · Supermercado (4.334 m²)** — (66,6, 42,5). **Novo.** Na ponta de baixo da faixa vertical do Outlet,
de frente para o boulevard horizontal que separa o Resort do Condomínio Vertical, com duas fileiras de
estacionamento arborizado. Foto: `assets/park/select-market-interior.jpg`.

### Ponta direita (norte) — a "cidade"

**9 · Centro Tecnológico + Espaço Business (2.340 m² por piso)** — (71,2, 16). Dois prédios em
trapézio, espelhados, dentro de uma quadra de cantos arredondados, **na esquina da via de acesso
do Resort com a Via Costeira** — é o primeiro edifício de quem entra pela via que leva ao Hotel e ao
Resort. "Centro Téc." à esquerda, "Espaço Business" à direita.
Fotos: `assets/park/tec-fachada.jpg`, `tec-recepcao.jpg`, `tec-lounge.jpg`, `tec-coworking.jpg`,
`tec-sala-reuniao.jpg`; `assets/renders/centro-empresarial-1/2.jpg` e `escritorios-1/2/3.jpg`
(OTIFF). **Atenção:** `centro-empresarial-2.jpg`, `escritorios.jpg` e `tec-sala-reuniao.jpg` mostram
um lago na janela — no V12 não há lago junto ao Centro Tecnológico (o lago do V15 ficava ali).

**10 · Estacionamento cidade/hotel (2.036 vagas)** — (77,5, 15,5). Os "pentes" de vagas com
palmeiras (carrinhos pretos e árvores verdes no desenho) que enchem a ponta da direita: um bloco de
quatro fileiras entre o Centro Tecnológico e o Salão de Eventos, e um bloco de seis fileiras × quatro
colunas entre o Hotel e o Resort, mais fileiras soltas junto à Escola. Os lagos que havia no meio do
estacionamento no V15 **saíram**.

**11 · Salão de Eventos (3.200 m²)** — (82,6, 10,6). Prédio retangular isolado, de contorno
vermelho, na borda da Via Costeira, entre o estacionamento e o Centro de Convenções. No V15 ficava
do outro lado da casca, à direita, mais ou menos onde hoje está a Escola.
Fotos: `assets/park/amen-salao-eventos.jpg`, `assets/Eventos.jpg`, `assets/renders/eventos-gastronomia-1.jpg`
(o mesmo salão de lustre).

**12 · Hotel — 384 studios, 30.000 m²** — (86, 17,3). O **bloco laranja**: lâmina de ≈ **72 × 34 m**
de projeção (≈ 2.450 m²; 30.000 m² ÷ 2.450 ≈ 12 pavimentos — conta minha, não do desenho),
encostada à esquerda da cobertura do Centro de Convenções, na parte de baixo dela, com um bloco cinza escalonado fazendo a
ligação entre os dois. É a torre de varandas dos renders.
Fotos: `assets/web/fotos/hotel-cupula-dia.jpg`, `hotel-cupula-piscina.jpg`, `hotel-fachada-varandas.jpg`,
`hotel-recepcao.jpg`, `hotel-quarto.jpg`, `hotel-suite.jpg`, `hotel-varanda-vista.jpg`;
`assets/park/hotel-aereo.jpg`, `hotel-conjunto.jpg`; `assets/Hotel.jpg`, `assets/convenco2.jpg`,
`assets/renders/capa-hotel-noturna.jpg`, `hotel-convencoes-noturna.jpg` (com o vermelho — fora do
site); `assets/web/hero-hotel-noturno.jpg`; planta do studio: `assets/renders/hotel-studio-planta.jpg`.

**13 · Centro de Convenções (13.500 m²) + anfiteatro de 1.200 lugares** — (90, 12,5). A **mancha
orgânica lilás** (≈ 150 × 95 m de envoltória) é a **cobertura em casca/gridshell** dos renders — a
"cúpula" ondulada de vidro. Dentro dela, duas formas cinza em asa (uma no topo, outra na ponta
oposta, com um volume circular). O anfiteatro de 1.200 lugares não tem posição própria no desenho:
fica dentro do centro de convenções.
Fotos: `assets/web/fotos/convencoes-foyer.jpg`, `convencoes-galeria.jpg`, `convencoes-galeria-2.jpg`,
`convencoes-restaurante.jpg`, `convencoes-restaurante-noite.jpg`, `convencoes-auditorio.jpg`,
`convencoes-auditorio-2.jpg`; `assets/park/hotel-galeria.jpg`, `hotel-galeria-marcas.jpg` (feira de
automóveis sob a casca), `hotel-fachada-azul.jpg`, `hotel-noturno.jpg`, `hotel-auditorio.jpg`
(planta do auditório); `assets/convencoes.jpg`, `assets/renders/pavilhao-eventos-1/2.jpg`.

**14 · Escola (2.775 m² por piso)** — (94,5, 18,5). **Novo.** Edifício em **arco segmentado**
(três alas curvas) no vértice da direita (norte), com uma **quadra poliesportiva** e um **parquinho** (ícones de
brinquedos) à frente. Fotos: nenhuma.

**15 · E.T.A. (2.665 m²)** — (94,5, 24,3). **Separada da ETE** e levada para o vértice da direita, ao lado da
Escola, numa quadra com borda verde. Desenho de estação de água: reservatório circular, tanque
menor, dois tanques retangulares (decantação e filtros) e um reservatório em losango.
Foto: `assets/park/ete-eta.jpg` (tanques — é genérica, serve para as duas estações).

**16 · Bracerum Resort — 141 lotes, 142.067 m²** — (79, 21,8). Condomínio fechado de casas no
centro da ponta norte. Desenho: um anel de lotes em volta de uma quadra central ("BRACERUM RESORT")
na parte de cima e um grande anel de lotes em volta do lago embaixo dele; ruas curvas; lotes em leque nas curvas.
Fotos: `assets/web/fotos/resort-lago.jpg`, `resort-casas-rua.jpg`, `resort-casa.jpg`,
`resort-rua-arborizada.jpg`; `assets/park/resort-implantacao.jpg` (vista aérea R04 — mostra o hotel
e a casca ao lado do condomínio, como no V12); `assets/casas.jpg`,
`assets/renders/condominio-casa-fachada.jpg`, `condominio-planta-humanizada.jpg` (planta de uma casa).

**17 · Lago central + coreto** — (79,5, 34,3). Lago alongado (≈ 160 × 44 m de espelho d'água) no
eixo horizontal do Resort, cercado de paisagismo e caminhos; o **coreto** é a ilha redonda ligada por passarelas
na ponta esquerda do lago. Uma fileira curva de árvores marca a praça entre o lago e o anel de cima.
Fotos: `assets/park/resort-lago-aereo.jpg`, `resort-lago-caiaque.jpg`, `resort-lago-fonte.jpg`,
`assets/web/fotos/resort-lago.jpg`.

**18 · Lazer do Resort (clubhouse)** — (88,2, 31,5). Na ponta direita do Resort: **clubhouse**
(prédios brancos de telhado), **piscina com deck** (piscina em L + piscina menor), **campo de
futebol** (verde-petróleo, com área e círculo central), **quatro quadras de areia** (salmão),
**quadra poliesportiva** (laranja), **piscina infantil/espelho d'água** (azul, pequena), **dois
lagos menores**, três pequenos edifícios sem rótulo e um quadrado cinza sem rótulo. Estacionamento curvo junto ao clubhouse.
Fotos: `assets/park/resort-clubhouse.jpg` (mesmo arranjo: campo, quadras, clubhouse),
`assets/web/fotos/amen-piscina-quincho.jpg`, `amen-quadra.jpg`; `assets/park/amen-quincho.jpg`.

**19 · Portaria do Resort** — (71,2, 31,6). Na via de acesso que desce entre o Outlet e o Resort:
uma ilhota com três cabines (os três quadradinhos) — o controle de acesso do condomínio.

**20 · Condomínio Vertical — 38 torres × 16 unidades = 608 aptos, 49.704 m²** — (75,8, 52,5).
**Novo.** Ocupa o canto inferior direito, abaixo do Resort, onde no V15 havia lotes industriais. Contei as
38 torres no desenho (cada uma com vagas dos dois lados), em quatro grupos:
- **7 torres** em fila logo abaixo do Resort, com um espelho d'água no meio (y ≈ 48%);
- **8 torres** na quadra da esquerda (3 + 2 + 3, com dois espelhos d'água no centro);
- **12 torres** na quadra da direita, triangular (6 + 2 + 4, com três espelhos d'água);
- **11 torres** na quadra de baixo, à esquerda (5 em coluna + 1 + 3 + 2 giradas na diagonal, com três espelhos d'água).

Entre o Resort e o condomínio passa o **boulevard horizontal arborizado** (a continuação do
boulevard industrial). Fotos: nenhuma.

**21 · Salão de festas + quadras do condomínio** — (73,2, 68,5). Quadra triangular entre os grupos
do condomínio: **"SL FESTAS"**, **campo society** (verde-petróleo), **quadra poliesportiva**
(laranja), **duas quadras de areia/tênis** (salmão), quiosques e vagas. Fotos: nenhuma.

### Miolo industrial

**22 · Lotes industriais — 41 lotes, 781.777 m²** — (38, 50,2). A grade: quadras de **200 × 100 m =
20.000 m²**, separadas por vias com rotatórias quadradas nos cruzamentos. **Cada quadra de 20.000 m²
está riscada em 16 módulos de 25 × 50 m (1.250 m²)** — 8 × 2. **O cliente confirmou (16/10): os
lotes são vendidos, e a venda pode ser fracionada a partir de um módulo de 1.250 m².** Os lotes da borda são trapézios
cortados pela diagonal do terreno ou da pista. Tabela completa em §4.
Fotos: `assets/web/fotos/galpao-docas.jpg`, `galpao-portico-azul.jpg`, `galpao-via.jpg`,
`park-boulevard-aereo.jpg`, `park-boulevard-aereo-2.jpg`, `vias-boulevard.jpg`, `vias-rotatoria.jpg`;
`assets/web/internas-01/02/06/07.jpg` (= `assets/INTERNAS PARK *.png`); `assets/park/vias-*.jpg`.

**23 · Canal de drenagem + ponte** — (22,2, 30). **Novo.** Um **canal** corre na vertical da prancha, no
canteiro da avenida entre as colunas 1 e 2, da rodovia até a altura do aeroporto (rótulo "CANAL" sete
vezes); onde ele cruza a Via Costeira há uma **PONTE** (22,4, 8). Fotos: nenhuma.

**24 · Administração do Park (1.150 m²; lote de 1.138 m²)** — (11,6, 38,5). Lotinho triangular na
borda esquerda da grade, rotulado "ADMINIST. PARK". **Não fica mais junto da entrada** (no V15 era
"Administração/Portaria/Acessos indústria").

### Ponta esquerda (sul) — infraestrutura e aeroporto

**25 · E.T.E. + Subestação de energia (14.557 m²)** — (8,6, 58,3). Quadra triangular na borda esquerda,
dividida por uma **faixa verde de 16 m**: à esquerda a **ETE** (dois tanques circulares, um
gradeamento e dois tanques menores); à direita a **subestação** (dois pátios de equipamentos ligados
por um trafo, e o quadrado vermelho de alta tensão). Foto: `assets/park/ete-eta.jpg`.

**26 · Galpões de manutenção do Park (4.125 m²)** — (12,6, 61,8). Faixa vertical na mesma quadra, à
direita da subestação, rotulada "GALPÕES MANUTENÇÃO PARK". Fotos: nenhuma.

**27 · Hangares + estacionamento do aeródromo** — (6,6, 66,9). Fileira de **7 blocos de hangar** (o
primeiro duplo) de frente para o pátio, cada um com a sua posição de aeronave marcada à frente; atrás
deles, a faixa "ESTACIONAMENTO AERÓDROMO".
Fotos: `assets/web/fotos/hangar-bracerum.jpg`, `hangar-interior.jpg`, `aero-patio-jato.jpg`.

**28 · Abastecimento + heliponto** — (15,6, 70). No fim da fileira de hangares, o bloco
"abastecimento" e, à frente dele, o **heliponto** (H em quadrado azul de borda amarela) com um
helicóptero desenhado — **o heliponto está no pátio dos hangares**, como o cliente confirmou em
16/09.

**29 · Aeroporto de Cargas Bracerum — pátio de 42.060 m²** — (9, 76,6). O pátio pavimentado
entre os hangares e a pista, com a ilha verde da taxiway. Área total do conjunto pista + heliponto +
escape + manobra: 73.750 m²; hangar + lounge + abastecimento: 7.686 m².
Foto: `assets/web/fotos/aero-pista-aerea.jpg` (pátio e hangares ao lado da pista).

**30 · Pista de pouso — 1.460 m** — (33, 84,2). O desenho escreve "pista de pouso 1.280 m ·
comprimento total 1.460 m"; **o número público, confirmado pelo cliente em 16/10, é 1.460 m** (substitui
os 1.480 m de setembro). Pista em
diagonal ao longo de toda a borda de baixo, com faixa verde dos dois lados e as duas cabeceiras
marcadas **"30"** (as duas com o mesmo número — erro do desenho; deveria ser 12/30).
Fotos: `assets/web/fotos/aero-pista-aerea.jpg`, `aero-cabeceira.jpg`; `assets/park/aero-pista.jpg`
(cabeceira "01" — numeração diferente da planta).

### Borda de baixo (leste) — serviços

**31 · Bloco de serviços (7.748 m²)** — (53,5, 86,6). Na coluna 5, no fim do boulevard central,
entre os lotes e a pista. Três partes, da esquerda para a direita: **Refeitório** (a maior) ·
**Creche / Espaço Kids** · **Ambulatório / Resgate / Bombeiros civis** (cruz vermelha — a planta
escreve "Hospital", mas **o nome oficial é Ambulatório**, em tudo). **A creche
mudou:** no V15 ficava na coluna da direita, abaixo do Resort; agora está aqui, no bloco de serviços.
Fotos: `assets/park/amen-comedor.jpg` (refeitório), `assets/renders/eventos-gastronomia-2/3.jpg`.
Creche e resgate: nenhuma.

**32 · Hub de Serviços para Indústrias (12.180 m²)** — (59,5, 87,6). **Uma quadra só** na coluna 6
(no V15 eram duas, de 3.360 e 7.470 m²). Área branca, sem prédio desenhado. Fotos: nenhuma.

**33 · Grêmio Recreativo (2.975 m²)** — (64,4, 84,6). **Novo.** Na ponta direita da quadra do Hub:
**campo society**, quatro quiosques, uma **piscina pequena** e o prédio do grêmio. Fotos: nenhuma
própria (os renders do "Clube Bracerum" — `assets/renders/clube-bracerum-*.jpg`, `assets/Clube.jpg`
— são de um clube com campo e quincho que não tem setor equivalente claro no V12).

---

## 4. Lotes industriais, quadra por quadra

Colunas C1 (esquerda, junto ao aeroporto/ETE) → C6 (direita, junto ao Outlet/condomínio); linhas
L1 (em cima, junto à rodovia) → L7 (embaixo, junto à pista). O canal fica entre C1 e C2; o
boulevard vertical, entre C4 e C5; o boulevard horizontal, entre L4 e L5.

| | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| **L1** | 10.398 | 20.000 | 20.000 | *entrada (setores 3–5)* | *Outlet* + lote 21.650 (433 × 50, C5–C6) | ← |
| **L2** | 16.520 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 |
| **L3** | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 |
| **L4** | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 |
| **L5** | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 |
| **L6** | 7.220 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 |
| **L7** | 15.619 | 15.445 | 20.830 | 25.943 | 20.000 | 20.000 |
| *abaixo* | *aeroporto* | *pista* | *pista* | *pista* | *serviços 7.748* | *Hub 12.180 + Grêmio* |

Mais o lote de borda **6.965 m²** (à esquerda de C1, altura L4) — e o lotinho da Administração
(1.138 m², à esquerda de C1, L3).

- **41 lotes industriais**, dos quais **32 são quadras-padrão de 20.000 m²**.
- Soma dos 41: **780.590 m²**. Com o lote da Administração: **781.728 m²** — a 49 m² do quadro
  (781.777 m²). O quadro parece contar a Administração junto.
- O maior lote é o de **25.943 m²** (C4/L7); o lote-padrão é **200 × 100 m**, divisível em módulos de
  **25 × 50 m (1.250 m²)**. **Venda** (não locação), fracionável a partir de um módulo.

---

## 5. Sistema viário e redes

- **Acesso único da rodovia:** PY-19 → alça (setor 2) → Via Costeira (13 m) → rotatória do pátio do
  Clube do Caminhoneiro → Gate (setor 5) → boulevard vertical.
- **Acesso à ponta da direita (Hotel/Resort/Outlet):** a Via Costeira continua para a direita e, na altura do
  Centro Tecnológico, uma via desce entre o Outlet e o Resort até o Supermercado, passando pela
  portaria do Resort.
- **Boulevard vertical** (canteiro com árvores) entre C4 e C5, do Gate ao bloco de serviços.
- **Boulevard horizontal** (canteiro com árvores) entre L4 e L5, da borda esquerda até o condomínio
  vertical, separando o Resort das torres.
- **Canal de drenagem** no canteiro entre C1 e C2, com ponte na Via Costeira.
- Cruzamentos da grade com **rotatórias quadradas** (ilhas no centro do cruzamento).
- O V12 só cota a Via Costeira. As larguras de via que o site usa em `qualidade.html`
  (25,60 / 16,60 / 11,60 / 10,60 m) vêm do esquema viário do R04 (`assets/park/vias-infografia.jpg`,
  `vias-corte.jpg`); o V15 cotava "Avenida L: 30,50 m" e "Via tipo 1 L: 15,80 m". **O V12 não
  confirma nem desmente** — continuam valendo até o cliente mandar o esquema viário novo.

---

## 6. O que mudou: planta do Catálogo V15 → V12

Referência anterior: `assets/renders/masterplan-implantacao.jpg` (planta do Catálogo V15, 19/08/2026).
É dessa planta que saíram os números que o site usa hoje.

| Tema | Catálogo V15 | V12 (01/10/2026) |
|---|---|---|
| **Entrada** | Canto superior esquerdo: Clube do Caminhoneiro, posto, quiosques, estacionamento de caminhões e de ônibus, Administração e "Entrada Indústria" | **Meio da frente da PY-19 (coluna 4)**, com alça, rotatória, pátio de caminhões, posto em L, quadra e Gate de 680 m² |
| **Administração** | Junto à entrada; "Administração/Portaria/Acessos indústria 3.510 m²" + "Administração 1 (por piso) 3.200 m²" | Lote isolado de 1.150 m² na borda esquerda |
| **Outlet** | Não existia | **57.750 m²** em L na frente da rodovia + **Supermercado 4.334 m²** |
| **Shopping/academia** | "Shopping/Academia 4.745 m²" junto a um lago, na coluna da direita | **Saiu do quadro** — o comércio virou Outlet + Supermercado |
| **Centro Tecnológico** | 1.140 m², "Centro Tec." junto à "Entrada Business" e a um lago | **2.340 m² por piso** + Espaço Business, na esquina da Via Costeira com o acesso norte; sem lago |
| **Lotes** | Quadras de **40.000 m² (200 × 200)**, total **989.642 m²**, com marcação VENDIDO/RESERVADO | Quadras de **20.000 m² (200 × 100)**, total **781.777 m²**, **sem** marcação de venda |
| **Creche** | 3.780 m², na coluna da direita junto ao Refeitório e ao Espaço Zen | **2.083 m², no bloco de serviços** junto à pista (com Refeitório e Resgate) |
| **Refeitório / Espaço Zen** | 5.907 m² (coluna da direita) | 4.639 m² (bloco de serviços) |
| **Ambulatório/Resgate** | 1.964 m² (coluna da direita) | 2.377 m² (a planta escreve "Hospital"; o nome é Ambulatório) |
| **Hub de serviços** | Duas quadras (3.360 + 7.470 m²) | Uma quadra de 12.180 m² |
| **Grêmio Recreativo** | — | **Novo**, 2.975 m² |
| **Condomínio Vertical** | — (eram lotes de 24.710, 28.325 e 16.067 m²) | **Novo**, 38 torres, 608 aptos, 49.704 m² |
| **Escola** | — | **Nova**, 2.775 m² por piso, no vértice da direita |
| **ETE / ETA** | Juntas, 10.650 m², na borda esquerda; subestação 11.375 m² à parte | **ETE + subestação juntas** (14.557 m²) na borda esquerda; **ETA separada** (2.665 m²) no vértice da direita |
| **Manutenção** | 1.153 m², canto inferior direito da grade | **Galpões de manutenção 4.125 m²**, junto à subestação |
| **Hotel / Convenções** | Mesma ponta da direita | Mesma ponta, encostados na Via Costeira; o **Salão de Eventos** trocou de lado (agora à esquerda da casca) |
| **Estacionamento** | 1.700 vagas, com lagos no meio | **2.036 vagas**, sem lagos ("Lagos 3.000 m²" saiu do quadro) |
| **Canal + ponte** | — | **Novo**, entre as colunas 1 e 2 |
| **Resort** | 141 lotes, 142.067 m² | Igual |
| **Aeroporto** | 42.060 m²; pista 1.280 m / total 1.460 m; heliponto junto ao abastecimento | Igual; número público da pista: **1.460 m** |

A planta ainda mais antiga, `assets/masterplan.jpg`, tinha "Data Center" e um bloco "Bracerum
Vendido" — já não vale para nada.

---

## 7. Fotos do repositório × setores do V12

### Com setor no V12
| Setor | Fotos |
|---|---|
| 1 Rodovia/acesso | `assets/renders/rodovia-acesso.jpg`, `assets/web/fotos/park-aereo-rio.jpg` |
| 3–4 Clube do Caminhoneiro, posto | `web/fotos/posto-caminhoes.jpg`; `park/select-apoio-caminhoes.jpg`, `select-posto-cobertura.jpg`, `select-posto-noturno.jpg`, `vias-caminhoes.jpg` |
| 5 Gate | `web/fotos/portaria.jpg` |
| 6 Outlet | `park/select-comercial-dia.jpg`, `select-comercial-noite.jpg`, `select-fachada-brises.jpg`; `renders/comercial-servicos-1/2/3.jpg` |
| 8 Supermercado | `park/select-market-interior.jpg` |
| 9 Centro Tecnológico | `park/tec-*.jpg` (5); `renders/centro-empresarial-1/2.jpg`, `escritorios-1/2/3.jpg`; `assets/escritorios.jpg` |
| 11 Salão de Eventos | `park/amen-salao-eventos.jpg`; `assets/Eventos.jpg`; `renders/eventos-gastronomia-1.jpg` |
| 12 Hotel | `web/fotos/hotel-*.jpg` (7); `park/hotel-aereo.jpg`, `hotel-conjunto.jpg`; `assets/Hotel.jpg`, `convenco2.jpg`; `renders/capa-hotel-noturna.jpg`, `hotel-convencoes-noturna.jpg`, `hotel-studio-planta.jpg`; `web/hero-hotel-noturno.jpg` |
| 13 Convenções | `web/fotos/convencoes-*.jpg` (7); `park/hotel-galeria.jpg`, `hotel-galeria-marcas.jpg`, `hotel-fachada-azul.jpg`, `hotel-noturno.jpg`, `hotel-auditorio.jpg`; `assets/convencoes.jpg`; `renders/pavilhao-eventos-1/2.jpg` |
| 15 ETA / 25 ETE | `park/ete-eta.jpg` |
| 16–19 Resort | `web/fotos/resort-*.jpg` (4), `amen-piscina-quincho.jpg`, `amen-quadra.jpg`; `park/resort-*.jpg` (5), `amen-quincho.jpg`; `assets/casas.jpg`; `renders/condominio-casa-fachada.jpg`, `condominio-planta-humanizada.jpg` |
| 22 Lotes / vias | `web/fotos/galpao-*.jpg` (3), `park-boulevard-aereo*.jpg` (2), `vias-*.jpg` (2); `web/internas-*.jpg` (4); `park/vias-*.jpg` (5) |
| 27–29 Aeroporto | `web/fotos/hangar-*.jpg` (2), `aero-patio-jato.jpg`, `aero-pista-aerea.jpg` |
| 30 Pista | `web/fotos/aero-pista-aerea.jpg`, `aero-cabeceira.jpg`; `park/aero-pista.jpg` |
| 31 Refeitório | `park/amen-comedor.jpg`; `renders/eventos-gastronomia-2/3.jpg` |
| Vista geral | `web/vista-aerea-park-02.jpg` (**layout do V15**, ver §8), `assets/Vista aérea park.png`, `web/fotos/park-aereo-rio.jpg` |

### Setores do V12 sem nenhuma foto
Escola (14) · Condomínio Vertical (20) · Salão de festas do condomínio (21) · Canal/ponte (23) ·
Administração (24) · Galpões de manutenção (26) · Creche e Ambulatório/Resgate (31) · Hub de serviços
(32) · Grêmio Recreativo (33) · Estacionamento (10).

### Fotos sem setor no V12
- `assets/park/fabrica-bracerum.jpg`, `assets/Fabrica.jpg`, `assets/renders/fabrica-bracerum-noturna.jpg`
  — **o V12 não marca nenhuma "Fábrica Bracerum"**.
- `assets/park/aero-torre.jpg` — **torre de controle**: o V12 não desenha torre.
- `assets/park/select-shopping-lago.jpg` (academia "Evoque" à beira de lago) — o V12 não tem
  academia nem lago no setor comercial.
- `assets/renders/clube-bracerum-1/2/3.jpg`, `assets/Clube.jpg`, `assets/park/amen-portico-lago.jpg`
  — o "Clube Bracerum" de fachada triangular; o V12 não tem um clube com esse programa (os candidatos
  são o Grêmio Recreativo e o lazer do Clube do Caminhoneiro — perguntar).
- `assets/park/amen-implantacao.jpg`, `amen-aereo-noturno.jpg`, `amen-quadras.jpg` — prédio de
  pátio central com tanques, campos e grande estacionamento (R04); sem equivalente claro no V12.
- `assets/park/clima-estudo.jpg` — estudo do R04, outra implantação; serve só para a orientação.

---

## 8. O que no site está desatualizado em relação ao V12

**Nada disto foi alterado ainda — o usuário pediu (2026-10-16) para não mexer no site por enquanto.**
É a lista para quando ele der o ok. Já incorpora as respostas do §9.

**A vista do masterplan da home.** `assets/web/vista-aerea-park-02.jpg` é um render do **layout do
V15**: entrada e Clube do Caminhoneiro no canto superior esquerdo, sem Outlet na frente da rodovia,
sem condomínio vertical nem escola. Os pinos podem ser corrigidos, mas o render em si não mostra a
entrada nova — **precisa de uma vista aérea nova do V12** (ou trocar o fundo pela planta).

Pinos e textos em `home.js` (array `AREAS`):
| Linha | Hoje | V12 |
|---|---|---|
| `home.js:17` Clube do Caminhoneiro | pino no canto superior esquerdo (33/30) | entrada no meio da frente da rodovia; 40.065 m² validado |
| `home.js:35` Portaria | "Administração · acessos indústria · 3.510 m²" | Gate de **680 m²**; Administração (1.150 m²) fica em outro lugar |
| `home.js:45` Fábricas Bracerum | pino na área industrial | **sai** — o cliente não vai mais colocar as fábricas (16/10) |
| `home.js:61` Lotes | "989.642 m² de lotes · módulos de 40.000 m²" | **781.777 m²**, quadras de **20.000 m²**, **venda a partir de 1.250 m²** |
| `home.js:64` Lotes (descrição) | "Galpões sob medida, venda ou locação, erguidos com o Steel Frame do próprio grupo" | lotes são de **venda**; o "Steel Frame do grupo" depende das fábricas (ver abaixo) |
| `home.js:76` ETE/ETA | "10.650 m² · subestação 11.375 m²" | ETE + subestação **14.557 m²**; ETA **2.665 m²**, separada, junto à Escola |
| `home.js:101` e `home.js:559` Pista | "1.480 m" | **1.460 m** (EN "1,460 m", ES "1.460 m") |
| `home.js:129` Hotel | "384 studios de 35 m² · 1.700 vagas" | 384 studios, 30.000 m², **2.036 vagas** (35 m² não está no V12) |

Textos de página:
- `index.html:276/278`, `select.html:7/58/62/72/74` — "shopping e academia": o V12 tem **Outlet
  (57.750 m²) e Supermercado (4.334 m²)**, sem academia.
- `select.html:118` — "caixa bancário no bloco de portaria e administração": Gate e Administração
  agora são lugares diferentes.
- `qualidade.html:137` — o pátio do caminhoneiro "com refeitório, vestiários e enfermaria": no V12 o
  refeitório e o ambulatório estão no bloco de serviços da borda de baixo, junto à pista, não no pátio.
- `select.html:163/164` — "Enfermaria e bombeiros civis" / "Enfermaria no bloco de apoio": o nome é
  **Ambulatório** (regra do cliente: "ambulatório" em tudo, nunca "hospital"; a "enfermaria" é o mesmo espaço e
  troca junto). Ajustar as chaves EN/ES junto.
- **Fábricas Bracerum** — o cliente não vai mais colocá-las. Sai com certeza o pino do masterplan
  (`home.js:45–55`). Os demais textos que falam das fábricas do grupo ficam para **confirmar com o
  cliente antes de mexer**, porque podem descrever a capacidade do grupo e não um setor do parque:
  `bracerum.html:7/66/134/140–152` ("três fábricas próprias em Villeta", "fabrica a própria obra"),
  `index.html:200` (foto da fábrica), `index.html:332` e `tributacao.html:243` ("Steel Frame do grupo").
- `resort.html:71` — Resort "separado da área fabril pelo lago e pelo cinturão verde": no V12 o lago
  fica **dentro** do Resort; quem separa o Resort da indústria é a faixa do Outlet e a via de acesso.
- `bracerum.html:154` — "+1.000.000 m² de área fabril": o V12 tem 781.777 m² de lotes industriais
  (se a frase fala do parque, está acima).
- **Assuntos novos que o site não cita:** Outlet, Supermercado, Escola, Creche/Espaço Kids,
  Condomínio Vertical (608 aptos), Grêmio Recreativo, Hub de serviços para indústrias, canal de
  drenagem.

---

## 9. Divergências e perguntas para o cliente

### Respondidas pelo cliente (2026-10-16)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Pista: 1.280 m (útil), 1.460 m (total) ou 1.480 m (site)? | **1.460 m.** É o número público; substitui os 1.480 m de 16/09. |
| 2 | Fábricas Bracerum: ficam dentro do parque? Em qual lote? | **"Não colocaremos mais."** Sai o pino do masterplan; os outros textos sobre as fábricas do grupo ficam para confirmar (§8). |
| 3 | Lotes em módulos de 1.250 m²: vender ou alugar? | **Vender.** Venda fracionável a partir de um módulo de 25 × 50 m (1.250 m²). |
| 4 | "Hospital" (planta) ou "ambulatório" (quadro)? | **Ambulatório, em tudo.** Nunca "hospital". As "enfermarias" que o site cita são o mesmo espaço — viram ambulatório também. |
| 5 | Itens "VALIDAR" do quadro | **Validados:** Clube do Caminhoneiro 40.065 m² · Quadras/campos 5.000 m² · Quadras/quiosques + Posto/salão/restaurante 7.250 m². |

### Ainda em aberto (menores, não bloqueiam nada)

1. **Cabeceiras.** As duas pontas da pista estão marcadas "30" (deveria ser 12/30). O render
   `aero-pista.jpg` mostra "01". Só importa se algum texto ou imagem citar a numeração.
2. **Bloco de serviços.** Refeitório (4.639) + Creche (2.083) + Ambulatório (2.377) = 9.099 m², mas o
   lote do bloco tem 7.748 m². As áreas do quadro devem ser construídas (com pavimento superior).
3. **Outlet:** 57.750 m² (quadro) ou 58.000 m² (rótulo)? Na dúvida, usar o do quadro. O lote de
   21.650 m² na frente é industrial (é o que fecha a soma de 781.777 m²).
4. **Quadras/campos (5.000 m²):** área validada, mas a planta não mostra onde ficam.
5. **VENDIDO/RESERVADO:** o V15 marcava lotes vendidos e reservados; o V12 não.
6. **Torre de controle, academia, Clube Bracerum:** existem renders, mas o V12 não tem esses
   programas — não usar essas imagens como se fossem setores do parque.
