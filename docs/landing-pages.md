# Landing pages dos folders (v6.7 — 2026-11-10)

Seis páginas de captura, uma para cada QR Code / link dos folders impressos, todas cadastrando o
lead no **CV CRM**. Geradas por `docs/build_lps.py` (não editar o HTML gerado); CSS e JS
compartilhados em `lp/`; o envio passa pela função `api/lead.js`.

| Endereço do folder | Página | Produto | Empreendimento no CV |
|---|---|---|---|
| `/FolderPark/` | `folderpark/` — Parque Industrial | lotes industriais | 4 |
| `/FolderResidence/` | `folderresidence/` — Bracerum Residence | apartamentos | 7 |
| `/FolderResort/` | `folderresort/` — Bracerum Resort | lotes para casas | 7 (no CV as casas são "Quadra Q0x (Resort)" do Residence) |
| `/FolderBusinessCenter/` | `folderbusinesscenter/` — Business Center | Outlet 1ª fase, Market, salas | 9 (Bracerum Outlet) |
| `/Foldermapadisponibilidade/` | `foldermapadisponibilidade/` — Preços e disponibilidade | escolhido no formulário | 4 / 7 / 9 conforme a opção |
| `/FolderLP/` | `folderlp/` — Bracerum Park (visão geral) | escolhido no formulário | conforme a opção; "ainda conhecendo" vai sem empreendimento |

Empreendimentos conferidos no CV em 2026-11-10 (`GET /api/v1/cadastros/empreendimentos`):
**3 Bracerum Hotel · 4 Lotes industriais · 7 Residence — Condomínios · 9 Bracerum Outlet**
(o CLAUDE.md dizia "9 = Cidade"; no CV é o Outlet). Não existe empreendimento do Resort à parte.

## 1. Pesquisa

**Referências do cliente.** As três LPs da Vetter (Bal Harbour, Dolphin Bay, Tropical Beach) usam
um molde só, feito no RD Station: foto + formulário curto (nome, e-mail, telefone) já no topo,
manifesto/estilo de vida, diferenciais em lista, localização, três pilares da marca, prova em
números e 3–4 "CADASTRE-SE" que levam ao mesmo formulário. São páginas de pré-lançamento
("avise-me"): sem preço, sem planta, sem WhatsApp. A da Embraed (Alaia) é o oposto — página de
produto premium: narrativa, ficha técnica, plantas em abas, tour virtual, andamento da obra, e
captura espalhada (formulário depois do conteúdo + chat + WhatsApp por cidade + telefone).
As imagens enviadas (Synais, Formora, M&P, Pyko, Places) dão o tom visual: editorial, serifada
grande com itálico, fundos escuros/vinho/bege, números grandes em linha, blocos com bastante ar.

**Conversão (benchmarks públicos, direcionais).** Formulários com 3 campos convertem mais que com
6+ (≈25% × 15% em análises de fornecedores); cada campo além de 5 custa alguns pontos. Formulário
em etapas: menos gente começa, mais gente termina — funciona quando a 1ª etapa é um clique fácil
e cada etapa decide alguma coisa (aqui: qual produto e qual empreendimento no CV). B2B de ticket
alto converte na faixa de 1–7%; o que mais pesa é preço/condição claros, prova e um canal humano
(WhatsApp) junto do formulário. Páginas de lote industrial que convertem (Cushman & Wakefield,
Savills, parques municipais nos EUA) abrem com metragem, preço por m², zoneamento/infra, mapa,
material para baixar e contato com nome.

**Skills de landing page** (registro aberto de skills do Claude): `rampstackco/landing-page-copy`,
`onewave-ai/landing-page-copywriter` (PAS/AIDA/StoryBrand), `guia-matthieu/clawfu-skills`
(estrutura por objetivo + auditoria de bloqueios de conversão), `nicepkg/ai-workflow/landing-page`.
Não foram instaladas — os princípios delas estão aplicados abaixo; para instalar, ver o repositório
de cada uma (`npx skills add …` ou clonar em `~/.claude/skills/`).

## 2. Decisões (o porquê de cada coisa)

1. **Quem chega já está quente.** Veio de um QR Code de um folder que tem na mão, que diz
   "escaneie e conheça os preços e o mapa de disponibilidade". A página entrega exatamente isso
   já na primeira dobra: promessa + 3 fatos + formulário à direita (embaixo, no celular).
2. **Preço aberto, não escondido.** Os folders já imprimem a tabela de lotes e a do Outlet. Esconder
   o preço atrás do formulário seria um passo para trás e derruba a confiança de quem compra em
   dólar. A isca do formulário é o que o folder não tem: **lotes livres hoje, plantas, simulação
   e o atendimento** — "Receber tabela e mapa".
3. **Urgência verdadeira.** A faixa de preço dos lotes lê a janela vigente do `precos.json` da
   maquete (Expo até 13/11 → Pós-Expo → Fase 1 plena), mostra a contagem regressiva e quanto o m²
   sobe depois. Quando a janela vira, a página vira sozinha. Nada de "últimas unidades" inventado.
