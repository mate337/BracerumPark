# Padrão de códigos de unidade — Bracerum Park (04/11/2026)

Definido pelo usuário em 2026-11-04. Todo imóvel à venda ou à locação no parque tem um **código de 7
dígitos**, igual em CRM, Controle de Unidades, contrato, tabela de preços e maquete.

```
  C  SS  NNNN
  │  │   └── número da unidade (4 dígitos; a regra de montagem é da subcategoria)
  │  └────── subcategoria (2 dígitos)
  └───────── categoria (1 dígito)
```

## Categorias e subcategorias

| Código | Categoria | Sub | Subcategoria | Como se monta o NNNN | Exemplo |
|---|---|---|---|---|---|
| **1** | **Hotel** | 00 | Bracerum Hotel | andar (2) + unidade (2) | **1000101** = andar 01, unidade 01 |
| **2** | **Cidade** | 01 | Bracerum Market | loja (4); 0013 = supermercado | 2010005 = loja LJ5 |
| **3** | **Loteamento** | 01 | Outlet Premium | loja (4) | **3010005** = loja 05 |
| | | 02 | Lotes industriais | quadra (2) + lote (2) | 3020714 = `LTIND.Q07.L014` |
| | | 03 | Hangares | hangar (4) | 3030007 = hangar 07 |
| | | 04 | Hub de serviços | lote (4) | 3040003 = lote 03 do Hub |
| **4** | **Condomínios** (prédios e casas) | 01 | Bracerum Residence | torre (2) + andar (1) + apto (1) | 4010732 = `RES T07 – 302` |
| | | 02 | Bracerum Resort | quadra (2) + lote (2) | 4020412 = `LT.RES.Q04.L12` |

Os prefixos de 3 e 5 dígitos também valem como código:

- **3 dígitos = empreendimento** (C + SS): `401` Residence, `302` Lotes industriais, `100` Hotel.
- **5 dígitos = bloco** (torre, quadra ou andar): `40107` = Torre T07; `30207` = Quadra Q07;
  `10001` = andar 01 do Hotel.

## Regras

1. **Sempre 7 dígitos**, tratados como texto (no Excel e no CRM, coluna em formato texto). Nenhum
   código começa com zero, então nada se perde, mas o formato texto evita "1.000.101".
2. **O código não muda nunca.** Venda, distrato, troca de dono ou de preço não mexem nele. Unidade
   que deixa de existir tem o código **aposentado**, não reaproveitado.
3. **Venda de vários lotes juntos:** cada lote mantém o seu código e o contrato lista todos. Se a
   prefeitura unificar os lotes na escritura, o lote resultante fica com o **menor** código do grupo
   e os demais são aposentados.
4. **Lote dividido** (o V14 já é desenhado em módulos de 1.250 m², então isso deve ser raro): as
   partes recebem números novos, acima do último usado na quadra.
5. **Unidade nova numa subcategoria** pega o próximo número livre. Subcategoria nova (por exemplo,
   o Centro Tecnológico ou o Hub de serviços, se passarem a vender ou alugar salas/lotes) pega o
   próximo `SS` livre da categoria.
6. **O nome oficial continua existindo** ao lado do código: `LTIND.Q07.L014.A01250.ESQNAO.RT.L` no
   V14, `RES T07 – 302` no Residence. O código é a chave; o nome é o que se lê.

## Capacidade

| Subcategoria | Hoje | Cabe |
|---|---|---|
| Hotel | 384 studios | 99 andares × 99 unidades |
| Market | 12 lojas | 9.999 |
| Outlet Premium | ≈ 224 lojas | 9.999 |
| Lotes industriais | 615 lotes, Q01–Q42, até 17 por quadra | 99 quadras × 99 lotes |
| Hangares | 7 | 9.999 |
| Residence | 1.200 aptos, 67 torres, 4 andares, até 6 por andar | 99 torres × 9 andares × 9 aptos |
| Resort | 31 lotes | 9.999 |

## O que já está codificado

`python3 docs/produtos/build_unidades.py` gera:

- **Um CSV do CRM por categoria**, no formato do modelo enviado (126 colunas, `;`, UTF-8 com BOM):

  | Arquivo | Unidades | O que tem |
  |---|---|---|
  | `docs/produtos/unidades_1_hotel.csv` | 384 | studios do Hotel (**distribuição estimada**, ver abaixo) |
  | `docs/produtos/unidades_2_cidade.csv` | 13 | Market: lojas LJ1–LJ12 + supermercado |
  | `docs/produtos/unidades_3_loteamento.csv` | 641 | 615 lotes industriais à venda + 11 fora da oferta (Q37 recinto, Q11 Administração) + 7 hangares + 8 lotes do Hub |
  | `docs/produtos/unidades_4_condominios.csv` | 1.231 | 1.200 aptos do Residence + 31 lotes do Resort |

  O código vai em `Código interno` da unidade, o prefixo de 5 dígitos no bloco e o de 3 no
  empreendimento/etapa. Só Residence e lotes industriais têm preço; o resto entra com
  `Ativo no painel = Não` e valor em branco. Q37 e Q11 entram também com `Bloqueado via Integração = Sim`.
- **`docs/produtos/registro_codigos.csv`**: os **2.269 códigos**, com categoria, subcategoria, nome
  oficial e lat/lon. O script recusa código repetido ou fora do formato.

| Faixa | Situação |
|---|---|
| 4010111 – 4016746 | Residence: **código definitivo** (torre, andar e apto vêm do kit comercial). O lugar de cada torre no mapa é proposta (ver `docs/produtos-residence-outlet.md`) |
| 3020101 – 3024216 | Lotes industriais: **definitivo**, sai do nome oficial do V14 |
| 3023701 – 3023710, 3021101 | Q37 (recinto alfandegado) e Q11.L001 (Administração): **definitivo**, nome oficial do V14, fora da oferta |
| 3030001 – 3030007 | Hangares: **definitivo**, numerados 01 a 07 no próprio V14 (a Sala VIP do lado não é hangar) |
| 3040001 – 3040008 | Hub de serviços: **numeração proposta** (o V14 diz "8 lotes", sem nome nem área por lote) |
| 4020101 – 4020413 | Resort: **definitivo**, nome e área de cada lote escritos no V14 (`LT.RES.Q01.L01`, 656 m²) |
| 2010001 – 2010013 | Market: LJ1–LJ12 como no V14; **supermercado = 2010013** (próximo número livre). Área por loja a definir |
| 1000101 – 1001232 | Hotel: **PROVISÓRIO** — 12 andares × 32 studios é estimativa minha (30.000 m² ÷ lâmina de ~2.450 m²). Quando chegar a distribuição real, regerar antes de usar |
| 3010001 – 3010224 | Outlet Premium: **a gerar**; não há planta de lojas, então o Outlet não entra no arquivo da categoria 3 |

## A confirmar com o usuário

- **Residence e Resort ficaram na categoria 4 (Condomínios)**, e não na Cidade (2) como na primeira
  proposta, porque a categoria 4 nasceu depois exatamente para prédios e casas. A Cidade ficou com o
  comércio e os serviços (Market).
- **Nome "Outlet Premium"** como subcategoria; o material comercial chama o produto de
  "Bracerum Outlet".
- **Distribuição do Hotel**: quantos andares e quantos studios por andar (o arquivo usa 12 × 32).
- **Hub de serviços** como subcategoria **04 do Loteamento** (o V14 chama de "8 lotes").
- **Resort: soma dos 31 lotes = 20.046 m²**, e o quadro do V14 diz 38.072 m². A diferença deve ser o
  sistema viário, lago, portaria e salão do condomínio. Confirmar.
