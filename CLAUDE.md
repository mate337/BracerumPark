# Bracerum Park — Website

Site institucional do **Bracerum Park**, cidade industrial multiuso em Villeta, Paraguai (Mercosul). Público-alvo: investidores e indústrias avaliando instalar operação no parque.

## Estado do projeto (v4.2 — 2026-08-26)

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
loader → hero (Ken Burns + dots) → teaser de tributação → masterplan com zoom por área (`AREAS` no script.js, coordenadas em % sobre `assets/web/vista-aerea-park.jpg`; o palco `#mpStage` tem a **proporção da própria imagem** e é dimensionado para cobrir o viewport — é isso que mantém os pinos no lugar em qualquer tela. Quando a planta é mais larga que a tela, o bloco fica **arrastável na horizontal** e as bordas esmaecem; no celular a faixa é mais baixa, `clamp(420px,68svh,600px)`, para o arrasto não ser longo demais) → mapa Leaflet dark full-bleed → "Como funciona" (seção de exatamente `100svh` fixada com `ScrollTrigger.pin`: primeiro ela se centraliza, depois o scroll avança os tópicos. **A altura fixa é o que evita a sobreposição e o espaço em branco da v2** — se mudar o conteúdo, manter o bloco cabendo em uma tela) → sanfona escura → empresas → assessoria → faixa história → footer.

### Mapa
**Basemap:** mapa **vetorial do OpenFreeMap** (estilo `dark`) via `maplibre-gl` + `maplibre-gl-leaflet`,
dentro do Leaflet — **sem chave de API e com uso comercial liberado**. O CARTO foi abandonado em
2026-08 porque passou a carimbar "API KEY REQUIRED" em todas as tiles públicas. O estilo é repintado
em runtime pela função `repaint()` em `script.js` (constante `PALETA`): fundo `--ink`, água `#1b4a6e`,
rios `#3d84b4`, rodovias em tons de areia, rótulos claros — **zero vermelho**. A água e os rios são
desenhados pelo próprio mapa, com traçado real; **não desenhar polilinha de rio por cima**
(foi rejeitado pelo cliente). Sem WebGL, cai para um raster claro (Esri Light Gray) invertido pelo
filtro CSS `.leaflet-pane--base`.
**Rotas:** o traçado real por vias vem de `assets/routes.json`, pré-calculado com o OSRM pelo script em
`docs/` (regerar com `build_routes.py` se os pontos mudarem). Sem chamada a API em runtime. Capitais
brasileiras são trechos aéreos e seguem em arco.
**Nota:** os km/tempo exibidos são os do catálogo (fonte de verdade do cliente) e diferem do OSRM em
alguns trechos curtos (ex.: Terport 23 km/20 min no catálogo vs. 35,7 km/36 min pelas vias públicas do
OSM) — o número exibido é o do cliente, a linha é a real.
**Interação:** clicar no ponto do mapa, no rótulo do ponto ou no item da lista faz a mesma coisa —
abre o cartão (foto + descrição para empresários), traça a rota, destaca o ponto e o item, e abre a
sanfona correspondente na lateral. Os marcadores têm área de toque de 28px (`.poi-marker`) porque o
ponto de 9px era pequeno demais no celular; os rótulos são `interactive: true` pelo mesmo motivo.
Indicador flutuante aponta o Park quando ele sai do enquadramento; rótulos de pontos a menos de 12 km
só aparecem a partir do zoom 11.

