# Prompt — vista aérea do Bracerum Park (Masterplan V12) para o ChatGPT Astra-6

Objetivo: uma imagem aérea fotorrealista, **atualizada para o Masterplan V12 (01/10/2026)**, com o
parque inteiro **no lugar real (Ruta PY-19, km 35, Villeta)** e **sem nenhuma legenda ou texto**.
Montado em 2026-10-16 com as respostas do cliente: pista de **1.460 m**, **sem as Fábricas
Bracerum**, lotes **vendidos a partir de 1.250 m²**, **ambulatório** (nunca "hospital") e os itens
"VALIDAR" do quadro de áreas **validados**. O registro completo da planta está em
`docs/masterplan-v12.md`.

Tudo o que é preciso está nesta pasta: este prompt e as 8 imagens de referência (A–H).

## Como usar

1. Abra uma conversa nova no ChatGPT (Astra-6).
2. Anexe as imagens **nesta ordem**: A, B, C, D, E, F, G, H. Se houver limite de anexos, as
   indispensáveis são **A, B e D**, depois C e E.
   Se o Astra-6 tiver um modo de **editar uma imagem**, use **A como a imagem a editar** e as demais
   como referência: é o que mais segura a implantação no lugar.
3. Cole o **prompt principal** (seção 2) inteiro e envie. Se o Astra-6 cortar, resumir ou recusar
   o texto longo, use a **versão curta**, logo abaixo dele.
4. Confira o resultado com o **checklist** (seção 4). Para corrigir, use os **prompts de ajuste**
   (seção 3) **na mesma conversa, um problema por vez**: pedir tudo de uma vez faz o gerador
   refazer a imagem inteira e perder o que já estava certo.
5. Quando estiver aprovada, peça a versão final no maior tamanho disponível.

Gerador de imagem não acerta contagem exata (41 lotes, 38 torres, 7 hangares) na primeira. O que
importa conferir é a **organização**: a entrada no meio da frente, a grade regular, a pista no
primeiro plano, o conjunto hotel + cobertura à direita, o resort com o lago, as torres baixas.

## 1. As referências

| | Arquivo | Para que serve | O que **não** copiar |
|---|---|---|---|
| **A** | `ref-A-camera-volumes.png` | **A base.** Câmera exata e volumes no lugar (galpões, hotel, casca, torres, casas, hangares), sobre a planta e o entorno real. | O aspecto de maquete, as cores chapadas e o entorno simplificado. |
| **B** | `ref-B-planta-v12.png` | A planta V12 vista de cima, **sem nenhum texto**. Vias, quadras, lagos, quadras esportivas, implantação de cada prédio. | As cores do desenho. |
| **C** | `ref-C-situacao.jpg` | O terreno no entorno real, de cima: PY-19, riachos, matas, rio Paraguai. | O estilo de mapa. |
| **D** | `ref-D-estilo.jpg` | O padrão de render já aprovado (luz, realismo, densidade de detalhe). | **A implantação e a posição do rio** — é de uma versão antiga. |
| **E** | `ref-E-hotel-convencoes.jpg` | Hotel (lâmina com varandas e brises) e a cobertura ondulada do centro de convenções. | — |
| **F** | `ref-F-industrial-vias.jpg` | Galpões com o pórtico azul, boulevard, rotatória, portaria. | — |
| **G** | `ref-G-resort.jpg` | Casas, clube, lago e piscina do resort. | — |
| **H** | `ref-H-servicos.jpg` | Pista e pátio, hangar, posto, comércio, centro tecnológico, estação de tratamento. | — |

As referências **não têm texto de propósito**: gerador de imagem copia rótulo de referência para a
imagem final. Nas fotos D–H o vermelho saturado (lanterna, cruz, flor) foi dessaturado, pela regra
da marca.

## 2. Prompt principal

Copiar tudo o que está dentro do bloco:

