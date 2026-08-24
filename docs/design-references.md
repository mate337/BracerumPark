# Referências de Design — Bracerum Park (retomada do projeto)

Este arquivo consolida tudo que foi passado na retomada do projeto em 2026-08-24: os dois guias em PDF, os 3 vídeos de referência de interação (padrões Osmo), o site de benchmark indicado e o inventário de conteúdo real do site anterior que precisa ser preservado no novo build.

---

## 1. Limitação importante: memória entre chats

Este ambiente (Claude Code, sessão de desenvolvimento ligada ao repositório `mate337/bracerumpark`) **não tem acesso à memória ou aos arquivos de outra conversa no claude.ai** (o "Projeto Bracerum Park" mencionado). São produtos/memórias separados — nada do que foi dito lá chega automaticamente aqui.

O que resolve isso na prática:
- Tudo que for anexado **diretamente nesta conversa** (como os 2 PDFs e os 3 vídeos) eu leio e registro aqui, de forma permanente, no repositório.
- O repositório já continha, antes desta sessão, imagens reais e dados do projeto (masterplan, renders, planta, logos de empresas parceiras, contatos) — provavelmente o que foi chamado de "Planta Humanizada" e material de apresentação. Isso **já está acessível** (ver seção 5) porque foi enviado para dentro do repo GitHub, e não fica preso na outra conversa.
- Qualquer arquivo adicional da "Planta Humanizada", imagens em alta resolução ou o PDF de apresentação do parque que ainda não esteja no repositório **precisa ser reenviado nesta conversa** (ou colocado em `/assets`) para que eu consiga usá-lo — não tenho como "puxar" de outro chat.

---

## 2. Guia de Ferramentas para Design de Website (PDF 1)

Resumo operacional do que vamos seguir como processo, adaptado à realidade desta sessão (sem Figma — traduzido direto para código):

- **Sistema visual a definir antes de qualquer página**: cores (brand, neutrals, surface, text, border, success/warning/error/info), tipografia (famílias, pesos, tamanhos, line-height, tracking), espaçamento (escala base), grid (container, colunas, gutters), radius, elevation (sombras), ícones, motion (duração/easing/redução de movimento), estados de componente (default, hover, focus, active, disabled, loading, error, success).
- **Design tokens em 3 camadas**: primitivos (`color.blue.500`) → semânticos (`color.text.primary`) → componente (`button.primary.background`). Vamos implementar isso como CSS custom properties em camadas, permitindo trocar tema sem reescrever componentes.
- **Motion**: comunicar causa/efeito, continuidade e hierarquia; movimentos rápidos e previsíveis; respeitar `prefers-reduced-motion`. GSAP entra aqui como ferramenta de produção.
- **Checklist antes de publicar** (vamos usar isso como critério de "pronto" por seção): tipografia consistente, escala de espaçamento consistente, grid coerente, estados definidos, hover/focus/active/disabled funcionando, mobile+desktop revisados, navegação testada, imagens otimizadas, contraste revisado, CTAs claros, SEO básico, performance testada, 404/estados vazios definidos, analytics configurado, implementação comparada ao design.
- **Ferramentas técnicas de referência**: VS Code, GitHub, Vercel (deploy/preview), Lighthouse/PageSpeed (performance/SEO/acessibilidade), DevTools.

## 3. Guia Completo de UX/UI para Web (PDF 2)

Metodologia a seguir na estruturação do novo site:

- **Processo**: Descobrir → Definir → Estruturar → Idear → Prototipar → Validar → Entregar → Medir/iterar. Regra prática: não começar pela tela — começar pelo problema (aqui: convencer um investidor/indústria a considerar o Bracerum Park), pela tarefa e pelo contexto.
- **Arquitetura da informação**: definir conteúdo antes da decoração; hierarquia global → seção → página → conteúdo → ação; vocabulário do usuário (evitar jargão interno); navegação primária/secundária/contextual/utilitária; estados de vazio/erro/loading definidos desde o início.
- **10 heurísticas de Nielsen** como checklist de inspeção: visibilidade do status, correspondência com o mundo real, controle e liberdade, consistência, prevenção de erros, reconhecimento > memorização, flexibilidade, design minimalista, recuperação de erros, ajuda/documentação.
- **Princípios de UI**: hierarquia, consistência, affordance, feedback, proximidade, progressive disclosure, reconhecimento, prevenção, conteúdo primeiro.
- **Mobile-first genuíno**: não é "a versão desktop encolhida" — priorizar tarefas e conteúdo essenciais na viewport limitada. Testar mobile estreito, mobile largo, tablet, notebook, desktop amplo, e também *entre* breakpoints.
- **Acessibilidade (WCAG)**: perceptível, operável, compreensível, robusto. Foco visível e ordem lógica, não comunicar informação só por cor, contraste adequado, alvos de toque confortáveis, texto redimensionável, alternativas textuais, nome/função/estado compreensíveis para tecnologia assistiva.
- **UX Writing**: escrever para a tarefa, verbos claros em CTAs, erro bom = o que aconteceu + por que + como resolver, terminologia consistente.
- **Referências citadas no guia**: Nielsen Norman Group, W3C/WAI (WCAG), Material Design, Apple HIG, Baymard Institute (UX de e-commerce).

