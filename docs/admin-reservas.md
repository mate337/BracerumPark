# Painel de reservas da feira — `bracerumpark.com/admin/`

Feito em 2026-11-11 para a equipe reservar lotes no stand, pelo celular, direto no CV CRM. Não muda nada
do site nem da maquete: é uma página à parte (`admin/`) e uma função à parte (`api/admin.js`).

## Fluxo

1. **Entrar** com o nome de quem atende e a **senha da equipe** (`ADMIN_SENHA` na Vercel). A sessão dura
   16 h no aparelho; "Sair" no menu apaga. O nome vai na anotação de cada reserva.
2. **Escolher os lotes** (um ou vários, de quadras diferentes; até 20) — toque na quadra no mapa (os lotes
   ampliam; arrastar e pinçar funcionam) ou na grade de quadras, e **toque nos lotes para marcar/desmarcar**
   (no mapa ou na lista; "Marcar os N livres" marca a quadra inteira). A busca ("Q07 L14") marca o lote. Uma
   barra fixa embaixo mostra os lotes marcados e o total, com **"Avançar para reserva"**. Lote que não está
   livre não entra; se um marcado deixar de estar livre (outra pessoa reservou), ele sai da seleção com aviso.
   Cores = situação no CV agora; atualiza sozinho a cada 30 s.
3. **Condição de pagamento** — as tabelas aprovadas do CV para o loteamento (hoje: Lançamento Expo
   20%+12x, à vista e 20%+36x), com o valor e as parcelas exatas de cada lote no CV; com vários lotes, a
   soma (desconto por volume, se houver, é negociado no CV — as tabelas do CV são por lote, faixa 1–8).
4. **Dados do interessado** — nome, CPF (com verificação dos dígitos: o CV recusa CPF inválido), e-mail,
   telefone com código do país e empresa: todos obrigatórios; observação opcional. Se algo estiver errado,
   um aviso no topo diz quais campos corrigir (2026-11-11: antes só os campos ficavam marcados e o botão
   parecia não fazer nada).
5. **Revisar e confirmar** → a função faz, no CV:
   1. confere no mapa de disponibilidade que a unidade continua livre;
   2. cadastra o **lead** (`POST /api/v1/comercial/leads`) com CPF, unidade de interesse, corretor e
      imobiliária da feira, origem "Outras publicidades", mídia `expo-py-br`, tags `feira`,
      `reserva-feira` e o lote, e uma anotação com empresa, lote, condição e atendente;
   3. acha o **cliente** pelo CPF (`GET /api/v1/cadastros/clientes?documento=`) ou cadastra
      (`POST /api/v1/cadastros/clientes`, `idpessoa_int` = `BPFEIRA-<cpf>`, empresa em
      `trabalho_nome_empresa`);
   4. cria **uma reserva por lote** (`POST /api/v1/comercial/reservas` — no CV a reserva é por unidade) com
      a tabela escolhida e as condições (sinal + mensais) copiadas da tabela do CV para aquela unidade —
      séries "Sinal" (7) e "Mensal" (1);
   5. associa as reservas ao lead e põe o lead em "Com Reserva" (situação 5).
   Com vários lotes: um lead e um cliente, todos os lotes na anotação, e o resultado é mostrado lote a lote
   (reservado / em negociação / tomado). Antes de gravar qualquer coisa, todos os lotes são conferidos
   livres no CV; se um estiver ocupado, nada é criado e o painel oferece tirá-lo da seleção.
   A reserva nasce em **"Nova Reserva"** no workflow do CV: é a negociação; dali a equipe segue no CV
   (análise, documentos, contrato). A unidade fica "reservada" e sai da venda — o painel, a maquete
   (`/api/lotes-status`) e as LPs passam a mostrá-la assim.
6. **Aba Reservas** — reservas do loteamento no CV (só as da feira, ou todas), com WhatsApp/e-mail do
   cliente. As da feira ainda ativas podem ser **canceladas** dali (`POST
   /api/v1/comercial/reservas/cancelar-reserva`); o lote volta a ficar disponível.

