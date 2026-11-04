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
| **2** | **Cidade** | 01 | Bracerum Market | loja (4) | 2010005 = loja LJ5 |
| **3** | **Loteamento** | 01 | Outlet Premium | loja (4) | **3010005** = loja 05 |
| | | 02 | Lotes industriais | quadra (2) + lote (2) | 3020714 = `LTIND.Q07.L014` |
| | | 03 | Hangares | hangar (4) | 3030007 = hangar 07 |
| **4** | **Condomínios** (prédios e casas) | 01 | Bracerum Residence | torre (2) + andar (1) + apto (1) | 4010732 = `RES T07 – 302` |
| | | 02 | Bracerum Resort | lote/casa (4) | 4020012 = lote 12 |

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

- **`docs/produtos/registro_codigos.csv`**: os **1.853 códigos** de hoje, com categoria,
  subcategoria, nome oficial e lat/lon (401: 1.200 · 302: 615 · 303: 7 · 402: 31). O script recusa
  código repetido ou fora do formato.
- **`docs/produtos/empreendimentos_unidades_bracerum.csv`**: o CSV do CRM. O código vai em
  `Código interno` da unidade, o prefixo de 5 dígitos no bloco e o de 3 no empreendimento/etapa.

| Faixa | Situação |
|---|---|
| 4010111 – 4016746 | Residence: **código definitivo** (torre, andar e apto vêm do kit comercial). O lugar de cada torre no mapa é proposta (ver `docs/produtos-residence-outlet.md`) |
| 3020101 – 3024216 | Lotes industriais: **definitivo**, sai do nome oficial do V14 |
| 3030001 – 3030007 | Hangares: **numeração proposta** (ordem de leitura da prancha) |
| 4020001 – 4020031 | Resort: **numeração proposta** (ordem de leitura da prancha) |
| 1000101 – … | Hotel: **a gerar** quando chegar a distribuição dos 384 studios por andar |
| 2010001 – 2010012 | Market: **a gerar** com a planta das lojas LJ1–LJ12 |
| 3010001 – 3010224 | Outlet Premium: **a gerar** com a planta de lojas (fases 1 a 3) |

## A confirmar com o usuário

- **Residence e Resort ficaram na categoria 4 (Condomínios)**, e não na Cidade (2) como na primeira
  proposta, porque a categoria 4 nasceu depois exatamente para prédios e casas. A Cidade ficou com o
  comércio e os serviços (Market).
- **Nome "Outlet Premium"** como subcategoria; o material comercial chama o produto de
  "Bracerum Outlet".
- **Distribuição do Hotel**: quantos andares e quantos studios por andar.
