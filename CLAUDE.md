# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v4 — 2026-08-25)

O site tem **3 páginas**: `index.html`, `tributacao.html` e `bracerum.html`, mais `i18n.js`, `style.css` e `script.js`.

### Regras de design **obrigatórias** (definidas pelo cliente)
- **Paleta: preto, branco e bege/marrom** (`--ink #0e0d0b`, `--paper #f7f3ea`, `--sand #cbb88f`, `--brown #473315`). **Zero vermelho.** Azul só nos três casos pedidos pelo cliente: a faixa institucional da Bracerum (`--brc-blue #1c4d9d`), a água do mapa (semântica) e a iluminação cênica do render do hero.
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
loader → hero (Ken Burns + dots) → teaser de tributação → masterplan com zoom por área (`AREAS` no script.js, coordenadas em % sobre `assets/web/vista-aerea-park.jpg`) → mapa Leaflet dark full-bleed → "Como funciona" (seção de exatamente `100svh` fixada com `ScrollTrigger.pin`: primeiro ela se centraliza, depois o scroll avança os tópicos. **A altura fixa é o que evita a sobreposição e o espaço em branco da v2** — se mudar o conteúdo, manter o bloco cabendo em uma tela) → sanfona escura → empresas → assessoria → faixa história → footer.

### Mapa
**Água:** o basemap é o CARTO Voyager (claro) num pane próprio com `filter: invert(1) hue-rotate(180deg)…` — isso deixa o terreno escuro e faz rios e lagos serem desenhados **pelo próprio mapa** em azul, com traçado real. Os rótulos vêm do `dark_only_labels` num pane separado, sem filtro. **Não desenhar polilinha de rio por cima** (foi rejeitado pelo cliente).
**Rotas:** o traçado real por vias vem de `assets/routes.json`, pré-calculado com o OSRM pelo script em `docs/` (regerar com `build_routes.py` se os pontos mudarem). Sem chamada a API em runtime. Capitais brasileiras são trechos aéreos e seguem em arco.
**Nota:** os km/tempo exibidos são os do catálogo (fonte de verdade do cliente) e diferem do OSRM em alguns trechos curtos (ex.: Terport 23 km/20 min no catálogo vs. 35,7 km/36 min pelas vias públicas do OSM) — o número exibido é o do cliente, a linha é a real.
Grupos de POI (portos, rodovias, aeroportos, distâncias aéreas de capitais brasileiras, referências); clicar no ponto do mapa ou no item da lista faz o mesmo: abre o cartão (foto + descrição para empresários), traça a rota e destaca o item; indicador flutuante aponta o Park quando ele sai do enquadramento; rótulos de pontos a menos de 12 km só aparecem a partir do zoom 11.

O **conteúdo e os dados de negócio** vêm do catálogo V15 e de bracerum.com — fonte de verdade, não inventar números.

**Pendências conhecidas** (aguardar o usuário):
- **Fotos dos pontos de interesse do mapa** (Terport, Puerto Seguro, aeroporto etc.): o cartão já tem o espaço reservado, mostrando "Foto do local" enquanto não chegam. Basta preencher o campo `img` do POI em `script.js`.
- Faixa de história / página Bracerum: falta o número de anos da Bracerum como importadora de aço. O site institucional só traz "2018–2026" no copyright, então usei 2018 como início da operação como trader — **confirmar com o cliente**.
- Pinos do masterplan já seguem as marcações do cliente; refinar se ele apontar ajustes.
- Hero: imagem recuperada da capa do catálogo (+2.2x de exposição). Se o render original em alta for enviado, substituir `assets/web/hero-hotel-noturno.jpg`.

## Stack de design/dev combinada

- Prototipação/handoff: seguir princípios do guia de ferramentas (Figma-like: tokens, componentes, estados) mesmo sem Figma disponível aqui — traduzir isso direto em CSS custom properties e componentes reutilizáveis.
- Animação: **GSAP** (ferramenta adicionada pelo usuário) para scroll, transições e microinterações — inspirado nos padrões Osmo documentados em `docs/design-references.md`.
- Implementação: HTML/CSS/JS (mesma stack do projeto atual, sem framework pesado, a menos que o usuário peça).
- Qualidade: seguir os checklists de UX/UI e visual do guia (acessibilidade WCAG, estados de componente, performance, responsividade mobile-first) antes de considerar qualquer seção "pronta".

## Assets já disponíveis em `/assets`

Imagens reais do projeto (renders): `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`. Logo oficial da Bracerum (grupo): `Bracerum Vertical - Branca.svg`, normalizado em `assets/logo/bracerum-{white,blue,black}.svg` — é um lockup próprio, diferente do logo do Park. Logos de empresas parceiras/validação de mercado: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.

Faltam (mencionados no `LEIA-ME.txt` original, ainda não enviados): `tecnologico.jpg`, `comercial.jpg`.

## Próximo passo

Aguardando o usuário: (1) as fotos dos pontos de interesse do mapa; (2) o dado de anos de história da Bracerum como importadora de aço.
