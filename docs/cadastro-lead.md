# Cadastro rápido de lead — `bracerumpark.com/cadastro/`

Feito em 2026-11-12. Página simples para a equipe cadastrar um lead no CV CRM em segundos: **nome,
telefone, empresa e interesse**. Mesmo visual do painel de reservas (`/admin/`), sem login, sem mapa.

## Arquivos

| Arquivo | O que é |
|---|---|
| `cadastro/index.html` | a página (noindex) |
| `cadastro/cadastro.css` | tokens do `admin/admin.css` (ink/paper/sand/brown, Helvetica + Noto Serif, cantos quadrados) |
| `cadastro/cadastro.js` | validação, envio, fila do aparelho, histórico |
| `cadastro/sw.js` + `manifest.webmanifest` | abre sem internet e pode ir para a tela inicial do celular ("Leads BP") |
| `api/lead.js` | a mesma função das LPs; `lp: "cadastro"` liga o modo "cadastro rápido" |
| `vercel.json` | `/cadastro` e `/Cadastro` → `/cadastro/`; cabeçalho noindex |

## Campos → CV

| Página | No CV (`POST /api/v1/comercial/leads`) |
|---|---|
| Nome (obrigatório) | `nome` |
| Telefone + código do país (obrigatório) | `telefone` (só dígitos, sem o zero da frente) + `telefone_ddi` |
| Empresa (opcional) | anotação do lead ("Empresa: …") — o CV não tem campo de empresa no lead |
| Interesse (obrigatório, **um ou mais**) | `idempreendimento` (número, ou lista `[4, 7]` com mais de um) + tags + `conversao` + anotação |

Interesse → empreendimento (igual às LPs): Lotes industriais → 4 · Apartamento (Residence) → 7 ·
Lote para casa (Resort) → 7 · Loja ou sala (Business Center/Outlet) → 9.

**Mais de um interesse (2026-11-12, pedido do cliente):** os quatro cartões são caixas de marcar. A página manda
`produtos: [...]` e a `api/lead.js` junta os empreendimentos sem repetir — Apartamento + Lote para casa = `7`;
Lotes + Loja = `[4, 9]` (o CV aceita lista de empreendimentos de interesse). Uma tag por produto, e o texto
"Apartamento, Lote para casa" na conversão e na anotação. Cadastro antigo na fila (só `produto`) continua valendo.

Sem e-mail: o CV aceita lead só com telefone ("e-mail **ou** telefone", doc. "Cadastra Leads"). Por isso a
`api/lead.js` passou a aceitar e-mail vazio (se vier, continua sendo validado) — as LPs não mudam, elas
seguem exigindo e-mail no navegador.

Também vai: `modulo: "Cadastro rápido"`, tags `cadastro-rapido` + produto, e a anotação começa com
"Cadastro rápido da equipe". Mesmo telefone = mesmo lead: a função repete com `permitir_alteracao` e o CV
registra a conversão nova no lead que já existe.

## Origem e mídia

Sem `utm_*` na URL, o lead entra como **da feira**, igual ao `/admin/`: origem "Outras publicidades" (OP),
mídia `expo-py-br`. Para outro evento: mude `ORIGEM_PADRAO` no topo de `cadastro/cadastro.js` ou abra
a página com `?utm_source=…&utm_medium=…&utm_campaign=<slug-da-midia>`.

## Sem internet

Se a internet ou o CV falharem (ou o envio passar de 15 s), o cadastro fica na **fila do aparelho**
(`localStorage`, chave `bp-cadastro-fila`), a tela diz "Guardado no aparelho" e ele sobe sozinho ao voltar a
conexão, a cada 30 s e ao abrir a página (ou no "Enviar a fila agora"). Só erro de preenchimento (422) não
entra na fila. "Neste aparelho" lista os últimos 30 cadastros com o estado: No CV (com o nº do lead) / Na fila
/ Recusado. A função também loga o lead que falhou (Vercel → Logs), como nas LPs.

## Testes feitos (2026-11-12, local, com o CV simulado)

- envio normal (PY +595 com zero na frente → `985123456` / `+595`), empreendimento 7, origem OP, mídia
  `expo-py-br`, empresa na anotação;
- CV fora (500) e conexão caída → fila → reenvio manual e pelo evento `online`;
- lead repetido (400 "já existe") → reenvio com `permitir_alteracao`;
- validação: vazio, telefone BR sem DDD, "Outro" código do país; 320 px sem rolagem lateral;
- `api/lead.js`: LP continua com e-mail obrigatório no navegador, tags e LGPD como antes.

## No ar (2026-11-12)

Publicado pela Vercel CLI (`docs/pacote_vercel.py`), deploy `dpl_B2DxM8jzC9BC1Qtu3W1xSTzYV4E7`. Conferido no ar:
`/cadastro` → `/cadastro/` (307), página, CSS, JS e SW em 200, noindex; home, `/admin/`, LPs, `/corretores`,
maquete e `/api/lotes-status` seguem em 200.

**Teste real no CV:** pela página no ar, "TESTE cadastro Claude - apagar", PY +595 900 000 001, empresa "Teste
Claude", Lotes industriais → **lead #13**, sem e-mail, empreendimento 4, origem "Outras publicidades", mídia
`expo-py-br`, tags `park` + `cadastro-rapido`, anotação com a empresa. **Descartado** em seguida (situação 3
"Descarte", motivo "Desistência", explicação "lead de teste").

**Vários interesses no ar (2026-11-12, deploy seguinte):** teste real pela página com Lotes industriais + Loja ou sala,
PY +595 900 000 002 → **lead #15** com os dois empreendimentos no CV (4 "Lotes industriais" e 9 "Bracerum Outlet"),
tags `park`, `outlet`, `cadastro-rapido`; **descartado** em seguida. Visto no caminho: **telefone repetido reativa o
lead** — um reenvio com o telefone do #13 tirou-o de "Descarte" (voltou a "Aguardando Atendimento", com
`data_reativacao`); foi descartado de novo. É o comportamento certo para um cliente que volta, mas teste novo usa
telefone novo.

Para descartar pela API: `POST /api/v1/comercial/leads` com `idlead`, `permitir_alteracao: true`, `idsituacao: 3`,
`motivo_cancelamento` (nome do motivo) e `descricao_motivo_cancelamento` quando o motivo exige explicação
(lista em `GET /api/v1/comercial/motivos-cancelamento-lead`; situações em `GET /api/v1/configuracoes/workflows/leads`).

**Aviso do CV:** a resposta da API trouxe "A rota /api/v1/comercial/leads será descontinuada. Migre para
/api/v4/comercial/leads". Vale para `api/lead.js` e `api/admin.js` — sem data anunciada; migrar antes que o CV desligue.
