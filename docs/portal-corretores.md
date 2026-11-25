# Portal do Corretor — pesquisa e estrutura inicial (2026-11-18)

Proposta de um **portal para os corretores e imobiliárias parceiras** do Bracerum Park: materiais,
pedidos ao marketing, materiais digitais e os acessos ao CV CRM num lugar só. Este documento é
pesquisa + proposta de estrutura. **Nada foi publicado e nada no site mudou.**

Método: pesquisa com o ECC (`ecc-universal@2.2.3`, instalado como plugin do Claude Code; skills
`deep-research`, `market-research` e `mcp-server-patterns`, e o catálogo `mcp-configs/mcp-servers.json`),
mais a documentação do CV CRM (`desenvolvedor.cvcrm.com.br/llms.txt`, 706 endpoints listados) e o que
já existe neste repositório.

---

## 1. O que a pesquisa mostrou

### 1.1 O CV CRM já tem um painel do corretor — o portal não deve competir com ele

- O CV vende o **Painel do Corretor** para a incorporadora, que o distribui às imobiliárias. Lá o
  corretor **gerencia os próprios leads, vê o mapa de disponibilidade, faz reserva, gera e assina
  contrato, acompanha venda e vê comissão**; há também um **mural** de recados da incorporadora
  (convites para treinamento, avisos). Fonte: blog e central de ajuda do CV.
- **Na conta da Bracerum ele já está no ar:** `bracerum.cvcrm.com.br/corretor/` e
  `bracerum.cvcrm.com.br/imobiliaria/` respondem (conferido em 18/11).
- O que os portais do mercado (Sienge/CV, TOTVS, Helbor, MRV) somam ao CRM é quase sempre a mesma
  coisa: **espelho de vendas, tabelas atualizadas, download de material (tabelas, plantas, fotos),
  pré-cadastro, análise de crédito, assinatura eletrônica e suporte (jurídico, comercial)**.
  **Nenhum dos pesquisados traz um módulo de pedidos ao marketing** — é um diferencial nosso.

**Conclusão:** o portal Bracerum é a **"porta de entrada"** do corretor: tudo que o CV não faz
(material, marketing, treinamento, regras, peças personalizadas) + **atalhos e números do CV**,
puxados pela API. Lead, reserva, contrato e comissão continuam sendo feitos no CV — o portal leva
até lá, não duplica.

### 1.2 O que a API do CV permite puxar para o portal

| Uso no portal | Endpoint (doc do CV) | Autenticação |
|---|---|---|
| Disponibilidade ao vivo (já usamos) | `GET /api/v1/comercial/mapadisponibilidade/{id}` | e-mail + token |
| Tabela de preço vigente | `tabelas de preço` (v1 detalhada e v3 lista/exibe) | token / Bearer |
| Validar o corretor no login (CPF/e-mail cadastrado) | `Retorna um ou vários corretores` | e-mail + token |
| Cadastrar corretor/imobiliária novos (substituir a planilha do `/corretores`) | `Cadastra corretor`, `Cadastra corretor PJ`, `Cadastra imobiliária`, `Adicionar usuário de imobiliária` | e-mail + token |
| Liberar o empreendimento para o corretor | `Associar corretor/imobiliária a um empreendimento` (v2, abr/2025) | e-mail + token |
| "Minhas reservas" e status | `Retorna as reservas de acordo com os filtros` | e-mail + token |
| "Minhas comissões" | `Retorna lote de pagamentos de comissão`, `Retorna repasses` | e-mail + token / Bearer |
| Enviar lead indicado pelo corretor | `POST /api/v1/comercial/leads` → **migrar para v4** (aviso do CV) | e-mail + token |
| Avisos em tempo real (reserva aprovada, lote vendido) | `Adicionar webhook` | e-mail + token |
| Painéis | API analítica **CVDW** ("Monte dashboards com o CVCRM") | usuário CVDW |

**Não existe MCP do CV CRM** (nem oficial, nem comunitário). Se quisermos o Claude conversando com o
CV, é preciso construir — ver §3.

---

## 2. Itens sugeridos para o portal

Prioridade: **P1** = primeira versão, **P2** = segunda onda, **P3** = quando houver volume.

### A. Entrada e conta
- **P1 · Login do corretor** por e-mail + código (link mágico no e-mail ou código no WhatsApp) — sem
  senha para esquecer. Só entra quem está cadastrado no CV (checagem pela API de corretores).
- **P1 · Cadastro/credenciamento** — evolução do `/corretores`: nome, CPF, CRECI (BR) ou registro
  equivalente (PY), imobiliária, WhatsApp; cai no CV como corretor e fica "aguardando aprovação".
- **P1 · Aceite do termo de parceria** (comissão, uso de marca, LGPD) com data e versão registradas.
- **P2 · Perfil** com foto, idiomas que atende, região — alimenta as peças personalizadas (item D).