```text
Crie uma única imagem fotorrealista: vista aérea oblíqua, de drone, de uma cidade industrial planejada inteira, já construída e em funcionamento, em Villeta, Paraguai — à margem leste da Ruta PY-19, na altura do km 35, numa planície plana a cerca de 3 km do rio Paraguai. Formato paisagem 3:2, no maior tamanho disponível. É uma imagem para investidores: arquitetura contemporânea, limpa e realista. A imagem não pode ter nenhum texto, legenda ou sobreposição.

IMAGENS ANEXADAS — como usar cada uma
A) Guia de câmera e de volumes. É a base da composição: repita exatamente este ponto de vista, este ângulo, este enquadramento, e a posição e o tamanho relativo de cada volume, quadra, via, lago e da pista. Os blocos cinza e brancos são volumes provisórios: transforme cada um em arquitetura real. Não copie as cores chapadas nem o aspecto de maquete; o entorno desta guia é simplificado — siga o texto.
B) Planta oficial vista de cima (a rodovia é a borda de cima; o norte aponta para a direita). Vias, quadras, lagos, quadras esportivas e a implantação de cada prédio seguem esta planta. As linhas finas dentro dos lotes são divisas de módulos, não muros.
C) Situação real vista de cima: a rodovia, os riachos, as matas e o rio em volta do terreno (o parque é o polígono no centro-baixo).
D) Referência de estilo e de acabamento do render (luz, realismo, densidade de detalhes). Não copie a implantação nem a posição do rio desta imagem — ela mostra uma versão antiga do projeto.
E) Hotel e centro de convenções aprovados. F) Galpões, vias, rotatórias e portaria aprovados. G) Condomínio de casas e clube aprovados. H) Pista e hangar, posto, comércio, centro tecnológico e estação de tratamento aprovados.

O LOCAL (é um lugar real — respeite)
- Terreno totalmente plano: várzea do rio Paraguai. Nada de morros, serras, mar ou cidade grande no horizonte.
- A Ruta PY-19 é uma rodovia asfaltada de pista simples, com acostamento, com alguns caminhões e carros. Ela corre reta ao longo de todo o fundo do parque e, bem na ponta direita dele, faz uma curva suave e segue em diagonal até o horizonte, à direita.
- Do outro lado da rodovia: pastos e campo nativo, casas de fazenda esparsas, estradas de terra bege e — exatamente em frente à ponta direita do parque — uma pequena unidade agroindustrial existente, com um galpão e silos metálicos redondos (é real; mantenha pequena e discreta). Mais ao fundo, um riacho muito sinuoso com mata ciliar fechada; ao longe, no canto superior direito, o largo rio Paraguai, de água barrenta que brilha prateada, com bancos de areia e ilhas, e a outra margem (Argentina) plana e verde.
- Em volta do parque e no primeiro plano: campo nativo úmido em tons de verde-oliva e palha, palmeiras karanda'y esparsas, ilhas de mata nativa densa e um banhado (estero) com água rasa e um córrego estreito e sinuoso. Solo bege-acinzentado — não é terra vermelha.

A CÂMERA
Câmera a leste do parque, sobre o banhado, a cerca de 1,6 km de altura, olhando para o oeste, inclinada uns 35° para baixo; lente equivalente a 28 mm. O parque inteiro cabe no quadro, ocupando a metade de baixo da imagem e quase toda a largura, com uma faixa de campo abaixo da pista. A pista de pouso fica no primeiro plano, atravessando a imagem; a rodovia passa ao fundo do parque; a parte urbana (hotel, resort, condomínio, escola) fica à direita; o aeroporto de cargas fica à esquerda. A metade de cima mostra o entorno e, no canto superior direito, o rio.

O PARQUE — o que fica onde (sempre como na guia A e na planta B)
É um polígono alongado de ~2,1 km por ~1,2 km: a borda do fundo é reta, ao longo da rodovia; a ponta direita é aguda; a borda direita desce em diagonal; a borda da frente é a pista; a borda esquerda é diagonal.

No fundo, junto à rodovia (da esquerda para a direita):
1. Por toda a frente: uma faixa verde e uma via de serviço paralela à rodovia. Um canal de drenagem retilíneo, de margens gramadas, atravessa o parque da via de serviço até o aeroporto, entre a primeira e a segunda coluna de lotes, com uma pequena ponte na via de serviço.
2. A entrada, no meio da frente: uma alça sai da rodovia e chega a uma rotatória; depois dela, um pátio de caminhões com três fileiras de vagas em espinha de peixe e carretas estacionadas. À esquerda do pátio, um posto de combustível com cobertura em L, loja e restaurante e uma quadra esportiva pequena; à direita, a portaria — guaritas sob um pórtico de cobertura metálica — de onde sai o boulevard central, em direção à câmera.
3. À direita da entrada: o outlet — um centro comercial térreo e comprido (cerca de 430 m ao longo da rodovia), com lojas em fileira e estacionamento arborizado. Ele vira em L e desce pela lateral direita da área industrial até um supermercado com estacionamento.
4. Mais à direita, na esquina da via que entra para o resort: o centro tecnológico — dois prédios corporativos baixos, espelhados, de planta trapezoidal, com brises e vidro.

No centro — a área industrial:
Uma grade regular de 6 colunas por 7 fileiras de lotes de 200 x 100 m (o lado de 200 m paralelo à rodovia); a fileira junto à rodovia é interrompida pela entrada e pelo outlet. Ruas asfaltadas com calçadas e árvores, e pequenas rotatórias quadradas nos cruzamentos. Dois boulevards com canteiro central arborizado com palmeiras: o central, que sai da portaria em direção à câmera, e um transversal no meio da grade, paralelo à rodovia. Todos os lotes construídos e em operação: em cada um, um galpão logístico/industrial de cerca de 12 m de altura com pátio de caminhões, docas e escritório na frente. Varie como na guia A — a maioria com um galpão grande, alguns com dois galpões médios, alguns com quatro galpões modulares menores. Os lotes junto às bordas diagonais são trapézios, com galpões menores. Caminhões nas docas, carros nos estacionamentos.

À direita — a parte urbana (do fundo para a frente):
5. Estacionamentos grandes em pentes, com palmeiras entre as vagas (cerca de 2.000 vagas), entre o centro tecnológico, o salão de eventos e o hotel.
6. O salão de eventos: um pavilhão retangular baixo, junto à via de serviço.
7. O centro de convenções: uma grande cobertura orgânica e ondulada em malha de aço branca com vidro (gridshell), de uns 150 x 95 m e cerca de 20 m no ponto mais alto, como na referência E. Encostada nela, à esquerda e um pouco à frente, a torre do hotel: uma lâmina de cerca de 10 pavimentos, com a fachada longa voltada para a câmera, varandas contínuas, brises verticais de madeira e jardins nas varandas, em tons de areia. É o prédio mais alto do parque.
8. Na ponta direita, junto à curva da rodovia: a escola — prédio baixo de 2 pavimentos em arco segmentado (três alas curvas) — com uma quadra esportiva e um parquinho; logo à frente dela, uma pequena estação de tratamento de água (um reservatório redondo e alguns tanques).
9. O resort: condomínio fechado de cerca de 140 casas contemporâneas de 1 e 2 pavimentos (concreto claro, madeira e vidro, telhado plano ou cinza-grafite, piscina no quintal), em ruas curvas: um anel de casas no fundo e um anel maior em volta de um lago alongado no centro, com uma ilhota redonda com coreto ligada por passarelas na ponta esquerda do lago, e muito paisagismo. Na ponta direita do resort, o clube: casa-clube, piscina com deck, campo de futebol gramado, quatro quadras de areia, uma quadra poliesportiva e dois laguinhos. A portaria do condomínio fica na via de acesso, à esquerda do resort.
10. À frente do resort, depois de um boulevard arborizado: o condomínio vertical — 38 prédios residenciais iguais, de 4 pavimentos, com planta em H, brancos com detalhes em madeira, em quatro grupos; cada prédio com vagas dos dois lados, e pequenos espelhos d'água e jardins entre eles. Num quarteirão triangular entre os grupos: um salão de festas, um campo society, uma quadra poliesportiva e duas quadras de areia.

À esquerda (do fundo para a frente):
11. Na borda esquerda da grade: um prédio administrativo pequeno; mais à frente, a estação de tratamento de esgoto (dois tanques redondos e tanques menores) e a subestação de energia (pátios de transformadores), separadas por uma faixa verde, e um galpão de manutenção comprido.
12. O aeroporto de cargas: uma fileira de 7 hangares lado a lado, de frente para um pátio asfaltado com jatos executivos e turbo-hélices brancos estacionados; um heliponto quadrado no pátio, um ponto de abastecimento e um estacionamento atrás dos hangares.

Na frente:
13. A pista de pouso, com 1.460 m: asfalto cinza-escuro, faixa central tracejada branca e marcações de cabeceira nas duas pontas, com faixas de grama dos dois lados. Ela atravessa a frente do parque desde a esquerda (junto aos hangares) até mais ou menos dois terços da largura da imagem.
14. À direita, entre a última fileira de lotes e o trecho final da pista: um bloco de serviços baixo (refeitório, creche com parquinho, ambulatório e base dos bombeiros); mais à direita, um centro de serviços para indústrias e um pequeno clube dos funcionários com campo society, quiosques e piscina.

DESIGN — materiais, cor e luz
- Galpões: painéis metálicos brancos e cinza-claros, telhados metálicos cinza-claros com faixas de iluminação zenital, docas com portas seccionais, escritórios de 2 pavimentos com vidro e o pórtico de aço azul-escuro (#1c4d9d) da referência F — esse azul aparece só nesses pórticos.
- Hotel, centro de convenções, centro tecnológico, outlet e escola: arquitetura contemporânea e sóbria — concreto claro, vidro, madeira e brises.
- Vias de asfalto escuro com faixas brancas e calçadas claras; paisagismo farto, com grama, palmeiras e árvores nativas de copa verde; lagos e piscinas verde-água. Veículos brancos, prata, cinza ou pretos.
- Paleta: brancos, cinzas, beges, areia e marrom, mais o verde da vegetação e a água. ZERO VERMELHO: nenhum telhado de telha de barro e nenhum veículo, toldo, flor, letreiro, quadra ou pista vermelha, laranja ou rosa; nenhuma cruz vermelha.
- Luz de fim de tarde, dourada e suave, vindo da esquerda e um pouco de frente, com o sol fora do quadro; sombras longas e nítidas; céu limpo; névoa leve no horizonte; o rio refletindo o céu.
- Render arquitetônico fotorrealista de alto padrão (qualidade Unreal, V-Ray ou Lumion), nítido, com escala de pessoas e veículos coerente e sem distorção de lente.

PROIBIDO
Qualquer texto, letra, número, legenda, rótulo, título, logotipo, marca d'água, assinatura, moldura, borda, seta, rosa dos ventos, escala gráfica, pino, ícone ou mapa sobreposto. Nenhum letreiro legível em fachadas, telhados, placas ou no chão — as únicas marcações permitidas são as de pavimento (faixas, zebras de cabeceira e o H do heliponto, sem números). Não invente prédios altos além do hotel, torre de controle, fábricas com marca, morros, mar, praia ou cidade no horizonte. Não ponha o rio colado na rodovia. Não use estilo de desenho, maquete, mapa ou pintura.

ANTES DE ENTREGAR, CONFIRA
Parque inteiro no quadro · rodovia ao fundo, com a curva na ponta direita · entrada no meio da frente · grade industrial regular · pista no primeiro plano · hotel com a cobertura ondulada à direita · resort com o lago · prédios em H à frente do resort · hangares e heliponto à esquerda · rio ao longe, no canto superior direito · nada escrito · nada vermelho.
```

