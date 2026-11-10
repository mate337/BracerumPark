# Prompt — vista aérea do Bracerum Park (Masterplan V14) para o ChatGPT Astra-6

Objetivo: uma imagem aérea fotorrealista do parque **inteiro**, atualizada para o **Masterplan V14 rev.
02/11/2026** (`docs/masterplan-v14/BRACERUM_PARK_V14_2026-11-02.pdf`), **no mesmo padrão da aérea que o
Astra-6 gerou em 16/10 e o cliente aprovou** (`docs/prompt-aerea-v12/gerada-v1-obliqua.webp`): a mesma
câmera, o mesmo enquadramento, a mesma luz dourada, as mesmas cores e o mesmo entorno — só a implantação
muda. Sem nenhuma legenda ou texto. Montado em 2026-11-10.

O registro da planta está em `docs/masterplan-v14.md`. Continua valendo tudo o que o cliente já
respondeu: pista de **1.460 m**, **sem as Fábricas Bracerum**, **ambulatório** (nunca "hospital"),
**zero vermelho**.

## O que mudou desde a aérea aprovada (V12 → V14)

A aérea aprovada é do V12. O que ela mostra e o V14 mudou — é o que o prompt corrige:

| Onde | Na aérea aprovada (V12) | No V14 |
|---|---|---|
| Lado direito, miolo | Resort de ~140 casas em volta de um lago grande | **Bracerum Residence**: 67 prédios baixos em quarteirões com pátio |
| Lado direito, frente | 38 prédios em H | Residence (blocos de prédios em cruz e retangulares) |
| Borda diagonal da direita | Clube do resort na ponta | **Bracerum Club** num triângulo: piscina olímpica, piscinas de lazer, quadras, salão de eventos |
| Perto do fim da pista | Bloco de serviços | **Bracerum Resort** pequeno: 31 casas em volta de um lago-piscina; ao lado, refeitório, grêmio e o **hub de 8 galpões** |
| Junto à rodovia, à direita | Centro tecnológico, salão de eventos, hotel | **Centro tecnológico em duas "folhas"** + **hotel, convenções e anfiteatro**, cercados de estacionamentos |
| Ponta direita | Escola e ETA | **Bombeiros, posto policial, posto de saúde, escola com creche e campo, ETA** |
| Outlet | Mancha comprida em L | **Loja por loja**, com marquise; atrás, uma fileira de **17 galpões pequenos** |
| Lado esquerdo | Hangares e heliponto | Igual, mais o **recinto alfandegado** (10 armazéns cercados) ao lado do heliponto |

O que **não** mudou: a rodovia, a entrada no meio da frente, a grade industrial de 6 × 7 quadras com os
dois boulevards e o canal, a pista, os 7 hangares, a ETE e a subestação.

## Como usar

1. Abra uma **conversa nova** no ChatGPT (Astra-6).
2. Anexe as imagens desta pasta **nesta ordem**: A, B, C, D, E, F, G, H. Se houver limite de anexos, as
   indispensáveis são **A, B e C** (C é a aérea aprovada: é ela que garante a mesma cor e o mesmo
   acabamento), depois E e G.
   Se o Astra-6 tiver um modo de **editar uma imagem**, use **A como a imagem a editar** e as demais
   como referência.
3. Cole o **prompt principal** (seção 2) inteiro e envie. Se o Astra-6 cortar, resumir ou recusar o texto
   longo, use a **versão curta**.
4. Confira com o **checklist** (seção 4). Corrija com os **prompts de ajuste** (seção 3), **na mesma
   conversa, um problema por vez** — pedir tudo de uma vez faz o gerador refazer a imagem inteira.
5. Aprovada, peça a versão final no maior tamanho disponível.

**Ainda tem a conversa em que a aérea de 16/10 foi gerada?** Dá para pedir a atualização lá mesmo
(seção 2.3), anexando só A e B. É mais rápido e o estilo vem junto, mas a mudança do lado direito é
grande e o gerador tende a manter o que já desenhou. Se ele insistir no lago grande ou nos prédios em H,
volte para a conversa nova.

Gerador de imagem não acerta contagem exata (67 prédios, 31 casas, 7 hangares) na primeira. O que
importa conferir é a **organização**: o mesmo enquadramento da aérea aprovada, a grade industrial, a
pista na frente, o hotel junto à rodovia à direita, os prédios baixos em quarteirões, o clube na borda
diagonal e o resort pequeno no fim da pista.

## 1. As referências

