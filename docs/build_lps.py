#!/usr/bin/env python3
"""Gera as landing pages dos folders do Bracerum Park.

    python3 docs/build_lps.py

Grava <slug>/index.html para cada página de PAGINAS (folderpark, folderresidence,
folderresort, folderbusinesscenter, foldermapadisponibilidade, folderlp e corretores —
esta última não vai para o CV: grava na planilha do Drive, ver docs/corretores.md) e as imagens
de compartilhamento assets/lp/og-<slug>.jpg. **Não editar o HTML gerado** — editar
aqui e rodar de novo. CSS e JS compartilhados em lp/ (lp.css, lp.js).

Cada texto é escrito nos três idiomas no mesmo lugar: T("pt", "en", "es"). O HTML sai
em português; EN e ES vão num <script id="lp-i18n"> que o lp.js aplica pela chave
"bp-lang" (a mesma do site). Estrutura, fontes dos números e o porquê de cada seção:
docs/landing-pages.md.
"""
import html
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://bracerumpark.com"
VERSAO = "2"

WA_BR = "5547988030200"  # Sydney Savi (Brasil)
WA_PY = "595985516065"   # Cleber Pavão (Paraguai)


# --------------------------------------------------------------------------- textos
class Pagina:
    def __init__(self, slug, lp, produto, nome, cta=None):
        self.slug, self.lp, self.produto, self.nome = slug, lp, produto, nome
        # Texto do botão do topo e da barra fixa do celular (todos levam ao #form).
        self.cta = cta or T("Receber tabela", "Get price list", "Recibir tabla")
        self.i18n = {"en": {}, "es": {}}
        self.n = 0

    def key(self, pt, en, es, k=None):
        if k is None:
            self.n += 1
            k = f"t{self.n}"
        self.i18n["en"][k] = en
        self.i18n["es"][k] = es
        return k

    def tx(self, tag, tri, cls="", extra=""):
        """<tag data-t=...>pt</tag>; tri = (pt, en, es)."""
        k = self.key(*tri)
        c = f' class="{cls}"' if cls else ""
        return f'<{tag}{c} data-t="{k}"{extra}>{tri[0]}</{tag}>'

    def attr(self, kind, tri):
        """Atributo traduzido: kind = 'tp' (placeholder) | 'ta' (aria-label)."""
        k = self.key(*tri)
        nome = {"tp": "placeholder", "ta": "aria-label"}[kind]
        return f' {nome}="{html.escape(tri[0], quote=True)}" data-{kind}="{k}"'


def T(pt, en=None, es=None):
    return (pt, en if en is not None else pt, es if es is not None else pt)


# --------------------------------------------------------------------------- ícones
_I = {
    "galpao": '<path d="M3 20V9l9-5 9 5v11M2 20h20M7 20v-6h10v6M7 17h10"/>',
    "alfandega": '<rect x="4" y="7" width="16" height="13"/><path d="M4 11h16M9 7V4h6v3M9.5 15.5l2 2 3.5-3.5"/>',
    "vias": '<path d="M8 3L5 21M16 3l3 18M12 4v3M12 10v3M12 16v3"/>',
    "caminhao": '<path d="M2 15V7h11v8M13 10h4l3 3v2h-7"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M1 21h22"/>',
    "gate": '<path d="M3 21V5h3v16M6 8h15M8 8l3 3M12 8l3 3M16 8l3 3"/>',
    "aviao": '<path d="M10.5 13.5L3 11l18-7-7 18-2.5-7.5zM10.5 13.5L15 9"/>',
    "escudo": '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    "pct": '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    "cal": '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3v3H8z"/>',
    "escola": '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    "praia": '<path d="M3 11a9 7 0 0 1 18 0z"/><path d="M12 11v9M3 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/>',
    "ar": '<rect x="2" y="5" width="20" height="8"/><path d="M5 10h14M7 16l-1 3M12 16v3M17 16l1 3"/>',
    "piso": '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    "grill": '<path d="M4 10h16a8 8 0 0 1-16 0z"/><path d="M7 18l-2 3M17 18l2 3M9 3v4M12 2v5M15 3v4"/>',
    "pin": '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "predios": '<path d="M2 21h20M4 21V9h7v12M11 21V4h9v17M14 8h3M14 12h3M14 16h3M6.5 13h2M6.5 17h2"/>',
    "loja": '<path d="M3 9l2-5h14l2 5M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-5h4v5"/>',
    "estrutura": '<path d="M3 20h18M6 20V10M12 20V6M18 20V10M3 10h18M7 6h10"/>',
    "corredor": '<path d="M4 3v18M20 3v18M8 12h8M13 9l3 3-3 3"/>',
    "prato": '<circle cx="12" cy="13" r="5"/><path d="M3 3v6a2 2 0 0 0 2 2v10M21 3v18M21 3c-2 1-3 3-3 6s1 4 3 4"/>',
    "pessoas": '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/>',
    "metragem": '<path d="M4 4h5M4 4v5M4 4l6 6M20 20h-5M20 20v-5M20 20l-6-6M20 4h-5M20 4v5M20 4l-6 6M4 20h5M4 20v-5M4 20l6-6"/>',
    "tech": '<rect x="3" y="4" width="18" height="12"/><path d="M8 20h8M12 16v4M7 8l2 2-2 2M12 12h4"/>',
    "carrinho": '<path d="M3 4h2l2.5 11h11L21 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    "navio": '<path d="M3 15l2 5h14l2-5zM5 15V9h14v6M9 9V5h6v4"/>',
    "estrada": '<path d="M4 21L9 3M20 21L15 3M12 6v2M12 11v2M12 16v2"/>',
    "hotel": '<path d="M3 21V5h12v16M15 9h6v12M2 21h20M6 9h2M10 9h2M6 13h2M10 13h2M7 21v-4h4v4"/>',
    "onda": '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M12 10c0-3 2-6 6-6-1 2-1 4 0 6"/>',
    "chave": '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    "folha": '<path d="M5 19c0-9 5-14 15-15-1 10-6 15-15 15zM5 19l8-8"/>',
}
WA_SVG = ('<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.06 3 3.4 8.66 3.4 15.64c0 2.23.58 4.4 '
          '1.69 6.32L3.3 28.7l6.9-1.81a12.6 12.6 0 0 0 5.84 1.49h.01c6.98 0 12.64-5.66 12.64-12.64C28.69 8.66 23.02 3 16.04 3zm0 '
          '22.99h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.23-3.98 1.05 1.06-3.88-.25-.4a10.47 10.47 0 0 1-1.61-5.61c0-5.8 4.72-10.52 '
          '10.53-10.52 2.81 0 5.45 1.1 7.44 3.08a10.46 10.46 0 0 1 3.08 7.45c0 5.8-4.72 10.52-10.53 10.52zm5.77-7.88c-.32-.16-1.87-.92'
          '-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.57-1.87-1.76'
          '-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.35-.26-.62'
          '-.52-.53-.71-.54l-.6-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75'
          '.33 1.34.52 1.8.67.76.24 1.45.21 1.99.13.61-.09 1.87-.77 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.6-.37z"/></svg>')
LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'


def ico(n):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">{_I[n]}</svg>'


def img(src, alt="", cls="", lazy=True, big=False):
    """src relativo à raiz (assets/...). Usa a versão -900 em srcset quando existe."""
    base, ext = os.path.splitext(src)
    small = f"{base}-900{ext}"
    srcset = ""
    if os.path.exists(os.path.join(ROOT, small)):
        srcset = f' srcset="../{small} 900w, ../{src} 1600w" sizes="{"100vw" if big else "(max-width:860px) 100vw, 50vw"}"'
    load = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    c = f' class="{cls}"' if cls else ""
    return f'<img{c} src="../{src}"{srcset} alt="{html.escape(alt, quote=True)}"{load} />'


# --------------------------------------------------------------------------- blocos
def topbar(p):
    return f'''<header class="top">
  <a class="top__logo" href="../" data-track="logo"><img src="../assets/logo/logo-horizontal-cream.svg" alt="Bracerum Park" width="150" height="26" /></a>
  <div class="lang" role="group"{p.attr("ta", T("Idioma", "Language", "Idioma"))}>
    <button type="button" data-lang="pt" aria-pressed="true">PT</button><button type="button" data-lang="en" aria-pressed="false">EN</button><button type="button" data-lang="es" aria-pressed="false">ES</button>
  </div>
  <a class="btn btn--sand" href="#form" data-track="top_cta">{p.tx("span", p.cta)}</a>
</header>'''


def hero(p, foto, eyebrow, titulo, sub, fatos, ctas, form_html):
    fl = "".join(p.tx("li", f) for f in fatos)
    bs = []
    for kind, tri, href, extra in ctas:
        if kind == "wa":
            bs.append(f'<a class="btn btn--line js-wa" href="https://wa.me/{WA_BR}" target="_blank" rel="noopener">{WA_SVG}{p.tx("span", tri)}</a>')
        else:
            bs.append(f'<a class="btn btn--sand" href="{href}"{extra}>{p.tx("span", tri)}<span class="arrow" aria-hidden="true">→</span></a>')
    return f'''<section class="hero" id="topo">
  <div class="hero__bg" aria-hidden="true">{img(foto, lazy=False, big=True)}</div>
  <div class="hero__copy">
    {p.tx("span", eyebrow, "eyebrow")}
    <h1 class="hero__title display">{p.tx("span", titulo)}{p.tx("small", sub)}</h1>
    <ul class="facts">{fl}</ul>
    <div class="btns">{"".join(bs)}</div>
  </div>
  {form_html}
</section>'''


DDI = [("55", "🇧🇷 +55"), ("595", "🇵🇾 +595"), ("54", "🇦🇷 +54"), ("598", "🇺🇾 +598"), ("56", "🇨🇱 +56"),
       ("591", "🇧🇴 +591"), ("1", "🇺🇸 +1"), ("351", "🇵🇹 +351"), ("34", "🇪🇸 +34"), ("49", "🇩🇪 +49"), ("86", "🇨🇳 +86")]


def formulario(p, titulo, sub, opcoes, perfis=None, empresa=False, enviar=T("Receber agora", "Get it now", "Recibir ahora")):
    """opcoes: [(valor, tri_titulo, tri_detalhe|None, produto|None)]"""
    def grupo(nome, legenda, itens, row=False):
        ops = []
        for valor, tri, det, prod in itens:
            dp = f' data-produto="{prod}"' if prod else ""
            small = p.tx("small", det) if det else ""
            ops.append(f'<label class="opt"><input type="radio" name="{nome}" value="{valor}"{dp} /><span>{p.tx("b", tri)}{small}</span></label>')
        return f'<fieldset class="fgroup">{p.tx("legend", legenda)}<div class="opts{" opts--row" if row else ""}">{"".join(ops)}</div></fieldset>'

    g1 = grupo("interesse", T("O que você procura?", "What are you looking for?", "¿Qué busca?"), opcoes)
    g2 = grupo("perfil", T("Para quê?", "What for?", "¿Para qué?"), perfis, row=True) if perfis else ""
    emp = (f'<label class="field">{p.tx("span", T("Empresa (opcional)", "Company (optional)", "Empresa (opcional)"))}'
           f'<input name="empresa" autocomplete="organization" maxlength="100" /></label>') if empresa else ""
    ddi = "".join(f'<option value="{v}">{t}</option>' for v, t in DDI)
    return f'''<div class="form rv" id="form" data-step="1">
  <div class="form__head">{p.tx("p", titulo, "form__title")}<span class="form__step">Etapa 1 de 2</span></div>
  {p.tx("p", sub, "form__sub")}
  <div class="form__bar"><i></i></div>
  <form novalidate>
    <div class="pane" data-pane="1">
      {g1}{g2}
      <p class="form__err" role="alert"></p>
      <button type="button" class="btn btn--ink" data-next>{p.tx("span", T("Continuar", "Continue", "Continuar"))}<span class="arrow" aria-hidden="true">→</span></button>
    </div>
    <div class="pane" data-pane="2" hidden>
      <label class="field">{p.tx("span", T("Nome", "Name", "Nombre"))}<input name="nome" autocomplete="name" required maxlength="100" /></label>
      <label class="field">{p.tx("span", T("WhatsApp", "WhatsApp", "WhatsApp"))}
        <span class="tel"><select name="ddi"{p.attr("ta", T("Código do país", "Country code", "Código de país"))}>{ddi}</select><input name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" required maxlength="20" /></span></label>
      <label class="field">{p.tx("span", T("E-mail", "E-mail", "E-mail"))}<input name="email" type="email" inputmode="email" autocomplete="email" required maxlength="100" /></label>
      {emp}
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
      <label class="check"><input type="checkbox" name="consentimento" required />{p.tx("span", T(
          "Autorizo o Bracerum Park a falar comigo por WhatsApp, telefone e e-mail sobre este empreendimento.",
          "I authorise Bracerum Park to contact me by WhatsApp, phone and e-mail about this development.",
          "Autorizo a Bracerum Park a contactarme por WhatsApp, teléfono y e-mail sobre este emprendimiento."))}</label>
      <p class="form__err" role="alert"></p>
      <button type="submit" class="btn btn--ink" data-track="lead_submit">{p.tx("span", enviar)}<span class="arrow" aria-hidden="true">→</span></button>
      <a href="#form" class="form__back" data-back>{p.tx("span", T("← voltar", "← back", "← volver"))}</a>
    </div>
  </form>
  <div class="done" hidden aria-live="polite"></div>
  <p class="form__trust">{LOCK_SVG}{p.tx("span", T(
      "Seus dados vão só para a equipe comercial do Bracerum Park.",
      "Your details go only to the Bracerum Park sales team.",
      "Sus datos van solo al equipo comercial de Bracerum Park."))}</p>
</div>'''


def head_sec(p, eyebrow, titulo, lead=None):
    lp = p.tx("p", lead, "lead") if lead else ""
    return f'''<div class="sec__head rv"><div>{p.tx("span", eyebrow, "eyebrow")}{p.tx("h2", titulo, "h2")}</div>{lp}</div>'''


def stats(p, itens, cls=""):
    cells = "".join(f'<div class="stat">{p.tx("b", n)}{p.tx("span", t)}</div>' for n, t in itens)
    return f'<div class="stats rv {cls}" style="--n:{len(itens)}">{cells}</div>'


def feats(p, itens):
    cells = "".join(f'<div class="feat">{ico(i)}<div>{p.tx("b", t)}{p.tx("span", d) if d else ""}</div></div>' for i, t, d in itens)
    return f'<div class="feats rv">{cells}</div>'


def split(p, foto, alt, eyebrow, titulo, paras, extra="", rev=False, cap=None):
    ps = "".join(p.tx("p", x) for x in paras)
    fc = p.tx("figcaption", cap) if cap else ""
    return f'''<div class="split{" split--rev" if rev else ""}">
  <figure class="split__media rv">{img(foto, alt)}{fc}</figure>
  <div class="rv">{p.tx("span", eyebrow, "eyebrow")}{p.tx("h2", titulo, "h2")}<div class="prose">{ps}</div>{extra}</div>
</div>'''


def reel(p, itens):
    figs = "".join(f'<figure>{img(f)}{p.tx("figcaption", c)}</figure>' for f, c in itens)
    return f'<div class="reel rv">{figs}</div>'


def steps(p, itens):
    cells = "".join(f'<div class="step">{p.tx("b", t)}{p.tx("p", d)}</div>' for t, d in itens)
    return f'<div class="steps rv" style="--n:{len(itens)}">{cells}</div>'


def faq(p, itens):
    cells = "".join(f'<details>{p.tx("summary", q)}{p.tx("p", a)}</details>' for q, a in itens)
    return f'<div class="faq rv">{cells}</div>'


def pay(p, itens):
    cells = "".join(f'<div>{p.tx("b", t)}{p.tx("span", d)}</div>' for t, d in itens)
    return f'<div class="pay rv">{cells}</div>'


