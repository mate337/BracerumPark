# Comando de execução — montar o filme de 60s do Bracerum Park no After Effects

> Arquivo de instrução autossuficiente. Leia inteiro antes de começar e execute sem pedir
> confirmação: todas as decisões já estão tomadas aqui. Onde este arquivo e qualquer outra fonte
> divergirem, **este arquivo vence**.

## 1. Quem faz o quê

Você vai produzir o projeto do **filme institucional de 60 s do Bracerum Park** no After Effects,
montado com os assets que já existem no repositório. Os takes 3D definitivos **ainda não foram
produzidos** — por isso o projeto nasce completo, com cada plano num precomp próprio, usando
render estático ou o clipe aéreo como *stand-in*. Quando um take 3D ficar pronto, ele substitui o
conteúdo do precomp correspondente e nada mais na timeline muda. **Essa estrutura é o objetivo
principal do trabalho**, mais do que o preview em si.

**Repositório:** `github.com/mate337/BracerumPark` · branch **`claude/park-v5-paginas-projetos`**
**Contexto completo do filme:** `docs/roteiro-video-60s.md` (roteiro + brief dos 20 takes 3D).
Leia antes de montar — mas a tabela da seção 6 **deste** arquivo é a fonte de verdade da timeline.

## 2. Entregáveis

1. **`docs/ae/bracerum-60s.jsx`** — ExtendScript que, rodado em `Arquivo > Scripts > Executar
   arquivo de script`, monta o projeto inteiro do zero: importa assets, cria os precomps, monta a
   master, aplica keyframes, textos, véus e marcadores. Rodar duas vezes seguidas não pode duplicar
   nada (limpe ou reaproveite pelo nome).
2. **`docs/ae/LEIA-ME.md`** — como rodar, o que instalar antes, como trocar um stand-in pelo take 3D.
3. **Se você tiver acesso ao After Effects:** rode o script, corrija o que falhar, salve
   `docs/ae/Bracerum_Park_60s.aep` e renderize `docs/ae/preview/bracerum-60s_preview.mp4`
   (H.264, 1920×1080, 30 fps). **Se não tiver:** entregue 1 e 2, e diga isso claramente no LEIA-ME —
   não finja que renderizou.

## 3. Restrições técnicas que causam retrabalho se ignoradas

- **ExtendScript é ES3.** Nada de `let`, `const`, arrow function, template literal, `JSON.parse`,
  `Array.prototype.forEach`. Use `var`, `function`, concatenação com `+` e `for` clássico.
- **Envolva tudo em `app.beginUndoGroup("Bracerum 60s") / app.endUndoGroup()`** e cheque
  `app.project` antes de criar qualquer coisa.
- **O After Effects não importa SVG.** Os logos já estão convertidos em PNG em `docs/ae/build/`.
  Não tente importar nada de `assets/logo/*.svg`.
- **Fontes:** *Noto Serif* (display/títulos — Google Fonts, gratuita, instalar antes) e *Helvetica*
  (UI/números; se não houver, **Arial**). Nomes PostScript: `NotoSerif-Regular`,
  `NotoSerif-Italic`, `Helvetica` / `ArialMT`, `Helvetica-Bold` / `Arial-BoldMT`.
- **O clipe aéreo é 24 fps numa comp de 30 fps.** Interprete o footage como 24 fps, ligue
  **Frame Blending → Pixel Motion** na camada e só então aplique o time-stretch da tabela. Sem isso
  o movimento tranca.
- **Caminhos relativos ao repositório.** O script deve resolver os assets a partir da pasta do
  próprio `.jsx` (`File($.fileName).parent.parent.parent` = raiz do repo), nunca com caminho
  absoluto da sua máquina.

## 4. Regras de marca (não negociáveis — vêm do cliente)

- **Paleta:** `--ink #0e0d0b` · `--paper #f7f3ea` · `--sand #cbb88f` · `--brown #473315`.
- **ZERO VERMELHO** em qualquer elemento gráfico, em qualquer frame.
- **Azul só em três lugares:** a fachada noturna do hotel (T14, é iluminação cênica do render), o
  mapa, e a faixa institucional Bracerum `#1c4d9d` na assinatura final.
- **Tipografia:** Noto Serif nos nomes de marca e ênfases (itálico como ênfase, **nunca cor**);
  Helvetica/Arial em números, legendas e dados.