| | Arquivo | Para que serve | O que **não** copiar |
|---|---|---|---|
| **A** | `ref-A-camera-volumes-v14.png` | **A base.** A câmera da aérea aprovada com os volumes do V14 no lugar (galpões, outlet loja por loja, hotel, casca, prédios do Residence, casas do Resort, hangares, recinto…), sobre a planta e o entorno real. | O aspecto de maquete, as cores chapadas e o entorno simplificado. |
| **B** | `ref-B-planta-v14.png` | A planta V14 vista de cima, **sem nenhum texto**. Vias, quadras, lagos, piscinas, quadras esportivas, implantação de cada prédio. | As cores do desenho. |
| **C** | `ref-C-aerea-aprovada.jpg` | **A aérea aprovada** (Astra-6, 16/10). Estilo, cor, luz, vegetação, entorno, rio, densidade de detalhe e o enquadramento. | **O lado direito** (resort com lago grande, prédios em H): é do V12. |
| **D** | `ref-D-situacao.jpg` | O terreno no entorno real, de cima: PY-19, riachos, matas, rio Paraguai. | O estilo de mapa. |
| **E** | `ref-E-hotel-convencoes.jpg` | Hotel (lâmina com varandas e brises) e a cobertura ondulada do centro de convenções. | — |
| **F** | `ref-F-industrial-vias.jpg` | Galpões com o pórtico azul, boulevard, rotatória, portaria. | — |
| **G** | `ref-G-lazer-residencial.jpg` | Piscina com deck e quiosque, quadra, casa e lago — o padrão do Club e do Resort. | — |
| **H** | `ref-H-servicos.jpg` | Pista e pátio, hangar, posto, comércio, centro tecnológico, estação de tratamento. | — |

As referências **não têm texto de propósito**: gerador de imagem copia rótulo de referência para a
imagem final. Nas fotos E–H o vermelho saturado (lanterna, cruz, flor) foi dessaturado, pela regra da
marca. Não existe foto do Residence nem do Club: o texto descreve.

## 2. Prompt principal

Copiar tudo o que está dentro do bloco:

```text
Crie uma única imagem fotorrealista: vista aérea oblíqua, de drone, de uma cidade industrial planejada inteira, já construída e em funcionamento, em Villeta, Paraguai — à margem leste da Ruta PY-19, na altura do km 35, numa planície plana a cerca de 3 km do rio Paraguai. Formato paisagem 3:2, no maior tamanho disponível. É uma imagem para investidores: arquitetura contemporânea, limpa e realista. A imagem não pode ter nenhum texto, legenda ou sobreposição.

É uma ATUALIZAÇÃO da imagem C, uma aérea já aprovada: mesma câmera, mesmo enquadramento, mesma luz, mesmas cores, mesmo entorno e mesmo padrão de render. O que muda é a implantação do projeto, que agora segue a guia A e a planta B — principalmente no lado direito do parque.

IMAGENS ANEXADAS — como usar cada uma
A) Guia de câmera e de volumes do projeto novo. É a base da composição: repita este enquadramento e a posição e o tamanho relativo de cada volume, quadra, via, lago e da pista. Os blocos cinza e brancos são volumes provisórios: transforme cada um em arquitetura real. Não copie as cores chapadas nem o aspecto de maquete; o entorno desta guia é simplificado — para o entorno, siga a imagem C.
B) Planta oficial vista de cima (a rodovia é a borda de cima; a pista, a de baixo). Vias, quadras, lagos, piscinas, quadras esportivas e a implantação de cada prédio seguem esta planta. As linhas finas dentro das quadras são divisas de lotes, não muros.
C) A aérea aprovada. Copie dela o estilo, as cores, a luz, a vegetação, o entorno, o rio e a densidade de detalhes. NÃO copie o lado direito dela (o condomínio de casas em volta de um lago grande e os prédios em H): esse trecho do projeto mudou; ali vale a guia A e a planta B.
D) Situação real vista de cima: a rodovia, os riachos, as matas e o rio em volta do terreno.
E) Hotel e centro de convenções aprovados. F) Galpões, vias, rotatórias e portaria aprovados. G) Padrão de piscinas, decks, quadras, casas e lago para o clube e o resort. H) Pista e hangar, posto, comércio, centro tecnológico e estação de tratamento aprovados.

O LOCAL E O ENTORNO (como na imagem C)
- Terreno totalmente plano: várzea do rio Paraguai. Nada de morros, serras, mar ou cidade grande no horizonte.
- A Ruta PY-19 é uma rodovia asfaltada de pista simples, com acostamento, com caminhões e carros. Ela corre reta ao longo de todo o fundo do parque e, bem na ponta direita dele, faz uma curva suave e segue em diagonal.
- Do outro lado da rodovia: campo nativo e pastos com palmeiras karanda'y esparsas, ilhas de mata nativa densa, riachos muito sinuosos com lagoas e mata ciliar, estradas de terra bege e casas de fazenda esparsas; exatamente em frente à ponta direita do parque, uma pequena unidade agroindustrial existente, com um galpão e silos metálicos redondos (pequena e discreta). Ao longe, no canto superior direito, o largo rio Paraguai, prateado, com ilhas e bancos de areia.
- Em volta do parque e no primeiro plano: campo úmido em tons de verde-oliva e palha, palmeiras karanda'y, ilhas de mata e um banhado com um córrego estreito e sinuoso. Solo bege-acinzentado — não é terra vermelha.

A CÂMERA (a mesma da imagem C)
Câmera a leste do parque, além da pista, a cerca de 2,3 km de altura, olhando para o oeste, inclinada uns 40° para baixo, lente equivalente a 50 mm. O parque inteiro ocupa a metade de baixo da imagem e toda a largura: a pista atravessa a parte de baixo, a rodovia corta a imagem um pouco acima do meio e a ponta direita do parque quase toca a borda direita. O aeroporto fica à esquerda; hotel, residencial e clube ficam à direita. A metade de cima mostra o entorno, com o rio no canto superior direito.

O PARQUE — o que fica onde (sempre como na guia A e na planta B)
É um polígono com 2,1 km de frente para a rodovia e cerca de 1,2 km de fundo: a borda de trás é reta, ao longo da rodovia; a ponta direita é aguda; a borda direita desce em diagonal até o fim da pista; a borda da frente é a pista; a borda esquerda é diagonal.

No fundo, junto à rodovia (da esquerda para a direita):
1. Por toda a frente: uma faixa verde e uma via de serviço paralela à rodovia. Um canal de drenagem retilíneo, de margens gramadas, atravessa o parque da via de serviço até o aeroporto, entre a primeira e a segunda coluna de quadras, com uma pequena ponte na via de serviço.
2. A entrada, no meio da frente: uma alça sai da via de serviço numa curva ampla até uma praça; um pátio de caminhões com três fileiras de vagas em diagonal e carretas estacionadas; um prédio baixo em L com posto de combustível, restaurante e o clube dos caminhoneiros; uma quadra esportiva pequena; e duas portarias com guaritas sob pórtico metálico — a da direita abre o boulevard central, que desce em direção à câmera.
3. À direita da entrada, ao longo da via de serviço: o outlet — uma fileira térrea e comprida de lojas (cerca de 430 m), com uma marquise contínua na frente, núcleos de circulação a intervalos regulares e estacionamento arborizado. Logo atrás dela, uma fileira de 17 galpões pequenos iguais, lado a lado. Na ponta direita, o outlet vira em L e desce em direção à câmera, como uma segunda fileira de lojas de uns 320 m, com docas, até um supermercado com uma galeria de 12 lojas.
4. Mais à direita, junto à rodovia, entre estacionamentos arborizados com palmeiras: o centro tecnológico — dois prédios de 4 pavimentos em forma de folha, de vidro e brises, com terraço-jardim na cobertura, um de frente para o outro numa praça de cantos arredondados com um pequeno espelho d'água no meio.
5. O conjunto do hotel: uma grande cobertura orgânica e ondulada em malha de aço branca com vidro (gridshell), de uns 150 x 95 m e cerca de 20 m no ponto mais alto — o centro de convenções —, como na referência E. Encostada na frente-esquerda dela, a torre do hotel: uma lâmina de cerca de 10 pavimentos, com a fachada longa voltada para a câmera, varandas contínuas, brises verticais de madeira e jardins nas varandas, em tons de areia — é o prédio mais alto do parque. Na frente-direita da cobertura, um anfiteatro ao ar livre em meia-lua. Em volta, estacionamentos grandes em pentes, com palmeiras entre as vagas (cerca de 2.000 vagas).
6. Na ponta direita, junto à curva da rodovia: o corpo de bombeiros e o posto policial (prédios baixos junto à rodovia), um posto de saúde, a escola com creche — prédio baixo de 2 pavimentos em duas alas curvas — com um campo de futebol gramado ao lado, e uma pequena estação de tratamento de água (um reservatório redondo e alguns tanques).

No centro — a área industrial:
Uma grade regular de 6 colunas por 7 fileiras de quadras de 200 x 100 m (o lado de 200 m paralelo à rodovia), mais quadras em trapézio junto à borda esquerda; a fileira junto à rodovia é interrompida pela entrada e pelo outlet. Ruas asfaltadas com calçadas e árvores e pequenas rotatórias nos cruzamentos. Dois boulevards com canteiro central arborizado com palmeiras: o central, que sai da portaria em direção à câmera, e um transversal no meio da grade, paralelo à rodovia. Todas as quadras construídas e em operação: galpões logísticos e industriais de cerca de 12 m de altura, com pátio de caminhões, docas e escritório na frente. Varie como na imagem C e na guia A — a maioria com um galpão grande, algumas com dois galpões médios, outras com quatro galpões modulares menores. Caminhões nas docas, carros nos estacionamentos.

À direita — a parte urbana (entre a perna do outlet e a borda diagonal da direita):
7. O condomínio residencial: 67 prédios residenciais baixos, de 4 pavimentos (os mais compridos com até 6), brancos e cor de areia com detalhes em madeira, organizados em cerca de dez quarteirões quadrados em grade, separados por ruas arborizadas. Em cada quarteirão, de 4 a 12 prédios em volta de um pátio central com gramado, árvores e espelhos d'água ou piscinas de forma orgânica, e vagas de estacionamento junto aos prédios. Três tipos de planta, como na guia A: em cruz (a maioria), retangular e lâmina comprida. Nada de torres altas: todos bem mais baixos que o hotel.
8. O clube, num grande terreno triangular junto à borda diagonal da direita, entre o residencial e a escola: uma piscina olímpica (50 x 25 m) e piscinas de lazer de formas orgânicas com decks de madeira, bares e quiosques; dois campos de futebol society, quadras de tênis, de padel e de beach tennis e uma quadra poliesportiva; um playground; e o salão de eventos — um pavilhão retangular baixo e elegante, na ponta mais próxima da rodovia. Muito paisagismo.
9. Na frente, perto do fim da pista, junto à borda diagonal: o resort — um pequeno condomínio fechado de 31 casas contemporâneas de 1 e 2 pavimentos (concreto claro, madeira e vidro, telhado plano ou cinza-grafite, piscina no quintal), em fileiras ao longo das ruas e da borda diagonal, em volta de um lago-piscina artificial de forma orgânica, com borda de areia clara e paisagismo; a portaria no meio da fileira de cima; um salão de festas na ponta de baixo.

À esquerda (do fundo para a frente):
10. Junto à borda esquerda: um prédio administrativo pequeno; mais à frente, a estação de tratamento de esgoto (dois tanques redondos e tanques menores), a subestação de energia (pátio de transformadores) e um galpão de manutenção comprido, separados por uma faixa verde.
11. O aeroporto de cargas: uma fileira de 7 hangares lado a lado, com estacionamento atrás, de frente para um pátio asfaltado amplo com jatos executivos e turbo-hélices brancos estacionados; um ponto de abastecimento; um heliponto quadrado no pátio; e, logo à direita do heliponto, o recinto alfandegado — uma área cercada com 10 armazéns pequenos iguais e portão próprio.

Na frente:
12. A pista de pouso, com 1.460 m: asfalto cinza-escuro, faixa central tracejada branca, zebras de cabeceira nas duas pontas e faixas de grama dos dois lados. Ela atravessa a frente do parque desde a esquerda (junto aos hangares) até mais ou menos dois terços da largura da imagem.
13. Entre a última fileira de quadras e o trecho final da pista, da esquerda para a direita: o refeitório (pavilhão baixo), o grêmio recreativo com um campo society e uma piscina, e o centro de serviços para indústrias — 8 galpões médios em fileira; logo depois, o resort.

DESIGN — materiais, cor e luz (os da imagem C)
- Galpões: painéis metálicos brancos e cinza-claros, telhados metálicos cinza-claros com faixas de iluminação zenital, docas com portas seccionais, escritórios de 2 pavimentos com vidro e o pórtico de aço azul-escuro (#1c4d9d) da referência F — esse azul aparece só nesses pórticos.
- Hotel, centro de convenções, centro tecnológico, outlet, residencial, clube e escola: arquitetura contemporânea e sóbria — concreto claro, vidro, madeira e brises.
- Vias de asfalto grafite com faixas brancas e calçadas claras; paisagismo farto, com grama, palmeiras e árvores nativas de copa verde; lagos e piscinas verde-água. Quadras esportivas verdes ou cinza; beach tennis de areia. Veículos brancos, prata, cinza ou pretos.
- Paleta: brancos, cinzas, beges, areia e marrom, mais o verde da vegetação e a água. ZERO VERMELHO: nenhum telhado de telha de barro, nenhuma quadra de saibro ou terracota, nenhum veículo, toldo, flor, letreiro ou pista vermelha, laranja ou rosa; nenhuma cruz vermelha.
- A luz da imagem C: fim de tarde, dourada e suave, vinda do fundo à esquerda, com o sol fora do quadro; sombras longas e nítidas; névoa quente e leve no horizonte; o rio brilhando prateado.
- Render arquitetônico fotorrealista de alto padrão (qualidade Unreal, V-Ray ou Lumion), nítido, com escala de pessoas e veículos coerente e sem distorção de lente.

PROIBIDO
Qualquer texto, letra, número, legenda, rótulo, título, logotipo, marca d'água, assinatura, moldura, borda, seta, rosa dos ventos, escala gráfica, pino, ícone ou mapa sobreposto. Nenhum letreiro legível em fachadas, telhados, placas ou no chão — as únicas marcações permitidas são as de pavimento (faixas, zebras de cabeceira e o H do heliponto, sem números). Não invente prédios altos além do hotel, torre de controle, fábricas com marca, morros, mar, praia ou cidade no horizonte. Não repita o condomínio de casas em volta do lago grande nem os prédios em H da imagem C. Não ponha o rio colado na rodovia. Não use estilo de desenho, maquete, mapa ou pintura.

ANTES DE ENTREGAR, CONFIRA
Mesmo enquadramento, luz e cores da imagem C · parque inteiro no quadro · rodovia ao fundo, com a curva na ponta direita · entrada no meio da frente · outlet em L à direita dela · grade industrial regular com o canal · pista no primeiro plano · hotel com a cobertura ondulada junto à rodovia, à direita · prédios residenciais baixos em quarteirões · clube com piscinas e quadras na borda direita · resort pequeno com lago perto do fim da pista · hangares, heliponto e recinto alfandegado à esquerda · nada escrito · nada vermelho.
```