### B. Painel inicial ("hoje")
- **P1 · Mural de avisos** (tabela nova, janela de preço virando, evento, treinamento) com destaque
  para o que vence: a janela **Pós-Expo → Fase 1 em 01/04/2027** já está no `precos.json`.
- **P1 · Números ao vivo**: lotes disponíveis/reservados/vendidos (do `/api/lotes-status`).
- **P1 · Atalhos do CV**: "Meus leads", "Reservar", "Minhas comissões" → `bracerum.cvcrm.com.br/corretor/`.
- **P2 · "Minhas reservas" e "Minhas comissões"** lidos da API, sem precisar abrir o CV.
- **P3 · Ranking/campanha de incentivo** (meta do mês, prêmio) — só com regra comercial definida.

### C. Biblioteca de materiais (o coração do portal)
Organizada por **produto** (Park/lotes industriais · Residence · Resort · Hotel · Business Center/Outlet)
e por **tipo**, sempre nos três idiomas quando houver:
- **P1 · Apresentações** (PDF), **folders** (os seis já existentes), **tabela de preços vigente**
  (com data de validade bem visível — tabela vencida na mão do corretor é o erro mais caro).
- **P1 · Mapa de lotes / masterplan** — link para a maquete 3D com o lote do cliente
  (`/3dmasterplan/#lote-Q38.L001`) e o PDF do V14.
- **P1 · Fotos e renders** em alta (os 35 de `assets/web/fotos/` + originais do Drive), **vídeos**
  e **logos** (pacote de marca com regras de uso).
- **P1 · Kit tributário** — resumo da Lei de Maquila/regime do Paraguai, com os números de
  `tributacao.html` (1% · 100% · 20 anos · 10 anos) e a ressalva de que não substitui assessoria.
- **P2 · Documentos para o cliente**: ficha de reserva, checklist de documentos (PF/PJ, estrangeiro),
  passo a passo de compra por um brasileiro no Paraguai.
- **P2 · FAQ / objeções** com respostas aprovadas ("por que Villeta?", logística, energia, mão de obra,
  segurança jurídica) — vem do site e das LPs.
- Cada item mostra **versão e data**; quando sai versão nova, a antiga some e o mural avisa.

### D. Materiais digitais prontos para enviar
- **P1 · Links rastreados por corretor**: as LPs dos folders com `utm_source=corretor&utm_content=<id>`
  (o `tracking.js` e o `api/lead.js` já leem utm) → o lead chega ao CV **já com o corretor de origem**.
- **P1 · Mensagens de WhatsApp prontas** (PT/ES/EN) com o link rastreado, para copiar ou abrir direto.
- **P1 · QR Code do corretor** (o `build_cartoes.py` já gera QR com `segno`).
- **P2 · Cartão digital do corretor parceiro** no mesmo padrão dos cartões da equipe (`/cleberpavao` etc.).
- **P2 · Peças personalizadas** (post, story, banner) com nome, foto e WhatsApp do corretor — via
  modelos do **Canva** (MCP oficial, §3) ou gerador próprio em HTML → PNG.
- **P3 · Simulador de proposta** em PDF, com o cálculo que a maquete já faz (categoria × janela ×
  quantidade × forma de pagamento) e a marca do corretor.

### E. Pedidos ao marketing
- **P1 · Formulário de solicitação**: tipo (peça personalizada, material impresso, apoio em evento,
  tradução, vídeo, visita guiada, outro), produto, idioma, prazo, descrição e anexo.
- **P1 · Fila com status** visível para o corretor: Recebido → Em produção → Para aprovação → Entregue
  (entrega cai na biblioteca pessoal dele). Aviso por e-mail/WhatsApp a cada mudança.
- **P1 · Lado do marketing**: a fila num quadro (Notion, Asana ou planilha — ver §3) com prazo e responsável.
- **P2 · Agendar visita ao parque / reunião com o comercial** (Google Calendar).
- **P2 · Pedido de material impresso** (folders, banners) com endereço de entrega.

### F. Treinamento
- **P1 · Trilha curta** (vídeos de 3–5 min): o parque, os produtos, a tabela, como reservar no CV,
  tributação. **P2 · Certificado** "corretor credenciado Bracerum" ao concluir.
- **P2 · Agenda de treinamentos e eventos** (Expo, visitas técnicas) com inscrição.

### G. Suporte
- **P1 · Contatos certos por assunto** (comercial BR/PY, marketing, jurídico, financeiro/comissão).
- **P3 · Assistente "Pergunte ao Bracerum"** — chat que responde com base nos materiais aprovados
  (e em disponibilidade/preço pela API). Só depois que a biblioteca estiver organizada.

---

## 3. MCP — o que é viável e o que vale a pena

MCP serve a **dois públicos diferentes**, e convém separar:
1. **A equipe interna** (marketing/comercial usando o Claude): "quantos lotes vendemos esta semana?",
   "gere o post deste corretor", "o que entrou na fila do marketing?".
2. **O próprio portal** — aqui MCP **não é necessário**: o portal fala com as APIs direto, por
   funções da Vercel, como `api/lead.js` e `api/lotes-status.js` já fazem.

