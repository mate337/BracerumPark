# Preços no CV CRM × materiais de investidores (2026-11-11)

Conferência dos valores por m² cadastrados no CV (`bracerum.cvcrm.com.br`) contra as apresentações para
investidores de novembro de 2026, enviadas pelo cliente em 11/11. O texto de cada PDF está em
`docs/cv-precos/materiais/` (os PDFs não estão no repositório); a planilha com os valores certos, unidade a
unidade, é `docs/cv-precos/Correcoes_CV_precos_2026-11-11.xlsx`. Para conferir de novo (só leitura):
`CVCRM_EMAIL=… CVCRM_TOKEN=… python3 docs/cv_conferencia_precos.py`.

## Regras dos materiais

| Produto | Material | Regra de preço (lançamento Expo, até 13/11/2026) | Pagamento |
|---|---|---|---|
| Lotes | P1 + Condições Comerciais MP14 rev. 16/10 | base US$ 160/185/220 (Expo/Pós-Expo/Fase 1 plena) × categoria (V 1,15 · B 1,10 · P 1,00 · I 0,90) | 20%+12x tabela · à vista ×0,92 · 20%+36x ×1,08 |
| Resort (casas) | P4 | casa = 80% do lote × **US$ 1.950/m²** (lote incluído); +8% até 31/03/2027, +15% depois | 30/40/30 · à vista −5% · 3+ casas −5% |
| Residence | P5 | apto × US$ 1.150/m² (vagas incluídas), arred. a US$ 100; cobertura + terraço × 460 + 6.800 | 20%+12x · à vista −5% · 36x +8% |
| Outlet (lojas) | P7A | US$ 1.150/m² (US$ 1.240 até 31/03/2027, US$ 1.320 depois) | 30% + saldo até a entrega · à vista −5% |
| Market | P7 | satélite US$ 1.000–1.300/m², média 850–1.000, supermercado 1.150 (≈ 2.200 m²) | 30% + 24x · à vista −5% |
| Business Center | P8 | US$ 1.150/m² | 30% + 24x |
| Hotel (studios) | P10 | ≈ US$ 1.700/m² → US$ 59.500 por studio de ≈ 35 m² | 20% + saldo na obra · à vista −5% |

## O que o CV tem (leitura de 11/11/2026)

- **Lotes (empreendimento 4):** 614 lotes, categorias iguais às da maquete; as 9 tabelas seguem a regra com o
  US$/m² **arredondado** da tabela pública (`3dmasterplan/data/precos.json`). As 12x batem exatamente com o
  material. À vista e 36x diferem até 0,17% dos exemplos do PDF de Condições, que usam o fator exato
  (ex.: Padrão Expo à vista CV 183.750 × PDF 184.000) — decidir pela Tabela lote a lote do Material de Apoio.
  A "Expo 20%+36x" é a única que arredonda o total a US$ 100. **Q38: 11 lotes com as áreas antigas**
  (CV 765.669 m² × 766.689 m² do material). **Q04.L017 = 1.650 m²** — o cliente decidiu em 11/11 que é este
  (a maquete passou a usar 1.650; a rev. 02/11 escrevia 1.410).
- **Residence (7, etapa "Pré-lançamento"):** 1.452 aptos e as 3 tabelas certas. O campo "valor" de 252 aptos
  do 4º andar das torres de 1 e 2 quartos tem preço de cobertura (116.700 / 84.350 / 86.000).
- **Resort (7, etapa "Fase 1", "Lote residencial"):** cobrado como **lote × US$ 1.150** (600 m² → 690.000)
  em vez de casa × 1.950 (936.000): **US$ 23,05 mi × 31,27 mi**. Área cadastrada = a do lote (fica assim,
  decisão de 11/11). Séries 20%+12x/36x em vez de 30/40/30; sem tabela pós-Expo.
- **Outlet (9, "Premium Outlet — 1ª fase"):** campo "valor" certo, mas **as três tabelas (15, 18, 19) têm os
  preços em ordem invertida**: a loja `out/k` recebeu o preço da `out/(58−k)` — 52 de 57 lojas erradas
  (a soma não muda). 1ª fase 17.870 m² no CV × 17.757 m² no P7A. Tabela de US$ 1.150 vale até 30/11.
- **Market (dentro do 9):** "Supermercado" com 4.606 m² (o Market inteiro) + 12 lojas de 60 m² a 1.150.
- **Hotel (3):** 384 studios de 33 m², sem preço e sem tabela — fora desta revisão (pedido de 11/11).
- **Business Center:** não existe no CV.
- Todas as unidades a corrigir estavam "Disponível". Parcelas de todas as tabelas: mensal = 80% ÷ n,
  arredondada a US$ 100, sinal = diferença (por isso o sinal varia de 18% a 21%).

## A API não corrige (testado em 11/11/2026)

- **Tabela de preço é só leitura:** `/v1/.../tabelasdepreco[/id]` e `/v3/.../tabelas-preco/{id}` respondem
  "Must be one of: GET, OPTIONS". Não existe endpoint de escrita nos docs (desenvolvedor.cvcrm.com.br).
- **Unidade:** `POST /v1/cadastros/empreendimentos/unidades` atualiza pelo `idunidade`, mas exige os
  `idempreendimento_int`/`idetapa_int`/`idbloco_int` de ERP, que aqui são nulos → "Empreendimento inexistente
  no sistema" (tentativa numa unidade do Residence; nada mudou). Preencher esses IDs exigiria regravar o
  cadastro do empreendimento (empresa, CNPJ, endereço) — não feito. O `PATCH /v3/.../unidades/{id}` faria a
  alteração parcial, mas a v3 só aceita Bearer gerado com **senha** (`POST /v3/auth/token`); o token da
  integração não serve.
- **Caminho:** lançar no painel do gestor a planilha `Correcoes_CV_precos_2026-11-11.xlsx` e rodar
  `docs/cv_conferencia_precos.py` para conferir.

## Pendente com o cliente

Resort em 30/40/30 (e 36x, que o P4 não prevê) e tabelas pós-Expo do Resort e do Outlet; condição do Outlet
(30% + até a entrega × 20%+12x/36x da peça "Premium Outlet"); área do supermercado do Market; arredondamento
de à vista/36x dos lotes; cadastro do Business Center.
