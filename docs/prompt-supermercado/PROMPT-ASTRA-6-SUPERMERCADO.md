# Prompt — Supermercado do Bracerum Park (Bracerum Market) para o ChatGPT Astra-6

Objetivo: **uma foto de arquitetura** do Supermercado do Bracerum Park e do conjunto em volta dele —
**farmácia e mais duas lojas** na mesma marquise, calçada coberta, estacionamento arborizado e a via
—, no mesmo padrão das imagens finalizadas do cliente (`assets/web/fotos/`, set/2026): luz de fim de
tarde, concreto claro, ripado de madeira, beiral grafite, palmeiras, asfalto limpo. **Minimalista,
clara e com cara de fotografia, não de IA.** Montado em 2026-11-05, com o mesmo método do prompt da
vista aérea (`docs/prompt-aerea-v12/`).

**Onde fica, pelo Masterplan V14 (28/10/2026):** o Supermercado fecha a ponta de baixo da faixa
comercial que desce da Via Costeira (o Outlet), de frente para o boulevard entre o Resort e o
Condomínio, com estacionamento arborizado e docas próprias. O quadro do V14 dá **4.606 m² para
supermercado + 12 lojas**. Esta imagem mostra **o supermercado + farmácia + 2 lojas**, como pedido —
é o trecho do conjunto que aparece de frente; as outras lojas ficam fora do quadro. A arquitetura
**não foi definida** pelo cliente: tudo aqui é proposta, no idioma dos renders já aprovados.

## Como usar

1. Conversa nova no ChatGPT (Astra-6).
2. Anexe as imagens **nesta ordem**: A, B, C, D. As indispensáveis são **A** (luz e acabamento) e
   **D** (implantação).
3. Cole o **prompt principal** (seção 2) e envie. Se o Astra-6 cortar ou resumir, use a **versão
   curta** logo abaixo.
4. Confira com o **checklist** (seção 5). Para corrigir, use os **ajustes** (seção 4) **na mesma
   conversa, um por vez** — pedir tudo de uma vez faz o gerador refazer a imagem e perder o que já
   estava certo.
5. Aprovada a principal, peça as **variações** (seção 3) na mesma conversa: elas herdam o prédio.
6. Versão final no maior tamanho disponível, 16:9 (as fotos do site são 1672 × 941).

## 1. As referências

| | Arquivo | Para que serve | O que **não** copiar |
|---|---|---|---|
| **A** | `ref-A-luz-acabamento.jpg` | **O padrão aprovado.** Luz de fim de tarde, sombras, céu, cor, nitidez, concreto aparente, palmeiras, meio-fio e asfalto. | A portaria, o caminhão e as cancelas. |
| **B** | `ref-B-arquitetura.jpg` | A linguagem do comércio do Select: volume baixo, concreto claro, ripado de madeira, panos de vidro, beiral escuro fino, luz quente interna. | O pôr do sol alaranjado (a principal é mais cedo), o edifício de dois pisos e o totem. |
| **C** | `ref-C-via-paisagismo.jpg` | A via do parque: asfalto, faixas, canteiro com palmeiras, árvores jovens, postes, escala. | Os galpões e a torre do fundo. |
| **D** | `ref-D-implantacao.png` | Planta-guia do conjunto vista de cima, sem texto: supermercado (branco), as três lojas (bege) à direita, marquise contínua (faixa escura), calçada, três pentes de vagas com fileiras de árvores, via lateral das docas à esquerda, boulevard embaixo. | As cores chapadas e o aspecto de diagrama. |

As referências **não têm texto de propósito** (o totem da B foi apagado) e o vermelho das cancelas
da A foi neutralizado, pela regra da marca. Regerar com `python3 docs/prompt-supermercado/build_refs.py`.

## 2. Prompt principal

Copiar tudo o que está dentro do bloco:

```text
Crie uma única fotografia de arquitetura, fotorrealista, de um pequeno centro comercial de bairro recém-inaugurado: um supermercado e, na mesma marquise, uma farmácia e mais duas lojas. Fica dentro de uma cidade industrial planejada em Villeta, Paraguai — terreno plano, clima subtropical. Formato paisagem 16:9, no maior tamanho disponível. É uma imagem para investidores: minimalista, clara, sóbria, com cara de foto real tirada por um fotógrafo de arquitetura — nunca de render de IA. A imagem não pode ter nenhum texto, letreiro, logotipo ou marca.

IMAGENS ANEXADAS — como usar cada uma
A) É o padrão de qualidade já aprovado pelo cliente: copie a luz, a cor, o céu, a nitidez, o concreto aparente, o paisagismo e o asfalto. Não copie a portaria nem o caminhão.
B) É a linguagem arquitetônica: volume baixo e horizontal, concreto claro, ripado vertical de madeira, panos de vidro e beiral escuro fino. Não copie o pôr do sol alaranjado nem o totem.
C) É a via do parque: asfalto, meio-fio, canteiro com palmeiras e árvores, postes e a escala.
D) É a planta do conjunto vista de cima e manda na implantação: o supermercado é o retângulo branco, as três lojas são os retângulos bege à direita dele, a faixa escura é a marquise contínua, os pentes cinza são as vagas, os círculos verdes são árvores. A via à esquerda leva às docas, nos fundos. O boulevard fica embaixo.

A CÂMERA
Fotógrafo no canto direito do estacionamento (canto inferior direito da planta D), sobre um mastro a uns 8 m de altura, olhando em diagonal para o canto superior esquerdo: a fachada aparece em três quartos, do primeiro plano à direita (as lojas) até o fundo à esquerda (o supermercado). Lente 24 mm com correção de perspectiva (tilt-shift): todas as verticais perfeitamente retas e paralelas. f/8, ISO 100, câmera de médio formato. O prédio ocupa o terço do meio da imagem; o estacionamento e as árvores ocupam o terço de baixo; o céu, o terço de cima. Horizonte reto.

O CONJUNTO — o que fica onde (sempre como na planta D)
1. O supermercado: um volume térreo, simples e comprido, de uns 78 m de frente por 36 m de fundo e 8 m de altura, com cobertura plana escondida atrás de uma platibanda reta. A fachada é quase toda de vidro na parte de baixo, sob a marquise; em cima, uma faixa larga e lisa de concreto claro com textura discreta de fôrma. A entrada é um recorte de pé-direito duplo no terço esquerdo da fachada, revestido de ripado vertical de madeira mel por dentro, com portas automáticas de vidro. Através do vidro se veem, desfocadas, gôndolas brancas e de madeira, frutas e verduras em caixotes, luz interna quente e uniforme.
2. As três lojas, encostadas à direita do supermercado, mais baixas (5,5 m), com 16 m de frente cada, separadas por pilares de concreto:
   - a farmácia, na esquina (a loja mais próxima da câmera): vidro nas duas faces, interior branco e claro, prateleiras brancas, balcão de madeira clara; nada de cruz, verde-néon ou vermelho;
   - um café-padaria: vitrine de pães e balcão de madeira, quatro mesinhas de madeira com cadeiras pretas na calçada, sob a marquise;
   - uma loja de serviços (lavanderia): vidro, bancada clara e máquinas brancas alinhadas no fundo.
3. Uma marquise contínua, fina (30 cm de espessura), em metal grafite fosco, corre de ponta a ponta sobre as quatro fachadas, a uns 4,5 m de altura, projetando 4 m sobre a calçada; forro de madeira por baixo com spots embutidos. Na frente de cada loja e acima da entrada do supermercado, uma faixa lisa de letreiro, vazia — só a superfície onde a marca vai entrar, sem nenhuma letra.
4. A calçada coberta: piso de concreto claro com juntas regulares, larga, com dois bancos de concreto, um bicicletário de aço escovado, um abrigo de carrinhos de aço inox perto da entrada do supermercado e jardineiras baixas com capim-ornamental e plantas de folhagem.
5. O estacionamento em frente: três pentes de vagas com faixas brancas, separados por canteiros gramados com uma fileira de árvores de copa verde média, como na planta D. Ocupação de uns 40%: uns 15 carros de passeio e um ou dois utilitários, em branco, prata, cinza, grafite ou preto, sem marca e com placas lisas. Postes finos de iluminação. Um carrinho de compras sendo levado ao carro.
6. A via lateral à esquerda, que desce para as docas: as docas ficam nos fundos e não aparecem — só um muro verde de vegetação e um caminhão-baú branco parcialmente escondido atrás dele.
7. Em volta, ao fundo e fora de foco: à esquerda, a faixa comercial térrea continua, recuando; ao fundo, à direita, três ou quatro prédios residenciais baixos (4 pavimentos), brancos com detalhes em madeira, entre árvores; no horizonte, o topo de alguns galpões industriais brancos. Tudo plano, sem morros. O boulevard da frente tem canteiro central com palmeiras, como na referência C.
8. Pessoas: de 6 a 10, pequenas e naturais, ocupadas com o que fazem — saindo com sacolas, empurrando um carrinho, um casal na mesinha do café, alguém entrando na farmácia. Roupas em tons neutros. Ninguém olhando para a câmera, ninguém posando.

LUZ E COR
- Fim de tarde, cerca de uma hora antes do pôr do sol: sol baixo, à esquerda e um pouco atrás da câmera, raspando a fachada com luz dourada suave; sombras longas e nítidas das árvores atravessando o estacionamento na diagonal. Céu limpo, azul que clareia para um tom creme no horizonte, com poucas nuvens altas e finas. Luz interna das lojas acesa, quente (3000 K) e discreta, equilibrada com a luz do dia — o interior não estoura.
- Paleta: concreto claro, branco-gesso, madeira mel, grafite, preto, o verde-oliva da vegetação e o azul do céu. ZERO VERMELHO, laranja ou rosa: nenhum carro, toldo, flor, árvore florida, sinalização, cruz de farmácia, embalagem em destaque ou pintura de piso vermelha, laranja ou rosa. Nenhum azul fora o céu.
- Tratamento de cor neutro e natural, como uma foto bem exposta: brancos limpos, sombras com detalhe, nada estourado, nada saturado demais.

PARA NÃO PARECER IA (obrigatório)
- Materiais com textura e pequenas imperfeições reais: marcas de fôrma no concreto, juntas de dilatação no piso, leve variação de tom no asfalto, um remendo, marcas de pneu nas vagas, algumas folhas secas no canteiro. Nada de superfície plástica, brilhante ou lisa demais.
- Estrutura coerente: pilares alinhados com a marquise, caixilhos do vidro numa modulação regular de 1,25 m, nada flutuando, nada torto, nenhum andar a mais. Uma única fonte de sol: todas as sombras na mesma direção.
- Vegetação irregular e variada: árvores com copas de tamanhos diferentes, nenhuma clonada, grama com variação natural de cor. Palmeiras só no boulevard.
- Carros com proporções reais, sem deformação, sem reflexos impossíveis. Pessoas com anatomia correta, mãos e rostos normais, em escala.
- Fotografia, não ilustração: sem HDR, sem halo nas bordas, sem nitidez exagerada, sem brilho difuso (bloom), sem raios de sol, sem estrela de lente, sem vinheta pesada, sem chão molhado, sem céu dramático. Grão fino e uniforme de câmera digital a ISO 100.

PROIBIDO
Qualquer texto, letra, número, letreiro, logotipo, marca, placa legível, totem, bandeira, faixa promocional, cartaz, preço, ícone, marca d'água, assinatura, moldura ou borda. Nenhuma cruz de farmácia. Nenhum prédio alto ou espelhado. Nenhum morro, serra ou mar. Nada vermelho, laranja ou rosa. Estilo de desenho, maquete, pintura ou ilustração.

ANTES DE ENTREGAR, CONFIRA
Fachada em três quartos com verticais retas · supermercado à esquerda, três lojas à direita, sob uma marquise contínua · farmácia na esquina mais próxima · faixas de letreiro vazias · estacionamento arborizado em frente, 40% ocupado · luz dourada de fim de tarde · nada escrito · nada vermelho · parece uma foto.
```

