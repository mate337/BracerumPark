# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v2 — 2026-08-24)

O site está na **versão 2**, reconstruída do zero após feedback do usuário sobre a v1. Regras de design **obrigatórias** definidas por ele:

- **Paleta: SOMENTE preto, branco e bege/marrom** (`--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315`). **Zero vermelho e zero azul na UI** (o vermelho/azul que aparece no hero é a iluminação cênica do render, escolhida pelo cliente — ok).
- **Tipografia: Helvetica** (UI/corpo, stack de sistema) **+ Noto Serif** (display/títulos, com itálico como ênfase no lugar de cor).
- **Cantos quadrados** — nada de border-radius chamativo (o usuário odiou a sanfona arredondada da v1).
- **Nav oculta enquanto o hero está em tela cheia**; entra deslizando após rolar. **Não existe menu lateral/painel** (foi removido a pedido) — mobile mostra só logo + CTA.
- Referências de motion aprovadas: zoom por área do masterplan estilo **oftheoak.co.uk/oak-species**, infográfico com destaque no scroll estilo **freehand.ai**, qualidade geral estilo **oryzo.ai** (blur/focus, serif editorial, copy sobre imagem).

Estrutura do `index.html`: loader → hero (imagem hi-res `assets/web/hero-hotel-noturno.jpg`, logo SVG inline grande, dots sutis) → teaser "A tributação mais competitiva da América do Sul" → masterplan interativo com zoom (vista aérea `assets/web/vista-aerea-park.jpg`, pinos em `AREAS` no script.js) → mapa Leaflet dark full-bleed com labels de distância permanentes → "Como funciona" pinado (ScrollTrigger) → sanfona escura → empresas → assessoria (marrom) → faixa história (escura) → footer.

O **conteúdo e os dados de negócio** (masterplan, regimes fiscais, empresas, contatos) vêm do catálogo V15 e do site anterior — fonte de verdade, não inventar números.

**Pendências conhecidas** (aguardar o usuário):
- Faixa de história: copy genérico sem número de anos da Bracerum como importadora de aço — confirmar antes de publicar. (Era para ser "tarja azul", mas azul saiu da paleta na v2; hoje está em fundo escuro `--ink-2`. Confirmar com o usuário se quer o azul de volta nessa faixa específica.)
- Pinos do masterplan (`AREAS` em script.js) usam coordenadas aproximadas sobre a vista aérea; o usuário descreveu: sup. esquerda = portaria/estacionamento de caminhões, centro = loteamentos/ETE, embaixo = aeroporto (pista 1.480 m), sup. direita = condomínio e hotel+convenções. Refinar se ele apontar ajustes.
- Hero: a imagem foi recuperada da capa do catálogo (exposição +2.2x sobre overlay escuro). Se o usuário subir o render original em alta no GitHub, substituir `assets/web/hero-hotel-noturno.jpg`.

Todo material de referência de design está registrado em **`docs/design-references.md`**. Leia antes de propor UI nova.

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
