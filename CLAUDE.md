# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v4 — 2026-08-25)

O site tem **3 páginas**: `index.html`, `tributacao.html` e `bracerum.html`, mais `i18n.js`, `style.css` e `script.js`.

### Regras de design **obrigatórias** (definidas pelo cliente)
- **Paleta: SOMENTE preto, branco e bege/marrom** (`--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315`). **Zero vermelho e zero azul na UI.** (O vermelho/azul do hero é a iluminação cênica do render — ok. O azul-claro do rio no mapa é semântico, para indicar água — aprovado pelo pedido do cliente.)
- **Tipografia: Helvetica** (UI/corpo, stack de sistema) **+ Noto Serif** (display/títulos, itálico como ênfase no lugar de cor).
- **Cantos quadrados** — sem border-radius chamativo.
- **Nav oculta enquanto o hero está em tela cheia**; entra deslizando após rolar. **Não existe menu lateral/painel** (removido a pedido).
- Referências de motion aprovadas: zoom por área do masterplan estilo **oftheoak.co.uk/oak-species**, infográfico com destaque no scroll estilo **freehand.ai**, qualidade geral estilo **oryzo.ai**.

### Entrada de idioma
Na primeira visita aparece uma tela (`#langGate`) com EN/PT/ES antes do site. Ao escolher, ela sai e o loader assume. Quem já escolheu entra direto. O fluxo é: `i18n.js` dispara `bp:langready` → `script.js` anima a saída da entrada e roda o loader. Há um timeout de segurança de 4s que **não** dispara enquanto a entrada estiver aberta.

### Idiomas (i18n.js)
O HTML carrega **português**; `i18n.js` traz dicionários **EN** e **ES** que sobrescrevem via `data-i18n="chave"`. Chave ausente cai no PT original — a página nunca quebra. Conteúdo dinâmico (pinos, POIs, listas do mapa) usa objetos `{pt,en,es}` lidos pelo helper `tr()` e re-renderiza no evento `langchange`.
**Atenção:** o helper chama-se `tr()` e **não** `L()`, porque `L` é o global do Leaflet. Ao adicionar texto novo, incluir a chave nos dois dicionários (há um script de conferência no histórico da sessão).

### Estrutura do index
loader → hero (Ken Burns + dots) → teaser de tributação → masterplan com zoom por área (`AREAS` no script.js, coordenadas em % sobre `assets/web/vista-aerea-park.jpg`) → mapa Leaflet dark full-bleed → "Como funciona" (coluna sticky + IntersectionObserver — **não usar pin do ScrollTrigger, causou sobreposição e espaço em branco**) → sanfona escura → empresas → assessoria → faixa história → footer.

### Mapa
**Água:** o basemap é o CARTO Voyager (claro) num pane próprio com `filter: invert(1) hue-rotate(180deg)…` — isso deixa o terreno escuro e faz rios e lagos serem desenhados **pelo próprio mapa** em azul, com traçado real. Os rótulos vêm do `dark_only_labels` num pane separado, sem filtro. **Não desenhar polilinha de rio por cima** (foi rejeitado pelo cliente).
**Rotas:** o traçado real por vias vem de `assets/routes.json`, pré-calculado com o OSRM pelo script em `docs/` (regerar com `build_routes.py` se os pontos mudarem). Sem chamada a API em runtime. Capitais brasileiras são trechos aéreos e seguem em arco.
**Nota:** os km/tempo exibidos são os do catálogo (fonte de verdade do cliente) e diferem do OSRM em alguns trechos curtos (ex.: Terport 23 km/20 min no catálogo vs. 35,7 km/36 min pelas vias públicas do OSM) — o número exibido é o do cliente, a linha é a real.
Grupos de POI (portos, rodovias, aeroportos, distâncias aéreas de capitais brasileiras, referências); clique no ponto abre cartão com descrição para empresários; clique na lista traça rota indicativa (arco) a partir do Park; indicador flutuante aponta o Park quando ele sai do enquadramento; rótulos de pontos a menos de 12 km só aparecem a partir do zoom 11.

O **conteúdo e os dados de negócio** vêm do catálogo V15 e de bracerum.com — fonte de verdade, não inventar números.

**Pendências conhecidas** (aguardar o usuário):
- **Fotos dos pontos de interesse do mapa** (Terport, Puerto Seguro, aeroporto etc.): o cartão já tem o espaço reservado, mostrando "Foto do local" enquanto não chegam. Basta preencher o campo `img` do POI em `script.js`.
- Faixa de história / página Bracerum: falta o número de anos da Bracerum como importadora de aço. O site institucional só traz "2018–2026" no copyright, então usei 2018 como início da operação como trader — **confirmar com o cliente**.
- Pinos do masterplan já seguem as marcações do cliente; refinar se ele apontar ajustes.
- **Logo da Bracerum** (faixa azul `#1c4d9d` do index): o arquivo oficial não chegou; `assets/logo/bracerum-{white,blue,black}.svg` são derivados dos SVGs do Park (marca + "BRACERUM", sem "PARK"). Substituir quando o oficial for enviado.
- Hero: imagem recuperada da capa do catálogo (+2.2x de exposição). Se o render original em alta for enviado, substituir `assets/web/hero-hotel-noturno.jpg`.

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