def produtos(p, itens):
    """itens: [(foto, tag, titulo, texto, href, cta)]"""
    out = []
    for foto, tag, tit, txt, href, cta in itens:
        out.append(f'''<a class="card" href="{href}" data-track="product_card">
  <div class="card__img">{img(foto)}</div>
  <div class="card__body">{p.tx("span", tag, "card__tag")}{p.tx("p", tit, "h3")}{p.tx("p", txt)}
  <span class="linkarrow">{p.tx("span", cta)}<span class="arrow" aria-hidden="true">→</span></span></div></a>''')
    return f'<div class="cards rv" style="--cols:{3 if len(itens) % 3 == 0 else 2 if len(itens) == 4 else 3}">{"".join(out)}</div>'


def final(p, titulo, texto, cta=None, so_br=False):
    """cta = texto do botão que leva ao #form; so_br = só o Sydney (Brasil) nos contatos."""
    cta = cta or T("Receber a tabela", "Get the price list", "Recibir la tabla")
    py = "" if so_br else f'''
  <a class="person js-wa" data-phone="{WA_PY}" href="https://wa.me/{WA_PY}" target="_blank" rel="noopener">{WA_SVG}<div><b>Cleber Pavão</b>{p.tx("span", T("Paraguai · +595 985 516 065", "Paraguay · +595 985 516 065", "Paraguay · +595 985 516 065"))}</div></a>'''
    pessoas = f'''<div class="people">{py}
  <a class="person js-wa" data-phone="{WA_BR}" href="https://wa.me/{WA_BR}" target="_blank" rel="noopener">{WA_SVG}<div><b>Sydney Savi</b>{p.tx("span", T("Brasil · +55 47 98803-0200", "Brazil · +55 47 98803-0200", "Brasil · +55 47 98803-0200"))}</div></a>
</div>'''
    return f'''<section class="sec ink" id="contato">
  <div class="final">
    <div class="rv">{p.tx("span", T("Fale com a equipe", "Talk to the team", "Hable con el equipo"), "eyebrow")}{p.tx("h2", titulo, "h2")}{p.tx("p", texto, "lead")}
      <div class="btns"><a class="btn btn--sand" href="#form" data-track="final_cta">{p.tx("span", cta)}<span class="arrow" aria-hidden="true">→</span></a></div></div>
    <div class="rv">{pessoas}</div>
  </div>
</section>'''


def rodape(p, nota=None):
    base = T("Imagens ilustrativas. Áreas, valores e condições sujeitos a alteração sem aviso prévio e à disponibilidade no momento da reserva; este material não é oferta vinculante — valem as condições do contrato. Os dados enviados pelo formulário são usados só para o atendimento comercial do Bracerum Park.",
             "Illustrative images. Areas, prices and terms subject to change without notice and to availability at the time of reservation; this material is not a binding offer — the contract terms prevail. Details sent through the form are used only for Bracerum Park sales contact.",
             "Imágenes ilustrativas. Áreas, valores y condiciones sujetos a cambios sin aviso y a la disponibilidad al momento de la reserva; este material no es oferta vinculante — rigen las condiciones del contrato. Los datos enviados por el formulario se usan solo para la atención comercial de Bracerum Park.")
    n = p.tx("p", nota) if nota else ""
    return f'''<footer class="foot">
  <div class="foot__row"><a href="../"><img src="../assets/logo/logo-horizontal-cream.svg" alt="Bracerum Park" width="150" height="22" loading="lazy" /></a>
  <span><a href="../">bracerumpark.com</a> · <a href="https://www.instagram.com/bracerumpark/" target="_blank" rel="noopener">@bracerumpark</a> · <a href="../3dmasterplan/">Masterplan 3D</a></span></div>
  {n}{p.tx("p", base)}
  <p>© 2026 Bracerum Park · Villeta, Paraguay</p>
</footer>
<div class="sticky"><a href="#form" data-track="sticky_cta">{p.tx("span", p.cta)}</a><a class="js-wa" href="https://wa.me/{WA_BR}" target="_blank" rel="noopener"{p.attr("ta", T("WhatsApp", "WhatsApp", "WhatsApp"))}>{WA_SVG}</a></div>
<a class="wa js-wa" href="https://wa.me/{WA_BR}" target="_blank" rel="noopener"{p.attr("ta", T("Falar no WhatsApp", "Chat on WhatsApp", "Hablar por WhatsApp"))}>{WA_SVG}</a>'''


def lotes_map():
    d = json.load(open(os.path.join(ROOT, "3dmasterplan/data/lotes.json"), encoding="utf-8"))
    return {l["id"]: l["cat"] for l in d["lotes"]}


def montar(p, titulo_doc, desc, og, corpo, wa_msg, maquete=True, lotes=False, cfg_extra=None):
    p.key(*wa_msg, k="wa.msg")
    p.key(titulo_doc[0], titulo_doc[1], titulo_doc[2], k="_title")
    cfg = {"lp": p.lp, "produto": p.produto, "nome": p.nome, "maquete": "../3dmasterplan/" if maquete else ""}
    cfg.update(cfg_extra or {})
    lm = f'<script type="application/json" id="lp-lotes">{json.dumps(lotes_map(), separators=(",", ":"))}</script>' if lotes else ""
    url = f"{SITE}/{p.slug}"
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>{html.escape(titulo_doc[0])}</title>
<meta name="description" content="{html.escape(desc, quote=True)}" />
<meta name="theme-color" content="#0e0d0b" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="{url}" />
<meta property="og:title" content="{html.escape(titulo_doc[0], quote=True)}" />
<meta property="og:description" content="{html.escape(desc, quote=True)}" />
<meta property="og:image" content="{SITE}/assets/lp/og-{p.slug}.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wdth,wght@0,62.5..100,300..700;1,62.5..100,300..700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../lp/lp.css?v={VERSAO}" />
<!-- Gerado por docs/build_lps.py — não editar à mão. -->
<script src="../tracking.js?v=1" defer></script>
<script src="../lp/lp.js?v={VERSAO}" defer></script>
</head>
<body>
{topbar(p)}
<main>
{corpo}
</main>
{rodape(p)}
<span hidden data-t="wa.msg">{html.escape(wa_msg[0])}</span>
<script type="application/json" id="lp-config">{json.dumps(cfg, ensure_ascii=False)}</script>
<script type="application/json" id="lp-i18n">{json.dumps(p.i18n, ensure_ascii=False).replace("</", "<\\/")}</script>
{lm}
</body>
</html>
'''


# ===================================================================== conteúdo comum
def sec_paraguai(p):
    return f'''<section class="sec brown" id="paraguai">
  {head_sec(p, T("Por que o Paraguai", "Why Paraguay", "Por qué Paraguay"),
            T("A tributação mais competitiva <em>da América do Sul.</em>", "The most competitive taxation <em>in South America.</em>", "La tributación más competitiva <em>de América del Sur.</em>"),
            T("Regime de Maquila, Ley de Inversiones e Certificado de Origem Mercosul numa única operação — com a equipe jurídica e contábil do Bracerum Park do enquadramento ao primeiro embarque.",
              "Maquila regime, Investment Law and Mercosur Certificate of Origin in a single operation — with Bracerum Park’s legal and accounting team from set-up to first shipment.",
              "Régimen de Maquila, Ley de Inversiones y Certificado de Origen Mercosur en una sola operación — con el equipo jurídico y contable de Bracerum Park desde el encuadre hasta el primer embarque."))}
  {stats(p, [(T("1%"), T("tributo único sobre o valor agregado, no regime de Maquila", "single tax on value added, under the Maquila regime", "tributo único sobre el valor agregado, en el régimen de Maquila")),
             (T("100%"), T("de capital estrangeiro permitido, sem exigência de sócio local", "foreign ownership allowed, no local partner required", "de capital extranjero permitido, sin exigencia de socio local")),
             (T("20 anos", "20 years", "20 años"), T("de benefícios garantidos pela Ley de Inversiones, renováveis", "of benefits guaranteed by the Investment Law, renewable", "de beneficios garantizados por la Ley de Inversiones, renovables")),
             (T("10 anos", "10 years", "10 años"), T("de isenção sobre remessas de lucros e dividendos ao exterior", "of exemption on profit and dividend remittances abroad", "de exención sobre remesas de utilidades y dividendos al exterior"))])}
  <div class="btns rv"><a class="btn btn--line" href="../tributacao.html" data-track="tax_link">{p.tx("span", T("Entender a tributação", "Understand the taxation", "Entender la tributación"))}<span class="arrow" aria-hidden="true">→</span></a></div>
</section>'''


def sec_logistica(p, cls="paper2"):
    return f'''<section class="sec {cls}" id="logistica">
  {head_sec(p, T("Logística", "Logistics", "Logística"),
            T("Rio, rodovia e pista <em>na porta.</em>", "River, road and runway <em>at the gate.</em>", "Río, ruta y pista <em>en la puerta.</em>"),
            T("Sobre a PY-19, a mesma rodovia que serve o Terport e o Puerto Seguro, com acesso à Hidrovia Paraná–Paraguai e ao corredor rodoviário do Mercosul — sem atravessar o trânsito de Assunção.",
              "On the PY-19, the same highway that serves Terport and Puerto Seguro, with access to the Paraná–Paraguay Waterway and the Mercosur road corridor — without crossing Asunción’s traffic.",
              "Sobre la PY-19, la misma ruta que sirve a Terport y Puerto Seguro, con acceso a la Hidrovía Paraná–Paraguay y al corredor vial del Mercosur — sin atravesar el tránsito de Asunción."))}
  {stats(p, [(T("23 km"), T("do Terport Villeta, o principal terminal de contêineres do país · 20 min", "from Terport Villeta, the country’s main container terminal · 20 min", "de Terport Villeta, la principal terminal de contenedores del país · 20 min")),
             (T("65 km"), T("de Assunção · o aeroporto internacional fica a 70 km", "from Asunción · the international airport is 70 km away", "de Asunción · el aeropuerto internacional está a 70 km")),
             (T("1.460 m", "1,460 m", "1.460 m"), T("de pista de pouso dentro do próprio parque", "runway inside the park itself", "de pista de aterrizaje dentro del propio parque")),
             (T("2 oceanos", "2 oceans", "2 océanos"), T("Atlântico e Pacífico pela hidrovia e pela futura Rota Bioceânica", "Atlantic and Pacific via the waterway and the future Bioceanic Route", "Atlántico y Pacífico por la hidrovía y la futura Ruta Bioceánica"))])}
</section>'''


FAQ_VISITA = (T("Posso visitar o parque?", "Can I visit the park?", "¿Puedo visitar el parque?"),
              T("Sim. Agende pelo WhatsApp. Se estiver longe, a equipe apresenta tudo online, pela maquete 3D do masterplan — lote por lote.",
                "Yes. Book through WhatsApp. If you are far away, the team presents everything online using the 3D masterplan model — lot by lot.",
                "Sí. Agende por WhatsApp. Si está lejos, el equipo presenta todo en línea con la maqueta 3D del masterplan — lote por lote."))
FAQ_ONDE = (T("Onde fica o Bracerum Park?", "Where is Bracerum Park?", "¿Dónde queda Bracerum Park?"),
            T("Em Villeta, Paraguai, às margens da rodovia PY-19 (Acceso Sur), a cerca de 65 km de Assunção e a 23 km do Terport Villeta.",
              "In Villeta, Paraguay, on the PY-19 highway (Acceso Sur), about 65 km from Asunción and 23 km from Terport Villeta.",
              "En Villeta, Paraguay, sobre la ruta PY-19 (Acceso Sur), a unos 65 km de Asunción y a 23 km de Terport Villeta."))

PASSOS = [
    (T("Receba a tabela", "Get the price list", "Reciba la tabla"),
     T("Preencha o formulário: a tabela vigente e o mapa de disponibilidade chegam pelo WhatsApp.", "Fill in the form: the current price list and availability map arrive on WhatsApp.", "Complete el formulario: la tabla vigente y el mapa de disponibilidad llegan por WhatsApp.")),
    (T("Escolha com um consultor", "Choose with a consultant", "Elija con un consultor"),
     T("Online, pela maquete 3D, ou numa visita ao parque — a equipe mostra unidade por unidade.", "Online with the 3D model, or on a site visit — the team walks you through unit by unit.", "En línea con la maqueta 3D, o en una visita al parque — el equipo muestra unidad por unidad.")),
    (T("Reserve a unidade", "Reserve the unit", "Reserve la unidad"),
     T("A reserva entra no mapa de vendas na hora e a unidade sai da lista de disponíveis.", "The reservation goes into the sales map at once and the unit leaves the available list.", "La reserva entra al mapa de ventas al instante y la unidad sale de la lista de disponibles.")),
]


def sec_passos(p, cls=""):
    return f'''<section class="sec {cls}" id="como-comprar">
  {head_sec(p, T("Como comprar", "How to buy", "Cómo comprar"), T("Três passos, <em>sem rodeio.</em>", "Three steps, <em>no fuss.</em>", "Tres pasos, <em>sin vueltas.</em>"))}
  {steps(p, PASSOS)}
</section>'''


def sec_faq(p, itens, cls="paper2"):
    return f'''<section class="sec {cls}" id="perguntas">
  {head_sec(p, T("Perguntas frequentes", "FAQ", "Preguntas frecuentes"), T("O que todo mundo <em>pergunta primeiro.</em>", "What everyone <em>asks first.</em>", "Lo que todos <em>preguntan primero.</em>"))}
  {faq(p, itens)}
