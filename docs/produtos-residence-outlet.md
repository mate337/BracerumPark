# Produtos P5 (Residence) e P7-A (Outlet) cruzados com o Masterplan V14 — 04/11/2026

Registro do material comercial que o cliente enviou em 2026-11-04 e de como cada número se liga a um
lugar do **Masterplan V14 (28/10/2026)** (`docs/masterplan-v14.md`) e à tabela de lotes (P1 v3.1,
`3dmasterplan/data/precos.json`). **O site não muda**: continua valendo a regra de não mexer nele até o
usuário liberar.

## 0. O que chegou

| Arquivo | Produto | O que traz | No repositório? |
|---|---|---|---|
| `P5_Apresentacao_Investidores_PT` (.pdf e .pptx, mesmo conteúdo) | P5 Residence | tese, tipologias, plantas, tabela, conta do investidor | não (14 MB) |
| `P5_Tabela_de_Precos_Bracerum_Residence_PT` (.docx, rev. 28/10) | P5 | tabela por tipologia, composição da cobertura, descontos, condições | não |
| `P5_Tabela_Apartamento_a_Apartamento_Bracerum_Residence_PT` (.docx, rev. 04/11) | P5 | preço de cada um dos 1.200 aptos (tabela e à vista) | não |
| `P5_Simulador_Bracerum_Residence_Interno` (.xlsx, **uso interno**, enviado 2× idêntico) | P5 | premissas, proposta, VGV | **não** |
| `Controle_Unidades_Bracerum_Residence_MP14` (.xlsx, **uso interno**) | P5 | 1.200 linhas com código oficial, situação, preço | **não** |
| `P7A_Apresentacao_Investidores_Outlet_PT` (.pdf) | P7-A Outlet | tese, fases, cap rate, mix, três formas de investir | não (11 MB) |
| `Guia_Treinamento_Vendas_P7A_Bracerum_Outlet` (.docx, rev. 02/11) | P7-A | preços das lojas, conta do investidor, pool, objeções | não |
| `CONTRATO - CARTA DE RESERVA REVISADO - BILINGUE` (.docx) | modelo geral | reserva e direito de aquisição futura, PT/ES, 41 cláusulas | **não** |
| `empreendimentos_unidades` (.csv) | — | **modelo vazio** de importação do CRM (só o cabeçalho, 126 colunas) | sim, `docs/produtos/modelo_…csv` |

**Por que os originais não entram no repositório:** a Vercel publica o repositório inteiro a partir do
`main`, `docs/` incluído. O que é "uso interno" (simulador, controle, contrato) ficaria aberto em
`bracerumpark.com/docs/…`. Aqui só entra o que já é público (preços de tabela, posições).

## 1. Onde fica cada produto no V14

O V14 tem o norte à **direita** da prancha; topo = PY-19. Posições em metros da prancha (1:1000), lat/lon
pela mesma conversão da maquete (`build_refs.py`).

| Produto | Lugar no V14 | Área no quadro | Valor no material |
|---|---|---|---|
| **P1 Lotes industriais** | 615 lotes, Q01–Q42 (Q37 e Q11 fora) | 766.693 m² | US$ 110–253/m² conforme janela, categoria e volume |
| **P5 Bracerum Residence** (= "Bracerum Condo" da planta) | miolo da ponta norte, 67 torres | 114.273 m² | VGV de tabela **US$ 103.144.800** |
| **P7-A Bracerum Outlet** | em L na frente da PY-19, ao lado da entrada | 61.850 m² de terreno | ABL ≈ 35.514 m²; ativo US$ 33–50 mi |
| Bracerum Market | supermercado + 12 lojas (LJ1–LJ12) e docas | 4.606 m² | sem preço (âncora do Market) |
| P13 Bracerum Club | ao lado das torres, vértice norte | 40.706 m² | título incluído no apto; mensalidade de referência US$ 60 |

**Distâncias, das 67 torres do Residence** (centro da torre ao centro do prédio, em linha reta, no V14):