### Versão curta

Se o Astra-6 cortar, resumir ou recusar o prompt longo, use esta, com as mesmas imagens anexadas:

```text
Render arquitetônico fotorrealista, vista aérea oblíqua de drone, formato 3:2, de uma cidade industrial planejada, completa e em operação, em Villeta, Paraguai, à margem leste da Ruta PY-19 (km 35), numa planície totalmente plana a 3 km do rio Paraguai. Use a imagem A como base exata da câmera e da posição de cada volume; a planta B como desenho oficial; C para o entorno real; D para o estilo; E a H para a arquitetura de cada prédio.
Câmera a leste, a 1,6 km de altura, olhando para o oeste, inclinada 35° para baixo, lente de 28 mm, com o parque inteiro no quadro.
Fundo: a PY-19 reta, com uma curva suave na ponta direita; a entrada no meio da frente (alça, rotatória, pátio de caminhões, posto, portaria); à direita dela, um outlet térreo em L que desce até um supermercado. Centro: grade regular de 6 x 7 lotes de 200 x 100 m com galpões brancos de 12 m, pátios de caminhões, ruas arborizadas, dois boulevards com palmeiras e um canal de drenagem. Direita: centro tecnológico, salão de eventos, estacionamentos com palmeiras, o centro de convenções com cobertura ondulada de aço branco e vidro e a torre do hotel de cerca de 10 pavimentos encostada nele (o único prédio alto); a escola em arco na ponta; o resort de cerca de 140 casas em volta de um lago alongado com coreto, com o clube na ponta; à frente dele, 38 prédios residenciais de 4 pavimentos em planta H. Esquerda: estação de esgoto, subestação, 7 hangares com jatos executivos e um heliponto. Frente: a pista de 1.460 m e um bloco de serviços.
Entorno: campo úmido com palmeiras karanda'y, ilhas de mata e banhado; do outro lado da rodovia, pastos, os silos de uma pequena agroindústria existente, um riacho com mata ciliar e, ao longe, no canto superior direito, o rio Paraguai.
Luz dourada de fim de tarde vinda da esquerda. Paleta de branco, cinza, bege, areia, marrom e verde; zero vermelho, laranja ou rosa. Sem nenhum texto, número, legenda, logotipo, marca d'água, moldura ou ícone; sem morros, mar ou prédios altos além do hotel.
```