</section>'''


# ===================================================================== 1. Parque Industrial
def pg_park():
    p = Pagina("folderpark", "folderpark", "park", "Parque Industrial")
    form = formulario(
        p, T("Receba a tabela e o <em>mapa de lotes</em>", "Get the prices and the <em>lot map</em>", "Reciba la tabla y el <em>mapa de lotes</em>"),
        T("Preços da janela vigente, lotes livres hoje e condições de pagamento — no seu WhatsApp.",
          "Current-window prices, lots free today and payment terms — on your WhatsApp.",
          "Precios de la ventana vigente, lotes libres hoy y condiciones de pago — en su WhatsApp."),
        [("1-lote", T("1 lote · 1.250 m²", "1 lot · 1,250 m²", "1 lote · 1.250 m²"), T("o módulo de 25 × 50 m", "the 25 × 50 m module", "el módulo de 25 × 50 m"), None),
         ("2-8-lotes", T("2 a 8 lotes", "2 to 8 lots", "2 a 8 lotes"), T("2.500 a 10.000 m²", "2,500 to 10,000 m²", "2.500 a 10.000 m²"), None),
         ("9-mais", T("9 lotes ou mais", "9 lots or more", "9 lotes o más"), T("quadra inteira · m² mais baixo", "whole block · lowest price per m²", "manzana entera · m² más bajo"), None),
         ("avaliando", T("Ainda estou avaliando", "Still evaluating", "Todavía estoy evaluando"), T("quero entender o parque primeiro", "I want to understand the park first", "quiero entender el parque primero"), None)],
        empresa=True, enviar=T("Receber tabela e mapa", "Get prices and map", "Recibir tabla y mapa"))

    corpo = hero(
        p, "assets/lp/park-galpao-avenida.jpg",
        T("Bracerum Park · Villeta, Paraguai", "Bracerum Park · Villeta, Paraguay", "Bracerum Park · Villeta, Paraguay"),
        T("Parque <em>Industrial</em>", "Industrial <em>Park</em>", "Parque <em>Industrial</em>"),
        T("Lotes industriais à venda no centro do Mercosul, às margens da PY-19 — com recinto alfandegado, pista de pouso e tributo único de 1% no regime de Maquila.",
          "Industrial lots for sale at the heart of Mercosur, on the PY-19 — with a bonded customs area, a runway and a single 1% tax under the Maquila regime.",
          "Lotes industriales en venta en el centro del Mercosur, sobre la PY-19 — con recinto aduanero, pista de aterrizaje y tributo único del 1% en el régimen de Maquila."),
        [T("Lotes a partir de 1.250 m²", "Lots from 1,250 m²", "Lotes desde 1.250 m²"),
         T("Venda do terreno, não locação", "Land sale, not lease", "Venta del terreno, no alquiler"),
         T("Quanto mais lotes, menor o m²", "The more lots, the lower the m²", "Cuantos más lotes, menor el m²")],
        [("go", T("Ver preços e disponibilidade", "See prices and availability", "Ver precios y disponibilidad"), "#precos", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp", "WhatsApp", "WhatsApp"), "", "")],
        form)
    corpo += '\n<div class="ribbon" data-ribbon hidden></div>'
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("614"), T("lotes industriais à venda, de 1.250 m² a quadras inteiras", "industrial lots for sale, from 1,250 m² to whole blocks", "lotes industriales en venta, de 1.250 m² a manzanas enteras")),
             (T("766.690 m²", "766,690 m²", "766.690 m²"), T("de área de lotes no Masterplan V14", "of lot area in Masterplan V14", "de área de lotes en el Masterplan V14")),
             (T("1.460 m", "1,460 m", "1.460 m"), T("de pista de pouso dentro do parque", "runway inside the park", "de pista de aterrizaje dentro del parque")),
             (T("1%"), T("tributo único sobre o valor agregado, no regime de Maquila", "single tax on value added, under Maquila", "tributo único sobre el valor agregado, en Maquila"))])}
</section>
<section class="sec paper2" id="parque">
  {split(p, "assets/lp/park-hangar-jato.jpg", "Hangar do Bracerum Park com jato executivo",
         T("O endereço", "The address", "La dirección"),
         T("Tudo o que uma indústria precisa, <em>num endereço só.</em>", "Everything an industry needs, <em>at one address.</em>", "Todo lo que una industria necesita, <em>en una sola dirección.</em>"),
         [T("Em Villeta, no Paraguai, às margens da PY-19 e no centro do Mercosul, o Bracerum Park reúne tudo o que uma indústria precisa para crescer: lotes e galpões, aeroporto, recinto alfandegado, centro de negócios, condomínio, escola e clube.",
            "In Villeta, Paraguay, on the PY-19 and at the heart of Mercosur, Bracerum Park brings together everything an industry needs to grow: lots and warehouses, an airfield, a bonded customs area, a business centre, housing, a school and a club.",
            "En Villeta, Paraguay, sobre la PY-19 y en el centro del Mercosur, Bracerum Park reúne todo lo que una industria necesita para crecer: lotes y galpones, aeródromo, recinto aduanero, centro de negocios, condominio, escuela y club."),
          T("Cada detalhe foi planejado para que a operação comece mais cedo, custe menos e chegue mais longe. As vias são dimensionadas para bitrem, com drenagem e iluminação — a infraestrutura essencial é entregue pronta pelo parque.",
            "Every detail was planned so your operation starts sooner, costs less and reaches further. Roads are sized for B-double trucks, with drainage and lighting — the essential infrastructure is delivered ready by the park.",
            "Cada detalle fue planificado para que la operación empiece antes, cueste menos y llegue más lejos. Las vías están dimensionadas para bitrén, con drenaje e iluminación — la infraestructura esencial la entrega lista el parque.")],
         cap=T("Hangar e pátio de aeronaves · imagem ilustrativa", "Hangar and apron · illustrative image", "Hangar y plataforma · imagen ilustrativa"))}
  {feats(p, [("galpao", T("Galpões triple A", "Triple-A warehouses", "Galpones triple A"), None),
             ("alfandega", T("Recinto alfandegado", "Bonded customs area", "Recinto aduanero"), None),
             ("vias", T("Vias largas para grandes transportes", "Wide roads for heavy transport", "Vías anchas para grandes transportes"), None),
             ("caminhao", T("Balança nos gates", "Weighbridge at the gates", "Balanza en los accesos"), None),
             ("gate", T("Gate de acesso controlado", "Controlled access gate", "Acceso controlado"), None),
             ("aviao", T("Pista de pouso exclusiva com 1.460 m", "Private 1,460 m runway", "Pista de aterrizaje exclusiva de 1.460 m"), None),
             ("escudo", T("Bombeiros e posto policial", "Fire station and police post", "Bomberos y puesto policial"), None),
             ("escola", T("Escola, creche e ambulatório", "School, nursery and clinic", "Escuela, guardería y ambulatorio"), None),
             ("pct", T("Regime de Maquila · 1%", "Maquila regime · 1%", "Régimen de Maquila · 1%"), None),
             ("cal", T("20 anos de benefícios fiscais", "20 years of tax benefits", "20 años de beneficios fiscales"), None)])}
</section>
<section class="sec" id="precos">
  {head_sec(p, T("Preços", "Prices", "Precios"),
            T("O preço é por lote. <em>Quanto mais lotes, menor o m².</em>", "Priced per lot. <em>The more lots, the lower the m².</em>", "El precio es por lote. <em>Cuantos más lotes, menor el m².</em>"),
            T("A unidade de venda é o lote de 1.250 m² (25 × 50 m): compre um ou junte vários, até quadras inteiras. O valor depende da categoria do lote — Vitrine, Business, Padrão ou Interna — e da janela de preço em que a reserva é assinada.",
              "The sales unit is the 1,250 m² lot (25 × 50 m): buy one or combine several, up to whole blocks. The price depends on the lot category — Showcase, Business, Standard or Inner — and on the price window in which the reservation is signed.",
              "La unidad de venta es el lote de 1.250 m² (25 × 50 m): compre uno o junte varios, hasta manzanas enteras. El valor depende de la categoría del lote — Vitrina, Business, Estándar o Interna — y de la ventana de precio en que se firma la reserva."))}
  <div class="rv" data-lot-prices><p class="small">{p.tx("span", T("Carregando a tabela…", "Loading prices…", "Cargando la tabla…"))}</p></div>
  {pay(p, [(T("À vista · −8%", "Cash · −8%", "Al contado · −8%"), T("pagamento integral na assinatura", "paid in full on signing", "pago total a la firma")),
           (T("20% + 12x", "20% + 12x", "20% + 12x"), T("sinal de 20% e 12 parcelas mensais, preço de tabela", "20% down and 12 monthly instalments, list price", "seña del 20% y 12 cuotas mensuales, precio de lista")),
           (T("20% + 36x · +8%", "20% + 36x · +8%", "20% + 36x · +8%"), T("sinal de 20% e 36 parcelas mensais", "20% down and 36 monthly instalments", "seña del 20% y 36 cuotas mensuales"))])}
</section>
<section class="sec ink" id="disponibilidade">
  {head_sec(p, T("Disponibilidade", "Availability", "Disponibilidad"),
            T("Lotes livres <em>agora.</em>", "Lots free <em>right now.</em>", "Lotes libres <em>ahora.</em>"),
            T("O número vem do mesmo mapa de vendas da equipe comercial: quando um lote é reservado, ele sai daqui na hora. Escolha o seu no masterplan 3D, lote por lote, com área, categoria e valor.",
              "The figure comes from the sales team’s own map: when a lot is reserved, it leaves this count at once. Pick yours in the 3D masterplan, lot by lot, with area, category and price.",
              "El número sale del mismo mapa de ventas del equipo comercial: cuando un lote se reserva, sale de aquí al instante. Elija el suyo en el masterplan 3D, lote por lote, con área, categoría y valor."))}
  <div class="rv" data-live><div class="live"></div><p class="note" data-live-meta></p></div>
  <div class="btns rv"><a class="btn btn--sand" href="../3dmasterplan/" data-track="open_3d">{p.tx("span", T("Escolher o lote no masterplan 3D", "Pick your lot in the 3D masterplan", "Elegir el lote en el masterplan 3D"))}<span class="arrow" aria-hidden="true">→</span></a>
  <a class="btn btn--line" href="#form" data-pick="avaliando">{p.tx("span", T("Reservar com um consultor", "Reserve with a consultant", "Reservar con un consultor"))}</a></div>
</section>
{sec_paraguai(p)}
{sec_logistica(p)}
<section class="sec ink" id="cidade">
  {head_sec(p, T("Tudo o que você precisa", "Everything you need", "Todo lo que necesita"),
            T("Uma cidade inteira <em>em volta da fábrica.</em>", "A whole city <em>around your plant.</em>", "Una ciudad entera <em>alrededor de la fábrica.</em>"),
            T("Para quem dirige uma indústria, tranquilidade é saber que o essencial está resolvido antes de virar problema. O patrimônio fica protegido 24 horas, com acesso controlado, posto policial e bombeiros no próprio perímetro; a creche e a escola ficam perto, e quem sabe que os filhos estão perto trabalha com mais foco e falta menos.",
              "For anyone running a plant, peace of mind means knowing the essentials are solved before they become problems. Assets are protected 24 hours, with controlled access, a police post and a fire station inside the perimeter; the nursery and school are close by, and people who know their children are near work with more focus and miss fewer days.",
              "Para quien dirige una industria, tranquilidad es saber que lo esencial está resuelto antes de volverse problema. El patrimonio está protegido 24 horas, con acceso controlado, puesto policial y bomberos dentro del perímetro; la guardería y la escuela están cerca, y quien sabe que sus hijos están cerca trabaja con más foco y falta menos."))}
  {produtos(p, [
      ("assets/lp/outlet-boulevard.jpg", T("Business Center"), T("Outlet, Market e <em>Centro Tecnológico</em>", "Outlet, Market and <em>Technology Centre</em>", "Outlet, Market y <em>Centro Tecnológico</em>"),
       T("Clientes e fornecedores recebidos sem ninguém ir até a capital; a rotina da equipe resolvida no mesmo endereço.", "Clients and suppliers received without anyone driving to the capital; your team’s routine solved at the same address.", "Clientes y proveedores recibidos sin que nadie vaya a la capital; la rutina del equipo resuelta en la misma dirección."),
       "../folderbusinesscenter/", T("Conhecer", "Discover", "Conocer")),
      ("assets/lp/residence-torre.jpg", T("Bracerum Residence"), T("Moradia para <em>a sua equipe</em>", "Homes for <em>your team</em>", "Vivienda para <em>su equipo</em>"),
       T("Apartamentos de 1, 2 e 3 quartos a poucos passos da operação, com praia artificial entre as torres.", "1, 2 and 3-bedroom flats a few steps from the plant, with an artificial beach between the towers.", "Departamentos de 1, 2 y 3 dormitorios a pocos pasos de la operación, con playa artificial entre las torres."),
       "../folderresidence/", T("Conhecer", "Discover", "Conocer")),
      ("assets/web/fotos/hotel-cupula-dia.jpg", T("Hotel & Convenções", "Hotel & Conventions", "Hotel & Convenciones"), T("384 studios e <em>1.200 lugares</em>", "384 studios and <em>1,200 seats</em>", "384 studios y <em>1.200 lugares</em>"),
       T("Para o técnico em missão, o executivo em visita e o comprador que quer conhecer a operação.", "For the technician on assignment, the visiting executive and the buyer who wants to see the operation.", "Para el técnico en misión, el ejecutivo de visita y el comprador que quiere conocer la operación."),
       "../hotel.html", T("Conhecer", "Discover", "Conocer"))])}
</section>
{sec_passos(p)}
{sec_faq(p, [
    (T("Posso comprar só um lote?", "Can I buy a single lot?", "¿Puedo comprar un solo lote?"),
     T("Sim. O lote de 1.250 m² é a unidade de venda: dá para comprar um ou juntar vários, até quadras inteiras. A partir de 9 lotes o preço por m² cai, e cai de novo a partir de 17 e de 33.",
       "Yes. The 1,250 m² lot is the sales unit: buy one or combine several, up to whole blocks. From 9 lots the price per m² drops, and again from 17 and 33.",
       "Sí. El lote de 1.250 m² es la unidad de venta: puede comprar uno o juntar varios, hasta manzanas enteras. A partir de 9 lotes el precio por m² baja, y vuelve a bajar a partir de 17 y de 33.")),
    (T("É venda ou locação?", "Is it a sale or a lease?", "¿Es venta o alquiler?"),
     T("Venda. O lote é seu; a construção do galpão pode ser feita sob medida (built-to-suit) com o apoio do parque.",
       "A sale. The lot is yours; the warehouse can be built to suit with the park’s support.",
       "Venta. El lote es suyo; el galpón puede construirse a medida (built-to-suit) con el apoyo del parque.")),
    (T("Uma empresa estrangeira pode se instalar?", "Can a foreign company set up here?", "¿Una empresa extranjera puede instalarse?"),
     T("Sim. A sociedade paraguaia pode ter 100% de capital estrangeiro, sem exigência de sócio local, e as equipes jurídica e contábil do Bracerum Park acompanham a constituição e o programa de Maquila.",
       "Yes. The Paraguayan company can be 100% foreign-owned with no local partner, and Bracerum Park’s legal and accounting teams handle incorporation and the Maquila programme with you.",
       "Sí. La sociedad paraguaya puede tener 100% de capital extranjero, sin socio local, y los equipos jurídico y contable de Bracerum Park acompañan la constitución y el programa de Maquila.")),
    (T("Como funciona o regime de Maquila?", "How does the Maquila regime work?", "¿Cómo funciona el régimen de Maquila?"),
     T("A indústria paga um tributo único de 1% sobre o valor agregado no Paraguai; insumos e máquinas entram com tributos suspensos e a produção sai com Certificado de Origem Mercosul.",
       "The plant pays a single 1% tax on value added in Paraguay; inputs and machinery enter with suspended duties and output leaves with a Mercosur Certificate of Origin.",
       "La industria paga un tributo único del 1% sobre el valor agregado en Paraguay; insumos y máquinas entran con tributos suspendidos y la producción sale con Certificado de Origen Mercosur.")),
    (T("O que muda entre Vitrine, Business, Padrão e Interna?", "What is the difference between Showcase, Business, Standard and Inner?", "¿Qué cambia entre Vitrina, Business, Estándar e Interna?"),
     T("A posição do lote no parque. O Padrão é a referência; Vitrine (frente da entrada e da avenida principal) custa 15% a mais, Business 10% a mais, e Interna 10% a menos.",
       "The lot’s position in the park. Standard is the reference; Showcase (facing the entrance and the main avenue) costs 15% more, Business 10% more and Inner 10% less.",
       "La posición del lote en el parque. Estándar es la referencia; Vitrina (frente al acceso y a la avenida principal) cuesta 15% más, Business 10% más e Interna 10% menos.")),
    (T("Quais são as formas de pagamento?", "What are the payment options?", "¿Cuáles son las formas de pago?"),
     T("À vista com 8% de desconto; 20% de sinal e 12 parcelas mensais pelo preço de tabela; ou 20% e 36 parcelas, com 8% de acréscimo.",
       "Cash with an 8% discount; 20% down and 12 monthly instalments at list price; or 20% and 36 instalments with an 8% surcharge.",
       "Al contado con 8% de descuento; 20% de seña y 12 cuotas mensuales al precio de lista; o 20% y 36 cuotas, con 8% de recargo.")),
    FAQ_VISITA])}
{final(p, T("Vamos escolher <em>o seu lote?</em>", "Shall we pick <em>your lot?</em>", "¿Elegimos <em>su lote?</em>"),
       T("Fale direto com quem vende: Cleber, no Paraguai, e Sydney, no Brasil.", "Talk directly to the people who sell: Cleber in Paraguay and Sydney in Brazil.", "Hable directo con quien vende: Cleber, en Paraguay, y Sydney, en Brasil."))}'''
    return montar(p, T("Parque Industrial — lotes à venda · Bracerum Park", "Industrial Park — lots for sale · Bracerum Park", "Parque Industrial — lotes en venta · Bracerum Park"),
                  "Lotes industriais a partir de 1.250 m² em Villeta, Paraguai: preços, disponibilidade ao vivo e tributo único de 1% no regime de Maquila.",
                  "park", corpo,
                  T("Olá! Vim pelo folder do Parque Industrial do Bracerum Park e quero a tabela de lotes.",
                    "Hello! I came from the Bracerum Park Industrial Park brochure and would like the lot price list.",
                    "¡Hola! Llegué por el folleto del Parque Industrial de Bracerum Park y quiero la tabla de lotes."), lotes=True)