| Até | Mais perto | Mediana | Mais longe |
|---|---|---|---|
| Supermercado (Bracerum Market) | 92 m | 275 m | 453 m |
| Hotel | 95 m | 348 m | 646 m |
| Salão de eventos do Bracerum Club | 208 m | 424 m | 708 m |
| Bracerum Outlet | 261 m | 468 m | 648 m |
| Ambulatório / posto de saúde | 371 m | 557 m | 860 m |
| Escola / creche | 403 m | 602 m | 902 m |
| Hub de serviços para indústrias | 320 m | 646 m | 879 m |
| Gate / portaria da entrada | 769 m | 915 m | 1.133 m |
| Lote industrial mais próximo | 52 m (Q30.L008) | — | 506 m |

Isso confirma o que o material promete ("vizinho ao Market e ao Outlet", "Club ao lado", "escola,
creche e posto de saúde no entorno", "indústrias a 5 minutos"): tudo fica a menos de 1,2 km.

## 2. Bracerum Residence (P5) — números conferidos

- **1.200 aptos, 67 torres** (térreo de garagem + 4 andares, elevador). 3 quartos: 12 torres × 16 = 192;
  2 quartos: 39 × 16 = 624; 1 quarto: 16 × 24 = 384. **300 coberturas** (48 + 156 + 96) no 4º andar.
  Bate com o quadro do V14 e com a planta: o `build_data.py` lê **12 torres retangulares de ~383 m²**
  (4 × 97,40), **39 em cruz de ~272 m²** (4 × 68,27) e **16 de 1 quarto de ~607 m²**.
- **Regra de preço** (vale para os 1.200): arredonda a US$ 50 de área × 1.150 + terraço × 460 +
  6.800 nas coberturas. 1 quarto: finais **02 e 05 são a planta de 49,20 m²**, os demais 48,16 m².

  | Tipologia | Aptos | Tabela (20% + 12x) | À vista (−8%) | Aluguel ref. | Bruto |
  |---|---|---|---|---|---|
  | 1 quarto 48,16 m² | 192 | 55.400 | 50.968 | 460 | 10,0% |
  | 1 quarto 49,20 m² | 96 | 56.600 | 52.072 | 460 | 9,8% |
  | 2 quartos 68,27 m² | 468 | 78.500 | 72.220 | 640 | 9,8% |
  | 3 quartos 97,40 m² | 144 | 112.000 | 103.040 | 920 | 9,9% |
  | Cobertura 1q 48,16 + 48,16 | 64 | 84.350 | 77.602 | 700 | 10,0% |
  | Cobertura 1q 49,20 + 49,20 | 32 | 86.000 | 79.120 | 700 | 9,8% |
  | Cobertura 2q 68,27 + 68,27 | 156 | 116.700 | 107.364 | 960 | 9,9% |
  | Cobertura 3q 97,40 + 97,40 | 48 | 163.600 | 150.512 | 1.340 | 9,8% |

- **VGV de tabela US$ 103.144.800** — a mesma cifra no simulador, no Controle, na tabela apto a apto
  e no script deste repositório. Por tipologia: 3q US$ 23.980.800 · 2q US$ 54.943.200 · 1q
  US$ 24.220.800. Torre de 3q vale US$ 1.998.400; de 2q, US$ 1.408.800; de 1q, US$ 1.513.800.
- **Área privativa total** 79.927,84 m² + 19.982 m² de terraços. Sobre os 114.273 m² do terreno:
  0,70 m² privativo por m² e **≈ US$ 903 de VGV por m² de terreno** — 5,6 × o lote industrial Padrão
  da janela Expo (US$ 160/m²).
- **Controle × Tabela apto a apto:** as 1.200 linhas batem uma a uma (código, área, preço de tabela e
  à vista). `python3 docs/produtos/build_unidades.py --controle <xlsx>` refaz a conferência.
- **Conta do investidor** confere: 2q 640 × 12 / 78.500 = 9,78% bruto; líquido 9,78% × 23/24 × 0,90 =
  8,44%; com 15% de volume, 7.680 / 66.725 = 11,5%.
- **Vagas** 2.016 = 384 (1q) + 2 × 816 (2q e 3q); 1.200 cobertas no térreo e 816 descobertas — iguais
  ao quadro do V14 (384 + 1.248 + 384).

## 3. Bracerum Outlet (P7-A) — números conferidos

- **ABL ≈ 35.514 m²** = 17.757 + 10.654 + 7.103 (fases 1–3), ≈ 224 lojas. Sobre os 61.850 m² de terreno
  do V14: 57%.
- **Venda do ativo:** NOI US$ 3,4–4,7 mi ÷ cap 10,5–9,5% = US$ 32,4–49,5 mi ("≈ 33–50 mi"). Por m² de
  terreno: US$ 524–800. O aluguel mínimo de referência do guia (US$ 12,50/m²/mês) dá 35.514 × 150 ×
  0,92 × 0,93 = US$ 4,56 mi de NOI: o topo da faixa.
- **Lojas à venda (Fase 1)**: compacta 40–80 m² a US$ 1.700–2.100/m²; padrão 80–200 m² a 1.400–1.700;
  grande 200–400 m² a 1.250–1.550. Fases 2 e 3: +8% a 10%. A conta da loja padrão de 120 m² a 1.550
  confere: US$ 186.000; 18.000 × 0,92 × 0,93 = 15.401 → 8,3% líquido; na garantia 9,0%; total 16,6%.
  As de compacta (8,6% → 16,9%) e grande (7,3% → 15,6%) também.
- **As lojas não têm unidade nem posição** em nenhum arquivo: nem planta de lojas, nem numeração,
  nem qual perna do L é a Fase 1. Por isso o Outlet **não entra** no CSV de unidades.

## 4. Divergências encontradas (para o cliente decidir)

1. **Mix do Outlet:** a apresentação diz esportiva 18%, casual/jeans 14%, calçados 10%, eletrônicos 9%;
   o guia de vendas diz 17%, 12%, 9% e **12%**. Moda brasileira (13%) e alimentação (7%) batem.
2. **Vagas do Outlet:** "≈ 1.800 vagas" no Outlet × **1.986 autos + 500 motos no parque inteiro** (V14),
   divididas com hotel (384 studios), convenções (1.200 lugares), Centro Tecnológico e Club. Ou as
   1.800 são as do estacionamento compartilhado, ou falta estacionamento.
3. **Residence, slide 15:** "1 quarto: US$ 460 sobre US$ 56.000" — US$ 56.000 não é preço de tabela
   (55.400 ou 56.600).
4. **Residence, mapa de tipologias** (slide 5, tabelas .docx): a legenda fala em azul/verde/amarelo,
   mas a imagem **não tem as torres pintadas**. Também não há numeração das torres (T01…T67).
5. **Valorização "20% a 30% em ≈ 3 anos" = 6,3% a 9,1% a.a.** O "cenário base" de 8,3% a.a. equivale a
   27%, no terço de cima da faixa (o meio, 25%, daria 7,7%). Os retornos totais de 16–17% dependem disso.
6. **Fase de obra:** a tabela diz que o preço "sobe por fase de obra" (planta → fundação → torre
   entregue), mas os fatores no simulador e no Controle estão em 1,00 / 1,00 / 1,00 ("a definir pela
   diretoria"). **Taxa condominial** também em branco (US$ 0, "definir com P3").
7. **Descontos acumulam?** O simulador e o Controle multiplicam à vista (−8%) e volume (até −15%):
   2q à vista com 25+ unidades = US$ 61.387 (12,5% bruto). A tabela pública não diz se acumulam.
8. **Contrato de reserva:** o modelo é de **lote** (Lote/Quadra, uso "industrial / logístico /
   serviços", tolerância de área ±5%, condição suspensiva do fracionamento) — serve para o P1. Para o
   Residence faltam torre/apto, área privativa, vagas, terraço, entrega por torre e o regime de
   condomínio; para as lojas do Outlet faltam pool de locação, aluguel garantido de 24 meses e recompra
   no 5º ano a cap 10%. O sinal está em branco ("[__]%"); o P5 fala em **sinal de 1%, válido por 30
   dias**, e os lotes em 20% + 12x. O que bate: área do empreendimento (1.820.000 m² ≈ 1.819.856 do V14)
   e o **Livro de Controle de Unidades** da cláusula 32 (situações e prazo de 5 dias úteis = Controle
   .xlsx, que acrescenta BLOQUEADA).
9. **Nome:** a planta e a maquete chamam de **"Bracerum Condo"**; o material comercial, de
   **"Bracerum Residence"**.
10. **Maquete 3D:** desenha as torres de 1 quarto com **6 pavimentos** (estimado por 24 unidades); o P5
    diz **térreo de garagem + 4 andares, 6 aptos por andar**. Corrigir quando a maquete for revista
    (`build_data.py`, tag `torre1`, e o texto do cartão `condo` no `app.js`).
11. **Market × Outlet** (§5.4 do V14) continua aberto, mas avançou: P5 e P7-A tratam o **Bracerum
    Market como supermercado + lojas** ("o supermercado no Market") e o recorte do P7-A põe o rótulo do
    Outlet na faixa ao longo da PY-19. A maquete chama a perna vertical do L de "Bracerum Market"; o
    quadro do V14 chama o L inteiro de Outlet (61.850 m²). Pedir ao cliente qual é qual.

## 5. Valor total à venda, por lugar (referência)

| | Base | Valor |
|---|---|---|
| Residence | tabela, 1.200 aptos | US$ 103,1 mi |
| Lotes industriais | 615 lotes, 1 a 8 lotes, 20% + 12x | Expo US$ 125,3 mi · Pós-Expo 145,1 · Fase 1 plena 172,4 |
| Lotes industriais | mesma base, faixa de 33+ lotes | Expo US$ 91,3 mi · Pós-Expo 105,8 · Fase 1 plena 125,3 |
| Outlet | venda do ativo pela renda | US$ 33–50 mi |

## 6. CSV de unidades para o CRM

**Códigos:** cada unidade leva o código de 7 dígitos do padrão em `docs/padrao-de-codigos.md`
(`4010732` = Residence T07 apto 302; `3020714` = lote Q07.L014), na coluna `Código interno`.

`docs/produtos/build_unidades.py` gera **um CSV por categoria** (`docs/produtos/unidades_1_hotel.csv`
a `unidades_4_condominios.csv`, lista no `docs/padrao-de-codigos.md`) no formato exato do modelo
enviado (mesmas 126 colunas, `;`, UTF-8 com BOM, vírgula decimal), com **2.269 unidades**. Os 1.200
apartamentos e os 615 lotes industriais levam **preço e latitude/longitude**; Hotel, Market, hangares,
Hub, Resort e os lotes fora da oferta levam local, sem preço. Também gera `docs/produtos/torres_residence.json` (torre, tipologia, posição, VGV e
distâncias da tabela do §1).

- **Residence:** Empreendimento = Bracerum Residence (sigla RES) · Etapa = pré-lançamento · Bloco =
  torre · Unidade = código oficial (`RES T07 – 302`) · andar, coluna, tipologia, quartos, banheiros,
  suítes, vagas, área privativa, terraço, preço de tabela. Lat/lon = centro da torre.
- **Lotes:** Empreendimento = Bracerum Park — Lotes industriais (LTIND) · Bloco = quadra · Unidade =
  `LTIND.Qxx.Lyyy` · área de contrato, categoria, nome oficial do V14 e preço da **janela vigente no dia
  em que o script roda** (1 a 8 lotes, 20% + 12x). Lat/lon = centro do lote. Rodar de novo quando a
  janela virar (14/11/2026 e 01/04/2027).
- **Em branco de propósito** (o CRM pede, os arquivos não trazem): matrícula/finca, CEP, datas de
  lançamento e entrega, centro de custo, percentuais de participação.
- **⚠️ Numeração das torres no mapa é proposta.** O kit só diz T01–T12 = 3q, T13–T51 = 2q, T52–T67 =
  1q; não diz onde fica cada uma. O script numera, dentro de cada tipologia, na ordem de leitura da
  prancha (de cima para baixo, da esquerda para a direita). Lat/lon de cada apto depende disso. Trocar
  quando chegar a planta numerada.

## 7. A pedir ao cliente

1. Planta do Residence com a **numeração das torres** (e a imagem de tipologias pintada).
2. **Planta de lojas do Outlet**: quantas, onde, qual perna do L é cada fase, quais são âncoras.
3. **Market × Outlet** na faixa vertical (item 11).
4. **Mix do Outlet** que vale (item 1) e de onde saem as ≈ 1.800 vagas (item 2).
5. **Fatores de fase de obra**, **taxa condominial** e se **à vista e volume acumulam** (itens 6–7).
6. **Contratos de reserva específicos** para apartamento e para loja (item 8).
7. Quais torres entram na **1ª fase** lançada na Expo.