### 3.1 Já conectados nesta conta (usar agora)
| MCP | Para o portal |
|---|---|
| **Google Drive** | Fonte da biblioteca (pastas por produto); leitura da planilha "Leads Corretores". |
| **Vercel** | Publicar, variáveis, logs, analytics do portal. |
| **GitHub** | Código do portal neste repositório. |
| **Miro** | Desenhar fluxos e o mapa do portal com a equipe. |
| **Higgsfield** | Gerar imagens/vídeos de campanha para a biblioteca. |
| **Notion, Slack, Figma, Linear, Atlassian, Intercom** (plugin design) | Configurados, mas **pedem login** nas configurações de conectores do claude.ai. **Asana** falhou ao conectar. |

### 3.2 Oficiais, recomendados para adicionar
| MCP | Situação | Uso |
|---|---|---|
| **Canva** (`mcp.canva.com/mcp`, OAuth) | Oficial | **Peças personalizadas por corretor** a partir de modelos da marca — o item com mais retorno. |
| **Notion** (`mcp.notion.com/mcp`) ou **Asana** | Oficiais | Quadro da **fila de pedidos ao marketing**; o Claude lê/atualiza status. Escolher **um**. |
| **Gmail / Google Calendar** (Google) | Oficiais | Avisos aos corretores, agendamento de visitas e treinamentos. |
| **Google Analytics** (Google, open source) | Oficial | Desempenho dos links rastreados por corretor (o GA4 `G-0MZSYRTHND` já está no ar). |
| **WhatsApp Business Tools** (Meta, `mcp.facebook.com/whatsapp_business_tools`) | **Beta**, liberação gradual | Modelos de mensagem e avisos de status pela API oficial. **Evitar servidores comunitários de WhatsApp** (risco de banimento do número). |
| **Meta Ads** | Beta | Só se o marketing for impulsionar campanhas de captação de corretores. |

Do catálogo do ECC, servem como apoio: **firecrawl/exa** (pesquisa), **playwright** (testar o portal),
**supabase** (banco, se for o caminho do §4), **context7** (documentação de bibliotecas).

### 3.3 O que vale construir: **MCP do CV CRM (`bracerum-cv`)**
Não existe; é o mais útil para a equipe. Pequeno, **somente leitura no começo**, rodando como função
na Vercel (transporte HTTP) com as mesmas `CVCRM_EMAIL`/`CVCRM_TOKEN`:
- `disponibilidade(produto)` · `tabela_vigente(produto)` · `reservas(periodo, corretor?)`
- `corretores(status)` · `comissoes(corretor, periodo)` · `leads_por_origem(periodo)` (utm → corretor)
- Escrita (fase 2, com confirmação): `aprovar_corretor`, `associar_corretor_empreendimento`.
- Regras: não devolver CPF/telefone de cliente final; registrar quem consultou; ler o token só do servidor.
- Base para construir: skill `mcp-builder` (Anthropic) + `mcp-server-patterns` / `api-connector-builder` (ECC).

---

## 4. Estrutura proposta

Mesmo padrão do `/admin/` e do `/cadastro/` (HTML/CSS/JS sem framework, funções na Vercel, celular
primeiro, PT/EN/ES pela chave `bp-lang`) — a equipe já sabe manter isso.

```
portal/                       bracerumpark.com/portal  (fora do menu do site, noindex)
  index.html                  login + painel "hoje"
  materiais.html              biblioteca (filtros produto/tipo/idioma)
  divulgar.html               links rastreados, mensagens, QR, peças
  pedidos.html                pedidos ao marketing + status
  treinamento.html
  portal.css · portal.js · sw.js (abre sem internet, como o /admin)
api/
  portal-auth.js              código por e-mail/WhatsApp → sessão (cookie assinado)
  portal-materiais.js         lista da biblioteca (Drive ou manifesto JSON)
  portal-pedidos.js           cria/lista pedidos (Notion/Asana ou planilha)
  portal-cv.js                proxy de leitura do CV: corretor, reservas, comissões
docs/portal-corretores.md     este documento
```

**Onde ficam os dados**

| Dado | Fonte de verdade | Por quê |
|---|---|---|
| Corretores, imobiliárias, leads, reservas, comissões | **CV CRM** | Já é onde o comercial trabalha. |
| Arquivos da biblioteca | **Google Drive** (pastas por produto, link público só de leitura) | O marketing já sobe tudo lá; o portal lê um manifesto. |
| Pedidos ao marketing | **Notion ou Asana** (P1 pode ser planilha + Apps Script, como `/corretores`) | Quadro com status para o marketing; MCP oficial para o Claude. |
| Sessão, aceite do termo, cliques | Vercel (KV/Blob) ou Supabase | Pouca coisa; só se precisar de histórico. |

**Segurança e LGPD**: portal `noindex`; links de material com validade; sessão expira; termo com
versão; o corretor só vê os próprios leads/reservas/comissões; nada de dado de cliente final na
biblioteca; aviso de cookies do `tracking.js` vale também aqui.