# ===================================================================== 2. Residence (apartamentos)
TIPOS_APTO = [
    ("1q", T("1 quarto", "1 bedroom", "1 dormitorio"), T("48,16 m² ou 49,20 m²", "48.16 m² or 49.20 m²", "48,16 m² o 49,20 m²"),
     T("1 vaga coberta", "1 covered space", "1 cochera cubierta"), T("1 banheiro · sacada", "1 bathroom · balcony", "1 baño · balcón"), T("US$ 55.400", "US$ 55,400", "US$ 55.400")),
    ("2q", T("2 quartos · suíte", "2 bedrooms · en-suite", "2 dormitorios · suite"), T("68,27 m²", "68.27 m²", "68,27 m²"),
     T("2 vagas (1 coberta)", "2 spaces (1 covered)", "2 cocheras (1 cubierta)"), T("2 banheiros · sacada com churrasqueira", "2 bathrooms · balcony with grill", "2 baños · balcón con parrilla"), T("US$ 78.500", "US$ 78,500", "US$ 78.500")),
    ("3q", T("3 quartos · suíte", "3 bedrooms · en-suite", "3 dormitorios · suite"), T("97,40 m²", "97.40 m²", "97,40 m²"),
     T("2 vagas (1 coberta)", "2 spaces (1 covered)", "2 cocheras (1 cubierta)"), T("2 banheiros · sacada com churrasqueira", "2 bathrooms · balcony with grill", "2 baños · balcón con parrilla"), T("US$ 112.000", "US$ 112,000", "US$ 112.000")),
    ("cob", T("Cobertura duplex", "Duplex penthouse", "Penthouse dúplex"), T("194,80 m² (97,40 + terraço)", "194.80 m² (97.40 + terrace)", "194,80 m² (97,40 + terraza)"),
     T("2 vagas (1 coberta)", "2 spaces (1 covered)", "2 cocheras (1 cubierta)"), T("3 quartos · área gourmet com churrasqueira, pergolado e solarium", "3 bedrooms · gourmet area with grill, pergola and solarium", "3 dormitorios · área gourmet con parrilla, pérgola y solárium"), T("US$ 163.600", "US$ 163,600", "US$ 163.600")),
]


def pg_residence():
    p = Pagina("folderresidence", "folderresidence", "residence", "Bracerum Residence")
    form = formulario(
        p, T("Receba a tabela e as <em>plantas</em>", "Get prices and <em>floor plans</em>", "Reciba la tabla y los <em>planos</em>"),
        T("Valores por tipologia, plantas e unidades disponíveis — no seu WhatsApp.", "Prices by type, floor plans and available units — on your WhatsApp.", "Valores por tipología, planos y unidades disponibles — en su WhatsApp."),
        [(k, nome, area, None) for k, nome, area, *_ in TIPOS_APTO],
        perfis=[("morar", T("Morar", "To live in", "Vivir"), None, None), ("investir", T("Investir", "To invest", "Invertir"), None, None),
                ("empresa", T("Minha equipe", "My team", "Mi equipo"), None, None)],
        enviar=T("Receber tabela e plantas", "Get prices and plans", "Recibir tabla y planos"))
    cards = []
    for k, nome, area, vaga, extra, preco in TIPOS_APTO:
        cards.append(f'''<article class="card"><div class="card__body">
  {p.tx("span", T("Apartamento", "Apartment", "Departamento"), "card__tag")}{p.tx("p", nome, "h3")}
  <ul class="specs"><li>{p.tx("span", T("Área privativa", "Private area", "Área privada"))}{p.tx("span", area)}</li><li>{p.tx("span", T("Garagem", "Parking", "Cochera"))}{p.tx("span", vaga)}</li></ul>
  {p.tx("p", extra)}
  <div class="price">{p.tx("small", T("a partir de", "from", "desde"))}{p.tx("b", preco)}</div>
  <a class="linkarrow" href="#form" data-pick="{k}">{p.tx("span", T("Quero esta planta", "I want this plan", "Quiero este plano"))}<span class="arrow" aria-hidden="true">→</span></a>
</div></article>''')
    corpo = hero(
        p, "assets/lp/residence-praia.jpg",
        T("Bracerum Park · Condomínio clube", "Bracerum Park · Club condominium", "Bracerum Park · Condominio club"),
        T("Bracerum <em>Residence</em>"),
        T("Apartamentos de 1, 2 e 3 quartos e coberturas, com praia artificial entre as torres — a poucos passos da operação.",
          "1, 2 and 3-bedroom apartments and penthouses, with an artificial beach between the towers — a few steps from work.",
          "Departamentos de 1, 2 y 3 dormitorios y penthouses, con playa artificial entre las torres — a pocos pasos de la operación."),
        [T("1, 2 e 3 quartos e coberturas", "1, 2 and 3 bedrooms and penthouses", "1, 2 y 3 dormitorios y penthouses"),
         T("Sacada com churrasqueira e ar split", "Balcony with grill and split A/C", "Balcón con parrilla y aire split"),
         T("A partir de US$ 55.400", "From US$ 55,400", "Desde US$ 55.400")],
        [("go", T("Ver plantas e valores", "See plans and prices", "Ver planos y valores"), "#tipologias", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp"), "", "")], form)
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("67"), T("torres no condomínio", "towers in the condominium", "torres en el condominio")),
             (T("1.452", "1,452", "1.452"), T("apartamentos de 1, 2 e 3 quartos e coberturas", "1, 2 and 3-bedroom flats and penthouses", "departamentos de 1, 2 y 3 dormitorios y penthouses")),
             (T("2 vagas", "2 spaces", "2 cocheras"), T("nos de 2 e 3 quartos (1 coberta e 1 descoberta)", "in 2 and 3-bedroom units (1 covered, 1 open)", "en los de 2 y 3 dormitorios (1 cubierta y 1 descubierta)")),
             (T("65 km"), T("de Assunção — e a minutos da fábrica", "from Asunción — and minutes from the plant", "de Asunción — y a minutos de la fábrica"))])}
</section>
<section class="sec paper2" id="tipologias">
  {head_sec(p, T("Plantas e valores", "Plans and prices", "Planos y valores"),
            T("Quatro plantas, <em>um mesmo padrão.</em>", "Four plans, <em>one standard.</em>", "Cuatro plantas, <em>un mismo estándar.</em>"),
            T("A verdadeira casa suspensa: apartamentos com isolamento térmico e acústico, espaços abertos e bem aproveitados, e toda a infraestrutura do parque por perto — farmácia, mercado, academia, Outlet Premium e Bracerum Club.",
              "A true home in the air: apartments with thermal and acoustic insulation, open, well-used spaces and the whole park’s infrastructure nearby — pharmacy, market, gym, Premium Outlet and Bracerum Club.",
              "La verdadera casa suspendida: departamentos con aislación térmica y acústica, espacios abiertos y bien aprovechados, y toda la infraestructura del parque cerca — farmacia, mercado, gimnasio, Outlet Premium y Bracerum Club."))}
  <div class="cards rv" style="--cols:4">{"".join(cards)}</div>
  {pay(p, [(T("20% + 12x"), T("sinal de 20% e 12 parcelas, preço de tabela", "20% down and 12 instalments, list price", "seña del 20% y 12 cuotas, precio de lista")),
           (T("À vista · −5%", "Cash · −5%", "Al contado · −5%"), T("pagamento integral na assinatura", "paid in full on signing", "pago total a la firma")),
           (T("Investidor · −5%", "Investor · −5%", "Inversor · −5%"), T("a partir de 10 unidades; 20% + 36x tem +8%", "from 10 units; 20% + 36x carries +8%", "desde 10 unidades; 20% + 36x tiene +8%"))])}
  {p.tx("p", T("Valores em dólares americanos (US$), na condição 20% + 12 parcelas. Descontos não cumulativos. Plantas ilustrativas; áreas e valores sujeitos a alteração e à disponibilidade no momento da reserva.",
               "Prices in US dollars, for 20% + 12 instalments. Discounts are not cumulative. Illustrative plans; areas and prices subject to change and to availability at reservation.",
               "Valores en dólares estadounidenses (US$), en la condición 20% + 12 cuotas. Descuentos no acumulables. Planos ilustrativos; áreas y valores sujetos a cambios y a la disponibilidad al momento de la reserva."), "note rv")}
</section>
<section class="sec" id="diferenciais">
  {split(p, "assets/lp/residence-torre.jpg", "Torre do Bracerum Residence",
         T("Diferenciais", "Highlights", "Diferenciales"),
         T("Moradia, negócios e serviços <em>no mesmo parque.</em>", "Home, business and services <em>in the same park.</em>", "Vivienda, negocios y servicios <em>en el mismo parque.</em>"),
         [T("Quem vai morar no Residence chega junto com as indústrias: diretores, gestores e equipes que querem viver perto da fábrica — e o tempo que se perdia na estrada até Assunção vira tempo livre.",
            "Residence buyers arrive with the industries: directors, managers and teams who want to live near the plant — and the time once lost on the road to Asunción becomes free time.",
            "Quienes vivirán en el Residence llegan junto con las industrias: directores, gerentes y equipos que quieren vivir cerca de la fábrica — y el tiempo que se perdía en la ruta a Asunción se vuelve tiempo libre."),
          T("O condomínio fica num perímetro que já nasce protegido, com acesso controlado, posto policial e bombeiros dentro do parque. O resultado é um patrimônio em dólar num território que se valoriza conforme é ocupado.",
            "The condominium sits inside a perimeter that is protected from day one, with controlled access, a police post and a fire station inside the park. The result is a dollar asset in a territory that gains value as it fills up.",
            "El condominio está en un perímetro que ya nace protegido, con acceso controlado, puesto policial y bomberos dentro del parque. El resultado es un patrimonio en dólares en un territorio que se valoriza a medida que se ocupa.")],
         extra=feats(p, [("grill", T("Sacada com churrasqueira", "Balcony with grill", "Balcón con parrilla"), None),
                         ("ar", T("Ar-condicionado split em todos os aptos", "Split A/C in every unit", "Aire split en todos los departamentos"), None),
                         ("piso", T("Piso em porcelanato", "Porcelain tile floors", "Piso de porcelanato"), None),
                         ("praia", T("Praia artificial entre as torres", "Artificial beach between the towers", "Playa artificial entre las torres"), None),
                         ("pin", T("Em Villeta, a cidade industrial do Paraguai", "In Villeta, Paraguay’s industrial city", "En Villeta, la ciudad industrial del Paraguay"), None),
                         ("predios", T("Moradia, negócios e serviços no parque", "Home, business and services in the park", "Vivienda, negocios y servicios en el parque"), None)]))}
</section>
<section class="sec ink" id="lazer">
  {head_sec(p, T("Clube & lazer", "Club & leisure", "Club & ocio"),
            T("A vida a <em>poucos passos.</em>", "Life <em>a few steps away.</em>", "La vida a <em>pocos pasos.</em>"),
            T("A água faz parte da paisagem de casa: praias de areia com entrada gradual, como no mar, entre jardins tropicais, espreguiçadeiras e um deck com quincho. No Bracerum Club estão a piscina olímpica, o simulador de surf, as quadras de tênis e padel e o salão de eventos.",
              "Water is part of the view from home: sandy beaches with a gradual entry, like the sea, among tropical gardens, loungers and a deck with a quincho. Bracerum Club has the Olympic pool, the surf simulator, tennis and padel courts and the events hall.",
              "El agua es parte del paisaje de casa: playas de arena con entrada gradual, como en el mar, entre jardines tropicales, reposeras y un deck con quincho. En el Bracerum Club están la piscina olímpica, el simulador de surf, las canchas de tenis y pádel y el salón de eventos."))}
  {reel(p, [("assets/lp/residence-praia.jpg", T("Praia artificial", "Artificial beach", "Playa artificial")),
            ("assets/web/fotos/amen-piscina-quincho.jpg", T("Deck com quincho", "Deck with quincho", "Deck con quincho")),
            ("assets/web/fotos/amen-quadra.jpg", T("Quadras esportivas", "Sports courts", "Canchas deportivas")),
            ("assets/web/fotos/resort-lago.jpg", T("Lago e áreas verdes", "Lake and green areas", "Lago y áreas verdes"))])}