Esses dois guias juntos são a régua de qualidade do projeto — vou usar os checklists deles como critério de aceite antes de considerar qualquer tela "pronta", não só como leitura de referência.

---

## 4. Vídeos de referência — padrões de interação (estilo Osmo)

Os 3 vídeos enviados são demos curtas (1440×900) de padrões de interação da Osmo (estúdio conhecido por microinterações com GSAP). Cada um vira um **componente candidato** para o novo site:

### 4.1 `osmofixedunderlaynavigation` — Menu overlay em painel fixo
Clique no menu abre um painel sólido que desliza da direita cobrindo boa parte da tela (fundo do hero permanece visível à esquerda, cortado). Dentro do painel: logo, lista de links verticais com o item ativo/hover destacado por um **underlay** (retângulo colorido que desliza atrás do texto, não um sublinhado), e um rodapé do menu com redes sociais e links utilitários (Privacidade, Termos). Botão "Close" no canto superior.
→ Candidato para o menu principal do novo site: mais imersivo que o burger-menu simples do site anterior, com hierarquia clara (Masterplan, Localização, O Parque, Vantagens, Empresas, Fale conosco) e espaço para reforçar marca/contato no rodapé do painel.

### 4.2 `osmoproducthotspotmodal` — Hotspots com modal lateral
Sobre uma imagem estática de produto, pontos "+" marcam áreas de interesse. Ao clicar num ponto, ele vira um marcador ativo (destacado) e abre um cartão lateral com imagem de detalhe, título, texto descritivo e paginação (setas + dots) para navegar entre hotspots sem fechar o modal.
→ Padrão forte para o **Masterplan** do Bracerum Park: em vez da lista lateral estática atual, usar hotspots sobre a planta geral (galpões, hotel, data center, centro de convenções, docas etc.) que abrem um cartão com a métrica (m², capacidade) e uma imagem/render daquela área específica. Também aplicável ao carrossel "O Parque".

### 4.3 `osmointeractivedotsgridbackground` — Grid de pontos reativo ao cursor
Fundo escuro com uma grade densa de pontos; pontos próximos ao cursor aumentam de tamanho e ganham cor (vermelho no exemplo), criando um efeito de "spotlight" orgânico que segue o mouse, com um logo/ícone estático sobreposto.
→ Candidato para seções de impacto (hero secundário, seção de vantagens fiscais/tese de investimento, ou fundo de uma seção de dados/números) — efeito sutil de sofisticação técnica sem poluir o conteúdo. Deve ter fallback estático em mobile/touch e respeitar `prefers-reduced-motion`.

**Nota técnica geral dos 3 padrões**: todos usam fundos de alto contraste, tipografia sans bem peso-variada, cantos arredondados generosos em painéis/cards, e transições suaves (~300-500ms) — consistente com o "Motion" recomendado no PDF 1. Implementação alvo: GSAP (`gsap.to`, ScrollTrigger para entrada de seção, Draggable/pointer events para o grid de pontos) em vez de animação só em CSS, já que o usuário adicionou GSAP especificamente para isso.

---

## 5. Benchmark: freehand.ai (via land-book.com)

Ao consultar `https://www.freehand.ai/?ref=land-book.com`, o conteúdo atual do domínio é de uma empresa **B2B de gestão de custos/frete com agentes de IA** ("AI Teams for complex spend management" / recuperação de 3-5% de gasto com frete) — não a antiga ferramenta de whiteboard colaborativo "Freehand" da InVision que esse nome costuma remeter. Isso pode ser intencional (curadoria do land-book.com para o estilo visual do site, independente do produto) ou o link pode ter mudado de dono — vale confirmar com você se era esse o site pretendido.

Pelo que foi possível extrair, os padrões de UI relevantes como referência são:
- Header fixo/sticky com navegação em categorias e dropdowns hierárquicos.
- Hero minimalista: headline de impacto + subtítulo com proposta de valor concreta (com métrica) + CTA único e claro.
- Tipografia sans moderna, hierarquia forte entre headline/body/métricas em destaque.
- Paleta neutra (branco/tons escuros) com acentos vibrantes reservados para CTAs — alto contraste.
- Cards de serviço (imagem + texto em grid), prova social (logos de clientes + depoimentos), comparativos tabulares, badges de certificação no rodapé.
- CTAs reiterados ao longo da página sem serem agressivos.