É o caminho do guia "Jornada do cliente: do lead à reserva" da documentação do CV e o mesmo da reserva
que a equipe fez à mão em 10/11 (reserva 7, Q03.010: corretor "Feira EXPO PY BR", tabela 3, sinal 1x
em 13/11 + 12 mensais a partir de 15/12, lead em "Com Reserva").

## Rede de segurança: lote "em negociação" (bloqueio para o CPF)

Se o CV recusar o **cliente** ou a **reserva** depois que o lead já entrou (o caso mais provável é falta de
permissão do perfil), o painel não deixa o lote livre: **segura-o em negociação para o CPF** do interessado,
com o recurso do CV descrito em "Como Cadastrar Motivos de Bloqueio de Unidade"
(ajuda.cvcrm.com.br/support/solutions/articles/157000357227) — bloqueio com "Reservar a Unidade para
(Doc)" e liberação automática. Pela API: `POST /api/v1/cadastros/empreendimentos/unidades/bloquear` com
`situacao: "Bloqueada"`, `motivo_bloqueio` (`CVCRM_FEIRA_MOTIVO`, padrão "Estratégia Comercial"),
descrição "Em negociação na feira — nome (empresa) — lead #… — atendente …", `documento_bloqueio` = CPF,
`data_desbloqueio` = hoje + `CVCRM_FEIRA_DIAS` (padrão 3) às 23:59. No CV, só esse cliente pode ser reservado
no lote; no painel ele aparece **"Em negociação"** (cor própria) e na maquete/LPs como indisponível. A tela
final diz o que o CV recusou e manda **terminar a reserva no CV** pelo lead. A aba Reservas lista os lotes
segurados (CPF mascarado) com **"Liberar o lote"** (`situacao: "Disponivel"`), que só funciona em bloqueio
com CPF — os bloqueios comuns (ex.: quadras da FSB) não são tocados.

**"Reservar agora"** (2026-11-11): cada lote segurado tem, na aba Reservas, a escolha da tabela e o botão
"Reservar agora" (`acao: "efetivar"`): acha o cliente pelo CPF do bloqueio e cria a reserva com as condições
da tabela. Se o CV recusar por o lote estar bloqueado, o painel libera o bloqueio, reserva e, se a reserva
ainda falhar, segura o lote de novo para o mesmo CPF — o lote nunca fica livre no meio.

**Primeiro uso real (11/11):** lead #9 e cliente #5 deram certo; a reserva voltou com "O campo valor_parcela
deve ser um decimal" (o painel mandava `36000`) e os lotes Q32.L002/L004/L006 ficaram segurados para o CPF —
por isso apareciam "bloqueados" no CV. Corrigido: o valor da parcela vai como decimal (`"36000.00"`; se o CV
ainda recusar, tenta como número com casas) — função `criarReserva()` em `api/admin.js`.