## 3. Prompts de ajuste

Na mesma conversa, um por vez. Todos terminam pedindo para não mexer no resto.

**Apareceu texto, legenda ou logotipo**
```text
Refaça a mesma imagem sem nenhum texto, letra, número, logotipo ou legenda — inclusive em telhados, fachadas, placas e no chão. Não mude mais nada.
```

**Apareceu vermelho, laranja ou rosa**
```text
Troque todo vermelho, laranja ou rosa da imagem (telhados, veículos, flores, quadras, toldos, cruzes) por branco, cinza, grafite, areia ou verde. Não mude mais nada.
```

**A implantação fugiu da guia (entrada no canto, grade irregular, pista fora do lugar)**
```text
A implantação tem que seguir a guia A: a entrada fica no meio da frente da rodovia, a área industrial é uma grade regular de 6 colunas por 7 fileiras de lotes de 200 x 100 m, e a pista atravessa a frente do parque, no primeiro plano. Refaça mantendo a mesma câmera, a mesma luz e o mesmo estilo.
```

**O rio ficou no lugar errado (colado na rodovia, ou virou mar)**
```text
O rio Paraguai fica longe, só no canto superior direito, a uns 3 km do parque; entre o parque e o rio há pastos, matas e um riacho sinuoso. Não há mar nem praia. Corrija só isso.
```

