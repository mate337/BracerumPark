# Capas e logos — Residence, Outlet Premium, Loteamentos e Hotel

Separados em 2026-11-10 para cadastro (CV CRM, redes, apresentações). Visão geral em `previa.jpg`.
Gerado por `docs/build_capas_logos.py` — **não editar os arquivos à mão**; se o cliente mandar
folder ou logo novo, rodar o script de novo.

Cada pasta tem:

- `logo/` — `*-claro` (creme `#fbf2e6`, para fundo escuro) e `*-escuro` (marrom `#40362e`, para
  fundo claro), em **SVG** (vetor) e **PNG** transparente de 2000 px; `*-quadrado.png` (1080 × 1080,
  logo creme sobre marrom) para avatar/miniatura.
- `capa/` — `capa-folder*.jpg` é a capa do folder impresso cortada na linha de corte (300 dpi,
  com título); `foto-*.jpg` são as fotos sem texto, no tamanho original (máx. 3200 px).

| Produto | Logo | Capa sugerida |
|---|---|---|
| **Bracerum Residence** | `bracerum-residence` — título "Bracerum *Residence*" da capa do folder | `foto-piscina-praia.jpg` (sem texto) ou `capa-folder-apartamentos.jpg` |
| **Bracerum Outlet Premium** | `premium-outlet` — título "PREMIUM OUTLET" da capa do folder | `foto-boulevard-lojas.jpg` ou `capa-folder.jpg` |
| **Loteamentos** | `bracerum-park-vertical` / `-horizontal` (o loteamento não tem marca própria) + `titulo-parque-industrial` | `foto-galpao-avenida.jpg` ou `capa-folder-cidade-industrial.jpg` |
| **Hotel** | `bracerum-hotel` — selo do cliente ("Bracerum Park Hotel"), já em curvas | `foto-hotel-cupula-dia.jpg` |

## De onde vem cada coisa

- **Folders impressos do cliente** (Google Drive, 05–06/11/2026): *Folder Bracerum Residence V3*,
  *Folder Bracerum Residence Casas*, *Folder Bracerum Premium Outlet V1* e *Folder Bracerum Park V3*.
  Os títulos das capas estão em curvas no PDF; o script copia os caminhos vetoriais, então os logos
  do Residence, do Outlet e o "Parque Industrial" são exatamente os do folder, não redesenhos.
- **Bracerum Park vertical:** *Logo Vertical - Branca.svg* da pasta "00 - Logos" do Drive (o lockup
  "BRACERUM / P A R K" dos folders). O de `assets/logo/` é o lockup anterior, com "Paraguay 2026".
  **Horizontal:** tirado do topo da capa do folder do Park — o *Logo Horizontal* do Drive só tem o
  texto, sem o losango.
- **Hotel:** `assets/logo/hotel-cream.svg` (Logo Hotel 02 do cliente, texto convertido em curvas por
  `docs/build_logos.py`). Fotos: renders originais da pasta "Imagens BracerumPark Finalizadas" e o
  hero do site.

## A confirmar com o cliente

- **Residence e Outlet não têm logo-símbolo próprio** — o que existe é o título tipográfico das capas.
  Se houver um logo oficial (como os selos do Hotel/Resort/Select), trocar.
- O título do folder é **"Premium Outlet"**; o nome do produto é **"Bracerum Outlet Premium"**.
- **Loteamento** usa a marca do Bracerum Park; confirmar se deve ter marca própria.
- O render *HOTEL FRENTE.png* (Drive, 04/11/2026) mostra um prédio diferente do hotel do site
  (torre escalonada) — ficou de fora até o cliente dizer qual é o projeto atual.
- A `foto-hotel-noturno.jpg` tem iluminação vermelha e azul na cúpula (é o hero do site); para
  peças fora do site, preferir a de dia.