4. **Disponibilidade ao vivo** (Parque e Mapa): o mesmo `/api/lotes-status` da maquete — lotes
   livres, reservados, vendidos, livres por categoria — e o botão para escolher no masterplan 3D.
5. **Formulário em 2 etapas.** Etapa 1 = um toque (o que procura; no Residence também "para quê").
   Etapa 2 = nome, WhatsApp (DDI pelo idioma: PT → +55, ES → +595), e-mail, empresa (opcional nas
   B2B) e autorização de contato (LGPD). Campo-isca invisível + tempo mínimo de 2,5 s contra robô.
6. **WhatsApp sempre à mão**, com a mensagem no idioma: PT → Sydney (Brasil), ES/EN → Cleber
   (Paraguai). Depois do envio, botão "falar agora" com o pedido já escrito. **Se o CV falhar, o
   lead não se perde**: a página oferece mandar tudo pelo WhatsApp, e a função grava o lead no log.
7. **Uma coluna, mesma marca.** Tokens do site (ink/paper/sand/brown, Helvetica + Noto Serif com o
   eixo de largura para o itálico condensado dos folders), cantos quadrados, zero vermelho.
   Independentes do `style.css` do site (como o linktree): ~30–55 KB de HTML por página.
8. **Três idiomas** pela chave `bp-lang` (a mesma do site, linktree, cartões e maquete); `?lang=es`
   força o idioma (útil em anúncio).

## 3. Sequência (organograma) de cada página

Todas: **topo fixo** (logo, idioma, "Receber tabela") → **hero com formulário** → … → **Como
comprar** (3 passos) → **Perguntas** → **Fale com a equipe** (Cleber/Sydney) → **rodapé legal** →
barra fixa no celular (tabela + WhatsApp) / botão de WhatsApp no desktop.

- **Parque Industrial:** hero (galpão na avenida) → faixa da janela de preço → números (614 lotes,
  766.690 m², pista 1.460 m, 1%) → "tudo num endereço só" + 10 diferenciais do folder → **tabela por
  tamanho × categoria** com abas das janelas + 3 pagamentos → **disponibilidade ao vivo** → Paraguai
  (1% · 100% · 20 anos · 10 anos) → logística (23 km Terport, 65 km Assunção, pista, 2 oceanos) →
  a cidade em volta (Business Center, Residence, Hotel) → passos → 7 perguntas → contato.
- **Residence:** hero (praia artificial) → números (67 torres, 1.452 aptos) → **4 plantas com área,
  vagas e "a partir de"** + pagamentos → diferenciais do folder → clube & lazer → passos → perguntas.
- **Resort:** hero (casa modelo) → números (31 lotes, 600 m²) → o condomínio (texto do folder) →
  casa modelo (cômodos, planta ilustrativa) → lazer (surf, piscina-lago) → passos → perguntas.
  **Sem preço** (ver §5).
- **Business Center:** hero (boulevard) → números (57 lojas, 17.870 m², 13 ativos no Market,
  US$ 1.150/m²) → o conjunto + 6 diferenciais → **tabela do Premium Outlet 1ª fase** (a do folder) →
  Centro Tecnológico → Bracerum Market (supermercado 4.606 m² + 12 lojas de 60 m²) → público cativo
  (614 lotes, 1.452 aptos, 384 studios, 1.200 lugares) → passos → perguntas.
- **Preços e disponibilidade:** hero (maquete 3D) com formulário que pergunta o produto → faixa da
  janela → disponibilidade ao vivo → tabela dos lotes → cartões dos outros produtos → passos.
- **Bracerum Park (geral):** hero (vista aérea) → números → cartões dos produtos + maquete/hotel →
  "o entorno trabalha a favor da operação" → Paraguai → logística → passos → perguntas.

## 4. Integração com o CV CRM (`api/lead.js`)

