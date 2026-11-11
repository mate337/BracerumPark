# LP de corretores — `/corretores` (2026-11-11)

Página de cadastro de corretores e imobiliárias que querem ofertar o Bracerum Park. Mesmo padrão
das LPs dos folders (gerada por `docs/build_lps.py`, CSS/JS em `lp/`, PT/EN/ES pela chave
`bp-lang`), mas com **outra dinâmica de envio: não cadastra no CV CRM** — grava numa planilha do
Google Drive e abre o WhatsApp do Sydney Savi com a mensagem pronta.

- Endereço: **bracerumpark.com/corretores** (também `/Corretores`; `/corretor` e `/Corretor` redirecionam).
- Planilha: **"Leads Corretores"** no Drive do Matheus
  (`1LavGFK7SC9TeXokO8Zkaj9-vXuzX9lYOWOF71WC2WgY`), primeira aba.
- WhatsApp de destino: Sydney Savi, **+55 47 98803-0200** (`5547988030200`, o mesmo `WA_BR` das outras LPs).
- **Publicada e ligada à planilha em 2026-11-11.** Apps Script publicado (GET na URL `/exec` responde
  `{"ok":true,"planilha":"Leads Corretores "}`), `CORRETORES_PLANILHA_URL` na Vercel (Production, sensível).
  Cadastro de teste pelo site no ar → linha 2 "TESTE Claude - apagar", conferida pelo Drive — apagar à mão.

## Fluxo

1. O corretor preenche **Nome, WhatsApp (com DDI) e Imobiliária** — três campos, um passo só.
   Autônomo escreve "Autônomo" no campo da imobiliária.
2. No toque em "Cadastrar e chamar no WhatsApp":
   - a conversa com o Sydney **abre na hora** (nova aba / app do WhatsApp) com:
     > Olá, me chamo **Maria Souza**, da Imobiliária **Central**, e tenho interesse em ofertar o Bracerum Park para os meus clientes.

     (Se o nome já começa com "Imobiliária…"/"Imóveis…", sai "da Imobiliária Horizonte", sem repetir;
     "Autônomo" vira "corretor(a) autônomo(a)". Em ES/EN a mensagem sai no idioma da página.)
   - ao mesmo tempo o navegador manda os dados para **`/api/corretor`** (`fetch` com `keepalive`,
     que termina mesmo se a página sair), e a função grava a linha na planilha.
   - Se o navegador bloquear a nova aba (navegador do Instagram etc.), a própria página vai para o WhatsApp.
3. A página mostra "Pronto, Maria. Cadastro recebido." com o botão "Abrir o WhatsApp" de reserva.

O WhatsApp abre **antes** da resposta da planilha de propósito: depois de esperar uma resposta, o
navegador já não deixa abrir janela. Se a planilha falhar, o Sydney recebe a mensagem do mesmo jeito
(com nome e imobiliária) e a função grava o cadastro no log da Vercel (`[corretor] falhou …`).

## Planilha

Colunas (o próprio script escreve o cabeçalho na primeira vez, em negrito e congelado):

| Data | Nome | WhatsApp | Imobiliária | Abrir conversa | Idioma | Origem | Página |
|---|---|---|---|---|---|---|---|
| 11/11/2026 19:30 | Maria Souza | +55 47 99123-4567 | Central | https://wa.me/5547991234567 | pt | instagram / bio | /corretores?utm_source=instagram… |

"Abrir conversa" é o link para falar com o corretor; "Origem" vem dos utm do link (ou do site de
onde veio, ou "direto"). Tudo entra como texto — nada que comece com `=`/`+` vira fórmula.

## Instalação (uma vez, na conta dona da planilha)

A gravação usa um **Apps Script** dentro da própria planilha, publicado como "App da Web" — sem
conta de serviço nem chave do Google na Vercel.

1. Abrir a planilha → **Extensões → Apps Script**.
2. Apagar o que estiver no editor e colar todo o `docs/corretores-planilha.gs`. Salvar (Ctrl+S);
   pode dar ao projeto o nome "Cadastro de corretores".
3. **Implantar → Nova implantação** → no ícone de engrenagem, **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. **Implantar → Autorizar acesso** → escolher a conta → "Avançado" → "Acessar Cadastro de
   corretores (não seguro)" → **Permitir**. (O aviso aparece porque o script é seu e não passou
   por verificação do Google; ele só mexe nesta planilha.)
5. Copiar a **URL do App da Web** (termina em `/exec`). Abrir no navegador deve mostrar
   `{"ok":true,"planilha":"Leads Corretores "}`.
6. Na Vercel: variável **`CORRETORES_PLANILHA_URL`** = essa URL, em Production, marcada como
   sensível. Publicar de novo (a variável só vale nas publicações seguintes).

**Mudou o código do script?** Implantar → Gerenciar implantações → lápis → Versão: **Nova versão**
→ Implantar. Assim a URL continua a mesma. Salvar o código sem nova versão não muda o que está no ar.

**Compartilhamento:** como o script roda como dono, a planilha **não precisa** ficar aberta a
"qualquer pessoa com o link" — pode (e deve, pela LGPD: são nomes e telefones) ficar restrita à equipe.

## Conferir

- `POST /api/corretor?dry=1` com o JSON do formulário devolve a linha que iria para a planilha, sem gravar.
- Teste real: um cadastro pela página no ar → a linha aparece na planilha → apagar a linha.
- Falhas: Vercel → Logs → procurar `[corretor]`. Resposta `não configurado` = falta a variável;
  `planilha indisponível` = a URL respondeu outra coisa (em geral, "Quem pode acessar" não está em
  "Qualquer pessoa", e o Google devolve a página de login).

## Arquivos

- `docs/build_lps.py` — `pg_corretores()` e `formulario_corretor()` (textos PT/EN/ES). **Não editar `corretores/index.html`.**
- `lp/lp.js` — seção 4b (`data-kind="corretor"`): validação, mensagem, abertura do WhatsApp, envio.
- `api/corretor.js` — valida, formata o telefone, monta a linha e manda ao Apps Script.
- `docs/corretores-planilha.gs` — o script que fica na planilha.
- Eventos de medição: `corretor_submit` (clique), `whatsapp_click` (vira Contact no Meta),
  `corretor_cadastro` / `corretor_erro` (resposta da planilha). Não dispara `generate_lead`: corretor não é lead de cliente.
