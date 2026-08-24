# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (retomada — 2026-08-24)

O protótipo v1 do novo site **já foi construído** (`index.html`, `tributacao.html`, `style.css`, `script.js` na raiz) seguindo a estrutura combinada com o usuário: loader com curtain-wipe, hero cinematográfico com grid de pontos reativo, teaser de tributação → página dedicada `tributacao.html`, masterplan com hotspots interativos, localização com mapa Leaflet escuro full-bleed, jornada em etapas, galeria em sanfona, empresas em grid de logos, assessoria fiscal, tarja azul de história da Bracerum, footer. GSAP + ScrollTrigger via CDN. Testado em desktop/mobile via Playwright (ver `docs/design-references.md` para o roteiro completo).

O **conteúdo e os dados de negócio** (masterplan, regimes fiscais, empresas, contatos) vêm do site anterior + do catálogo V15 anexado pelo usuário, e devem continuar sendo a fonte de verdade — não inventar números.

**Pendências conhecidas** (não inventar, aguardar o usuário):
- Tarja azul "história da Bracerum como importadora de aço" está com copy genérico, sem número de anos — usuário precisa confirmar o dado antes de publicar.
- Hotspots do masterplan usam coordenadas aproximadas sobre `assets/renders/masterplan-implantacao.jpg` (extraído do catálogo) — recalibrar quando o usuário enviar os renders em alta resolução da "Entrada 01" (planta humanizada do resort) e do masterplan grid industrial completo, que ele indicou que enviaria via GitHub.
- Site é multi-página estático (sem framework) — qualquer nova página deve seguir o mesmo padrão de nav/menu-panel/footer de `tributacao.html`.

Todo material de referência de design (guias em PDF, vídeos de interação, sites de benchmark) está registrado em **`docs/design-references.md`**. Leia esse arquivo antes de propor UI nova.

## Stack de design/dev combinada

- Prototipação/handoff: seguir princípios do guia de ferramentas (Figma-like: tokens, componentes, estados) mesmo sem Figma disponível aqui — traduzir isso direto em CSS custom properties e componentes reutilizáveis.
- Animação: **GSAP** (ferramenta adicionada pelo usuário) para scroll, transições e microinterações — inspirado nos padrões Osmo documentados em `docs/design-references.md`.
- Implementação: HTML/CSS/JS (mesma stack do projeto atual, sem framework pesado, a menos que o usuário peça).
- Qualidade: seguir os checklists de UX/UI e visual do guia (acessibilidade WCAG, estados de componente, performance, responsividade mobile-first) antes de considerar qualquer seção "pronta".

## Assets já disponíveis em `/assets`

Imagens reais do projeto (renders): `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`. Logos de empresas parceiras/validação de mercado: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.

Faltam (mencionados no `LEIA-ME.txt` original, ainda não enviados): `tecnologico.jpg`, `comercial.jpg`.

## Próximo passo

Aguardando o usuário: (1) confirmar/enviar o dado de anos de história da Bracerum para a tarja azul; (2) enviar os renders em alta resolução da planta humanizada (Entrada 01) e do masterplan grid completo para recalibrar os hotspots; (3) revisar o protótipo v1 e apontar ajustes de conteúdo/visual.