**Fases**
1. **MVP (2–3 semanas):** login por código, mural, números ao vivo, atalhos do CV, biblioteca, links
   rastreados + WhatsApp + QR, formulário de pedidos com status, contatos.
2. **CV integrado:** cadastro do corretor direto no CV (aposenta a planilha), minhas reservas/comissões,
   webhooks de aviso, MCP `bracerum-cv` para a equipe, migração do lead para a v4.
3. **Escala:** peças personalizadas via Canva, trilha com certificado, simulador em PDF, ranking, assistente.

---

## 5. Decisões que precisam do cliente
1. **Login próprio no portal** (código por e-mail/WhatsApp) **ou** só pelo login do CV? (Recomendo o próprio,
   validando no CV: o corretor ainda não aprovado também precisa ver o material de credenciamento.)
2. **Fila do marketing:** Notion, Asana ou planilha no começo?
3. **Quem aprova** corretor novo e quem responde pedidos (nomes/SLA).
4. **Regras de comissão e termo de parceria** — texto jurídico, vem do cliente.
5. **O que é público para o corretor**: tabela completa ou só a faixa de preço? Plantas em alta?
6. **Corretor do Paraguai**: registro equivalente ao CRECI e idioma padrão ES.
7. Endereço: `bracerumpark.com/portal` ou subdomínio `corretor.bracerumpark.com`.

## Fontes
- CV CRM — Painel do Corretor: https://cvcrm.com.br/blog/painel-do-corretor-de-imoveis-uma-ferramenta-essencial/
- CV CRM — documentação da API: https://desenvolvedor.cvcrm.com.br/llms.txt · changelog abr/2025: https://ajuda.cvcrm.com.br/support/solutions/articles/157000358644
- Portal do Corretor Sienge (feito pelo CV): https://sienge.com.br/blog/portal-do-corretor-sienge-o-que-e-e-quais-sao-os-beneficios/
- Espelho de vendas: https://sienge.com.br/blog/espelho-de-vendas-otimizar-gestao-empresarial/
- TOTVS Construção (portal com materiais de marketing): https://www.totvs.com/construcao/totvs-construcao-gestao-de-imoveis/
- Canva MCP oficial: https://growthmethod.com/canva-mcp-server/
- WhatsApp MCP (oficial em beta × comunitários): https://www.dragapp.com/blog/whatsapp-mcp-server/ · https://mcpservers.org/servers/whatsapp-business-tools-mcp
- MCPs oficiais para marketing (Google Analytics, Meta Ads, Notion, Asana, Google Workspace): https://www.digitalapplied.com/blog/official-mcp-servers-for-marketing-teams
- ECC: https://github.com/affaan-m/ECC (pacote `ecc-universal@2.2.3`)

---

## 6. Implementado — bracerumpark.com/PortalCorretores (2026-11-18)

Primeira versão no ar, preto e branco (pedido: sem a identidade do site), fonte Urbanist. Referências
de interface aplicadas: cartões com rótulo pequeno e número grande + painel escuro com a maquete
(dashboard de energia), página editorial com linhas finas e filtros sublinhados (portfólio), barra
inferior com botão central e cartões arredondados no celular (app bancário), vidro fosco e títulos
leves e grandes (Notis).

**Arquivos**
- `portalcorretores/index.html` · `portal.css` · `portal.js` (aplicação, rotas `#/inicio`, `#/materiais`,
  `#/divulgar`, `#/tabela`, `#/pedidos`, `#/aprender[/guia]`, `#/conta`; equipe: `#/pedidos`, `#/corretores`, `#/mural`)
- `portalcorretores/conteudo.js` — **todos os textos (PT/ES/EN), a biblioteca, os destinos dos links,
  as mensagens prontas, os guias, o FAQ e os contatos. Material novo = uma linha aqui.**
- `portalcorretores/materiais/` (PDFs da tabela v3.1 e do mapa MP14), `thumbs/` (miniaturas 640 px),
  `vendor/qrcode-1.4.4.js` (MIT, Kazuhiko Arase).
- `api/portal.js` — servidor. `package.json` — só `@vercel/blob` (para a função).
- `vercel.json` — `/PortalCorretores` (rewrite); `/portalcorretores`, `/PortalCorretor` etc. redirecionam; noindex.

**Armazenamento:** Vercel Blob **privado** `portal-corretores` (store `store_k8Ojbo3ByMB9PkHZ`, gru1),
ligado ao projeto pela `BLOB_READ_WRITE_TOKEN` (todos os ambientes — prévia e produção usam o mesmo).
`portal/u/<id>.json` contas · `portal/p/<id>.json` pedidos · `portal/avisos.json` mural.