### 2.2 Versão curta

Se o Astra-6 cortar, resumir ou recusar o prompt longo, use esta, com as mesmas imagens anexadas:

```text
Render arquitetônico fotorrealista, vista aérea oblíqua de drone, formato 3:2, de uma cidade industrial planejada, completa e em operação, em Villeta, Paraguai, à margem leste da Ruta PY-19 (km 35), numa planície totalmente plana a 3 km do rio Paraguai. É uma atualização da imagem C (aérea aprovada): mesma câmera, enquadramento, luz dourada de fim de tarde, cores, entorno e acabamento — só a implantação muda. Use a imagem A como base exata da câmera e da posição de cada volume; a planta B como desenho oficial; C para estilo e entorno (menos o lado direito dela, que mudou); D para a situação real; E a H para a arquitetura.
Fundo: a PY-19 reta, com uma curva suave na ponta direita; a entrada no meio da frente (alça, pátio de caminhões, posto em L, portarias); à direita dela, um outlet térreo comprido com marquise, uma fileira de 17 galpões pequenos atrás, e uma perna em L até um supermercado; depois, entre estacionamentos com palmeiras, o centro tecnológico (dois prédios de 4 pavimentos em forma de folha) e o centro de convenções com cobertura ondulada de aço branco e vidro, com a torre do hotel de 10 pavimentos encostada na frente (o único prédio alto) e um anfiteatro; na ponta, bombeiros, posto de saúde e a escola em duas alas curvas com um campo.
Centro: grade regular de 6 x 7 quadras de 200 x 100 m com galpões brancos de 12 m, pátios de caminhões, ruas arborizadas, dois boulevards com palmeiras e um canal de drenagem.
Direita: 67 prédios residenciais baixos (4 pavimentos), em cruz e retangulares, em quarteirões quadrados com pátios, jardins e espelhos d'água; um clube triangular na borda diagonal com piscina olímpica, piscinas de lazer, quadras e salão de eventos; perto do fim da pista, um resort pequeno de 31 casas em volta de um lago-piscina.
Esquerda: estação de esgoto, subestação, 7 hangares com jatos executivos, heliponto e um recinto alfandegado cercado com 10 armazéns. Frente: a pista de 1.460 m, o refeitório, o grêmio e 8 galpões de serviços.
Entorno como na imagem C: campo úmido com palmeiras karanda'y, ilhas de mata e riachos sinuosos; do outro lado da rodovia, pastos, os silos de uma pequena agroindústria e, ao longe, no canto superior direito, o rio Paraguai.
Paleta de branco, cinza, bege, areia, marrom e verde; zero vermelho, laranja ou rosa. Sem nenhum texto, número, legenda, logotipo, marca d'água, moldura ou ícone; sem morros, mar ou prédios altos além do hotel; sem o lago grande e os prédios em H da imagem C.
```