Esse padrão de "corporativo-inovador, confiável, orientado a conversão" é diretamente aplicável ao Bracerum Park (site B2B para investidores/indústrias): prova social = tabela de empresas (Ball Corporation, Kingspan, Lupo, Cremer, be8), comparativos tabulares = os 3 regimes fiscais (Maquila / Ley de Inversiones / Mercosul), badges de certificação = "Regime de Maquila", "Ley de Inversiones", "Certificado de Origem Mercosul".

---

## 6. Conteúdo e dados a preservar (extraídos do site anterior)

Isto é o "miolo" informacional do projeto — a planta e os números reais — que deve ser levado 1:1 para o novo site, independente da nova UI:

**Identidade**: Bracerum Park — Villeta Industrial City, Paraguai. Tagline: "Uma Cidade Industrial Completa no coração do Mercosul".

**Números-chave**: lote único de **1.819.856 m²**, sobre a rodovia PY19 (eixo dos portos), a **65-70 km de Assunção**, tributo único de **1%** (Maquila).

**Masterplan (breakdown de áreas)** — 24 itens categorizados em Industrial / Cidade & Serviços / Infraestrutura, incluindo: Galpões industriais (488.730 m²), Data Center (277.588 m²), Fábrica Bracerum (180.245 m²), Pátio industrial (115.920 m²), Casas — 78 lotes (79.200 m²), Galpões logísticos (67.500 m²), Hotel — 384 studios (30.000 m²), Docas — 80 docas (14.400 m²), Centro de convenções (13.500 m²), Escritórios/coworking, Pista de pouso + heliponto (1.325 m), Hangar, Anfiteatro (1.200 lugares), Salão de eventos, Academia/lojas/lanchonetes, Quadras, Refeitório, Estacionamentos (2.150 vagas), Lagos, entre outros.

**Localização**: coordenadas 25°46'18.1"S 57°43'56.6"W. Lista de portos fluviais próximos (Puerto Alegre, Puerto Lobato, Terport Villeta, Puerto Seguro, Terminal Villa Oliva, Caacupemí, Porto de Assunção, Porto de Alberdi) com km/tempo. Lista de rodovias/destinos Mercosul (Assunção, Encarnación, Ciudad del Este, Foz do Iguaçu, Curitiba, Porto Alegre, Córdoba, Buenos Aires) com km/tempo.

**Tese fiscal (3 regimes)**:
1. Regime de Maquila — 1% de tributo único, benefícios por até 20 anos renováveis (Lei 7.547/2025), importação com tributos suspensos, venda parcial no mercado interno, 100% capital estrangeiro.
2. Ley de Inversiones — 0% impostos na entrada para projetos a partir de US$ 13 mi (Lei 7.548/2025), 0% tributos aduaneiros e IVA em bens de capital, isenção sobre remessa de lucros/dividendos por 10 anos.
3. Certificado Mercosul — 0% tarifa no bloco, +270 milhões de consumidores, acesso preferencial a Brasil/Argentina/Uruguai.

Extras: regime fiscal "10·10·10" do Paraguai, Investor Pass (residência permanente + dividendos a 8% para residentes, Res. MIC 283/2026), redundância energética Itaipu + Yacyretá (subestação a 7,4 km), 3 fábricas próprias (Steel Frame, Concreto, Pavers).

**Validação de mercado (empresas)**: Be8 (Brasil, biocombustíveis — biorrefinaria Omega Green), Ball Corporation (EUA, embalagens de alumínio, US$ 80 mi), Cremer (Alemanha, óleos/químicos), Lupo (Brasil, têxtil, R$ 30 mi, custo ~28% menor que no Brasil), Kingspan (Irlanda, construção industrializada). Contexto: +US$ 3 bi em cadeias produtivas na região, aluguéis de galpões +20% a.a., valorização projetada +205% até 2030.

**Contatos**: Cleber Pavao (+55 11 98651-6065, @pavaocleber) e Sydney Savi (+55 47 98803-0200, @sydneysavi), ambos com WhatsApp e Instagram.

---

## 7. Assets já no repositório (`/assets`)

Renders/fotos: `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`.
Logos de empresas: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.
Faltando (citados no `LEIA-ME.txt` original): `tecnologico.jpg` (Centro Tecnológico), `comercial.jpg` (Centro Comercial e Serviços).

Itens que o usuário mencionou existirem em outra conversa e que **ainda não estão neste repositório**: planta humanizada em alta resolução (se for diferente de `masterplan.jpg`), PDF de apresentação do parque. Precisam ser enviados aqui ou adicionados em `/assets` para uso direto.