**Acesso**
- Corretor: cria a conta (nome, e-mail, WhatsApp, imobiliária, CRECI opcional, senha ≥ 8, aceite dos
  termos) e entra na hora como **"Em análise"**: usa materiais, tabela, links e guias; **pedido ao
  marketing só depois de aprovado**. Senha com scrypt; sessão em cookie HttpOnly assinado (30 dias).
  Cada conta nova também vai para a planilha "Leads Corretores" (mesma `CORRETORES_PLANILHA_URL`).
- Equipe: aba "Equipe Bracerum" com **a mesma senha do `/admin` (`ADMIN_SENHA`)** — só existe em
  Production, então na prévia a equipe não entra. Aprova/suspende corretor, gera senha nova (abre o
  WhatsApp do corretor com a senha), exporta CSV, publica no mural e move os pedidos no quadro
  (Recebido → Em produção → Para aprovação → Entregue), com resposta e link de entrega.
- Esqueceu a senha: a equipe gera outra. "Excluir minha conta" (LGPD) na aba Conta.

**Links rastreados:** `?utm_source=corretor&utm_medium=corretor|whatsapp|qr&utm_campaign=corretor-<código>&utm_content=<código>`;
o `api/lead.js` grava `corretor-<código>` como **mídia do lead no CV** e a origem (WhatsApp/QR/site).
O código é primeiro + último nome + 4 caracteres do id (ex.: `maria-souza-5f83`).

**Dados ao vivo:** disponibilidade pelo `/api/lotes-status` (CV) e a janela/preço pelo
`3dmasterplan/data/precos.json` — o aviso "a tabela muda de janela" entra sozinho no mural 45 dias antes.

**Pendências:** termo de parceria/comissão (texto jurídico do cliente) — hoje o aceite é um parágrafo
curto; acesso ao painel do CV por corretor (criação dos usuários no CV continua manual); avisos por
e-mail/WhatsApp quando o pedido muda de etapa; fotos/vídeos novos e apresentações em PDF para a biblioteca.

### Contas da equipe com e-mail próprio (2026-11-18)
- Além da senha compartilhada (`ADMIN_SENHA`), quem é da equipe pode ter **login próprio por e-mail**:
  a conta fica no mesmo store (`portal/u/<id>.json`, `papel: "equipe"`) e entra pela aba **Entrar**.
- **Primeiro acesso por convite:** `/PortalCorretores#/convite/<e-mail base64url>.<HMAC(PORTAL_CONVITE, e-mail)>`.
  A pessoa define nome e senha; **o link morre depois de usado** (a conta passa a ter senha).
- Quem pode receber convite: e-mails em **`PORTAL_ADMINS`** (variável plain, separada por vírgula) ou quem a
  equipe convidar pela aba **Corretores → Convidar para a equipe** (gera o link e abre WhatsApp/e-mail).
- **`PORTAL_CONVITE`** (sensitive, Production) assina os links. Trocar o valor invalida convites ainda não usados.
- Primeiro admin: `matheus337.martins@gmail.com` (em `PORTAL_ADMINS` desde 2026-11-18).
- Conta da equipe troca a senha na aba Conta; esqueceu → outro admin convida de novo não funciona (a conta já
  tem senha) — por ora, pedir ao Claude para zerar a senha no store.

### Início com boas-vindas, mural só leitura e formulário de pedido (2026-11-18, pedido do Matheus)
- **Início** (corretor e equipe): "Bem-vindo, <nome>", data e os **tópicos no centro** — corretor: Materiais,
  Mural, Tabela, Aprender (+ atalhos Pedir ao marketing, Meu link, Seus pedidos, Painel do CV); equipe: Pedidos,
  Corretores, Mural, Materiais, Tabela, Aprender (com contadores de pedidos novos e corretores aguardando).
- **Mapa de reservas no Início:** legenda ao vivo do CV (disponíveis, reservados, vendidos, indisponíveis, janela e
  preço) + a maquete embutida em `/3dmasterplan/?embed=1#lotes` (abre no modo de lotes; carrega sozinha ao chegar perto).
- **Mural:** o corretor só lê (aba Mural); só a equipe publica. "Corretores" continua só da equipe.
- **Pedido ao marketing = página de formulário** (`#/pedidos/novo`): 01 Material (12 opções em `MATERIAIS_PEDIDO`
  no `conteudo.js`) · 02 Tipo (digital/impresso/ambos), quantidade, medida, produto · 03 Informações para preencher
  (já vem com os dados do corretor e o link dele) · 04 Detalhes · 05 **Exemplos anexos** (até 6, imagem ou PDF, 3 MB
  cada; foto grande é reduzida no navegador) + link · 06 Prazo e idioma.
- **Anexos** no store privado em `portal/a/<pedido>/<n>-<nome>`; baixados por `GET /api/portal?anexo=<caminho>` —
  só o dono do pedido e a equipe (outro corretor ou sem sessão = 404).

### Dois tipos de conta: gerenciador × corretor (2026-11-18, pedido do Matheus)
- **Login só com "Entrar".** Não existe mais cadastro aberto nem a senha compartilhada da equipe (`ADMIN_SENHA` não
  entra mais no portal; continua valendo só no `/admin`). Sessões antigas da senha compartilhada caem no login.