</section>
{sec_passos(p)}
{sec_faq(p, [
    (T("Posso comprar para investir?", "Can I buy to invest?", "¿Puedo comprar para invertir?"),
     T("Sim — e há condição de investidor: 5% de desconto a partir de 10 unidades (não cumulativo com outros descontos).",
       "Yes — and there is an investor condition: 5% off from 10 units (not cumulative with other discounts).",
       "Sí — y hay condición de inversor: 5% de descuento a partir de 10 unidades (no acumulable con otros descuentos).")),
    (T("Quais são as formas de pagamento?", "What are the payment options?", "¿Cuáles son las formas de pago?"),
     T("20% de sinal e 12 parcelas mensais pelo preço de tabela; à vista com 5% de desconto; ou 20% e 36 parcelas, com 8% de acréscimo.",
       "20% down and 12 monthly instalments at list price; cash with a 5% discount; or 20% and 36 instalments with an 8% surcharge.",
       "20% de seña y 12 cuotas mensuales al precio de lista; al contado con 5% de descuento; o 20% y 36 cuotas, con 8% de recargo.")),
    (T("Como é a cobertura?", "What is the penthouse like?", "¿Cómo es el penthouse?"),
     T("Duplex de 3 quartos: 97,40 m² no primeiro piso e um terraço privativo de 97,40 m² com área gourmet completa — churrasqueira, bancada com pia, pergolado, banheiro e solarium.",
       "A 3-bedroom duplex: 97.40 m² on the first level and a private 97.40 m² terrace with a full gourmet area — grill, sink counter, pergola, bathroom and solarium.",
       "Dúplex de 3 dormitorios: 97,40 m² en el primer piso y una terraza privada de 97,40 m² con área gourmet completa — parrilla, mesada con pileta, pérgola, baño y solárium.")),
    FAQ_ONDE, FAQ_VISITA])}
{final(p, T("Qual planta <em>é a sua?</em>", "Which plan <em>is yours?</em>", "¿Qué planta <em>es la suya?</em>"),
       T("Receba a tabela completa e as plantas, ou fale agora com a equipe.", "Get the full price list and floor plans, or talk to the team now.", "Reciba la tabla completa y los planos, o hable ahora con el equipo."))}'''
    return montar(p, T("Bracerum Residence — apartamentos em Villeta · Bracerum Park", "Bracerum Residence — apartments in Villeta · Bracerum Park", "Bracerum Residence — departamentos en Villeta · Bracerum Park"),
                  "Apartamentos de 1, 2 e 3 quartos e coberturas no Bracerum Park, em Villeta, Paraguai, com praia artificial e Bracerum Club. A partir de US$ 55.400.",
                  "residence", corpo,
                  T("Olá! Vim pelo folder do Bracerum Residence e quero a tabela e as plantas dos apartamentos.",
                    "Hello! I came from the Bracerum Residence brochure and would like the price list and floor plans.",
                    "¡Hola! Llegué por el folleto de Bracerum Residence y quiero la tabla y los planos de los departamentos."))


# ===================================================================== 3. Resort (casas)
def pg_resort():
    p = Pagina("folderresort", "folderresort", "resort", "Bracerum Resort")
    form = formulario(
        p, T("Receba a tabela e o <em>mapa dos lotes</em>", "Get prices and the <em>lot map</em>", "Reciba la tabla y el <em>mapa de lotes</em>"),
        T("Lotes livres, metragens e valores do condomínio de casas — no seu WhatsApp.", "Free lots, sizes and prices for the house condominium — on your WhatsApp.", "Lotes libres, metrajes y valores del condominio de casas — en su WhatsApp."),
        [("lote-casa", T("Lote para construir minha casa", "A lot to build my home", "Lote para construir mi casa"), None, None),
         ("lote-investir", T("Lote para investir", "A lot to invest", "Lote para invertir"), None, None),
         ("casa-modelo", T("Quero conhecer a casa modelo", "I want to see the model house", "Quiero conocer la casa modelo"), None, None)],
        enviar=T("Receber tabela e mapa", "Get prices and map", "Recibir tabla y mapa"))
    comodos = [T("Living integrado", "Open-plan living", "Living integrado"), T("Cozinha gourmet", "Gourmet kitchen", "Cocina gourmet"), T("Área de serviço", "Laundry", "Lavadero"),
               T("Três suítes", "Three en-suites", "Tres suites"), T("Piscina", "Pool", "Piscina"), T("Depósito", "Storage", "Depósito"),
               T("Lavabo", "Guest toilet", "Toilette"), T("Garagem", "Garage", "Garaje")]
    lista = "".join(f"<li>{p.tx('span', c)}</li>" for c in comodos)
    corpo = hero(
        p, "assets/lp/resort-casa-modelo.jpg",
        T("Bracerum Park · Condomínio fechado de casas", "Bracerum Park · Gated house community", "Bracerum Park · Barrio cerrado de casas"),
        T("Bracerum <em>Resort</em>"),
        T("Lotes para casas a partir de 600 m², em condomínio fechado com praia artificial, simulador de surf e o Bracerum Club.",
          "House lots from 600 m² in a gated community with an artificial beach, a surf simulator and Bracerum Club.",
          "Lotes para casas desde 600 m², en barrio cerrado con playa artificial, simulador de surf y el Bracerum Club."),
        [T("Lotes a partir de 600 m²", "Lots from 600 m²", "Lotes desde 600 m²"),
         T("Portaria e condomínio fechado", "Gatehouse and gated community", "Portería y barrio cerrado"),
         T("Ao lado do parque industrial", "Next to the industrial park", "Junto al parque industrial")],
        [("go", T("Ver o condomínio", "See the community", "Ver el condominio"), "#condominio", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp"), "", "")], form)
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("31"), T("lotes residenciais no condomínio", "residential lots in the community", "lotes residenciales en el condominio")),
             (T("600 m²"), T("lote mínimo — há lotes de até 1.481 m²", "minimum lot — some reach 1,481 m²", "lote mínimo — hay lotes de hasta 1.481 m²")),
             (T("3 suítes", "3 suites", "3 suites"), T("na casa modelo, com piscina e cozinha gourmet", "in the model house, with pool and gourmet kitchen", "en la casa modelo, con piscina y cocina gourmet")),
             (T("1 clube", "1 club", "1 club"), T("piscina olímpica, surf, tênis, padel e salão de eventos", "Olympic pool, surf, tennis, padel and events hall", "piscina olímpica, surf, tenis, pádel y salón de eventos"))])}
</section>
<section class="sec paper2" id="condominio">
  {split(p, "assets/web/fotos/resort-casas-rua.jpg", "Rua do Bracerum Resort",
         T("O condomínio", "The community", "El condominio"),
         T("Um tipo de silêncio <em>que só existe longe do ruído.</em>", "A kind of quiet <em>found only far from the noise.</em>", "Un tipo de silencio <em>que solo existe lejos del ruido.</em>"),
         [T("O Bracerum Resort foi desenhado em torno dele: ruas tranquilas, verde por toda parte e casas que se abrem para a paisagem. A portaria cuida de quem entra e sai, e assim a privacidade de uma casa vem com a segurança de um condomínio fechado.",
            "Bracerum Resort was designed around it: quiet streets, greenery everywhere and houses that open onto the landscape. The gatehouse looks after who comes and goes, so the privacy of a house comes with the security of a gated community.",
            "Bracerum Resort fue diseñado alrededor de él: calles tranquilas, verde por todas partes y casas que se abren al paisaje. La portería cuida quién entra y sale, y así la privacidad de una casa viene con la seguridad de un barrio cerrado."),
          T("Em volta ficam escola, creche, ambulatório e o Bracerum Club, e o tempo que se perdia na estrada até Assunção vira tempo livre. Ter uma casa aqui é ter um patrimônio raro, que se valoriza porque há poucos iguais.",
            "Around it are a school, nursery, clinic and Bracerum Club, and the time once lost on the road to Asunción becomes free time. A house here is a rare asset, one that gains value because there are few like it.",
            "Alrededor están escuela, guardería, ambulatorio y el Bracerum Club, y el tiempo que se perdía en la ruta a Asunción se vuelve tiempo libre. Tener una casa aquí es tener un patrimonio raro, que se valoriza porque hay pocos iguales.")])}
</section>
<section class="sec" id="casa-modelo">
  {split(p, "assets/lp/resort-casa-modelo.jpg", "Casa modelo do Bracerum Resort",
         T("Casa modelo", "Model house", "Casa modelo"),
         T("Pronta para <em>ser vivida.</em>", "Ready <em>to be lived in.</em>", "Lista para <em>ser vivida.</em>"),
         [T("Para quem constrói e para quem chega de mudança, a casa já começa pronta: espaços amplamente abertos, com lugar para o ar livre, perto de toda a infraestrutura do parque — farmácia, mercado, academia, Outlet Premium e Bracerum Club.",
            "For those who build and those who move in, the house starts ready: wide open spaces with room for the outdoors, close to all the park’s infrastructure — pharmacy, market, gym, Premium Outlet and Bracerum Club.",
            "Para quien construye y para quien llega de mudanza, la casa ya empieza lista: espacios ampliamente abiertos, con lugar para el aire libre, cerca de toda la infraestructura del parque — farmacia, mercado, gimnasio, Outlet Premium y Bracerum Club.")],
         extra=f'<ul class="specs" style="margin-top:22px">{lista}</ul>' + p.tx("p", T("Planta ilustrativa, sujeita a alterações; não representa o modelo final.", "Illustrative plan, subject to change; not the final design.", "Plano ilustrativo, sujeto a cambios; no representa el modelo final."), "note"),
         rev=True)}
</section>
<section class="sec ink" id="lazer">
  {head_sec(p, T("Clube & lazer", "Club & leisure", "Club & ocio"),
            T("O descanso <em>ao lado da operação.</em>", "Downtime <em>next to the operation.</em>", "El descanso <em>al lado de la operación.</em>"),
            T("Uma onda perfeita a qualquer hora, sem depender do mar: o simulador de surf do Bracerum Club é exclusivo de moradores. E uma piscina desenhada como um lago, com areia na beira e entrada gradual, cercada de verde e sombra — para um mergulho sem pressa, um livro e o sol baixo no fim da tarde.",
              "A perfect wave at any hour, no sea required: Bracerum Club’s surf simulator is for residents only. And a pool shaped like a lake, with sand at the edge and a gradual entry, surrounded by green and shade — for an unhurried swim, a book and the late-afternoon sun.",
              "Una ola perfecta a cualquier hora, sin depender del mar: el simulador de surf del Bracerum Club es exclusivo para residentes. Y una piscina diseñada como un lago, con arena en la orilla y entrada gradual, rodeada de verde y sombra — para un chapuzón sin apuro, un libro y el sol bajo al final de la tarde."))}
  {reel(p, [("assets/lp/residence-praia.jpg", T("Piscina artificial com praia", "Lagoon pool with beach", "Piscina artificial con playa")),
            ("assets/web/fotos/resort-lago.jpg", T("Lago", "Lake", "Lago")),
            ("assets/web/fotos/amen-piscina-quincho.jpg", T("Deck com quincho", "Deck with quincho", "Deck con quincho")),
            ("assets/web/fotos/amen-quadra.jpg", T("Quadras", "Courts", "Canchas")),
            ("assets/web/fotos/resort-rua-arborizada.jpg", T("Ruas arborizadas", "Tree-lined streets", "Calles arboladas"))])}
</section>
{sec_passos(p)}
{sec_faq(p, [
    (T("Qual o tamanho dos lotes?", "How big are the lots?", "¿De qué tamaño son los lotes?"),
     T("De 600 m² a 1.481 m²; a maioria tem 600 m². A tabela mostra a metragem de cada lote livre.",
       "From 600 m² to 1,481 m²; most are 600 m². The price list shows the size of each free lot.",
       "De 600 m² a 1.481 m²; la mayoría tiene 600 m². La tabla muestra el metraje de cada lote libre.")),
    (T("Quem pode usar o clube?", "Who can use the club?", "¿Quién puede usar el club?"),
     T("O simulador de surf é exclusivo de moradores. O Bracerum Club reúne piscina olímpica, quadras de tênis e padel e o salão de eventos.",
       "The surf simulator is for residents only. Bracerum Club has the Olympic pool, tennis and padel courts and the events hall.",
       "El simulador de surf es exclusivo para residentes. El Bracerum Club reúne piscina olímpica, canchas de tenis y pádel y el salón de eventos.")),
    (T("Como recebo os valores?", "How do I get the prices?", "¿Cómo recibo los valores?"),
     T("Pelo formulário desta página ou pelo WhatsApp: a equipe envia a tabela de lotes e o mapa de disponibilidade.",
       "Through the form on this page or on WhatsApp: the team sends the lot price list and the availability map.",
       "Por el formulario de esta página o por WhatsApp: el equipo envía la tabla de lotes y el mapa de disponibilidad.")),
    FAQ_ONDE, FAQ_VISITA])}
{final(p, T("A sua casa, <em>perto de tudo.</em>", "Your home, <em>close to everything.</em>", "Su casa, <em>cerca de todo.</em>"),
       T("Receba a tabela de lotes do Resort ou fale agora com a equipe.", "Get the Resort lot price list or talk to the team now.", "Reciba la tabla de lotes del Resort o hable ahora con el equipo."))}'''
    return montar(p, T("Bracerum Resort — casas em condomínio fechado · Bracerum Park", "Bracerum Resort — gated house community · Bracerum Park", "Bracerum Resort — casas en barrio cerrado · Bracerum Park"),
                  "Lotes para casas a partir de 600 m² em condomínio fechado no Bracerum Park, Villeta: praia artificial, simulador de surf e Bracerum Club.",
                  "resort", corpo,
                  T("Olá! Vim pelo folder do Bracerum Resort e quero a tabela de lotes para casas.",
                    "Hello! I came from the Bracerum Resort brochure and would like the house-lot price list.",
                    "¡Hola! Llegué por el folleto de Bracerum Resort y quiero la tabla de lotes para casas."))


# ===================================================================== 4. Business Center
OUTLET = [  # tipo, área m², preço base US$ (US$ 1.150/m²) — folder "Premium Outlet", 1ª fase
    (T("Praça de alimentação", "Food court", "Patio de comidas"), 30),
    (T("Loja compacta", "Compact store", "Local compacto"), 40),
    (T("Loja compacta", "Compact store", "Local compacto"), 60),
    (T("Loja padrão", "Standard store", "Local estándar"), 80),
    (T("Loja padrão", "Standard store", "Local estándar"), 120),
    (T("Loja ampla", "Large store", "Local amplio"), 200),
    (T("Megaloja", "Megastore", "Megatienda"), 500),
    (T("Âncora", "Anchor", "Ancla"), 1000),
]


def us(v, en=False):
    s = f"{v:,.0f}"
    return "US$ " + (s if en else s.replace(",", "."))


def pg_business():
    p = Pagina("folderbusinesscenter", "folderbusinesscenter", "business", "Business Center")
    form = formulario(
        p, T("Receba a tabela de <em>lojas e salas</em>", "Get the <em>stores and offices</em> price list", "Reciba la tabla de <em>locales y oficinas</em>"),
        T("Lojas livres, metragens e condições de lançamento — no seu WhatsApp.", "Free units, sizes and launch terms — on your WhatsApp.", "Locales libres, metrajes y condiciones de lanzamiento — en su WhatsApp."),
        [("outlet", T("Loja no Premium Outlet", "Store at the Premium Outlet", "Local en el Premium Outlet"), T("1ª fase · US$ 1.150/m²", "Phase 1 · US$ 1,150/m²", "1ª fase · US$ 1.150/m²"), "outlet"),
         ("market", T("Loja no Bracerum Market", "Store at Bracerum Market", "Local en Bracerum Market"), T("12 lojas de 60 m²", "12 stores of 60 m²", "12 locales de 60 m²"), "outlet"),
         ("supermercado", T("Supermercado (âncora)", "Supermarket (anchor)", "Supermercado (ancla)"), T("4.606 m²", "4,606 m²", "4.606 m²"), "outlet"),
         ("sala", T("Sala no Centro Tecnológico", "Office at the Technology Centre", "Oficina en el Centro Tecnológico"), T("escritório, startup, tecnologia", "office, startup, tech", "oficina, startup, tecnología"), "business")],
        empresa=True, enviar=T("Receber tabela", "Get price list", "Recibir tabla"))
    rows = []
    for tipo, a in OUTLET:
        area = f"{a:,} m²"
        cel = lambda v: T(us(v), us(v, en=True), us(v))   # noqa: E731
        rows.append(f'<tr><td>{p.tx("span", tipo)}</td><td>{p.tx("span", T(area.replace(",", "."), area, area.replace(",", ".")))}</td>'
                    f'<td class="hl">{p.tx("span", cel(a * 1150))}</td><td>{p.tx("span", cel(round(a * 1150 * 0.92)))}</td></tr>')
    tabela = f'''<div class="tablewrap rv"><table class="prices"><thead><tr>
  <th>{p.tx("span", T("Tipo de loja", "Store type", "Tipo de local"))}</th><th>{p.tx("span", T("Área", "Area", "Área"))}</th>
  <th>{p.tx("span", T("Preço base", "Base price", "Precio base"))}<small>20% + 12x</small></th><th>{p.tx("span", T("À vista (−8%)", "Cash (−8%)", "Al contado (−8%)"))}</th>
</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'''
    corpo = hero(
        p, "assets/lp/outlet-boulevard.jpg",
        T("Bracerum Park · Centro comercial e tecnológico integrado", "Bracerum Park · Integrated retail and technology centre", "Bracerum Park · Centro comercial y tecnológico integrado"),
        T("Business <em>Center</em>"),
        T("Lojas no Premium Outlet, salas no Centro Tecnológico e as lojas do Bracerum Market — de frente para a PY-19, com o público que o parque traz todos os dias.",
          "Stores at the Premium Outlet, offices at the Technology Centre and Bracerum Market units — facing the PY-19, with the crowd the park brings every day.",
          "Locales en el Premium Outlet, oficinas en el Centro Tecnológico y los locales del Bracerum Market — frente a la PY-19, con el público que el parque trae todos los días."),
        [T("Outlet a US$ 1.150/m² na 1ª fase", "Outlet at US$ 1,150/m² in phase 1", "Outlet a US$ 1.150/m² en la 1ª fase"),
         T("20% + 12x sem acréscimo", "20% + 12x, no surcharge", "20% + 12x sin recargo"),
         T("Vitrine para a PY-19", "Frontage on the PY-19", "Vidriera a la PY-19")],
        [("go", T("Ver preços do Outlet", "See Outlet prices", "Ver precios del Outlet"), "#outlet", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp"), "", "")], form)
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("57"), T("lojas na 1ª fase do Premium Outlet", "stores in Premium Outlet phase 1", "locales en la 1ª fase del Premium Outlet")),
             (T("17.870 m²", "17,870 m²", "17.870 m²"), T("vendáveis na 1ª fase", "sellable in phase 1", "vendibles en la 1ª fase")),
             (T("13"), T("ativos no Market: supermercado + 12 lojas", "Market assets: supermarket + 12 stores", "activos en el Market: supermercado + 12 locales")),
             (T("US$ 1.150", "US$ 1,150", "US$ 1.150"), T("o m² de lançamento do Outlet", "Outlet launch price per m²", "el m² de lanzamiento del Outlet"))])}
</section>
<section class="sec paper2" id="business">
  {split(p, "assets/lp/outlet-fachada.jpg", "Fachada do Bracerum Outlet",
         T("Business Center", "Business Center", "Business Center"),
         T("Toda cidade tem um lugar <em>onde as coisas acontecem.</em>", "Every city has a place <em>where things happen.</em>", "Toda ciudad tiene un lugar <em>donde las cosas pasan.</em>"),
         [T("No Bracerum Park, esse lugar é o Business Center: o ponto de encontro entre quem produz, quem administra e quem vive o dia a dia do parque. Num mesmo conjunto ficam o Centro Administrativo, que faz a gestão do parque, e o Centro Tecnológico, com escritórios, salas de reunião e espaço para receber clientes e parceiros.",
            "At Bracerum Park, that place is the Business Center: where those who produce, those who manage and those who live the park’s daily life meet. In one complex sit the Administrative Centre, which runs the park, and the Technology Centre, with offices, meeting rooms and space to host clients and partners.",
            "En Bracerum Park, ese lugar es el Business Center: el punto de encuentro entre quien produce, quien administra y quien vive el día a día del parque. En un mismo conjunto están el Centro Administrativo, que gestiona el parque, y el Centro Tecnológico, con oficinas, salas de reunión y espacio para recibir clientes y socios."),
          T("O Outlet Premium, o supermercado e a farmácia completam o conjunto e resolvem a rotina sem que ninguém precise sair do parque. Para o empresário, isso significa uma operação mais ágil, uma equipe mais bem atendida e um endereço que trabalha a favor do negócio.",
            "The Premium Outlet, the supermarket and the pharmacy complete the complex and handle daily needs without anyone leaving the park. For the business owner, that means a nimbler operation, a better-served team and an address that works for the business.",
            "El Outlet Premium, el supermercado y la farmacia completan el conjunto y resuelven la rutina sin que nadie tenga que salir del parque. Para el empresario, eso significa una operación más ágil, un equipo mejor atendido y una dirección que trabaja a favor del negocio.")],
         extra=feats(p, [("loja", T("Vitrine para a PY-19", "Frontage on the PY-19", "Vidriera a la PY-19"), None),
                         ("estrutura", T("Estrutura triple A", "Triple-A build", "Estructura triple A"), None),
                         ("corredor", T("Corredores livres", "Open walkways", "Pasillos libres"), None),
                         ("prato", T("Praça de alimentação", "Food court", "Patio de comidas"), None),
                         ("pessoas", T("Público cativo", "Captive audience", "Público cautivo"), None),
                         ("metragem", T("Metragens flexíveis", "Flexible sizes", "Metrajes flexibles"), None)]))}
