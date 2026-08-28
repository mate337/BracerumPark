# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v4.1 — 2026-08-26)

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

### Fotos dos pontos de interesse (v4.1)
Os 27 POIs do mapa têm foto em `assets/pois/`, todas do **Wikimedia Commons** sob licença livre
(CC / CC0 / domínio público) — inventário completo em `assets/pois/CREDITOS.md` e `CREDITOS.json`.
Cada POI tem `img` e `credit: {pt,en,es}` em `script.js`; o crédito é renderizado em texto pequeno
sobre a foto, no rodapé do cartão (`.poi-card__credit`). **Não usar imagem de busca comum do Google**
— são protegidas por direito autoral e o site é comercial.
Não existe foto livre dos terminais privados (Terport, Puerto Seguro, Caacupemí): esses três usam
foto de contexto, rotulada como "Foto ilustrativa" no próprio crédito para não passar uma coisa
por outra. Quando o cliente enviar fotos próprias, trocar o arquivo e ajustar o `credit`.

**Pendências conhecidas** (aguardar o usuário):
- Fotos próprias dos terminais (Terport, Puerto Seguro, Caacupemí) para substituir as ilustrativas.
- Faixa de história / página Bracerum: falta o número de anos da Bracerum como importadora de aço. O site institucional só traz "2018–2026" no copyright, então usei 2018 como início da operação como trader — **confirmar com o cliente**.
- Pinos do masterplan já seguem as marcações do cliente; refinar se ele apontar ajustes.
- Hero: imagem recuperada da capa do catálogo (+2.2x de exposição). Se o render original em alta for enviado, substituir `assets/web/hero-hotel-noturno.jpg`.

## Stack de design/dev combinada

- Prototipação/handoff: seguir princípios do guia de ferramentas (Figma-like: tokens, componentes, estados) mesmo sem Figma disponível aqui — traduzir isso direto em CSS custom properties e componentes reutilizáveis.
- Animação: **GSAP** (ferramenta adicionada pelo usuário) para scroll, transições e microinterações — inspirado nos padrões Osmo documentados em `docs/design-references.md`.
- Implementação: HTML/CSS/JS (mesma stack do projeto atual, sem framework pesado, a menos que o usuário peça).
- Qualidade: seguir os checklists de UX/UI e visual do guia (acessibilidade WCAG, estados de componente, performance, responsividade mobile-first) antes de considerar qualquer seção "pronta".
- Revisão de UI: a skill `web-design-guidelines` (de `vercel-labs/agent-skills`) audita arquivos contra as Web Interface Guidelines da Vercel e devolve os achados em `arquivo:linha`. Também é um stub — busca as regras atualizadas em `vercel-labs/web-interface-guidelines` na hora da revisão. Complementa o `agent-browser`: uma lê o código, a outra confere o site rodando.
- Componentes: a skill `building-components` (de `vercel/components.build`) traz 15 referências `.mdx` sobre design de componentes. **Atenção ao escopo:** a maior parte pressupõe React + TypeScript + Tailwind + registry shadcn, que **não** é a stack deste site (HTML/CSS/JS puro, sem build nem npm). O que transfere de fato é `references/accessibility.mdx` (HTML semântico, navegação por teclado, ARIA, foco, contraste) e `references/design-tokens.mdx` (arquitetura de CSS custom properties semânticas — casa com os tokens `--ink`/`--paper`/`--sand`/`--brown` do `style.css`). Ignorar as partes de `as-child`, polimorfismo, npm, registry e marketplaces enquanto o site não usar framework.

### Teste no navegador — `agent-browser`

Automação de navegador via [`agent-browser`](https://github.com/vercel-labs/agent-browser)
(CLI Rust da Vercel Labs, Chrome por CDP). Usar para conferir o site de verdade — entrada de
idioma, loader, Ken Burns do hero, zoom do masterplan, pin da seção "Como funciona", mapa
Leaflet — em vez de julgar só pelo código.

O ambiente do Claude Code na web é efêmero: reinstalar por sessão com
`npm i -g agent-browser && agent-browser install` (em Linux, `--with-deps` se o Chrome não subir).
O que fica versionado é o stub da skill em `.agents/skills/agent-browser/` (com symlink em
`.claude/skills/`) mais o `skills-lock.json`; o conteúdo real vem do CLI com
`agent-browser skills get core`, então nunca desatualiza.

Fluxo típico (o site é estático, basta servir a pasta):

```bash
python3 -m http.server 8123 &
NO_PROXY=127.0.0.1,localhost agent-browser open http://127.0.0.1:8123/index.html
NO_PROXY=127.0.0.1,localhost agent-browser snapshot      # árvore de acessibilidade com refs @eN
NO_PROXY=127.0.0.1,localhost agent-browser click @e2     # ex.: escolher o idioma na entrada
NO_PROXY=127.0.0.1,localhost agent-browser screenshot hero.png
NO_PROXY=127.0.0.1,localhost agent-browser close
```

**Atenção:** o `NO_PROXY` é necessário porque o ambiente roteia HTTPS por um proxy — sem ele o
Chrome não alcança o `127.0.0.1`. E o caminho do `screenshot` é resolvido no diretório de trabalho
do daemon (o diretório de onde ele subiu), não no do comando — salvar fora do repositório ou
apagar depois, para não versionar PNG de teste.

## Assets já disponíveis em `/assets`

Imagens reais do projeto (renders): `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`. Logo oficial da Bracerum (grupo): `Bracerum Vertical - Branca.svg`, normalizado em `assets/logo/bracerum-{white,blue,black}.svg` — é um lockup próprio, diferente do logo do Park. Logos de empresas parceiras/validação de mercado: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.

Faltam (mencionados no `LEIA-ME.txt` original, ainda não enviados): `tecnologico.jpg`, `comercial.jpg`.

## Próximo passo

Aguardando o usuário: (1) fotos próprias dos terminais privados, para substituir as ilustrativas; (2) o dado de anos de história da Bracerum como importadora de aço.