- **Gerenciador** (`papel: "equipe"`): Início, **Gestão**, Solicitações (quadro do marketing), Materiais (com envio),
  Tabela, Masterplan 3D, Aprender. **Corretor**: Início, Tabela, Solicitações (formulário), Materiais, Masterplan 3D,
  Aprender. Mural e Divulgar saíram do menu (o código do mural ficou só no servidor).
- **Gestão** (`#/gestao`): "Nova conta" → tipo (corretor/gerenciador), nome, e-mail, WhatsApp, imobiliária, CRECI →
  a conta nasce liberada e gera o **link de primeiro acesso** (copiar, WhatsApp, e-mail). Por conta: link de acesso
  (enquanto não ativou), **novo link (zera a senha — "esqueci a senha")**, tornar corretor/gerenciador, suspender/
  reativar, remover; filtros, busca e CSV. Ninguém mexe na própria conta.
- **Materiais do gerenciador:** "Adicionar material" (arquivo até 500 MB ou link) com título, categoria, produto,
  descrição e destaque; editar e remover os enviados; **ocultar/mostrar** os fixos do `conteudo.js`. O arquivo vai
  **direto do navegador para o Blob privado** com token de 30 min (`materialToken`; uploader empacotado em
  `portalcorretores/vendor/vercel-blob-client-2.8.0.js`, esbuild de `@vercel/blob/client`). Índice em
  `portal/m/index.json`; download por `GET /api/portal?material=…` só logado — por isso arquivo enviado não tem
  "copiar link" (não abre para o cliente final; o corretor baixa e encaminha).
- **Masterplan 3D** em página própria (`#/masterplan`, maquete em `#lotes`) além do mapa de reservas do Início.
- **Tema:** botão sol/lua no topo e na entrada; **modo claro = fundo branco**. Foto da entrada: `portalcorretores/img/galpao-avenida.{webp,jpg}` (enviada pelo cliente).

## 7. Briefing de 2026-11-18 (`BRACERUM_PORTAL_CLAUDE_CODE.md`) — regras no servidor, dados comerciais, ofertas

**Estado:** implementado e testado localmente; **enviado só ao branch `claude/brave-hamilton-wps9hz` (prévia)**.
Produção só com autorização do Matheus.

### 7.1 O que mudou
- **Regras no servidor** (`api/_portal-regras.js`, funções puras, e `api/portal.js`): sem cadastro público
  (`cadastro`/`equipe` → 403); só gestor cria conta e muda papel/situação; a sessão relê a conta a cada chamada,
  então **bloquear, excluir ou trocar o papel derruba a sessão na hora**; exclusão é **lógica** (`status: excluido`,
  histórico e solicitações ficam; dá para reativar); o sistema **nunca fica sem gestor ativo** (409).
- **Imobiliárias** viraram cadastro próprio (`portal/i/index.json`), ligado ao corretor por `imobiliariaId`.
  Com corretor vinculado, **não exclui — arquiva** (409; nada em cascata). Aba Gestão → Imobiliárias.
- **Dados comerciais unificados:** identidade do lote = `3dmasterplan/data/lotes.json` (V14, mesmo id da maquete e do
  CV: `Q07.L014`); situação = **último retrato do CV** (`portal/sync/comercial.json`); preço = `precos.json`
  (Tabela v3.1). Mapa, tabela de lotes e ofertas leem a mesma fonte.
- **Sincronização com o CV:** registro com última tentativa, último sucesso, resultado e erro. Falha **não apaga** o
  último retrato bom nem finge sucesso. Retrato com mais de `PORTAL_DADOS_MAX_MIN` (60) min = **desatualizado**
  (faixa de aviso, ofertas com lote ficam fora do ar); sem retrato = situação **desconhecida**. Nova consulta ao CV
  no máximo a cada `PORTAL_SYNC_MIN` (5) min; o gestor tem "Sincronizar agora". A maquete continua lendo o CV ao vivo.
- **Ofertas e cards de WhatsApp** (aba Ofertas): rascunho → publicada → encerrada. O corretor só vê oferta
  **publicada, dentro da vigência e com todos os lotes disponíveis** no retrato atual; a regra roda **na listagem e
  de novo no download** (`GET /api/portal?card=<id>` → 410 com o motivo). Datas guardadas em UTC, digitadas no fuso
  comercial `PORTAL_FUSO` (padrão `America/Asuncion`); fim exclusivo. O card (1080×1350, SVG gerado no servidor,
  PNG convertido no navegador) traz condições, valor ou lotes com preço de tabela e "Válida até … (horário de
  Assunção)". **Nada é enviado automaticamente**: o corretor baixa e manda pelo WhatsApp dele. Não dá publicar
  oferta já vencida.
- **Materiais:** rascunho / publicado / arquivado, com **versões** (a nova vira a única que o corretor baixa; as antigas
  ficam no histórico). O corretor só lista e baixa publicado + versão atual (conferido também no download).