</section>
<section class="sec" id="outlet">
  {head_sec(p, T("Premium Outlet · 1ª fase", "Premium Outlet · Phase 1", "Premium Outlet · 1ª fase"),
            T("Preços exclusivos <em>de lançamento.</em>", "Exclusive <em>launch prices.</em>", "Precios exclusivos <em>de lanzamiento.</em>"),
            T("A primeira fase do Outlet Premium tem condição de lançamento, reservada a quem chega antes: o metro quadrado sai a US$ 1.150, com entrada de 20% e o saldo em 12 parcelas sem acréscimo, ou em 36 parcelas. À vista tem 8% de desconto, e quem compra mais de uma loja ganha condição especial por volume. São as lojas da frente — as duas pontas ficam para a 2ª fase, de liberação futura.",
              "Phase 1 of the Premium Outlet has a launch condition reserved for early buyers: US$ 1,150 per m², 20% down and the balance in 12 instalments with no surcharge, or in 36 instalments. Cash gets 8% off, and buying more than one store earns a special volume condition. These are the front stores — both ends are phase 2, to be released later.",
              "La primera fase del Outlet Premium tiene condición de lanzamiento, reservada a quien llega antes: el metro cuadrado sale a US$ 1.150, con 20% de entrada y el saldo en 12 cuotas sin recargo, o en 36 cuotas. Al contado tiene 8% de descuento, y quien compra más de un local recibe condición especial por volumen. Son los locales del frente — las dos puntas quedan para la 2ª fase, de liberación futura."))}
  {tabela}
  {pay(p, [(T("20% + 12x"), T("sem acréscimo, preço base", "no surcharge, base price", "sin recargo, precio base")),
           (T("À vista · −8%", "Cash · −8%", "Al contado · −8%"), T("pagamento integral na assinatura", "paid in full on signing", "pago total a la firma")),
           (T("Volume", "Volume", "Volumen"), T("condição especial para mais de uma loja", "special terms for more than one store", "condición especial por más de un local"))])}
  {p.tx("p", T("Valores de referência em dólares americanos (US$), válidos para a 1ª fase e sujeitos a alteração sem aviso prévio; unidades sujeitas à disponibilidade no momento da reserva. A área final de cada loja é a do plano de mensura aprovado. Os descontos à vista e por volume não são cumulativos com outras promoções. Esta tabela não é oferta vinculante; valem as condições do contrato de compra e venda.",
               "Reference prices in US dollars, valid for phase 1 and subject to change without notice; units subject to availability at reservation. Each store’s final area is that of the approved survey plan. Cash and volume discounts are not cumulative with other offers. This table is not a binding offer; the purchase contract prevails.",
               "Valores de referencia en dólares estadounidenses (US$), válidos para la 1ª fase y sujetos a cambios sin aviso; unidades sujetas a la disponibilidad al momento de la reserva. El área final de cada local es la del plano de mensura aprobado. Los descuentos al contado y por volumen no son acumulables con otras promociones. Esta tabla no es oferta vinculante; rigen las condiciones del contrato de compraventa."), "note rv")}
  <div class="btns rv"><a class="btn btn--ink" href="#form" data-pick="outlet">{p.tx("span", T("Ver lojas livres", "See free stores", "Ver locales libres"))}<span class="arrow" aria-hidden="true">→</span></a></div>
</section>
<section class="sec ink" id="tecnologia">
  {split(p, "assets/web/fotos/convencoes-foyer.jpg", "Centro Tecnológico do Bracerum Park",
         T("Centro Tecnológico", "Technology Centre", "Centro Tecnológico"),
         T("O lado digital <em>do Bracerum Park.</em>", "Bracerum Park’s <em>digital side.</em>", "El lado digital <em>de Bracerum Park.</em>"),
         [T("Salas corporativas para escritórios e reuniões, espaços de incubação para startups que estão começando e estrutura para receber empresas de tecnologia, desenvolvimento de software e grandes operações do setor.",
            "Corporate rooms for offices and meetings, incubation space for early-stage startups and room for technology, software development and large operations in the sector.",
            "Salas corporativas para oficinas y reuniones, espacios de incubación para startups que empiezan y estructura para recibir empresas de tecnología, desarrollo de software y grandes operaciones del sector."),
          T("Aqui o programa trabalha ao lado de quem produz: automação, dados e soluções digitais nascem perto das fábricas que vão usá-los. Um ecossistema pensado para atrair talentos, gerar inovação e fazer do parque um polo de tecnologia no coração do Mercosul.",
            "Here, code works next to production: automation, data and digital solutions are born close to the plants that will use them. An ecosystem designed to attract talent, drive innovation and make the park a technology hub at the heart of Mercosur.",
            "Aquí el programa trabaja al lado de quien produce: automatización, datos y soluciones digitales nacen cerca de las fábricas que los usarán. Un ecosistema pensado para atraer talento, generar innovación y hacer del parque un polo tecnológico en el corazón del Mercosur.")],
         extra=f'<div class="btns"><a class="btn btn--sand" href="#form" data-pick="sala">{p.tx("span", T("Quero uma sala", "I want an office", "Quiero una oficina"))}<span class="arrow" aria-hidden="true">→</span></a></div>',
         rev=True, cap=T("Imagem ilustrativa", "Illustrative image", "Imagen ilustrativa"))}
</section>
<section class="sec paper2" id="market">
  {head_sec(p, T("Bracerum Market", "Bracerum Market", "Bracerum Market"),
            T("Mais de 12 lojas <em>à espera de quem chegar primeiro.</em>", "12+ stores <em>waiting for whoever comes first.</em>", "Más de 12 locales <em>esperando a quien llegue primero.</em>"),
            T("O supermercado é a âncora natural de uma cidade em formação, com demanda diária e um público cativo de indústrias, moradores e visitantes. Ao lado, o Hub de Serviços Rápidos reúne doze lojas de alta visibilidade e tráfego intenso de pedestres, para o que se resolve em minutos: farmácia, café, conveniência e serviços.",
              "The supermarket is the natural anchor of a city in the making, with daily demand and a captive audience of industries, residents and visitors. Next to it, the Quick Services Hub gathers twelve high-visibility stores with heavy foot traffic, for what gets done in minutes: pharmacy, coffee, convenience and services.",
              "El supermercado es el ancla natural de una ciudad en formación, con demanda diaria y un público cautivo de industrias, residentes y visitantes. Al lado, el Hub de Servicios Rápidos reúne doce locales de alta visibilidad y tránsito intenso de peatones, para lo que se resuelve en minutos: farmacia, café, conveniencia y servicios."))}
  <div class="cards rv" style="--cols:2">
    <article class="card"><div class="card__img">{img("assets/web/fotos/park-boulevard-aereo.jpg")}</div><div class="card__body">{p.tx("span", T("Âncora", "Anchor", "Ancla"), "card__tag")}{p.tx("p", T("Supermercado", "Supermarket", "Supermercado"), "h3")}
      <ul class="specs"><li>{p.tx("span", T("Área", "Area", "Área"))}<span>4.606 m²</span></li><li>{p.tx("span", T("Dimensões", "Dimensions", "Dimensiones"))}<span>55,5 × 83 m</span></li></ul>
      <a class="linkarrow" href="#form" data-pick="supermercado">{p.tx("span", T("Receber condições", "Get terms", "Recibir condiciones"))}<span class="arrow" aria-hidden="true">→</span></a></div></article>
    <article class="card"><div class="card__img">{img("assets/lp/outlet-fachada.jpg")}</div><div class="card__body">{p.tx("span", T("Hub de Serviços Rápidos", "Quick Services Hub", "Hub de Servicios Rápidos"), "card__tag")}{p.tx("p", T("12 lojas", "12 stores", "12 locales"), "h3")}
      <ul class="specs"><li>{p.tx("span", T("Área de cada loja", "Each store", "Área de cada local"))}<span>60 m²</span></li><li>{p.tx("span", T("Dimensões", "Dimensions", "Dimensiones"))}<span>10 × 6 m</span></li></ul>
      <a class="linkarrow" href="#form" data-pick="market">{p.tx("span", T("Receber valores", "Get prices", "Recibir valores"))}<span class="arrow" aria-hidden="true">→</span></a></div></article>
  </div>
</section>
<section class="sec brown" id="publico">
  {head_sec(p, T("Público cativo", "Captive audience", "Público cautivo"),
            T("Clientes que <em>o próprio parque gera.</em>", "Customers <em>the park itself creates.</em>", "Clientes que <em>el propio parque genera.</em>"),
            T("São negócios independentes, com um mercado que cresce a cada empresa que se instala.", "Independent businesses, in a market that grows with every company that moves in.", "Son negocios independientes, con un mercado que crece con cada empresa que se instala."))}
  {stats(p, [(T("614"), T("lotes industriais e suas equipes", "industrial lots and their teams", "lotes industriales y sus equipos")),
             (T("1.452", "1,452", "1.452"), T("apartamentos no Bracerum Residence", "apartments at Bracerum Residence", "departamentos en Bracerum Residence")),
             (T("384"), T("studios no Bracerum Hotel", "studios at Bracerum Hotel", "studios en el Bracerum Hotel")),
             (T("1.200", "1,200", "1.200"), T("lugares no auditório de convenções", "seats in the convention auditorium", "lugares en el auditorio de convenciones"))])}
</section>
{sec_passos(p)}
{sec_faq(p, [
    (T("As lojas são vendidas ou alugadas?", "Are the stores sold or leased?", "¿Los locales se venden o se alquilan?"),
     T("Vendidas: os valores da tabela são de venda da unidade. O comprador pode operar a loja ou alugá-la a terceiros.",
       "Sold: the table shows unit sale prices. The buyer can run the store or lease it to others.",
       "Vendidos: los valores de la tabla son de venta de la unidad. El comprador puede operar el local o alquilarlo a terceros.")),
    (T("Posso comprar mais de uma loja?", "Can I buy more than one store?", "¿Puedo comprar más de un local?"),
     T("Sim, e quem compra mais de uma loja do Outlet ganha condição especial por volume.", "Yes, and buying more than one Outlet store earns a special volume condition.", "Sí, y quien compra más de un local del Outlet recibe condición especial por volumen.")),
    (T("Quais são as metragens?", "What sizes are available?", "¿Qué metrajes hay?"),
     T("No Outlet, de 30 m² (praça de alimentação) a 1.000 m² (âncora), com metragens flexíveis. No Market, lojas de 60 m² e o supermercado de 4.606 m².",
       "At the Outlet, from 30 m² (food court) to 1,000 m² (anchor), with flexible sizes. At the Market, 60 m² stores and the 4,606 m² supermarket.",
       "En el Outlet, de 30 m² (patio de comidas) a 1.000 m² (ancla), con metrajes flexibles. En el Market, locales de 60 m² y el supermercado de 4.606 m².")),
    (T("O que é a 2ª fase do Outlet?", "What is Outlet phase 2?", "¿Qué es la 2ª fase del Outlet?"),
     T("As duas pontas do Outlet, que serão liberadas depois. A condição de lançamento vale para a 1ª fase, as lojas da frente.",
       "The two ends of the Outlet, to be released later. The launch condition applies to phase 1, the front stores.",
       "Las dos puntas del Outlet, que se liberarán después. La condición de lanzamiento vale para la 1ª fase, los locales del frente.")),
    FAQ_ONDE])}
{final(p, T("O ponto certo <em>chega antes.</em>", "The right spot <em>goes first.</em>", "El punto correcto <em>se va primero.</em>"),
       T("A 1ª fase do Outlet é a das lojas da frente. Receba a tabela ou fale agora com a equipe.", "Outlet phase 1 is the front stores. Get the price list or talk to the team now.", "La 1ª fase del Outlet es la de los locales del frente. Reciba la tabla o hable ahora con el equipo."))}'''
    return montar(p, T("Business Center — Outlet, Market e Centro Tecnológico · Bracerum Park", "Business Center — Outlet, Market and Technology Centre · Bracerum Park", "Business Center — Outlet, Market y Centro Tecnológico · Bracerum Park"),
                  "Lojas no Premium Outlet a US$ 1.150/m² na 1ª fase, 12 lojas e supermercado no Bracerum Market e salas no Centro Tecnológico — Bracerum Park, Villeta.",
                  "business", corpo,
                  T("Olá! Vim pelo folder do Business Center do Bracerum Park e quero a tabela de lojas e salas.",
                    "Hello! I came from the Bracerum Park Business Center brochure and would like the stores and offices price list.",
                    "¡Hola! Llegué por el folleto del Business Center de Bracerum Park y quiero la tabla de locales y oficinas."))


# ===================================================================== 5. Mapa de disponibilidade
OPCOES_TODOS = [
    ("lotes", T("Lotes industriais", "Industrial lots", "Lotes industriales"), T("Parque Industrial · a partir de 1.250 m²", "Industrial Park · from 1,250 m²", "Parque Industrial · desde 1.250 m²"), "park"),
    ("apartamento", T("Apartamento", "Apartment", "Departamento"), T("Bracerum Residence · 1, 2 e 3 quartos", "Bracerum Residence · 1, 2 and 3 bedrooms", "Bracerum Residence · 1, 2 y 3 dormitorios"), "residence"),
    ("casa", T("Lote para casa", "House lot", "Lote para casa"), T("Bracerum Resort · a partir de 600 m²", "Bracerum Resort · from 600 m²", "Bracerum Resort · desde 600 m²"), "resort"),
    ("loja", T("Loja ou sala", "Store or office", "Local u oficina"), T("Business Center · Outlet, Market e Tecnológico", "Business Center · Outlet, Market and Tech", "Business Center · Outlet, Market y Tecnológico"), "outlet"),
]


def cards_produtos(p):
    return produtos(p, [
        ("assets/lp/park-galpao-avenida.jpg", T("Parque Industrial", "Industrial Park", "Parque Industrial"), T("Lotes de <em>1.250 m²</em>", "<em>1,250 m²</em> lots", "Lotes de <em>1.250 m²</em>"),
         T("614 lotes, de um módulo a quadras inteiras. Tabela por janela e disponibilidade ao vivo.", "614 lots, from one module to whole blocks. Prices by window and live availability.", "614 lotes, de un módulo a manzanas enteras. Tabla por ventana y disponibilidad en vivo."),
         "../folderpark/", T("Preços e lotes livres", "Prices and free lots", "Precios y lotes libres")),
        ("assets/lp/residence-torre.jpg", T("Bracerum Residence"), T("Apartamentos <em>desde US$ 55.400</em>", "Apartments <em>from US$ 55,400</em>", "Departamentos <em>desde US$ 55.400</em>"),
         T("1, 2 e 3 quartos e coberturas, com praia artificial entre as torres.", "1, 2 and 3 bedrooms and penthouses, with an artificial beach between the towers.", "1, 2 y 3 dormitorios y penthouses, con playa artificial entre las torres."),
         "../folderresidence/", T("Plantas e valores", "Plans and prices", "Planos y valores")),
        ("assets/lp/resort-casa-modelo.jpg", T("Bracerum Resort"), T("Casas em <em>condomínio fechado</em>", "Houses in a <em>gated community</em>", "Casas en <em>barrio cerrado</em>"),
         T("31 lotes a partir de 600 m², com simulador de surf e Bracerum Club.", "31 lots from 600 m², with a surf simulator and Bracerum Club.", "31 lotes desde 600 m², con simulador de surf y Bracerum Club."),
         "../folderresort/", T("Ver o condomínio", "See the community", "Ver el condominio")),
        ("assets/lp/outlet-boulevard.jpg", T("Business Center"), T("Outlet a <em>US$ 1.150/m²</em>", "Outlet at <em>US$ 1,150/m²</em>", "Outlet a <em>US$ 1.150/m²</em>"),
         T("57 lojas na 1ª fase, 12 lojas e supermercado no Market e salas no Centro Tecnológico.", "57 stores in phase 1, 12 stores and a supermarket at the Market and offices at the Technology Centre.", "57 locales en la 1ª fase, 12 locales y supermercado en el Market y oficinas en el Centro Tecnológico."),
         "../folderbusinesscenter/", T("Lojas e salas", "Stores and offices", "Locales y oficinas")),
    ])


def pg_mapa():
    p = Pagina("foldermapadisponibilidade", "foldermapadisponibilidade", "park", "Preços e disponibilidade")
    form = formulario(
        p, T("Receba a <em>tabela completa</em>", "Get the <em>full price list</em>", "Reciba la <em>tabla completa</em>"),
        T("Escolha o produto: a tabela vigente e o mapa de disponibilidade chegam no seu WhatsApp.", "Pick the product: the current price list and availability map arrive on your WhatsApp.", "Elija el producto: la tabla vigente y el mapa de disponibilidad llegan a su WhatsApp."),
        OPCOES_TODOS, empresa=True, enviar=T("Receber tabela", "Get price list", "Recibir tabla"))
    corpo = hero(
        p, "3dmasterplan/data/poster.jpg",
        T("Bracerum Park · Mapa de disponibilidade", "Bracerum Park · Availability map", "Bracerum Park · Mapa de disponibilidad"),
        T("Preços e <em>disponibilidade</em>", "Prices and <em>availability</em>", "Precios y <em>disponibilidad</em>"),
        T("O que está livre hoje, com os valores da tabela vigente — ou abra o masterplan 3D e escolha a unidade no mapa.",
          "What is free today, at current list prices — or open the 3D masterplan and pick your unit on the map.",
          "Lo que está libre hoy, con los valores de la tabla vigente — o abra el masterplan 3D y elija la unidad en el mapa."),
        [T("Lotes ao vivo pelo mapa de vendas", "Lots live from the sales map", "Lotes en vivo desde el mapa de ventas"),
         T("Tabela por janela de preço", "Prices by price window", "Tabla por ventana de precio"),
         T("Masterplan 3D lote por lote", "3D masterplan lot by lot", "Masterplan 3D lote por lote")],
        [("go", T("Abrir o masterplan 3D", "Open the 3D masterplan", "Abrir el masterplan 3D"), "../3dmasterplan/", ' data-track="open_3d"'),
         ("wa", T("WhatsApp"), "", "")], form)
    corpo += '\n<div class="ribbon" data-ribbon hidden></div>'
    corpo += f'''