### 2.3 Na conversa da aérea aprovada

Só se a conversa de 16/10 ainda existir. Anexe **A** e **B** e cole:

```text
Atualize esta mesma imagem para a versão nova do projeto (masterplan V14). Mantenha exatamente a mesma câmera, o mesmo enquadramento, a mesma luz dourada, as mesmas cores, o mesmo entorno e o mesmo padrão de render. Mude só a implantação, seguindo a guia de volumes (imagem A) e a planta oficial sem texto (imagem B) anexadas:
1. Lado direito: saem o condomínio de casas em volta do lago grande e os prédios em H. Entram 67 prédios residenciais baixos (4 pavimentos), em cruz e retangulares, em cerca de dez quarteirões quadrados com pátios, jardins e espelhos d'água; um clube num terreno triangular junto à borda diagonal da direita, com piscina olímpica, piscinas de lazer com decks, campos society, quadras de tênis, padel e beach tennis e um salão de eventos; e, perto do fim da pista, um resort pequeno de 31 casas em volta de um lago-piscina de forma orgânica.
2. Junto à rodovia, à direita do outlet: o centro tecnológico — dois prédios de 4 pavimentos em forma de folha, um de frente para o outro numa praça com espelho d'água — e o conjunto do hotel: a cobertura ondulada do centro de convenções, a torre do hotel encostada na frente-esquerda dela e um anfiteatro em meia-lua na frente-direita, tudo cercado por estacionamentos com palmeiras.
3. Na ponta direita: bombeiros e posto policial, um posto de saúde, a escola em duas alas curvas com um campo de futebol e a pequena estação de água.
4. O outlet passa a ser uma fileira de lojas com marquise contínua; atrás dela, uma fileira de 17 galpões pequenos iguais; a perna em L desce até um supermercado.
5. À esquerda, logo à direita do heliponto: um recinto alfandegado cercado com 10 armazéns pequenos.
6. Entre a última fileira de quadras e o fim da pista: o refeitório, o grêmio recreativo com campo e piscina e 8 galpões médios em fileira.
O resto fica como está: rodovia, entrada, grade industrial, boulevards, canal, pista, hangares, entorno e rio. Continua proibido qualquer texto, número ou logotipo, e qualquer vermelho, laranja ou rosa.
```

## 3. Prompts de ajuste

Na mesma conversa, um por vez. Todos terminam pedindo para não mexer no resto.

**O lado direito copiou a aérea antiga (lago grande, prédios em H)**
```text
O lado direito tem que seguir a guia A e a planta B, não a imagem C: no lugar do condomínio de casas em volta do lago grande e dos prédios em H, vão 67 prédios residenciais baixos em quarteirões quadrados com pátios, o clube triangular com piscinas e quadras na borda diagonal e, perto do fim da pista, o resort pequeno de 31 casas em volta de um lago-piscina. Mantenha a câmera, a luz, as cores e todo o resto.
```

**O enquadramento ou a luz fugiram da aérea aprovada**
```text
Volte ao enquadramento e à luz da imagem C: o parque inteiro na metade de baixo, de borda a borda, com a pista atravessando a parte de baixo e a rodovia um pouco acima do meio; luz dourada de fim de tarde vinda do fundo à esquerda, com sombras longas. Não mude a implantação.
```

**Apareceu texto, legenda ou logotipo**
```text
Refaça a mesma imagem sem nenhum texto, letra, número, logotipo ou legenda — inclusive em telhados, fachadas, placas, na pista e no chão. Não mude mais nada.
```