- **Solicitações:** Enviada → Em análise → Em produção → Concluída (+ Cancelada); concluída/cancelada não reabre.
  Conversa (mensagens + anexos dos dois lados), responsável (só gestor ativo), link de entrega https e histórico.
  O corretor só lê as próprias, só cancela enquanto "Enviada" e não mexe em campo de gestão (campos extras são
  ignorados). Status antigos (`recebido`, `aprovacao`, `entregue`, `cancelado`) são lidos como os novos.
- **Aprender:** tutoriais gerenciáveis (texto, link/vídeo ou arquivo; rascunho/publicado/arquivado; ordem); os seis
  guias fixos podem ser retirados.
- **Auditoria:** cada ação de gestão grava `portal/log/…` (quem, quando, o quê — sem senha nem token); aba
  Gestão → Atividade mostra as últimas 150.
- **Saiu:** o mural (a pedido, o corretor não cadastra nada; os avisos viraram ofertas/tutoriais) e a exclusão da
  própria conta (agora só o gestor).
- **Fora do escopo, de propósito:** reservas, pagamentos, comissões, gestão de leads, chatbot, envio automático de
  WhatsApp e integrações novas. Nenhum MCP do CV foi criado.

### 7.2 Variáveis (`.env.example` lista os nomes, nunca os valores)
Já existem em Production: `BLOB_READ_WRITE_TOKEN`, `PORTAL_CONVITE`, `PORTAL_ADMINS`, `CVCRM_EMAIL`, `CVCRM_TOKEN`.
Novas e **opcionais** (têm padrão): `PORTAL_FUSO` (America/Asuncion), `PORTAL_SYNC_MIN` (5), `PORTAL_DADOS_MAX_MIN` (60).
**Na prévia** só há o Blob: link de convite dá 503 e a sincronização registra "integração com o CV não configurada"
(dados aparecem como desconhecidos/desatualizados e ofertas com lote ficam fora do ar) — é o comportamento certo.

### 7.3 Testes
- `npm install` e `npm test` → `node --test tests/portal.test.js`: **18 testes** (Blob e CV simulados em memória)
  cobrindo cadastro público, papéis, bloqueio derrubando sessão, exclusão lógica, nunca sem gestor, imobiliária,
  isolamento entre corretores, fluxo de solicitação, sincronização com falha, mesma identidade de lote, limites de
  vigência e fuso, elegibilidade de oferta e download do card, materiais/versões, tutoriais e auditoria sem segredo.
- Navegador (Playwright, servidor local com os mesmos simulados): gestor e corretor de ponta a ponta, desktop e
  iPhone 13, sem rolagem lateral — tudo passou. O roteiro fica fora do repositório (scratchpad da sessão).
- **Não validado com serviço real:** gravação no Blob de produção pela nova versão e leitura do CV pela rotina de
  sincronização (o código chama o mesmo `lerCV` da `/api/lotes-status`, que está no ar). Conferir no primeiro uso.

### 7.4 A confirmar com o cliente
- Fuso comercial das ofertas (assumido **Assunção**, UTC−3); se for Brasília, mudar `PORTAL_FUSO`.
- Texto jurídico/rodapé do card (hoje: condições + validade + referência da oferta).

### 7.5 Ajustes de 2026-11-18 (noite, pedidos do Matheus)
- **Biblioteca só com os 4 folders digitais** enviados pelo cliente, em `portalcorretores/materiais/`
  (`bracerum-{park-loteamentos-industriais,residence-aptos,residence-casas,outlet-premium}-folder-digital.pdf`,
  capas em `thumbs/folder-*.jpg` geradas da 1ª página com `pdftoppm`). Saíram da biblioteca fixa fotos, logos,
  vídeo, páginas, LPs e os PDFs de tabela/mapa (estes continuam na tela **Tabela**). Miniaturas sem uso apagadas.
  **Os PDFs vieram com "Aptos" e "Casas" trocados no nome** (o "Aptos" é o das casas/Resort, lotes a partir de
  600 m²; o "Casas" é o dos apartamentos 1–3 quartos) — no portal valem pelo conteúdo.
  Os filtros de categoria/produto só mostram o que tem material. Materiais enviados pela Gestão (Blob) continuam
  aparecendo se existirem — arquivar pela própria aba.
- **Saíram os contatos do Cleber e do Sydney** do portal (bloco "Fale com a equipe" em Aprender e em Minha conta;
  `CONTATOS` removido de `conteudo.js`). O site, o linktree, os cartões e a LP de corretores não foram mexidos.
- **Abre sempre no modo claro** (fundo branco), mesmo em aparelho com modo escuro; escuro só se a pessoa escolher
  no botão do topo ou em Minha conta (opção "Sistema" saiu). Chave nova `bp-portal-tema2`, para todo mundo
  recomeçar no claro.