### Versão curta

Com as mesmas imagens anexadas:

```text
Fotografia de arquitetura fotorrealista, 16:9, de um pequeno centro comercial recém-inaugurado numa cidade industrial planejada em Villeta, Paraguai (terreno plano): um supermercado térreo de 78 m de frente e 8 m de altura e, encostadas à direita, três lojas mais baixas — farmácia na esquina, café-padaria com mesinhas na calçada e uma lavanderia —, todas sob uma marquise contínua e fina de metal grafite com forro de madeira. Fachadas de vidro embaixo, faixa lisa de concreto claro em cima, entrada do supermercado em pé-direito duplo revestida de ripado de madeira. Faixas de letreiro vazias, sem nenhuma letra.
Use A como padrão de luz, cor e acabamento; B para a linguagem arquitetônica; C para a via e o paisagismo; D (planta vista de cima) para a implantação.
Câmera a 8 m de altura no canto direito do estacionamento, olhando a fachada em três quartos, lente 24 mm tilt-shift, verticais retas, f/8, ISO 100. Em frente, três pentes de vagas com canteiros e árvores, 40% ocupados por carros brancos, prata, cinza e pretos. De 6 a 10 pessoas naturais, ninguém olhando para a câmera. Ao fundo, fora de foco: prédios residenciais de 4 pavimentos e o topo de galpões brancos.
Fim de tarde, sol baixo à esquerda raspando a fachada, sombras longas, céu limpo, luz interna quente e discreta. Paleta de concreto claro, branco, madeira, grafite e verde-oliva; zero vermelho, laranja ou rosa. Texturas reais (marcas de fôrma, juntas, marcas de pneu), sem HDR, halo, bloom, estrela de lente ou chão molhado. Sem nenhum texto, logotipo, placa, cruz de farmácia, moldura ou marca d'água.
```