<section class="sec ink" id="disponibilidade">
  {head_sec(p, T("Lotes industriais · ao vivo", "Industrial lots · live", "Lotes industriales · en vivo"),
            T("Disponíveis <em>agora.</em>", "Available <em>now.</em>", "Disponibles <em>ahora.</em>"),
            T("O mesmo mapa de vendas da equipe comercial: quando um lote é reservado, ele sai da contagem na hora.", "The sales team’s own map: when a lot is reserved, it leaves the count at once.", "El mismo mapa de ventas del equipo comercial: cuando un lote se reserva, sale del conteo al instante."))}
  <div class="rv" data-live><div class="live"></div><p class="note" data-live-meta></p></div>
  <div class="btns rv"><a class="btn btn--sand" href="../3dmasterplan/" data-track="open_3d">{p.tx("span", T("Escolher no masterplan 3D", "Choose in the 3D masterplan", "Elegir en el masterplan 3D"))}<span class="arrow" aria-hidden="true">→</span></a>
  <a class="btn btn--line" href="#form" data-pick="lotes">{p.tx("span", T("Receber a lista de lotes livres", "Get the list of free lots", "Recibir la lista de lotes libres"))}</a></div>
</section>
<section class="sec" id="precos">
  {head_sec(p, T("Tabela · lotes industriais", "Price list · industrial lots", "Tabla · lotes industriales"),
            T("Preço por lote, <em>por janela.</em>", "Price per lot, <em>by window.</em>", "Precio por lote, <em>por ventana.</em>"),
            T("Lotes de 1.250 m² e seus múltiplos, nas quatro categorias. Toque na próxima janela para ver quanto o mesmo lote vai custar depois.",
              "1,250 m² lots and multiples, in the four categories. Tap the next window to see what the same lot will cost later.",
              "Lotes de 1.250 m² y sus múltiplos, en las cuatro categorías. Toque la próxima ventana para ver cuánto costará el mismo lote después."))}
  <div class="rv" data-lot-prices><p class="small">{p.tx("span", T("Carregando a tabela…", "Loading prices…", "Cargando la tabla…"))}</p></div>
</section>
<section class="sec paper2" id="produtos">
  {head_sec(p, T("Outros produtos", "Other products", "Otros productos"), T("Tudo o que está <em>à venda no parque.</em>", "Everything <em>for sale in the park.</em>", "Todo lo que está <em>en venta en el parque.</em>"))}
  {cards_produtos(p)}
</section>
{sec_passos(p)}
{final(p, T("Encontrou <em>a sua unidade?</em>", "Found <em>your unit?</em>", "¿Encontró <em>su unidad?</em>"),
       T("Reserve com um consultor antes que ela saia do mapa.", "Reserve it with a consultant before it leaves the map.", "Resérvela con un consultor antes de que salga del mapa."))}'''
    return montar(p, T("Preços e disponibilidade · Bracerum Park", "Prices and availability · Bracerum Park", "Precios y disponibilidad · Bracerum Park"),
                  "Tabela vigente e lotes livres ao vivo no Bracerum Park, em Villeta, Paraguai — lotes industriais, apartamentos, casas, lojas e salas.",
                  "mapa", corpo,
                  T("Olá! Vim pelo QR Code do folder e quero a tabela e o mapa de disponibilidade do Bracerum Park.",
                    "Hello! I came from the brochure QR code and would like Bracerum Park’s price list and availability map.",
                    "¡Hola! Llegué por el código QR del folleto y quiero la tabla y el mapa de disponibilidad de Bracerum Park."), lotes=True)


# ===================================================================== 6. LP geral (cidade industrial)
def pg_geral():
    p = Pagina("folderlp", "folderlp", "geral", "Bracerum Park")
    form = formulario(
        p, T("Fale com o <em>Bracerum Park</em>", "Talk to <em>Bracerum Park</em>", "Hable con <em>Bracerum Park</em>"),
        T("Diga o que procura e receba a apresentação e a tabela no seu WhatsApp.", "Tell us what you are looking for and get the presentation and prices on WhatsApp.", "Díganos qué busca y reciba la presentación y la tabla en su WhatsApp."),
        OPCOES_TODOS + [("conhecer", T("Ainda conhecendo o projeto", "Still getting to know it", "Todavía conociendo el proyecto"), T("quero a apresentação geral", "I want the overview", "quiero la presentación general"), "geral")],
        empresa=True, enviar=T("Receber apresentação", "Get the presentation", "Recibir presentación"))
    corpo = hero(
        p, "assets/web/fotos/park-aereo-rio.jpg",
        T("Villeta · Paraguai · Mercosul", "Villeta · Paraguay · Mercosur", "Villeta · Paraguay · Mercosur"),
        T("Bracerum <em>Park</em>"),
        T("Uma cidade industrial completa: lotes, moradia, comércio, hotel, convenções e pista de pouso — num endereço só, no centro do Mercosul.",
          "A complete industrial city: lots, housing, retail, a hotel, conventions and a runway — at one address, at the heart of Mercosur.",
          "Una ciudad industrial completa: lotes, vivienda, comercio, hotel, convenciones y pista de aterrizaje — en una sola dirección, en el centro del Mercosur."),
        [T("1.819.856 m² planejados como cidade", "1,819,856 m² planned as a city", "1.819.856 m² planificados como ciudad"),
         T("Tributo único de 1% (Maquila)", "Single 1% tax (Maquila)", "Tributo único del 1% (Maquila)"),
         T("A 65 km de Assunção", "65 km from Asunción", "A 65 km de Asunción")],
        [("go", T("Conhecer os produtos", "See the products", "Conocer los productos"), "#produtos", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp"), "", "")], form)
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("1.819.856 m²", "1,819,856 m²", "1.819.856 m²"), T("planejados como uma cidade", "planned as a city", "planificados como una ciudad")),
             (T("614"), T("lotes industriais à venda", "industrial lots for sale", "lotes industriales en venta")),
             (T("1.452", "1,452", "1.452"), T("apartamentos no Residence", "apartments at the Residence", "departamentos en el Residence")),
             (T("1.460 m", "1,460 m", "1.460 m"), T("de pista de pouso própria", "private runway", "de pista de aterrizaje propia"))])}
</section>
<section class="sec paper2" id="produtos">
  {head_sec(p, T("O que tem no parque", "What the park offers", "Qué hay en el parque"),
            T("Uma cidade inteira <em>à venda.</em>", "A whole city <em>for sale.</em>", "Una ciudad entera <em>en venta.</em>"),
            T("Cada produto tem a sua página, com valores e disponibilidade. Escolha por onde começar.", "Each product has its own page, with prices and availability. Choose where to start.", "Cada producto tiene su página, con valores y disponibilidad. Elija por dónde empezar."))}
  {cards_produtos(p)}
  <div class="btns rv"><a class="btn btn--ink" href="../3dmasterplan/" data-track="open_3d">{p.tx("span", T("Explorar o masterplan 3D", "Explore the 3D masterplan", "Explorar el masterplan 3D"))}<span class="arrow" aria-hidden="true">→</span></a>
  <a class="btn btn--line" href="../hotel.html">{p.tx("span", T("Hotel & Convenções", "Hotel & Conventions", "Hotel & Convenciones"))}</a></div>
</section>
<section class="sec" id="cidade">
  {split(p, "assets/lp/park-hangar-jato.jpg", "Hangar do Bracerum Park",
         T("Tudo o que você precisa", "Everything you need", "Todo lo que necesita"),
         T("O entorno trabalha <em>a favor da operação.</em>", "The surroundings work <em>for your operation.</em>", "El entorno trabaja <em>a favor de la operación.</em>"),
         [T("O patrimônio fica protegido 24 horas, com acesso controlado, posto policial e bombeiros dentro do próprio perímetro. O Centro Tecnológico, a poucos passos da fábrica, recebe clientes, fornecedores e reuniões de diretoria sem que ninguém precise ir até a capital.",
            "Assets are protected 24 hours, with controlled access, a police post and a fire station inside the perimeter. The Technology Centre, a short walk from the plant, hosts clients, suppliers and board meetings without anyone driving to the capital.",
            "El patrimonio está protegido 24 horas, con acceso controlado, puesto policial y bomberos dentro del perímetro. El Centro Tecnológico, a pocos pasos de la fábrica, recibe clientes, proveedores y reuniones de directorio sin que nadie tenga que ir a la capital."),
          T("A creche e a escola fecham a conta: quem sabe que os filhos estão perto trabalha com mais foco, falta menos e fica mais tempo na empresa. Para o empresário, isso significa reter talentos e manter uma operação estável.",
            "The nursery and the school complete the picture: people who know their children are close work with more focus, miss fewer days and stay longer. For the business owner, that means retaining talent and running a stable operation.",
            "La guardería y la escuela cierran la cuenta: quien sabe que sus hijos están cerca trabaja con más foco, falta menos y se queda más tiempo en la empresa. Para el empresario, eso significa retener talento y mantener una operación estable.")],
         extra=feats(p, [("alfandega", T("Recinto alfandegado", "Bonded customs area", "Recinto aduanero"), None),
                         ("aviao", T("Pista de 1.460 m e hangares", "1,460 m runway and hangars", "Pista de 1.460 m y hangares"), None),
                         ("hotel", T("Hotel e centro de convenções", "Hotel and convention centre", "Hotel y centro de convenciones"), None),
                         ("escola", T("Escola, creche e ambulatório", "School, nursery and clinic", "Escuela, guardería y ambulatorio"), None)]))}
</section>
{sec_paraguai(p)}
{sec_logistica(p)}
{sec_passos(p)}
{sec_faq(p, [
    (T("O que é o Bracerum Park?", "What is Bracerum Park?", "¿Qué es Bracerum Park?"),
     T("Uma cidade industrial multiuso em Villeta, Paraguai: lotes industriais, recinto alfandegado, pista de pouso, Business Center com Outlet e Market, hotel e convenções, condomínios de apartamentos e de casas, escola e clube — num só endereço.",
       "A multi-use industrial city in Villeta, Paraguay: industrial lots, a bonded customs area, a runway, a Business Center with Outlet and Market, a hotel and conventions, apartment and house communities, a school and a club — at one address.",
       "Una ciudad industrial multiuso en Villeta, Paraguay: lotes industriales, recinto aduanero, pista de aterrizaje, Business Center con Outlet y Market, hotel y convenciones, condominios de departamentos y de casas, escuela y club — en una sola dirección.")),
    (T("Uma empresa estrangeira pode se instalar?", "Can a foreign company set up here?", "¿Una empresa extranjera puede instalarse?"),
     T("Sim. A sociedade paraguaia pode ter 100% de capital estrangeiro, sem exigência de sócio local, e as equipes jurídica e contábil do parque acompanham a constituição e o programa de Maquila.",
       "Yes. The Paraguayan company can be 100% foreign-owned with no local partner, and the park’s legal and accounting teams handle incorporation and the Maquila programme with you.",
       "Sí. La sociedad paraguaya puede tener 100% de capital extranjero, sin socio local, y los equipos jurídico y contable del parque acompañan la constitución y el programa de Maquila.")),
    FAQ_ONDE, FAQ_VISITA])}
{final(p, T("Vamos construir <em>a porta de entrada industrial do Mercosul?</em>", "Shall we build <em>Mercosur’s industrial gateway?</em>", "¿Construimos <em>la puerta de entrada industrial del Mercosur?</em>"),
       T("Fale direto com Cleber, no Paraguai, ou Sydney, no Brasil.", "Talk directly to Cleber in Paraguay or Sydney in Brazil.", "Hable directo con Cleber, en Paraguay, o Sydney, en Brasil."))}'''
    return montar(p, T("Bracerum Park — cidade industrial em Villeta, Paraguai", "Bracerum Park — industrial city in Villeta, Paraguay", "Bracerum Park — ciudad industrial en Villeta, Paraguay"),
                  "Lotes industriais, apartamentos, casas, lojas e salas numa cidade industrial completa em Villeta, Paraguai, com tributo único de 1% no regime de Maquila.",
                  "geral", corpo,
                  T("Olá! Vim pelo folder do Bracerum Park e quero conhecer o projeto.",
                    "Hello! I came from the Bracerum Park brochure and would like to know more about the project.",
                    "¡Hola! Llegué por el folleto de Bracerum Park y quiero conocer el proyecto."))


