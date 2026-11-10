# Tabela de valores para o CV CRM — Residence e Outlet (2026-11-10)

Gerado por `build_tabela_cv.py` (rodar de novo se mudar preço ou estrutura). Não vai para o site
(`pacote_vercel.py` não leva `docs/`). **US$ 1.150/m²** em tudo, **menos o Supermercado: US$ 1.950/m²** (cliente, 2026-11-10).

| Arquivo | O que é | Unidades | Valor total |
|---|---|---|---|
| `importar_no_cv/cv_residence_aptos_valores.csv` | **Importação no CV** — Residence Aptos (empreendimento 7) | 1.452 | US$ 111.994.800 |
| `importar_no_cv/cv_residence_casas_valores.csv` | **Importação no CV** — Residence Casas, lotes Q01–Q04 do Resort (empr. 7) | 31 · 20.046 m² | US$ 23.052.900 |
| `importar_no_cv/cv_outlet_premium_1a_fase_valores.csv` | **Importação no CV** — Premium Outlet 1ª fase (empr. 9) | 57 · 17.870 m² | US$ 20.550.500 |
| `importar_no_cv/cv_outlet_supermercado_lojas_valores.csv` | **Importação no CV** — Supermercado + LJ1–LJ12 (empr. 9) | 13 · 5.326 m² | US$ 9.809.700 |
| `Bracerum_Tabela_de_Valores_CV_2026-11.xlsx` | Tabela legível das quatro, com fórmulas, e a lista de mudanças dos aptos | | |
| `cv_residence_aptos_mudancas.csv` | Conferência: as 504 unidades de aptos que mudam no CV (252 novas + 252 alteradas) | | |
| `premium-outlet-1a-fase-cliente.png` | Desenho "Premium Outlet — 1ª fase" do cliente (fonte das lojas) | | |
| `premium-outlet-1a-fase-numerado.png` | O mesmo desenho com a numeração OUT-01…OUT-57 usada no CV | | |
| `cv_unidades_2026-11-10.json` | Retrato do cadastro do CV (empreendimentos 7 e 9) lido da API — de onde saem os ids | | |

Formato: o modelo `unidades_*.csv` da pasta "BRACERUM PARK - CV" do Drive (126 colunas, `;`, UTF-8 com BOM,
números com vírgula decimal). A coluna **Id (Unidade)** leva o id do CV para a importação **atualizar** a
unidade; unidade nova vai sem id.

## Regras

- **Aptos** — Apresentação para investidores P5 (nov/2026), que vale sobre o cadastro antigo do CV (cliente,
  2026-11-10): torres de 1 e 2 quartos com **5 andares, sem cobertura** (a antiga cobertura virou mais um piso);
  torres de 3 quartos com 4 andares e a **cobertura duplex** no 4º (ocupa 2 pisos). US$ 1.150/m² do apartamento
  com as vagas, arredondado à centena; a cobertura soma o terraço (US$ 460/m²) e US$ 6.800 do gourmet — confere
  com a tabela da pág. 12 (55.400 / 56.600 / 78.500 / 112.000 / 163.600). As 252 unidades do 5º andar (T13–T67)
  vão **sem id**; as 252 "coberturas" de 4º andar dessas torres viram apartamento comum.
- **Casas** — 31 lotes, áreas do CV = Masterplan V14.
- **Premium Outlet 1ª fase** — não existe lista de lojas: cada loja do desenho do cliente é um terreno à venda
  (57 lojas, 17.870 m², o número do desenho "Área vendável 1ª fase"). A área de cada loja foi **medida no próprio
  desenho** (eixo a eixo das linhas) com uma escala única que fecha os 17.870 m² (0,83 m/px); o desenho está em
  escala — as larguras alternam como na planta V14. Arredondado ao m² pelo maior resto. **É área de desenho:
  confirmar no plano de mensura.** Ficam fora: doca, sanitários, acessos e a 2ª fase (liberação futura).
  As 57 lojas não existiam no CV — entram num bloco novo, "Premium Outlet — 1ª fase", sem id.
  Numeração (o cliente não numerou): fileira da frente 01–18, fileira de trás 19–36, coluna da doca 37–44,
  coluna externa 45–57 (mapa numerado acima).
- **Supermercado + LJ1–LJ12** — medidos no PDF vetorial do V14 rev. 02/11 (1:1000): supermercado 55,49 × 83,01 m
  = **4.606 m²** (o número do quadro é só do supermercado), a **US$ 1.950/m² = US$ 8.981.700**; lojas na faixa de 10,02 m ao lado, módulos de 6,00 m →
  **60 m² cada**, a US$ 1.150/m² = US$ 69.000 (entre LJ6 e LJ7 há uma passagem de 11 m, sem loja). Unidades já existentes no CV (com id).
- **Só o que vai para o CV, só o que está à venda.** A pasta `importar_no_cv/` tem apenas os quatro CSVs de importação;
  o `build_tabela_cv.py` recusa gravar qualquer linha de terreno de uso do parque (Hub, hangares, Q37, Q11, ETE/ETA,
  manutenção, equipamentos) ou parte comum do Outlet (doca, sanitários, acessos, passagem, 2ª fase), e linha sem área
  ou sem valor. Conferido em 2026-11-10: 1.553 linhas, nenhuma fora da venda.

## Pendente

- Importação não testada no CV — conferir se o CV cria unidade nova pela planilha (252 aptos + 57 lojas sem id).
- Tipologias "2 quartos — cobertura" e "1 quarto — cobertura" ficam sem uso no CV depois da importação.
- Empreendimento 4: Hub (8), hangares (7), Q37 (10) e Q11 (1) estão "disponível" — bloquear; Q38.L017 e as áreas
  da Q38 ainda são as de 28/10.