## 3. Variações (na mesma conversa, depois da principal aprovada)

**Nível do olho, na calçada coberta** (para o site e redes)
```text
Mesmo conjunto, mesma arquitetura e mesma luz, agora do ponto de vista de uma pessoa: câmera a 1,6 m de altura, na calçada coberta junto à farmácia, olhando ao longo da marquise em direção à entrada do supermercado. Lente 35 mm, verticais retas. Em primeiro plano, à direita, a vitrine da farmácia; no meio, as mesinhas do café com um casal; ao fundo, a entrada de ripado de madeira. A linha da marquise e do forro de madeira cria a perspectiva. Nada escrito, nada vermelho.
```

**Hora azul** (a mesma vista da principal)
```text
Mesma imagem, mesma câmera, cerca de 20 minutos depois do pôr do sol: céu azul-profundo limpo, sem sol; o interior das lojas e do supermercado aceso em luz quente (3000 K), o forro de madeira da marquise iluminado pelos spots, postes do estacionamento acesos em luz neutra. Exposição equilibrada: o céu ainda tem cor e as fachadas têm detalhe. Chão seco. Menos pessoas e carros. Não mude mais nada.
```

**Vista aérea do conjunto** (para o masterplan)
```text
Mesmo conjunto, mesma arquitetura e mesma luz, visto de drone: a uns 60 m de altura, inclinado 40° para baixo, lente 28 mm, olhando o conjunto inteiro como na planta D — cobertura plana com placas solares discretas e equipamentos agrupados atrás da platibanda, a marquise, a calçada, os três pentes de vagas com árvores, a via das docas e as docas nos fundos com dois caminhões-baú brancos, o boulevard com palmeiras na frente. Ao redor, a faixa comercial continuando, prédios residenciais baixos e galpões brancos. Nada escrito, nada vermelho.
```

## 4. Ajustes

Na mesma conversa, um por vez. Todos terminam pedindo para não mexer no resto.

**Apareceu texto, letreiro, logotipo ou cruz de farmácia**
```text
Refaça a mesma imagem sem nenhum texto, letra, número, logotipo, placa ou cruz — as faixas de letreiro ficam lisas e vazias, as vitrines sem adesivo. Não mude mais nada.
```