**Apareceram morros ou serras**
```text
O terreno é totalmente plano até o horizonte (várzea do rio Paraguai). Remova os morros e as serras; o resto fica igual.
```

**Hotel ou centro de convenções errados**
```text
O centro de convenções é uma cobertura orgânica e ondulada em malha de aço branca com vidro (veja a referência E), com a torre do hotel — uma lâmina de cerca de 10 pavimentos, com varandas e brises de madeira — encostada à esquerda dela. É o único prédio alto do parque. Corrija só esse conjunto.
```

**Condomínio vertical alto demais**
```text
Os 38 prédios do condomínio vertical têm só 4 pavimentos, com planta em H, e ficam bem mais baixos que o hotel. Corrija só isso.
```

**Faltou algum setor** (trocar o trecho entre colchetes pela descrição do item da seção 2)
```text
Faltou [o aeroporto de cargas: uma fileira de 7 hangares de frente para um pátio com jatos executivos, um heliponto e um ponto de abastecimento, na ponta esquerda, junto à cabeceira da pista]. Acrescente na posição da guia A, sem mexer no resto.
```

**Variação de luz: manhã** (mais clara para leitura do projeto)
```text
Mesma imagem, mesma câmera e mesma implantação, com luz de início da manhã: sol baixo atrás da câmera, à direita; fachadas voltadas para a câmera iluminadas; uma névoa leve sobre o banhado e sobre o rio, ao fundo.
```

**Formato 16:9** (para tela)
```text
Mesma imagem em formato 16:9, sem cortar o parque nem a pista: reduza só o entorno do topo e o campo abaixo da pista.
```

## 4. Checklist de aprovação