- **Cantos quadrados.** Sem border-radius, sem sombra, sem bisel, sem brilho.
- Transições são **corte seco**, exceto onde a tabela disser outra coisa. Nada de dissolve
  cruzado genérico, wipe, zoom-blur ou "transição de template".

## 5. Estrutura obrigatória do projeto

```
01_MASTER/      BP_60s_MASTER          1920×1080 · 30 fps · 60 s · 16 bpc · sRGB
02_TAKES/       T01_parque_geral, T02_zoomout, T03_planta, T04_galpoes, T05_doca,
                T06_fabrica, T07_aerodromo, T08_enfermaria, T09_creche, T10_bombeiros,
                T11_comercial, T12_academia, T13_posto, T14_hotel, T15_auditorio,
                T16_convencoes, T17_resort_lago, T18_beira_lago, T19_quadras, T20_saida,
                B01_engenheiro, B02_barcacas, B03_galpao_interior
03_ASSETS/      imagens, clipe e PNGs de apoio importados
04_GRAFISMO/    cartelas, legendas, assinatura, véus
```

Cada precomp de take tem **a duração do plano na master** (as durações estão na tabela) e o
mesmo tamanho da master. **Um plano = um precomp**, sempre — é o que permite trocar o stand-in
pelo take 3D sem tocar na timeline.

**Precomps sem asset** (T08, T09, T10, T12 e os três `B0x`): monte como *slate* — fundo `--ink`,
o ID do take em Helvetica `--sand` no topo, a descrição em Noto Serif `--paper` no centro e a nota
em Helvetica `--paper` a 65% embaixo. **Texto de verdade, editável** — não use imagem pronta.

## 6. Timeline — a tabela é a fonte de verdade

`IN` é o tempo na master. Movimento: `escala a→b` é o Ken Burns (Escala uniforme, dois keyframes,
**Suavização Easy Ease com influência 45** nos dois, nunca linear). Assets são relativos à raiz do repo.

| IN | Dur | Precomp | Asset (stand-in) | Movimento | Texto na tela |
|---|---|---|---|---|---|
| 0:00.0 | 3,0s | T01_parque_geral | `assets/video/voo-passaro-01.mp4` · trecho 0,0–1,8 s · time-stretch **166,67%** | nenhum (o movimento é do clipe) | — |
| 0:03.0 | 2,0s | B01_engenheiro | *slate* | — | `VILLETA · PARAGUAI` |
| 0:05.0 | 4,0s | T02_zoomout | `assets/web/vista-aerea-park-02.jpg` | escala **150→62**, subindo (posição Y +90 px) | `65 km de Assunção` · `Hidrovia Paraná–Paraguai` · `Ruta PY19 · Acceso Sur` |
| 0:09.0 | 3,0s | T03_planta | `assets/web/vista-aerea-park-02.jpg` | escala **118→104** | **1.819.856 m²** + *planejados* (itálico serifado) |
| 0:12.0 | 2,0s | B02_barcacas | *slate* | — | — |
| 0:14.0 | 2,0s | T04_galpoes | `assets/park/vias-galpao.jpg` | escala **104→118**, deriva X −40 px | **989.642 m²** de lotes · módulos de **40.000 m²** |
| 0:16.0 | 2,0s | T05_doca | `assets/park/vias-caminhoes.jpg` | escala **106→116**, deriva X −40 px (mesmo eixo do T04) | — |
| 0:18.0 | 2,0s | B03_galpao_interior | *slate* | — | — |
| 0:20.0 | 3,0s | T06_fabrica | `assets/park/fabrica-bracerum.jpg` | escala **116→104** | **Built-to-Suit** · Steel Frame próprio |
| 0:23.0 | 4,0s | T07_aerodromo | `assets/video/voo-passaro-01.mp4` · trecho 2,6–4,8 s · time-stretch **181,82%** | nenhum | **Pista de 1.480 m** · hangares **7.686 m²** · **heliponto** junto aos hangares |
| 0:27.0 | 1,0s | (cartela) | — | máscara vertical revelando o texto em 12 frames | **Apoio e bem-estar** |
| 0:28.0 | 2,0s | T08_enfermaria | *slate* | — | **Enfermaria** no perímetro |
| 0:30.0 | 2,0s | T09_creche | *slate* | — | **Creche** |
| 0:32.0 | 2,0s | T10_bombeiros | *slate* | — | **Bombeiros civis** próprios |
| 0:34.0 | 1,0s | (cartela) | — | idem | **Bracerum Select** |
| 0:35.0 | 2,0s | T11_comercial | `assets/park/select-shopping-lago.jpg` | escala **104→115** | **Shopping** e lojas |
| 0:37.0 | 2,0s | T12_academia | *slate* | — | **Academia** |
| 0:39.0 | 2,0s | T13_posto | `assets/park/select-posto-noturno.jpg` | escala **115→104** | **Posto · market · banco · praça de alimentação** |
| 0:41.0 | 1,0s | (cartela) | — | idem | **Bracerum Hotel** |
| 0:42.0 | 3,0s | T14_hotel | `assets/web/hero-hotel-noturno.jpg` | escala **104→116**, deriva Y −30 px | **384 studios** de 35 m² |
| 0:45.0 | 2,0s | T15_auditorio | `assets/park/hotel-auditorio.jpg` | escala **106→116** | **Auditório para 1.200 pessoas** |
| 0:47.0 | 1,0s | T16_convencoes | `assets/renders/pavilhao-eventos-1.jpg` | escala **110→116** | **Centro de convenções · 13.500 m²** |
| 0:48.0 | 1,0s | (cartela) | — | idem | **Bracerum Resort** |
| 0:49.0 | 3,0s | T17_resort_lago | `assets/park/resort-lago-aereo.jpg` | escala **116→104** | **141 lotes** · **142.067 m²** |
| 0:52.0 | 2,0s | T18_beira_lago | `assets/park/resort-lago-fonte.jpg` | escala **104→112** | — |
| 0:54.0 | 1,0s | T19_quadras | `assets/park/amen-quadras.jpg` | escala **112→106** | Lago · quadras · clubhouse |
| 0:55.0 | 3,0s | T20_saida | `assets/video/voo-passaro-01.mp4` · trecho 0,0–1,6 s · **Time-Reverse Layer** + time-stretch **187,5%** | nenhum | `PARK · SELECT · HOTEL · RESORT` |
| 0:58.0 | 2,0s | (assinatura) | `docs/ae/build/logo-stacked-wide-cream.png` | logo entra por máscara vertical em 10 frames | **bracerumpark.com · Villeta · Paraguai** |

