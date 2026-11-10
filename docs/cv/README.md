# Tabela de valores para o CV CRM — Bracerum Residence (2026-11-10)

Gerado por `build_tabela_cv.py` (rodar de novo se mudar preço ou estrutura). Não vai para o site
(`pacote_vercel.py` não leva `docs/`).

| Arquivo | O que é |
|---|---|
| `cv_residence_aptos_valores.csv` | **Importação no CV** — 1.452 aptos, no modelo `unidades_*.csv` da pasta "BRACERUM PARK - CV" do Drive (126 colunas, `;`, UTF-8 com BOM, números com vírgula decimal). |
| `cv_residence_casas_valores.csv` | **Importação no CV** — os 31 lotes residenciais (Q01–Q04 do Resort). |
| `cv_residence_aptos_mudancas.csv` | Conferência: as 504 unidades que mudam no CV (252 novas + 252 alteradas). |
| `Bracerum_Residence_Tabela_de_Valores_2026-11.xlsx` | Tabela legível: aptos por tipologia, casas lote a lote e as mudanças. |
| `cv_unidades_2026-11-10.json` | Retrato do cadastro do CV (empreendimentos 7 e 9) lido da API em 2026-11-10 — de onde saem os ids. |

## Regras

- **Aptos** — Apresentação para investidores P5 (nov/2026), que **vale sobre o cadastro antigo do CV** (o cliente
  confirmou em 2026-11-10): 1.452 aptos em 67 torres. US$ 1.150/m² do apartamento com as vagas, arredondado à
  centena; a cobertura soma o terraço (US$ 460/m²) e mais US$ 6.800 do gourmet. Confere com a tabela da pág. 12:
  1q 55.400 / 56.600 · 2q 78.500 · 3q 112.000 · cobertura 163.600 → **US$ 111.994.800**.
- **Casas** — US$ 1.150/m² do lote (cliente, 2026-11-10): 31 lotes, 20.046 m² → **US$ 23.052.900**.
- A coluna **Id (Unidade)** leva o id do CV para a importação **atualizar** a unidade. As 252 unidades do 5º andar
  das torres de 1 e 2 quartos (T13–T67) vão **sem id** (unidade nova). As antigas "coberturas" do 4º andar dessas
  torres viram apartamento comum — o PDF diz que as torres de 1 e 2 quartos não têm cobertura.
- Só unidades vendáveis. Hub de serviços, hangares, Q37 e Q11 estão no empreendimento 4 (loteamento), não aqui.

## Pendente

- **Outlet + Supermercado e lojas (empreendimento 9)** — falta a área de cada loja (no CV as 13 unidades estão com
  0 m²) e as 57 lojas da 1ª fase do Outlet nem estão cadastradas. Preço da 1ª fase: US$ 1.150/m².
- No CV, a tipologia "2 quartos — cobertura" e "1 quarto — cobertura" fica sem uso depois da importação.