### Fotos dos pontos de interesse (v4.1)
Os 27 POIs do mapa têm foto em `assets/pois/`, todas do **Wikimedia Commons** sob licença livre
(CC / CC0 / domínio público) — inventário completo em `assets/pois/CREDITOS.md` e `CREDITOS.json`.
Cada POI tem `img` e `credit: {pt,en,es}` em `script.js`; o crédito é renderizado em texto pequeno
sobre a foto, no rodapé do cartão (`.poi-card__credit`). **Não usar imagem de busca comum do Google**
— são protegidas por direito autoral e o site é comercial.
O critério é **empresarial**: a foto tem que mostrar infraestrutura e escala (cais, guindaste, pátio,
comboio de barcaças) — pôr do sol e paisagem bonita não servem para este público.
Não existe foto livre dos terminais privados (Terport, Puerto Seguro, Caacupemí) — checado no Wikimedia
Commons e no Openverse (Flickr CC). Esses usam foto de contexto, rotulada como "Foto ilustrativa" no
próprio crédito. **O caminho certo é pedir as fotos aos próprios terminais** (terport.com.py,
puertosegurofluvial.com, caacupemi.com.py): eles ganham com a divulgação e uma autorização por e-mail
resolve. Quando chegarem, trocar o arquivo em `assets/pois/` e ajustar o `credit`.
Onde a foto não existe, a **descrição** carrega a escala: Terport e Puerto Seguro trazem investimento,
capacidade e equipamento, apurados nas fontes do setor.

**Pendências conhecidas** (aguardar o usuário):
- Fotos próprias dos terminais (Terport, Puerto Seguro, Caacupemí) para substituir as ilustrativas.
- Faixa de história / página Bracerum: falta o número de anos da Bracerum como importadora de aço. O site institucional só traz "2018–2026" no copyright, então usei 2018 como início da operação como trader — **confirmar com o cliente**.
- Pinos do masterplan já seguem as marcações do cliente; refinar se ele apontar ajustes.
- Hero: imagem recuperada da capa do catálogo (+2.2x de exposição). Se o render original em alta for enviado, substituir `assets/web/hero-hotel-noturno.jpg`.

## APROVA — ferramenta de aprovação (repositório separado)

O aplicativo de aprovação de postagens nasceu aqui, na pasta `aprovacoes/`, e foi
movido para o seu próprio repositório: **[mate337/Bracerumpark-Aprovacoes](https://github.com/mate337/Bracerumpark-Aprovacoes)**.
Não mexer nele por este repositório.

Vale saber que existe porque o **design é outro** — preto e laranja, degradês,
vidro, cantos arredondados. As regras deste site (paleta bege/marrom, cantos
quadrados, zero vermelho) **não valem lá**, e vice-versa.

## Stack de design/dev combinada

- Prototipação/handoff: seguir princípios do guia de ferramentas (Figma-like: tokens, componentes, estados) mesmo sem Figma disponível aqui — traduzir isso direto em CSS custom properties e componentes reutilizáveis.
- Animação: **GSAP** (ferramenta adicionada pelo usuário) para scroll, transições e microinterações — inspirado nos padrões Osmo documentados em `docs/design-references.md`.
- Implementação: HTML/CSS/JS (mesma stack do projeto atual, sem framework pesado, a menos que o usuário peça).
- Qualidade: seguir os checklists de UX/UI e visual do guia (acessibilidade WCAG, estados de componente, performance, responsividade mobile-first) antes de considerar qualquer seção "pronta".

## Assets já disponíveis em `/assets`

Imagens reais do projeto (renders): `masterplan.jpg`, `Hotel.jpg`, `Fabrica.jpg`, `casas.jpg`, `convencoes.jpg`, `convenco2.jpg`, `escritorios.jpg`, `Clube.jpg`, `Eventos.jpg`. Logo oficial da Bracerum (grupo): `Bracerum Vertical - Branca.svg`, normalizado em `assets/logo/bracerum-{white,blue,black}.svg` — é um lockup próprio, diferente do logo do Park. Logos de empresas parceiras/validação de mercado: `Ball_Corporation_logo_2024.svg`, `Kingspan_Group_logo.svg`, `Lupo_logo (1).svg`, `cremer.svg`, `be8.svg`.

Faltam (mencionados no `LEIA-ME.txt` original, ainda não enviados): `tecnologico.jpg`, `comercial.jpg`.

## Próximo passo

Aguardando o usuário: (1) fotos próprias dos terminais privados, para substituir as ilustrativas; (2) o dado de anos de história da Bracerum como importadora de aço.