---

## 8.1 Segunda leva de material (mesma sessão) — catálogo, logos reais, vídeos

Depois do registro inicial acima, o usuário confirmou que o link do freehand.ai é mesmo a referência do land-book.com (curadoria de estilo, não o produto em si), e anexou o material que fechou o escopo do v1:

- **`Bracerum_Park_Catalogo_V15_2026.08.19.pdf`** (40 páginas) — deck de investidor completo: sumário executivo, os 3 regimes fiscais em detalhe, timeline de erosão do ICMS 2026→2033, comparativos Brasil x Paraguai, macroeconomia (Baa3 Moody's), passo a passo de instalação (pág. 13, usado na seção Jornada), prova social (232 empresas brasileiras), mitos e fatos, quadro de áreas do masterplan, renders de cada espaço (fábrica, hotel, condomínio, pavilhão de convenções, centro empresarial, escritórios, comercial, clube, eventos) e modelo de negócio. Imagens extraídas via `pdfimages` e organizadas em `assets/renders/`.
- **16 variantes de logo real** (`assets/SVG/Ativo 17-32.svg`, copiadas com nomes descritivos em `assets/logo/`): marca origami (3 triângulos dobrados) + wordmark "BRACERUM PARK", em 4 layouts (horizontal, stacked-wide, compact, tagline com "Construimos el futuro Industrial") × 4 cores (black, brown `#473315`, white, cream `#fff8ef`). Essas cores viraram a base do novo design system (ver `style.css`), substituindo o dourado do protótipo anterior.
- **2 imagens inline da planta** (sem upload de arquivo, só visualizadas no chat): zoom da área do clube/resort com "Entrada 01" (portaria) e o masterplan grid industrial completo — confirmam a leitura de `assets/renders/masterplan-implantacao.jpg` (mesma planta, extraída do catálogo): portaria/estacionamento de caminhões no canto superior esquerdo, loteamentos industriais + ETE ao centro, aeroporto (pista ~1.280–1.480 m) embaixo, condomínio + hotel/centro de convenções no canto superior direito.
- **`osmologorevealloader1440x900.mp4`** — quarto vídeo de referência Osmo: tela de loading em fundo escuro com wordmark "Osmo ✳" em fade-in, barra de progresso fina, depois uma cortina (`curtain`) desliza revelando a página em fundo claro. Base direta do `#loader` implementado em `index.html`/`script.js`.
- Os outros 2 vídeos (`osmointeractivedotsgridbackground`, `osmoproducthotspotmodal`) vieram reenviados com hashes novos — mesmo conteúdo já registrado na seção 4.

## 8.2 Estrutura do site v1 (definida pelo usuário nesta sessão)

Ordem confirmada e implementada em `index.html` + `tributacao.html`:

1. Loader (curtain-wipe, logo P&B)
2. Hero cinematográfico — fundo Hotel + Centro de Convenções, logo SVG central, dots grid leve sobre a imagem
3. Teaser "1% tributação" → link para página dedicada de tributação
4. Masterplan interativo com hotspots (estilo hotspot-modal) sobre a planta
5. Localização — mapa full-width em tons escuros
6. Jornada — sequência de etapas (estilo catálogo pág. 13)
7. Galeria em sanfona dos espaços do parque
8. Empresas — só logos, estilo mobile do site anterior
9. Assessoria — Bracerum ajuda no enquadramento tributário ideal
10. Tarja azul — anos de história da Bracerum como importadora de aço no Brasil (conteúdo pendente de confirmação, ver `CLAUDE.md`)
11. Footer + contatos

## 8.3 Ambiente de teste: CDNs via proxy

Nesta sessão o Chromium (Playwright) só conseguiu acessar CDNs externas (GSAP, Leaflet, Google Fonts) configurando explicitamente `proxy={"server": "http://127.0.0.1:43433"}` no `launch()` — sem isso, dá `ERR_CONNECTION_RESET` mesmo com `HTTPS_PROXY` no ambiente (o Chromium não herda a env var automaticamente). Isso é só uma limitação do sandbox de teste; em produção (hospedagem real) os CDNs funcionam normalmente para os visitantes.

## 9. Stack de ferramentas do usuário (para indicação, não uso direto nesta sessão)

Do PDF 1, mapeado ao perfil "Website orientado a conversão": Figma/FigJam (não disponível aqui — compensado por especificar tokens/componentes direto em código), pesquisa (Maze/Lyssna), Clarity/Hotjar/GA4 (analytics pós-lançamento), Lighthouse (auditoria). Ferramenta de motion adicionada pelo usuário para este projeto: **GSAP**.