**Apareceu vermelho, laranja ou rosa**
```text
Troque todo vermelho, laranja ou rosa da imagem (telhados, veículos, flores, quadras, toldos, cruzes) por branco, cinza, grafite, areia ou verde. Não mude mais nada.
```

**Prédios residenciais altos demais**
```text
Os prédios do condomínio residencial têm só 4 pavimentos (os mais compridos até 6) e ficam bem mais baixos que o hotel, que é o único prédio alto do parque. Corrija só isso.
```

**O clube ficou sem piscinas ou quadras**
```text
O clube, no terreno triangular junto à borda diagonal da direita, tem uma piscina olímpica retangular, piscinas de lazer de formas orgânicas com decks de madeira, dois campos society, quadras de tênis, padel e beach tennis, um playground e o salão de eventos (pavilhão retangular baixo). Acrescente o que faltou, na posição da guia A, sem mexer no resto.
```

**Hotel ou centro de convenções errados**
```text
O centro de convenções é uma cobertura orgânica e ondulada em malha de aço branca com vidro (veja a referência E), junto à rodovia, à direita; a torre do hotel — uma lâmina de cerca de 10 pavimentos, com varandas e brises de madeira e a fachada longa voltada para a câmera — fica encostada na frente-esquerda dela, e um anfiteatro em meia-lua na frente-direita. É o único prédio alto do parque. Corrija só esse conjunto.
```

**O outlet virou um bloco único**
```text
O outlet é uma fileira de lojas térreas lado a lado, com marquise contínua na frente e núcleos de circulação a intervalos — não um bloco único. Atrás dele, uma fileira de 17 galpões pequenos iguais. Corrija só isso.
```

**A implantação fugiu da guia (entrada no canto, grade irregular, pista fora do lugar)**
```text
A implantação tem que seguir a guia A: a entrada fica no meio da frente da rodovia, a área industrial é uma grade regular de 6 colunas por 7 fileiras de quadras de 200 x 100 m, e a pista atravessa a frente do parque, no primeiro plano. Refaça mantendo a mesma câmera, a mesma luz e o mesmo estilo.
```

**Apareceram morros ou serras**
```text
O terreno é totalmente plano até o horizonte (várzea do rio Paraguai). Remova os morros e as serras; o resto fica igual.
```

**Faltou algum setor** (trocar o trecho entre colchetes pela descrição do item da seção 2)
```text
Faltou [o recinto alfandegado: uma área cercada com 10 armazéns pequenos iguais e portão próprio, logo à direita do heliponto, junto à cabeceira esquerda da pista]. Acrescente na posição da guia A, sem mexer no resto.
```

**Formato 16:9** (para tela)
```text
Mesma imagem em formato 16:9, sem cortar o parque nem a pista: reduza só o entorno do topo e o campo abaixo da pista.
```

## 4. Checklist de aprovação

- [ ] Mesmo enquadramento, mesma luz dourada e mesmas cores da aérea aprovada (C).
- [ ] Nenhum texto, número, logotipo, legenda, moldura ou ícone na imagem (nem o "30" na cabeceira).
- [ ] Nada vermelho, laranja ou rosa (telhados, veículos, quadras, flores, cruz).
- [ ] O parque inteiro no quadro, com a pista no primeiro plano e a rodovia ao fundo, com a curva na ponta direita.
- [ ] A entrada no **meio** da frente; o outlet em lojas, com a fileira de galpões pequenos atrás e a perna em L até o supermercado.
- [ ] A grade industrial regular, com galpões em todas as quadras, os dois boulevards e o canal entre a 1ª e a 2ª coluna.
- [ ] Junto à rodovia, à direita: o centro tecnológico em duas "folhas" e o hotel (lâmina de ~10 pavimentos) encostado na cobertura ondulada, com o anfiteatro — o hotel é o prédio mais alto.
- [ ] Na ponta: bombeiros, posto de saúde, escola em duas alas curvas com campo, estação de água.
- [ ] **Sem** o lago grande e **sem** os prédios em H da aérea antiga.
- [ ] Residencial: prédios **baixos** em quarteirões quadrados com pátios e espelhos d'água.
- [ ] Clube triangular na borda diagonal: piscina olímpica, piscinas de lazer, quadras, salão de eventos.
- [ ] Resort pequeno com o lago-piscina perto do fim da pista; refeitório, grêmio e os 8 galpões de serviço ao longo da pista.
- [ ] À esquerda: 7 hangares, pátio com aviões, heliponto e o recinto alfandegado cercado.
- [ ] Terreno plano; campo úmido, ilhas de mata e riachos em volta; rio só ao longe, à direita.
- [ ] Nenhuma fábrica com marca, nenhuma torre de controle, nenhum prédio alto além do hotel.

## 5. Por que está assim (para quem for mexer depois)

**A câmera é a da aérea aprovada, não a da guia do V12.** O Astra-6 não seguiu a câmera da guia A do V12
à risca: aproximou o parque, que na imagem aprovada enche a largura do quadro. Como o cliente aprovou esse
enquadramento, a guia nova foi feita nele: cinco pontos da aérea aprovada (as duas zebras da pista, os
dois cantos do parque e a ponta norte) casados com a planta por mínimos quadrados — erro médio de 15 px em
1536 px. Dá uma câmera a ~2,3 km de altura, ~1,8 km a leste da pista, inclinada 41° e com lente de ~47 mm
(`CAMERA` em `build_refs_v14.py`). Com a geometria real, o rio Paraguai fica fora do quadro (está a ~3 km
da ponta norte): na aérea aprovada o gerador o trouxe para o canto superior direito, o cliente gostou, e
o prompt manda manter — por isso o entorno vem da imagem C, não da guia A.

