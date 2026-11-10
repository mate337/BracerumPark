# Contrato de Reserva e Direito de Aquisição Futura — guia de preenchimento (CV CRM)

Registro de 2026-11-10. Origem: dúvida do time do CV sobre o contrato base do parque (lotes industriais).

- `CONTRATO_RESERVA_MODELO_BILINGUE_rev2.docx` — modelo do jurídico, como o cliente enviou.
- `EXEMPLO_Contrato_Reserva_LTIND.Q02.L003_comentado.docx` — o modelo **preenchido**, com destaque por cor e
  comentários do Word em cada campo. Comprador fictício; lote, preço, pagamento e data = os da **reserva 4**
  do teste do CV (LTIND.Q02.L003, 09/11/2026). O `.pdf` é o mesmo arquivo com os comentários na margem.
- `build_exemplo.py` — gera o exemplo a partir do modelo (`python3 build_exemplo.py word/document.xml comentarios.json`
  sobre o modelo descompactado; os comentários entram depois com o `comment.py` do skill de docx).

Legenda do exemplo: **amarelo** = variável do CV (muda a cada reserva) · **ciano** = fixo no modelo (igual em
todo contrato) · **cinza** = sugestão, diretoria/jurídico confirma · **vermelho [PENDENTE]** = dado que falta.

## 1. Quem é quem

| Papel | Quem | Fonte |
|---|---|---|
| Empreendedora / Desarrolladora (vendedora) | **QATAR S.A. (Bracerum Park)**, RUC 80142167-5, Assunção | Cláusula 1ª do modelo; Tabela de Preços v3.1 ("somente para a conta da Empreendedora — QATAR S.A.") |
| Bracerum do Brasil Importação e Exportação S.A. | CNPJ 38.659.873/0001-83, Pomerode/SC — trading do grupo no Brasil | "Dados cadastrais Bracerum 2026" |

**A Bracerum do Brasil não é parte do contrato.** Nenhum dado dela entra no contrato: nem no cabeçalho, nem na
assinatura, nem no endereço de notificação, nem no Anexo V. As contas dela (Santander, Itaú, Daycoval) não servem
como conta receptora: o 14.1 exige conta de titularidade da Empreendedora, o 13.5 manda a Empreendedora emitir o
recibo fiscal e a Cláusula 31ª (PLD) pede o dinheiro na mesma empresa que vende. Receber no Brasil seria mudança
de estrutura — jurídico antes.

## 2. O que falta o cliente informar (fixo, uma vez só, direto no modelo)

1. Representante legal da QATAR S.A. — nome, C.I., cargo — e a ata/procuração (Anexo IX). (1.1 e assinatura)
2. Dados do terreno: Finca, Cta. Cte. Catastral, Padrón, superfície, Seção (4.1; certidão do Anexo I).
3. Conta bancária da QATAR S.A. para o Anexo V (banco, agência, conta em USD, SWIFT).
4. Endereço de notificação da QATAR S.A. em Assunção, responsável e e-mail (35.1).
5. Decisões comerciais: prazo de individualização (16.1); data-base e índice do reajuste (12.4); multa de
   confidencialidade em USD (27.3); valor mínimo da taxa de cessão (28.2, ou apagar o trecho); confirmar 1%/2% de
   mora (24.1) e 20% (27.2); nome oficial da etapa/setor (sugestão: "P1 · Lotes Industriais").

Percentuais que já estão na Tabela v3.1 e viram fixos sem colchetes: 25% de retenção (26.3/26.4), 10% de multa
(27.1) e 2% de cessão (28.2).

## 3. Variáveis do CV (por reserva) — sempre nas **duas colunas** (a ES prevalece)

Comprador (1.2 PF **ou** 1.3 PJ, renumerando), lote pelo nome oficial do Masterplan V14 (`LTIND.Qxx.Lyyy`), quadra,
área com duas casas (`1.250,00`), confrontações (6.2), código da reserva (6.4), preço total por extenso e
US$/m² (12.1), sinal / saldo / parcelas / 1º vencimento (13.1), autorização de divulgação (34.5), endereço e
e-mail do comprador (35.1), data por extenso (40.5) e assinatura.

## 4. O que saiu errado no teste da reserva 4 (PDF gerado pelo CV, 09/11/2026)

- Cabeçalho e assinatura com `[RAZÃO SOCIAL] — RUC [___]` → QATAR S.A. — RUC 80142167-5.
- Coluna **ES** sem variáveis em 12.1 (preço) e 40.5 (data); 6.1/6.2 em branco nas duas colunas; US$/m² em branco.
- Nacionalidade "Paraguaio" para comprador com CPF e domicílio em Barbacena/MG; "Solteiro(a)"; "Empresário" na
  coluna ES; endereço sem número e CEP.
- Unidade "Lote N.º 3 — Quadra Q02 — **Loteamento** — 1.250,000 m²": usar `LTIND.Q02.L003`, a etapa do parque
  (não o nome do empreendimento no CV) e `1.250,00`.
- Sinal 49.749,92 para fechar 36 × 5.527,78. A Tabela diz sinal = 20% do total: sinal **49.750,00** e a última
  parcela 5.527,70.
- 12.3 com `[__]%` de juros: pela Tabela não há juros (o +8% do 36x já está no US$/m²) — texto sugerido no exemplo.
- Percentuais ainda entre colchetes (`[1]%`, `[25]%`, …) e `[foi / não foi]`.
- O preço confere: 1.250 m² × US$ 199 (Expo, Vitrine, 1–8 lotes, 20% + 36x) = US$ 248.750,00.

## 5. Pontos para o jurídico

- 12.4: o índice "estabelecido pelo Banco Central do Paraguai" precisa ser nomeado e valer para parcela em USD.
- Carta de Reserva da Expo (sinal de 1%, dedutível do sinal do contrato): citar no 13.1 quando houver.
- A Tabela v3.1 promete preferência da Empreendedora na revenda de lote não edificado e prazos de obra (24 meses)
  e operação (36 meses) — o contrato remete ao Regulamento Interno (Anexo VII); conferir se está lá.