**2ª ocorrência (11/11, Q32.L009/L010, lead #10, cliente #7):** a string `"36000.00"` e o número `36000` também
voltaram "deve ser um decimal". O CV (PHP) só aceita um float literal no JSON, e o `JSON.stringify` escreve
36000.00 como `36000`. Agora `criarReserva()` escreve `"valor_parcela":36000.00` direto no texto do JSON (1º
formato); se o CV ainda reclamar, tenta `"36000.00"` e `"36000,00"`. O formato aceito/recusado vai para o log.

**Sem mensagem de erro na tela (pedido do cliente, 11/11):** quando o lote é segurado, o painel não mostra mais
o erro do CV — mostra que o lote está bloqueado para o cliente. A descrição do bloqueio no CV leva **nome, CPF,
telefone, e-mail, empresa, lead #, cliente #, tabela e valor e o atendente**, e a aba Reservas mostra essa
descrição em cada lote em negociação (se o mapa do CV a devolver). O motivo da recusa fica só no log da Vercel.

**Recomendado no CV** (o artigo acima mostra como): criar um motivo próprio, por exemplo **"Em negociação —
Feira"**, com cor de fundo própria (aparece assim no Mapa de Disponibilidade do CV), e pôr o nome dele em
`CVCRM_FEIRA_MOTIVO` na Vercel.

## Se algo falhar

- **Lote tomado** no meio do atendimento (outra pessoa reservou): o CV recusa, o painel diz e oferece
  "Escolher outro lote" — os dados digitados continuam.
- **Falha numa etapa** (lead, cliente ou reserva): o painel mostra qual, o que já ficou no CV (ex.: "o lead
  #901 já ficou no CV") e "Tentar de novo" com os mesmos dados. Repetir não duplica o cliente (o CPF é
  procurado antes) e o lead vira uma nova conversão do mesmo lead.
- **Sem internet / CV fora**: aviso no topo ("sem resposta do CV") e a última leitura continua na tela.
- Tudo o que a função faz vai para o log da Vercel (Deployments → Functions → `api/admin`) e para o CVIO
  do CV (`bracerum.cvcrm.com.br/cvio`, 30 dias).

## Configuração (Vercel → Settings → Environment Variables, Production)

| Variável | Para quê |
| --- | --- |
| `ADMIN_SENHA` | senha da equipe (sensível). Trocar a senha derruba todas as sessões. |
| `CVCRM_EMAIL`, `CVCRM_TOKEN` | as mesmas da maquete e das LPs (usuário CONEXAOSITECV) |
| `CVCRM_FEIRA_CORRETOR` | opcional, padrão `2` ("Feira EXPO PY BR") |
| `CVCRM_FEIRA_IMOBILIARIA` | opcional, padrão `1` |
| `CVCRM_FEIRA_TABELA` | opcional, tabela marcada de início, padrão `3` (Expo 20%+12x) |
| `CVCRM_FEIRA_MIDIA` | opcional, padrão `expo-py-br` |
| `CVCRM_EMPREENDIMENTO` | opcional, padrão `4` (loteamento) |
| `CVCRM_FEIRA_MOTIVO` | opcional, motivo do bloqueio "em negociação" (nome de um motivo cadastrado no CV), padrão `Estratégia Comercial` |
| `CVCRM_FEIRA_DIAS` | opcional, dias até o CV liberar sozinho o lote segurado, padrão `3` (1–30) |

O perfil do usuário da integração no CV precisa de permissão para **Leads, Clientes e Reservas**
(criar e cancelar). O bloqueio de unidades e o cadastro de leads já foram usados com ele; criar
cliente e reserva **não puderam ser testados de verdade daqui** (ver abaixo).

O `vercel.json` redireciona `/admin` → `/admin/`, manda `noindex` e `no-cache` para `/admin/*` e dá
60 s à função (a primeira leitura das tabelas de preço do CV, ~575 KB, leva ~10 s; depois fica em
memória por 10 min e o estado sai em ~0,5 s).

## Testes feitos (2026-11-11)

- Contra o CV real, só leitura: login (senha errada → 401, certa → sessão), estado (614 lotes, 3 tabelas,
  517 disponíveis / 1 reservado / 96 bloqueados), reservas (a 7 da Q03), validação (CPF, e-mail,
  telefone, nome, empresa), lote bloqueado recusado (Q02.L001), e a reserva em modo de teste
  (`"teste": true` no corpo: monta as condições — ex.: Q42.L016 20%+12x = sinal 36.000 + 12 × 12.000 —
  sem gravar nada).
- Interface no Chromium como iPhone 13, iPhone SE, Pixel 7 e desktop: sem rolagem lateral, fluxo
  completo até "Reserva feita" (com a gravação simulada), erros de campo, falha na etapa da reserva,
  lote tomado, sessão expirada.
- A rede de segurança e o "liberar", com um CV simulado (sem rede): reserva ok → `modo: reserva`; reserva
  ou cliente recusados → bloqueio para o CPF com os campos acima → `modo: negociacao`; bloqueio também
  recusado → erro com os dois motivos; lote tomado (409) → nada é bloqueado; "liberar" recusa bloqueio sem CPF.
- **Não testado:** a gravação real (lead + cliente + reserva + cancelamento) — o modo automático da
  sessão bloqueou criar registros no CV de produção. **Primeiro uso real:** fazer uma reserva de teste
  num lote Interna (ex.: Q42.L016) com dados de teste, conferir no CV (lead, cliente, reserva "Nova
  Reserva", unidade reservada), e cancelar pela aba Reservas.