`POST /api/lead` (mesmo domínio) → `POST https://bracerum.cvcrm.com.br/api/v1/comercial/leads`
com `email` + `token` das variáveis da Vercel (as mesmas do `/api/lotes-status`: `CVCRM_EMAIL`,
`CVCRM_TOKEN`). O usuário da API precisa da permissão **Leads > Cadastrar/Alterar Lead** — o acesso
de leitura a leads foi conferido em 2026-11-10 (`GET …/leads?email=` responde "Lead não
encontrado", não 401/403); **o primeiro POST real ainda não foi feito** (ver §6).

O que vai para o CV:

| Campo do CV | Valor |
|---|---|
| `nome`, `email`, `telefone`, `telefone_ddi` | do formulário (o zero inicial do celular paraguaio sai quando há DDI) |
| `idempreendimento` | pelo produto (tabela no topo); `CVCRM_EMP_<PRODUTO>` na Vercel muda sem publicar |
| `origem` | pelo utm/clid: folder/offline/QR → **OP** (outras publicidades), Facebook → FB, Instagram → IG, Google/gclid → GO, LinkedIn → LK, WhatsApp → WA, busca orgânica → BO, resto → **SI** (site) |
| `midia` | `utm_campaign` (ex. `folder-park`) — o CV cria a mídia se não existir |
| `conversao` | `LP folderpark — 2 a 8 lotes` |
| `tags` | `landing-page`, a LP, o produto, o idioma |
| `interacoes[0]` (anotação) | página, idioma, interesse, perfil, empresa, utm da última e da primeira visita, referência, gclid/fbclid, consentimento |
| `idfila_distribuicao_leads` | opcional, `CVCRM_FILA` na Vercel |

Lead repetido (mesmo e-mail/telefone): se o CV recusar, a função reenvia com
`permitir_alteracao: true` para registrar a nova conversão. `?dry=1` (ou `"dry": true`) devolve o
corpo que iria ao CV sem enviar. Eventos de medição: `form_start`, `form_step`, `generate_lead`
(vira **Lead** no Meta), `lead_error`, `price_window`, `open_3d`, cliques de WhatsApp (**Contact**).
**GA4 e Meta Pixel continuam vazios no `tracking.js`** — sem os IDs, só a Vercel Analytics mede.

## 5. Dados usados e o que confirmar com o cliente

Fontes: folders impressos V3 (Drive "Folder Final - Impressão"), `Bracerum_Tabela_de_Valores_CV_2026-11.xlsx`
e os CSVs de importação do CV (Drive), `3dmasterplan/data/precos.json` (Tabela v3.1) e
`lotes.json` (V14 rev. 02/11), textos do site (tributação, logística, convenções).

- **Apartamentos — preços publicados "a partir de":** 1q US$ 55.400 · 2q US$ 78.500 · 3q
  US$ 112.000 · cobertura US$ 163.600 (planilha, fonte "Apresentação para investidores P5, pág. 12";
  US$ 1.150/m² com vagas). Condições: 20% + 12x; à vista −5%; 20% + 36x +8%; investidor −5% a
  partir de 10 unidades. **Confirmar antes de campanha paga.**
- **1.452 apartamentos / 67 torres** (tabela do folder Residence) × "1.200 aptos" do V14: a
  planilha explica — 5º andar novo nas torres T13–T67. A página usa 1.452.
- **Resort sem preço de propósito:** a planilha põe os lotes residenciais a US$ 1.150/m² (lote de
  600 m² = US$ 690.000), o mesmo m² de apartamento construído e de loja — parece valor provisório.
  A página pede o formulário para enviar a tabela. Também: 31 lotes somam 20.046 m² na planilha
  × 38.072 m² no V14 de 28/10.
- **Outlet:** a tabela publicada é a do folder (tipos de 30 a 1.000 m² a US$ 1.150/m²); o cadastro
  do CV tem 57 lojas de 173 a 545 m² medidas no desenho. As duas convivem ("metragens flexíveis"),
  mas vale alinhar. O "36 parcelas" do Outlet não diz acréscimo — a página não inventa um.
- **Market:** supermercado 4.606 m² e 12 lojas de 60 m² sem preço na página (a planilha tem
  US$ 1.150/m² — confirmar).
- **Fotos:** as dos folders vieram do Drive (`capas-e-logos/…/capa/foto-*.jpg`) para
  `assets/lp/`. O Centro Tecnológico usa a foto do foyer de convenções (rotulada "imagem
  ilustrativa") até chegar o render próprio. Plantas humanizadas dos apartamentos e da casa não
  estão na página (só nos PDFs dos folders, 35–50 MB) — boas candidatas a entrar quando houver
  versão leve.

## 6. Publicar

1. `python3 docs/build_lps.py` (regera as 6 páginas e as imagens `assets/lp/og-*.jpg`).
2. Levar ao `main` e publicar pela Vercel CLI (`docs/pacote_vercel.py`, ver CLAUDE.md) — `lp/`,
   `api/` e `assets/lp/` já entram no pacote.
3. **Trocar as 6 Routing Rules do painel da Vercel** (hoje mandam `/Folder…` para a home com utm).
   Cada uma passa a mandar para a LP — `Location: /folderpark/?utm_source=folder&utm_medium=offline&utm_campaign=folder-park&utm_content=FolderPark` —
   **com a condição `missing: query utm_source`**, senão a regra (que não diferencia maiúsculas)
   pegaria a própria `/folderpark/` e entraria em laço. O `vercel.json` já reescreve `/folderpark`,
   `/FolderPark` e `/FolderPark/` para o arquivo.
4. Mandar **um lead de teste** pela página no ar e conferir no CV (empreendimento, mídia, origem,
   anotação); depois apagar/arquivar o lead de teste lá.
5. Preencher `ga4` e `metaPixel` no `tracking.js` antes de anúncio pago, e pôr aviso de cookies.
