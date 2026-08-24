# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (retomada — 2026-08-24)

O site anterior (`index.html` / `style.css` / `script.js` na raiz, tema claro dourado/creme institucional) está sendo **descartado visualmente**. Vamos construir um novo protótipo do zero: mais intuitivo, com produção visual de alto nível, seguindo boas práticas de UX/UI e um design system consistente, com animações via **GSAP**.

O **conteúdo e os dados de negócio** do site anterior são reais e devem ser preservados/reaproveitados no novo site (ver `docs/design-references.md` → "Conteúdo e dados a preservar"). Não é para reinventar números, áreas, regimes fiscais ou contatos — só a camada visual/UX muda.

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

Aguardando o usuário enviar a estrutura do novo site (sitemap/wireframe) para iniciarmos a reconstrução página a página.