# ===================================================================== 7. Cadastro de corretores
# Não cadastra no CV: o formulário manda para /api/corretor, que grava uma linha na planilha
# "Leads Corretores" do Drive (Apps Script, docs/corretores-planilha.gs), e a conversa com o
# Sydney Savi abre no WhatsApp com a mensagem pronta. Fluxo e instalação: docs/corretores.md.
def formulario_corretor(p):
    ddi = "".join(f'<option value="{v}">{t}</option>' for v, t in DDI)
    return f'''<div class="form rv" id="form" data-kind="corretor">
  <div class="form__head">{p.tx("p", T("Cadastro de <em>corretor</em>", "Broker <em>sign-up</em>", "Registro de <em>corredor</em>"), "form__title")}</div>
  {p.tx("p", T("Três campos. Ao enviar, a conversa com Sydney Savi, da equipe comercial, abre no seu WhatsApp com a mensagem pronta.",
               "Three fields. When you send, a chat with Sydney Savi from the sales team opens on your WhatsApp, message ready.",
               "Tres campos. Al enviar, la conversación con Sydney Savi, del equipo comercial, se abre en su WhatsApp con el mensaje listo."), "form__sub")}
  <div class="form__bar"></div>
  <form novalidate>
    <label class="field">{p.tx("span", T("Nome", "Name", "Nombre"))}<input name="nome" autocomplete="name" required maxlength="100" /></label>
    <label class="field">{p.tx("span", T("WhatsApp"))}
      <span class="tel"><select name="ddi"{p.attr("ta", T("Código do país", "Country code", "Código de país"))}>{ddi}</select><input name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" required maxlength="20" /></span></label>
    <label class="field">{p.tx("span", T("Imobiliária", "Real estate agency", "Inmobiliaria"))}<input name="imobiliaria" autocomplete="organization" required maxlength="100"{p.attr("tp", T("Nome da imobiliária — ou “Autônomo”", "Agency name — or “Independent”", "Nombre de la inmobiliaria — o “Independiente”"))} /></label>
    <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
    <p class="form__err" role="alert"></p>
    <button type="submit" class="btn btn--ink" data-track="corretor_submit">{WA_SVG}{p.tx("span", T("Cadastrar e chamar no WhatsApp", "Sign up and chat on WhatsApp", "Registrarme y escribir por WhatsApp"))}</button>
    {p.tx("p", T("Ao enviar, você autoriza o Bracerum Park a falar com você pelo WhatsApp sobre a parceria.",
                 "By sending, you authorise Bracerum Park to contact you on WhatsApp about the partnership.",
                 "Al enviar, autoriza a Bracerum Park a contactarle por WhatsApp sobre la alianza."), "form__legal")}
  </form>
  <div class="done" hidden aria-live="polite"></div>
  <p class="form__trust">{LOCK_SVG}{p.tx("span", T(
      "Seus dados vão só para a equipe comercial do Bracerum Park.",
      "Your details go only to the Bracerum Park sales team.",
      "Sus datos van solo al equipo comercial de Bracerum Park."))}</p>
</div>'''


def pg_corretores():
    p = Pagina("corretores", "corretores", "corretores", "Corretores parceiros",
               cta=T("Cadastrar", "Sign up", "Registrarme"))
    corpo = hero(
        p, "assets/web/fotos/park-boulevard-aereo.jpg",
        T("Bracerum Park · Corretores parceiros", "Bracerum Park · Partner brokers", "Bracerum Park · Corredores asociados"),
        T("Corretor <em>parceiro</em>", "Partner <em>broker</em>", "Corredor <em>asociado</em>"),
        T("Uma cidade industrial inteira à venda em Villeta, no Paraguai — lotes industriais, apartamentos, casas e lojas. Cadastre-se para ofertar aos seus clientes, com material, tabela e atendimento direto da equipe comercial.",
          "A whole industrial city for sale in Villeta, Paraguay — industrial lots, apartments, houses and stores. Sign up to offer it to your clients, with materials, prices and direct support from the sales team.",
          "Una ciudad industrial entera en venta en Villeta, Paraguay — lotes industriales, departamentos, casas y locales. Regístrese para ofrecerla a sus clientes, con material, tabla y atención directa del equipo comercial."),
        [T("Quatro produtos num endereço só", "Four products at one address", "Cuatro productos en una sola dirección"),
         T("Tabela e disponibilidade ao vivo", "Live prices and availability", "Tabla y disponibilidad en vivo"),
         T("Atendimento direto com a equipe", "Direct line to the sales team", "Atención directa con el equipo")],
        [("go", T("Quero me cadastrar", "I want to sign up", "Quiero registrarme"), "#form", ' data-track="hero_cta"'),
         ("wa", T("WhatsApp"), "", "")],
        formulario_corretor(p))
    corpo += f'''
<section class="sec" id="numeros">
  {stats(p, [(T("614"), T("lotes industriais, de 1.250 m² a quadras inteiras", "industrial lots, from 1,250 m² to whole blocks", "lotes industriales, de 1.250 m² a manzanas enteras")),
             (T("1.452", "1,452", "1.452"), T("apartamentos de 1, 2 e 3 quartos e coberturas no Residence", "1, 2 and 3-bedroom flats and penthouses at the Residence", "departamentos de 1, 2 y 3 dormitorios y penthouses en el Residence")),
             (T("31"), T("lotes para casas no Bracerum Resort, a partir de 600 m²", "house lots at Bracerum Resort, from 600 m²", "lotes para casas en Bracerum Resort, desde 600 m²")),
             (T("57"), T("lojas na 1ª fase do Outlet Premium", "stores in phase 1 of the Premium Outlet", "locales en la 1ª fase del Outlet Premium"))])}
</section>
<section class="sec paper2" id="produtos">
  {head_sec(p, T("O que você vai ofertar", "What you will offer", "Qué va a ofrecer"),
            T("Um portfólio inteiro, <em>num endereço só.</em>", "A whole portfolio, <em>at one address.</em>", "Un portafolio entero, <em>en una sola dirección.</em>"),
            T("Do industrial ao residencial: cada produto tem a sua página, com valores e disponibilidade, para você conhecer antes de apresentar ao cliente.",
              "From industrial to residential: each product has its own page, with prices and availability, so you know it before presenting it to your client.",
              "De lo industrial a lo residencial: cada producto tiene su página, con valores y disponibilidad, para que lo conozca antes de presentarlo al cliente."))}
  {cards_produtos(p)}
  <div class="btns rv"><a class="btn btn--ink" href="../3dmasterplan/" data-track="open_3d">{p.tx("span", T("Explorar o masterplan 3D", "Explore the 3D masterplan", "Explorar el masterplan 3D"))}<span class="arrow" aria-hidden="true">→</span></a>
  <a class="btn btn--line" href="../foldermapadisponibilidade/" data-track="open_mapa">{p.tx("span", T("Preços e disponibilidade", "Prices and availability", "Precios y disponibilidad"))}</a></div>
</section>
<section class="sec" id="argumentos">
  {split(p, "assets/lp/park-hangar-jato.jpg", "Hangar do Bracerum Park com jato executivo",
         T("Argumentos de venda", "Selling points", "Argumentos de venta"),
         T("O que o seu cliente <em>não encontra em outro lugar.</em>", "What your client <em>won’t find anywhere else.</em>", "Lo que su cliente <em>no encuentra en otro lugar.</em>"),
         [T("O Bracerum Park reúne num só endereço o que uma indústria precisa para operar e o que as pessoas precisam para morar perto dela: lotes e galpões, recinto alfandegado, pista de pouso, centro de negócios, condomínios, escola e clube.",
            "Bracerum Park brings together at one address what an industry needs to operate and what people need to live close to it: lots and warehouses, a bonded customs area, a runway, a business centre, housing, a school and a club.",
            "Bracerum Park reúne en una sola dirección lo que una industria necesita para operar y lo que las personas necesitan para vivir cerca: lotes y galpones, recinto aduanero, pista de aterrizaje, centro de negocios, condominios, escuela y club."),
          T("Para o investidor industrial, o argumento é o Paraguai: tributo único de 1% no regime de Maquila, 100% de capital estrangeiro e 20 anos de benefícios garantidos. Para quem vai morar, é ter tudo a poucos passos do trabalho.",
            "For the industrial investor, the argument is Paraguay: a single 1% tax under the Maquila regime, 100% foreign ownership and 20 years of guaranteed benefits. For those who will live there, it is having everything a few steps from work.",
            "Para el inversor industrial, el argumento es Paraguay: tributo único del 1% en el régimen de Maquila, 100% de capital extranjero y 20 años de beneficios garantizados. Para quien va a vivir, es tener todo a pocos pasos del trabajo.")],
         extra=feats(p, [("pct", T("Regime de Maquila · 1%", "Maquila regime · 1%", "Régimen de Maquila · 1%"), None),
                         ("alfandega", T("Recinto alfandegado", "Bonded customs area", "Recinto aduanero"), None),
                         ("aviao", T("Pista de pouso de 1.460 m", "1,460 m runway", "Pista de aterrizaje de 1.460 m"), None),
                         ("praia", T("Praia artificial no Residence", "Artificial beach at the Residence", "Playa artificial en el Residence"), None)]),
         cap=T("Hangar e pátio de aeronaves · imagem ilustrativa", "Hangar and apron · illustrative image", "Hangar y plataforma · imagen ilustrativa"))}
</section>
{sec_paraguai(p)}
<section class="sec" id="como-funciona">
  {head_sec(p, T("Como funciona", "How it works", "Cómo funciona"), T("Três passos <em>até a primeira venda.</em>", "Three steps <em>to your first sale.</em>", "Tres pasos <em>hasta la primera venta.</em>"))}
  {steps(p, [
      (T("Cadastre-se", "Sign up", "Regístrese"),
       T("Nome, WhatsApp e imobiliária. Ao enviar, a conversa com Sydney Savi abre no seu WhatsApp, com a mensagem pronta.",
         "Name, WhatsApp and agency. When you send, a chat with Sydney Savi opens on your WhatsApp, message ready.",
         "Nombre, WhatsApp e inmobiliaria. Al enviar, la conversación con Sydney Savi se abre en su WhatsApp, con el mensaje listo.")),
      (T("Receba o material", "Get the materials", "Reciba el material"),
       T("Tabela vigente, mapa de disponibilidade ao vivo, maquete 3D do masterplan e as condições da parceria, direto com a equipe comercial.",
         "Current price list, live availability map, the 3D masterplan model and the partnership terms, straight from the sales team.",
         "Tabla vigente, mapa de disponibilidad en vivo, maqueta 3D del masterplan y las condiciones de la alianza, directo con el equipo comercial.")),
      (T("Apresente e reserve", "Present and reserve", "Presente y reserve"),
       T("Visita ao parque ou apresentação online pela maquete 3D, com o apoio da equipe. A reserva entra no mapa de vendas na hora.",
         "A site visit or an online presentation with the 3D model, backed by the team. The reservation goes into the sales map at once.",
         "Visita al parque o presentación en línea con la maqueta 3D, con el apoyo del equipo. La reserva entra al mapa de ventas al instante.")),
  ])}
</section>
{sec_faq(p, [
    (T("Quem pode se cadastrar?", "Who can sign up?", "¿Quién puede registrarse?"),
     T("Corretores de imóveis e imobiliárias. Quem trabalha por conta própria escreve “Autônomo” no campo da imobiliária.",
       "Real estate brokers and agencies. If you work on your own, write “Independent” in the agency field.",
       "Corredores inmobiliarios e inmobiliarias. Quien trabaja por cuenta propia escribe “Independiente” en el campo de la inmobiliaria.")),
    (T("Como funciona a comissão?", "How does the commission work?", "¿Cómo funciona la comisión?"),
     T("As condições da parceria — comissão, prazos e como cada venda fica registrada — são passadas pela equipe comercial no primeiro contato, depois do cadastro.",
       "The partnership terms — commission, timelines and how each sale is registered — are given by the sales team at the first contact, after you sign up.",
       "Las condiciones de la alianza — comisión, plazos y cómo queda registrada cada venta — las informa el equipo comercial en el primer contacto, después del registro.")),
    (T("O que eu posso ofertar?", "What can I offer?", "¿Qué puedo ofrecer?"),
     T("Lotes industriais a partir de 1.250 m² no Parque Industrial, apartamentos de 1, 2 e 3 quartos e coberturas no Bracerum Residence, lotes para casas no Bracerum Resort e lojas e salas no Business Center (Outlet, Market e Centro Tecnológico).",
       "Industrial lots from 1,250 m² at the Industrial Park, 1, 2 and 3-bedroom flats and penthouses at Bracerum Residence, house lots at Bracerum Resort, and stores and offices at the Business Center (Outlet, Market and Technology Centre).",
       "Lotes industriales desde 1.250 m² en el Parque Industrial, departamentos de 1, 2 y 3 dormitorios y penthouses en Bracerum Residence, lotes para casas en Bracerum Resort y locales y oficinas en el Business Center (Outlet, Market y Centro Tecnológico).")),
    (T("Como sei o que ainda está disponível?", "How do I know what is still available?", "¿Cómo sé qué sigue disponible?"),
     T("Pelo mapa de vendas ao vivo, na página de preços e disponibilidade, e pela maquete 3D do masterplan, lote por lote. Antes de fechar, a equipe confirma a posição do dia.",
       "Through the live sales map on the prices and availability page, and the 3D masterplan model, lot by lot. Before closing, the team confirms the day’s position.",
       "Con el mapa de ventas en vivo, en la página de precios y disponibilidad, y con la maqueta 3D del masterplan, lote por lote. Antes de cerrar, el equipo confirma la posición del día.")),
    (T("Posso levar clientes para visitar?", "Can I bring clients to visit?", "¿Puedo llevar clientes de visita?"),
     T("Sim. Agende com a equipe pelo WhatsApp. Para clientes de longe, a apresentação pode ser online, pela maquete 3D — lote por lote.",
       "Yes. Book with the team on WhatsApp. For clients far away, the presentation can be online, with the 3D model — lot by lot.",
       "Sí. Agende con el equipo por WhatsApp. Para clientes lejanos, la presentación puede ser en línea, con la maqueta 3D — lote por lote.")),
    FAQ_ONDE])}
{final(p, T("Vamos vender <em>juntos?</em>", "Shall we sell <em>together?</em>", "¿Vendemos <em>juntos?</em>"),
       T("Cadastre-se e fale direto com Sydney Savi, da equipe comercial do Bracerum Park.",
         "Sign up and talk directly to Sydney Savi from the Bracerum Park sales team.",
         "Regístrese y hable directo con Sydney Savi, del equipo comercial de Bracerum Park."),
       cta=T("Fazer meu cadastro", "Sign me up", "Hacer mi registro"), so_br=True)}'''
    return montar(p, T("Corretores parceiros · Bracerum Park", "Partner brokers · Bracerum Park", "Corredores asociados · Bracerum Park"),
                  "Cadastro de corretores e imobiliárias para ofertar o Bracerum Park: lotes industriais, apartamentos, casas e lojas em Villeta, Paraguai.",
                  "corretores", corpo,
                  T("Olá! Sou corretor(a) e tenho interesse em ofertar o Bracerum Park para os meus clientes.",
                    "Hello! I am a real estate broker and I am interested in offering Bracerum Park to my clients.",
                    "¡Hola! Soy corredor(a) inmobiliario(a) y tengo interés en ofrecer Bracerum Park a mis clientes."),
                  cfg_extra={"wa": WA_BR, "envio": "/api/corretor"})


PAGINAS = {
    "folderpark": (pg_park, "assets/lp/park-galpao-avenida.jpg"),
    "folderresidence": (pg_residence, "assets/lp/residence-praia.jpg"),
    "folderresort": (pg_resort, "assets/lp/resort-casa-modelo.jpg"),
    "folderbusinesscenter": (pg_business, "assets/lp/outlet-boulevard.jpg"),
    "foldermapadisponibilidade": (pg_mapa, "3dmasterplan/data/poster.jpg"),
    "folderlp": (pg_geral, "assets/web/fotos/park-aereo-rio.jpg"),
    "corretores": (pg_corretores, "assets/web/fotos/park-boulevard-aereo.jpg"),
}


def og(slug, foto):
    """Imagem de compartilhamento 1200×630 (recorte da foto do hero, sem texto)."""
    out = os.path.join(ROOT, f"assets/lp/og-{slug}.jpg")
    im = Image.open(os.path.join(ROOT, foto)).convert("RGB")
    w, h = im.size
    alvo = 1200 / 630
    if w / h > alvo:
        nw = int(h * alvo)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / alvo)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((1200, 630), Image.LANCZOS).save(out, quality=78, optimize=True, progressive=True)


def main():
    for slug, (fn, foto) in PAGINAS.items():
        pagina = fn()
        os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
        with open(os.path.join(ROOT, slug, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(pagina)
        og(slug, foto)
        print(f"{slug}/index.html  {len(pagina.encode()) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