**A localização** é a mesma do V12 (a prancha e as coordenadas não mudaram): ver a seção 5 de
`docs/prompt-aerea-v12/PROMPT-ASTRA-6-AEREA-V12.md`.

**O Outlet aparece inteiro.** O cliente separa o Outlet em 1ª fase (à venda) e 2ª fase ("liberação
futura"); a maquete 3D mostra a 2ª fase como laje hachurada. Esta imagem mostra o masterplan completo —
como mostra todas as quadras industriais ocupadas —, então as duas fases saem construídas. Se o cliente
quiser a 2ª fase vazia, pedir na mesma conversa: "Deixe sem construir a metade esquerda da fileira de lojas
do outlet (até o meio da fileira) e o trecho final da perna em L, junto ao supermercado: ali fica só o
terreno gramado, com o resto igual."

**Alturas são estimativas** — o V14 não define altura de nada, menos o centro tecnológico (o quadro diz 4
pavimentos). Hotel ~10 pavimentos (renders aprovados); prédios do Residence com 4 pavimentos (16 unidades
por prédio nas torres de 2 e 3 quartos, como no quadro; as de 1 quarto têm 24 e podem ter 6); escola com 2
pavimentos; galpões ~12 m; casca do centro de convenções ~20 m. São as mesmas da maquete 3D.

**O que a imagem inventa** (o V14 desenha o lugar, não o prédio): a arquitetura do outlet, do
supermercado, dos prédios do Residence, das casas do Resort, do Club, do hub de serviços, do recinto
alfandegado, do refeitório, do grêmio, dos bombeiros, do posto policial e do posto de saúde. Se o cliente
tiver projeto de algum deles, entra como referência nova.

**O que fica de fora de propósito**: as Fábricas Bracerum, a torre de controle, o simulador de surf
desenhado num lote do Resort (pequeno demais para aparecer e fácil de o gerador exagerar) e os números da
pista (o desenho escreve "30" na cabeceira; a regra é nenhum número na imagem).

**Regerar as referências** (outra revisão da planta, outra câmera):

```sh
pip install numpy pillow scipy pikepdf opencv-python-headless      # e poppler-utils (pdftoppm)
python3 docs/prompt-aerea-v14/build_refs_v14.py
```

O script reaproveita o kit do V12 (`docs/prompt-aerea-v12/build_refs.py`: PDF sem texto, render por
marcha de raios, colagens) e a leitura da planta da maquete 3D (`Maquete14` em
`docs/3dmasterplan/build_data.py`). O entorno vem pronto de `3dmasterplan/data/entorno.webp` (mesmo
referencial e mesma escala), então ele **não depende da Overpass API**. Planta nova: trocar `PLANTA` no
`build_data.py` e rodar de novo.

Entorno das referências A e D: © colaboradores do OpenStreetMap (ODbL).

## 6. Variação 90° (vista de cima)

A primeira oblíqua do V14 (`gerada-v14-obliqua.webp`, 2026-11-10) saiu boa: segue a guia A, com o outlet
em L, o centro tecnológico em folhas, o hotel com a cobertura, o residencial baixo, o clube, o resort com
o lago, o recinto e o hub. A variação 90° é a **mesma imagem vista de cima**, com a câmera apontada reto
para baixo e a **mesma orientação** (rodovia em cima, pista embaixo, hotel à direita) — o "Vista 90º" do
filme e a candidata a fundo novo do masterplan da home (pinos remarcados, quando o site for liberado).

A guia é a **A90 do V14**: a mesma maquete da guia A vista de cima, com as sombras vindo do canto superior
esquerdo, como a luz da imagem gerada. Mesmo quadro da A90 do V12, em três tamanhos:

| Arquivo | Tamanho | Para quê |
|---|---|---|
| `ref-A90-zenital-volumes-v14-4k.png` | 3840 × 2560 (3:2), 300 dpi | **A que anexar** |
| `ref-A90-zenital-volumes-v14-4k-16x9.png` | 3840 × 2160 (16:9), 300 dpi | Tela, vídeo e o fundo do masterplan; com ela, troque "Formato paisagem 3:2" por "Formato 16:9" |
| `ref-A90-zenital-volumes-v14.png` | 1536 × 1024 (3:2) | Versão leve |

O entorno da guia em volta do parque vem ampliado do entorno da maquete 3D (2,5 m/px) e sai borrado: é
de propósito só uma indicação — o entorno da imagem final segue a oblíqua gerada.

### Na mesma conversa

Na conversa em que a oblíqua do V14 foi gerada, anexe a **A90** (de preferência a 4K) e cole:

```text
Agora faça uma variação 90° desta imagem: exatamente a mesma cidade industrial, com a mesma arquitetura, os mesmos materiais, a mesma vegetação e a mesma luz dourada, mas vista de cima, com a câmera apontada reto para baixo (vista zenital, 90°), como uma foto de drone a grande altura ou de satélite de altíssima resolução. Formato paisagem 3:2, no maior tamanho disponível.

Se houver uma imagem anexada (guia de cima), use-a como base: ela mostra o enquadramento, a orientação e a posição de cada volume, quadra, via, lago e da pista vistos de cima. Os blocos cinza e brancos são volumes provisórios e as sombras indicam a altura; não copie as cores chapadas nem o entorno simplificado. Para o desenho exato, siga a planta B que já está na conversa. Onde a imagem anterior divergir da planta, vale a planta: 6 colunas por 7 fileiras de quadras; o canal de drenagem entre a primeira e a segunda coluna; os dois boulevards com palmeiras (o central, que sai da portaria, e o transversal no meio da grade); a fileira de 17 galpões pequenos atrás do outlet; os 67 prédios residenciais baixos em quarteirões quadrados com pátios e espelhos d'água; o clube triangular na borda diagonal, com a piscina olímpica; o resort pequeno com o lago-piscina perto do fim da pista; os 10 armazéns do recinto alfandegado ao lado do heliponto.

Orientação: a mesma da imagem anterior, como se a câmera tivesse subido até apontar para baixo. A Ruta PY-19 cruza o alto da imagem de ponta a ponta e faz uma curva suave no alto, à direita; a pista de pouso fica embaixo; o outlet em L fica à direita da entrada; centro tecnológico, hotel com o centro de convenções, residencial, clube e escola ficam à direita; o aeroporto de cargas e a estação de esgoto ficam à esquerda. Não gire a imagem para o norte ficar em cima.

Sem perspectiva aparente: quadras retangulares, ruas paralelas, sem horizonte e sem céu, quase nenhuma fachada. Vê-se telhados com as faixas de iluminação zenital, a cobertura ondulada de malha branca do centro de convenções, pátios de caminhões, carros, copas de árvores, piscinas, quadras e sombras. O parque inteiro ocupa quase toda a largura, com uma margem do entorno real em volta: acima da rodovia, pasto com palmeiras, uma estrada de terra e os silos da agroindústria vizinha junto à curva; abaixo da pista, o banhado com um córrego sinuoso e ilhas de mata.

Luz: a mesma luz dourada, vinda do canto superior esquerdo, com o sol a uns 35°. Sombras suaves, projetadas para baixo e para a direita, que mostram a altura dos prédios sem esconder ruas e pátios.

Continua valendo tudo o que era proibido: nenhum texto, número, legenda, logotipo, rosa dos ventos, escala, moldura ou ícone; nada vermelho, laranja ou rosa. Não é mapa nem desenho: é uma fotografia aérea.
```

### Em conversa nova

Anexe, nesta ordem: a **oblíqua gerada** (`gerada-v14-obliqua.webp`), a **A90** e a **B** (e, se couber,
E a H). Cole o prompt acima trocando o primeiro parágrafo por: "Crie uma única imagem fotorrealista: a
vista de cima, com a câmera apontada reto para baixo (vista zenital, 90°), da cidade industrial da imagem
1 — a mesma arquitetura, os mesmos materiais, a mesma vegetação e a mesma luz, só que vista de cima, como
uma foto de drone a grande altura ou de satélite de altíssima resolução. Formato paisagem 3:2, no maior
tamanho disponível. A imagem 2 é a guia de cima e a imagem 3 é a planta oficial."

### Ajustes da vista de cima

Os ajustes da seção 3 (texto, vermelho, morros) continuam valendo. Os próprios da vista de cima:

**Saiu inclinada (aparece céu, horizonte ou fachada)**
```text
A câmera tem que estar exatamente a 90°, apontada reto para baixo: sem horizonte, sem céu e sem fachadas visíveis — só telhados, pátios, copas e sombras. Mantenha todo o resto.
```

**A orientação girou**
```text
A orientação tem que ser a da imagem anterior: a rodovia no alto da imagem, a pista embaixo, o hotel, o residencial e o clube à direita, o aeroporto à esquerda. Corrija só a orientação; o resto fica igual.
```

**Ficou com cara de mapa ou de planta ilustrada**
```text
Isto tem que ser uma fotografia aérea fotorrealista, não um mapa nem uma planta ilustrada: textura real de telhado metálico, asfalto, grama, copas de árvores e água, com sombras naturais. Mantenha a implantação e o enquadramento.
```

**As sombras estão escondendo ruas e pátios**
```text
Deixe as sombras mais curtas e mais suaves, com o sol mais alto (uns 45°), para não esconder ruas e pátios. O resto fica igual.
```

### Checklist da vista de cima

- [ ] Câmera reta para baixo: sem céu, sem horizonte, sem fachadas.
- [ ] Mesma orientação da oblíqua: rodovia em cima, pista embaixo, hotel, residencial e clube à direita, aeroporto à esquerda.
- [ ] Quadras retangulares e ruas paralelas, sem perspectiva; grade de 6 × 7 com o canal e os dois boulevards.
- [ ] Entrada no meio da frente; outlet em L com a fileira de galpões pequenos atrás.
- [ ] Residencial em quarteirões quadrados com pátios; clube triangular com a piscina olímpica; resort com o lago-piscina.
- [ ] Recinto alfandegado ao lado do heliponto; 7 hangares.
- [ ] Nada escrito, nada vermelho.