**Fecha exatamente em 60,0 s.** Se sua soma der diferente, você errou em algum plano — confira antes
de seguir.

### Como montar cada elemento

- **Ken Burns:** a imagem entra no precomp em escala uniforme, centralizada, com os dois keyframes
  da tabela no primeiro e no último frame **do precomp**. Nunca deixe a borda da imagem aparecer:
  escala mínima 104%. Easy Ease nos dois keyframes, influência 45.
- **Legendas:** camada `docs/ae/build/veil-bottom.png` (véu já pronto, degradê ink) por baixo do
  texto, sempre — sem ela o texto claro some na aérea dourada. Texto alinhado à esquerda, a
  **110 px da borda esquerda** (é a coluna do site), bloco terminando a ~190 px da base.
  Estrutura do bloco: *eyebrow* em Helvetica Bold 22 px `--sand` com **tracking 120**, caixa alta →
  número/título em Helvetica Bold 86 px `--paper` → ênfase em Noto Serif Italic 72 px `--paper` →
  linha de apoio em Helvetica 34 px `--paper` a 88%.
  Entrada: opacidade 0→100 em 8 frames + posição Y +18 px → 0, Easy Ease. Saída: corta com o plano.
- **Números:** os que aparecem em negrito na coluna "Texto na tela" contam de 0 até o valor em
  **0,4 s** com Easy Ease (expressão ou keyframes, tanto faz), mantendo separador de milhar com
  ponto. **Nunca invente número** — use exatamente o que está na tabela.
- **Cartelas de marca:** fundo `--ink` cheio, nome em Noto Serif Italic 104 px `--paper` centrado,
  filete `--sand` de 240×1 px abaixo, descritor em Helvetica Bold 24 px `--sand` com tracking 130,
  caixa alta. Revelação por máscara retangular subindo em 12 frames, Easy Ease.
- **Assinatura:** fundo `--ink`, logo PNG centralizado com ~620 px de largura, revelado por máscara
  vertical em 10 frames; endereço em Helvetica 30 px `--paper` a 80% abaixo; faixa `#1c4d9d` de
  10 px colada na base entrando nos últimos 12 frames.