**Apareceu vermelho, laranja ou rosa**
```text
Troque todo vermelho, laranja ou rosa (carros, embalagens, flores, toldos, sinalização) por branco, cinza, grafite, madeira ou verde-oliva. Não mude mais nada.
```

**Ficou com cara de render de IA (plástico, HDR, brilho)**
```text
Deixe a imagem com cara de fotografia real de arquitetura: tire o efeito HDR, o halo e o brilho difuso, reduza a nitidez e a saturação, dê textura real ao concreto (marcas de fôrma), ao piso (juntas) e ao asfalto (leve variação de tom e marcas de pneu), e grão fino de câmera. Mesma composição, mesma luz.
```

**Prédio com cara de shopping ou grande demais**
```text
O conjunto é térreo e discreto: o supermercado tem só 8 m de altura e as lojas 5,5 m, sem torre, sem cúpula, sem fachada espelhada e sem pórtico monumental. Simplifique para um volume baixo e horizontal, como na referência B. Não mude mais nada.
```

**Verticais tortas ou perspectiva de grande-angular**
```text
Corrija a perspectiva como numa lente tilt-shift: todas as verticais retas e paralelas, sem distorção nas bordas. Mesma composição.
```

**Lojas fora do lugar ou faltando** (trocar o trecho entre colchetes)
```text
As três lojas ficam encostadas à direita do supermercado, sob a mesma marquise, nesta ordem a partir da câmera: [farmácia na esquina, café-padaria com mesinhas na calçada, lavanderia]. Corrija só isso.
```

**Muita gente, muito carro**
```text
Reduza para 6 a 10 pessoas e uns 15 carros, espalhados com naturalidade. Não mude mais nada.
```

**Formato vertical 4:5** (Instagram)
```text
Mesma imagem em formato vertical 4:5: aproxime a câmera da esquina da farmácia e mostre a marquise recuando para a esquerda, com uma fileira de árvores do estacionamento em primeiro plano. Nada escrito.
```

## 5. Checklist de aprovação

- [ ] Nenhum texto, letreiro, logotipo, placa, cruz de farmácia, moldura ou marca d'água.
- [ ] Nada vermelho, laranja ou rosa; nenhum azul além do céu.
- [ ] Parece **fotografia**: texturas reais, sem HDR, halo, bloom, estrela de lente ou chão molhado.
- [ ] Verticais retas (tilt-shift), horizonte reto.
- [ ] Supermercado térreo, horizontal, ~8 m — sem cara de shopping; entrada de pé-direito duplo com ripado.
- [ ] Três lojas mais baixas à direita, na ordem farmácia (esquina) → café-padaria → lavanderia.
- [ ] Uma marquise contínua, fina e grafite, com forro de madeira, de ponta a ponta.
- [ ] Faixas de letreiro presentes e **vazias**.
- [ ] Estacionamento em frente, com canteiros e árvores, ~40% ocupado; carros sem cor viva.
- [ ] Docas escondidas nos fundos; caminhão só de relance.
- [ ] Pessoas poucas, naturais, ninguém olhando para a câmera.
- [ ] Luz de fim de tarde vinda da esquerda, sombras na mesma direção; interior aceso sem estourar.
- [ ] Fundo plano: prédios residenciais baixos e galpões brancos ao longe, nada de morro.

## 6. A confirmar com o cliente

- **Quais são as duas lojas complementares.** O prompt usa café-padaria e lavanderia (dão leitura de
  "serviço do dia a dia" para quem mora no Condo e trabalha no parque); trocar no item 2 e no ajuste
  "Lojas fora do lugar" se ele quiser outras (ótica, pet, açougue, conveniência…).
- **O nome:** a maquete chama o conjunto de **Bracerum Market** e o V14 escreve "Supermercado + lojas"
  (ver `docs/3dmasterplan/README.md`, "Market × Outlet"). A imagem não leva nome nenhum — as faixas
  vazias recebem a marca depois, por composição.
- **Arquitetura:** o V14 só desenha a projeção do prédio. Volume, alturas, marquise e materiais são
  proposta, no idioma dos renders aprovados.