- [ ] Nenhum texto, número, logotipo, legenda, moldura ou ícone na imagem.
- [ ] Nada vermelho, laranja ou rosa (telhados, veículos, quadras, flores, cruz).
- [ ] O parque inteiro no quadro, com a pista no primeiro plano e a rodovia ao fundo.
- [ ] A PY-19 reta ao longo do fundo, com a curva suave na ponta direita do parque.
- [ ] A entrada no **meio** da frente (alça, rotatória, pátio de caminhões, posto, portaria) — não no canto.
- [ ] O outlet ao lado direito da entrada, ao longo da rodovia, virando em L até o supermercado.
- [ ] A grade industrial regular, com galpões em todos os lotes e os dois boulevards arborizados.
- [ ] O canal de drenagem entre a 1ª e a 2ª coluna de lotes.
- [ ] Hotel (lâmina de ~10 pavimentos) encostado na cobertura ondulada — o prédio mais alto.
- [ ] Escola em arco na ponta direita; pequena estação de água ao lado.
- [ ] Resort com o lago alongado, o coreto na ilhota e o clube na ponta direita.
- [ ] Condomínio vertical à frente do resort: prédios **baixos** (4 pavimentos), em grupos.
- [ ] Aeroporto à esquerda: 7 hangares, pátio com aviões, heliponto.
- [ ] Pista ocupando cerca de dois terços da frente; bloco de serviços entre a grade e o fim da pista.
- [ ] Terreno plano; campo úmido, ilhas de mata e banhado em volta; rio só ao longe, à direita.
- [ ] Nenhuma fábrica com marca, nenhuma torre de controle, nenhum prédio alto além do hotel.

## 5. Por que está assim (para quem for mexer depois)

**Localização.** O cliente informa **Ruta PY-19, km 35**. A planta foi encaixada no terreno pela
própria rodovia: nesse trecho a PY-19 faz **uma única curva** (em −25,7715 / −57,7333), e é nela
que o V12 desenha a dobra da rodovia na ponta norte do parque. Com a dobra da planta sobre a curva
e a frente alinhada ao trecho sul (rumo 169°), o parque cai a leste da rodovia, ao sul da curva —
o mesmo ponto que o mapa do site já usa (`PARK` em `home.js`). Medindo pela geometria do
OpenStreetMap a partir de onde a PY-19 começa em Villeta, essa curva fica no **km ~36,8**; a
diferença para o km 35 deve ser a origem da quilometragem oficial. **Se o cliente souber o marco
exato e ele ficar ~2 km ao norte da curva, avisar**: a planta só encaixa na curva.

Coordenadas de conferência: ponta norte −25,7695 / −57,7327 · portaria −25,7810 / −57,7303 · centro
do parque −25,7799 / −57,7264 · câmera −25,7808 / −57,7103, olhando a 265°. O rio Paraguai passa a
~3,2 km a noroeste da ponta norte; um riacho com mata ciliar passa a ~1 km a oeste, do outro lado da
rodovia; a leste do parque há ilhas de mata e um banhado (visto em imagem de satélite — o
OpenStreetMap não mapeia essas matas, por isso elas estão no texto e não na guia A).

**Alturas são estimativas** — o V12 não define altura de nada. Hotel ~10 pavimentos (pelos renders
aprovados); prédios do condomínio vertical com 4 pavimentos (planta em H com 16 vagas cada, e o
quadro dá 16 apartamentos por torre: 4 por andar); escola com 2 pavimentos (o quadro dá a área "por
piso"); galpões ~12 m; casca do centro de convenções ~20 m.

**O que a imagem inventa** (o V12 não desenha o prédio, só o lugar): a arquitetura do outlet, do
supermercado, do centro de serviços para indústrias, do salão de festas, do clube dos funcionários
e da portaria do resort. Se o cliente tiver projeto de algum desses, entra como referência nova.

**O que fica de fora de propósito**: as Fábricas Bracerum (o cliente não vai mais colocá-las), a
torre de controle (`assets/park/aero-torre.jpg` não tem lugar no V12), a academia à beira do lago e
o "Clube Bracerum" de fachada triangular (`assets/renders/clube-bracerum-*.jpg`) — nenhum deles
existe no V12.

**Regerar as referências** (outra versão da planta, outra câmera):

```sh
pip install numpy pillow scipy pikepdf      # e poppler-utils (pdftoppm)
python3 docs/prompt-aerea-v12/build_refs.py
```

O script tira o texto do PDF, georreferencia a planta, desenha o entorno a partir do OpenStreetMap,
monta os volumes lidos da própria planta (galpões nos 41 lotes, as 38 torres em H, as casas do
resort, hotel, casca, hangares…) e renderiza a guia A na câmera `CAMERA`. Numa planta nova, conferir
`DOBRA_PLANTA` (o vértice da dobra da rodovia, em fração da prancha).

Entorno das referências A e C: © colaboradores do OpenStreetMap (ODbL).