- **Marcadores de locução:** na master, um **marcador de comp** no IN de cada plano com a fala
  correspondente da seção 7 no comentário. É o guia para gravar o VO depois.

## 7. Locução — só marcadores, não gere áudio

Não sintetize voz nem trilha. O VO é gravado depois; a trilha é licenciada. Os textos para os
marcadores (o TC é o do início do plano correspondente):

| TC | Fala |
|---|---|
| 0:01 | Villeta, Paraguai. Sessenta e cinco quilômetros de Assunção, minutos da Hidrovia. |
| 0:09 | Um milhão, oitocentos e dezenove mil metros quadrados planejados como uma cidade industrial completa. |
| 0:15 | Quase um milhão de metros quadrados de lotes, em módulos de quarenta mil. Galpão pronto, em Steel Frame próprio. |
| 0:23 | Mil quatrocentos e oitenta metros de pista, hangares e heliponto dentro do perímetro: o investidor desce no parque. |
| 0:28 | Enfermaria, creche e bombeiros próprios. O que uma cidade precisa para funcionar. |
| 0:35 | Bracerum Select: shopping, academia, banco e posto. A rotina resolvida sem sair do parque. |
| 0:42 | Bracerum Hotel: trezentos e oitenta e quatro studios e um auditório para mil e duzentas pessoas. |
| 0:49 | Bracerum Resort: cento e quarenta e um lotes à beira do lago, a cinco minutos da operação. |
| 0:56 | Bracerum Park. A porta de entrada industrial do Mercosul. |

## 8. Entrega no Git

Trabalhe na branch **`claude/park-v5-paginas-projetos`**, commit com mensagem descritiva em
português. Commitar: o `.jsx`, o `LEIA-ME.md` e, se tiver rodado, o `.aep` e o preview.
**Não commitar** cache de disco do AE, pastas de render intermediário nem nada em `Adobe After
Effects Auto-Save/`.

## 9. Critérios de aceite

- [ ] O `.jsx` roda numa instalação limpa do AE sem erro e sem diálogo, e rodar duas vezes não duplica nada.
- [ ] A master fecha em **60,0 s** exatos, sem frame vazio nem sobreposição entre planos.
- [ ] Os 23 precomps existem, com os nomes exatos da seção 5, cada um com a duração da tabela.
- [ ] Nenhum pixel vermelho em elemento gráfico, em nenhum frame.
- [ ] Todo texto na tela bate **literalmente** com a coluna "Texto na tela" — inclusive os números.
- [ ] Toda legenda tem o véu por baixo e começa a 110 px da borda esquerda.
- [ ] Os três planos do clipe estão com Pixel Motion ligado e o time-stretch da tabela.
- [ ] Os 9 marcadores de locução estão na master, nos TCs certos.
- [ ] Nenhum caminho absoluto dentro do `.jsx`.

## 10. O que NÃO fazer

- Não invente dado, número, metragem ou nome de ambiente que não esteja neste arquivo.
- Não use imagem, vídeo, trilha ou fonte de fora do repositório e da lista da seção 3.
- Não mude a duração total, a ordem dos planos nem o texto das legendas "para ficar melhor".
  Se achar que algo está errado, **monte como está e anote no LEIA-ME** — quem decide é o cliente.
- Não aplique efeito de template (glitch, light leak, lens flare artificial, partícula, zoom-blur).
  O filme é sóbrio: corte seco, Ken Burns discreto e tipografia.
- Não adicione marca d'água, assinatura própria, nem crédito de ferramenta em nenhum frame.

## 11. Estado conhecido do material

- O **clipe aéreo** (`assets/video/voo-passaro-01.mp4`, 5 s, 1284×716, 24 fps) é o único material
  filmado que existe. É preview — abaixo de HD. Ele entra como stand-in em T01, T07 e T20 e será
  substituído pelos takes 3D em 4K. Numa comp 1080p ele sobe 1,5×: **é esperado que apareça
  suave**, não tente corrigir com sharpen.
- **T08, T09, T10 e T12** não têm render nem projeto arquitetônico definido — por isso são slates.
- **T09 (creche)** ainda depende de confirmação do cliente; mantenha o slate e a nota.
- Os `B0x` são os planos que serão **filmagem de banco licenciada**, não 3D — ficam como slate até a
  licença ser comprada. Há ainda um insert de 0,5 s de maquininha de cartão previsto **dentro** do
  T13, que entra junto com essa licença: não monte agora, só deixe anotado no LEIA-ME.