### 7.6 Solicitações ao marketing só para o gestor (2026-11-24, pedido do Matheus)
- O corretor **não vê nem cria** solicitações: saíram a aba, o tópico do início (5 tópicos agora), os atalhos
  "Pedir ao marketing"/"Minhas solicitações", o "+" da barra do celular (virou Tabela) e o "Falta algum material?
  Peça ao marketing". Textos que diziam "abra um pedido" (login, guia do CV, FAQ) passaram a citar a equipe Bracerum.
- **O servidor também recusa** (`pedidos`, `pedido`, `pedidoMensagem`, `anexo`, `pedidoCancelar` e o download de
  anexo → 403 para corretor). O gestor continua com a aba Solicitações completa (ver, responder, mudar etapa).
- Para devolver ao corretor: `PORTAL_PEDIDOS_CORRETOR=1` na Vercel **e** reverter este commit no frontend.
- Testes: 19 (novo: "padrão: corretor não vê nem cria solicitação; o gestor continua vendo tudo").

### 7.7 Corretor do CV → acesso ao portal + e-mail de boas-vindas (2026-11-24)
- **Fonte:** `GET https://bracerum.cvcrm.com.br/api/v1/cadastros/corretores` (cabeçalhos `email` + `token`, os mesmos
  `CVCRM_EMAIL`/`CVCRM_TOKEN`; até 500 por página, `limit`/`offset`). Conferido no CV real: 4 corretores em 24/11
  (#2 demonstração "Feira EXPO PY BR", #3 Omar, #4 e #5 contas de teste do Matheus), todos `ativo_login: "S"`.
- **Regra:** corretor com login ativo e e-mail válido vira **conta de corretor com o mesmo e-mail** (`origem: "cv"`,
  `cvId`), e recebe o **e-mail de boas-vindas** com o link de primeiro acesso (ele só cria a senha). Fica de fora:
  login desativado, sem e-mail, ids em `PORTAL_CV_IGNORAR` (padrão `2`) e domínios de demonstração. Conta que já existe
  com o mesmo e-mail não é recriada nem rebaixada (gestor continua gestor) — só ganha o `cvId`.
  Um convite por conta; se o envio falhar, fica registrado e é tentado de novo até 3 vezes; nunca marca sucesso falso.
- **Quando roda:** com `PORTAL_CV_AUTO=1`, (a) rotina diária da Vercel `0 13 * * *` (10h de Brasília) em
  `/api/portal?cron=cv-corretores`, protegida por `CRON_SECRET`; (b) a cada abertura da aba Gestão → **Corretores do
  CV** (no máximo a cada 10 min). Sem `PORTAL_CV_AUTO`, só pelos botões da aba ("Criar contas e enviar convites",
  "Enviar acesso" por corretor, "Enviar e-mail de teste para mim"). O plano Hobby só permite rotina diária; para chegar
  na hora, o caminho é o webhook do CV ("Adicionar webhook") — não ligado.
- **E-mail:** Resend (`RESEND_API_KEY`), remetente `PORTAL_EMAIL_DE` (padrão `Bracerum Park <portal@bracerumpark.com>`),
  responder para `bracerumpark@bracerum.com`. Texto do Matheus; HTML preto e branco com logo PNG e foto do galpão em
  `portalcorretores/email/` (cliente de e-mail não mostra SVG). Módulo: `api/_portal-cv.js`.
  **O domínio `bracerumpark.com` precisa ser verificado no Resend** (registros na GoDaddy, DNS em `domaincontrol.com`);
  até lá o Resend só entrega de `onboarding@resend.dev` para o e-mail dono da conta Resend.
- Testes: 22 (3 novos: conta com o mesmo e-mail e convite único; falha registrada e repetida até 3×; teste só para o
  gestor e rotina protegida por `CRON_SECRET`).

### 7.8 Automático ligado (2026-11-25, pedido do Matheus)
- `PORTAL_CV_AUTO=1` e `PORTAL_CV_AUTO_DESDE_ID=6` em Production: **corretor cadastrado no CV com id ≥ 6** vira conta e
  recebe o e-mail sozinho. Os que já existiam (Omar #3, testes #4/#5) continuam no botão manual da aba.
- **Gatilho:** o CV não tem webhook de cadastro de corretor (os eventos documentados são de reserva, cliente, unidade e
  empreendimento) e o plano Hobby só roda rotina diária. Então **toda chamada ao `/api/portal` e ao `/api/lotes-status`**
  (a maquete da home chama o tempo todo) agenda, em segundo plano (`waitUntil` do `@vercel/functions` 3.11.1), uma
  conferência do CV — **no máximo a cada 5 min**. Sem visita nenhuma ao site, a rotina diária das 10h garante.
- **Sem convite em dobro:** cada tentativa de cada corretor é reservada com um arquivo `portal/cv/auto-<cvId>-<n>.json`
  criado com `allowOverwrite: false` (atômico no Blob); quem não consegue criar, pula. Teste com duas chamadas
  simultâneas: um e-mail só.
- E-mail de teste no formato final (remetente `portal@bracerumpark.com`, imagens do site) enviado ao Matheus em 25/11.
