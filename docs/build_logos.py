#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera os logos web dos sub-projetos e o favicon adaptativo.

    python3 docs/build_logos.py            # escreve em assets/logo/ e assets/

PRECISA RODAR DE NOVO SE:
  - o cliente reenviar um SVG em assets/Bracerum {Hotel,Resort,Select}/SVG/;
  - o cliente reenviar assets/FavIcon{Branco,Preto}.svg;
  - a paleta mudar (CREAM/INK abaixo).

POR QUE ELE EXISTE
Os SVGs que o cliente manda saem do Illustrator com <text> vivo em fontes
proprietarias (NotoSerif-ExtraCondensed*, HelveticaLTPro-Bold). Dentro de um
<img> o SVG e um documento isolado: as webfonts que a pagina carrega nao
chegam nele e o texto cai numa serifada de sistema, com larguras erradas — o
logo sai deformado. Este script redesenha o texto como <path>, com a fonte
certa, e o arquivo passa a nao depender de fonte nenhuma.

Substitutos usados (conferidos contra o PNG de referencia do cliente em
assets/Bracerum Hotel/PNG/Logo Hotel 02@200x.png):
  NotoSerif-ExtraCondensed*  ->  Noto Serif variavel em wdth=62.5
  HelveticaLTPro-Bold        ->  Liberation Sans Bold (metricas de Helvetica)

DEPENDENCIAS
  pip install fonttools uharfbuzz
  Noto Serif variavel (OFL) em docs/fonts/:
    curl -L -o 'docs/fonts/NotoSerif[wdth,wght].ttf' \
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif%5Bwdth%2Cwght%5D.ttf'
    curl -L -o 'docs/fonts/NotoSerif-Italic[wdth,wght].ttf' \
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-Italic%5Bwdth%2Cwght%5D.ttf'
  Liberation Sans Bold: pacote fonts-liberation.
"""

import re, sys, os, copy
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTDIR = os.environ.get("BP_FONTDIR", os.path.join(HERE, "fonts"))
NOTO = os.path.join(FONTDIR, "NotoSerif[wdth,wght].ttf")
NOTO_IT = os.path.join(FONTDIR, "NotoSerif-Italic[wdth,wght].ttf")
HELV = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

_cache = {}


def get_font(path, wght=None, wdth=None):
    key = (path, wght, wdth)
    if key in _cache:
        return _cache[key]
    tt = TTFont(path)
    if wght is not None:
        tt = instancer.instantiateVariableFont(
            tt, {"wght": wght, "wdth": wdth}, inplace=False, optimize=False
        )
    blob = hb.Blob.from_file_path(path)
    face = hb.Face(blob)
    hbfont = hb.Font(face)
    if wght is not None:
        hbfont.set_variations({"wght": wght, "wdth": wdth})
    _cache[key] = (tt, hbfont)
    return _cache[key]


WEIGHT_BY_NAME = [
    ("ExtraLight", 200), ("SemiBold", 600), ("Medium", 500),
    ("Light", 300), ("Bold", 700), ("Black", 900),
]


def resolve_font(family, weight, style):
    fam = family or ""
    if "Helvetica" in fam:
        return HELV, None, None
    italic = style == "italic" or "Italic" in fam
    wdth = 62.5 if "ExtraCondensed" in fam else (75.0 if "Condensed" in fam else 100.0)
    if weight is None:
        weight = 400
        for name, w in WEIGHT_BY_NAME:
            if name in fam:
                weight = w
                break
    return (NOTO_IT if italic else NOTO), float(weight), wdth


# ---------------------------------------------------------------- CSS
def parse_css(text):
    rules = {}
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", text):
        props = {}
        for decl in body.split(";"):
            if ":" not in decl:
                continue
            k, v = decl.split(":", 1)
            props[k.strip()] = v.strip()
        for s in sel.split(","):
            s = s.strip()
            if s.startswith("."):
                rules.setdefault(s[1:], {}).update(props)
    return rules


def style_of(el, css, inherited):
    st = dict(inherited)
    for cls in (el.get("class") or "").split():
        st.update(css.get(cls, {}))
    if el.get("style"):
        for decl in el.get("style").split(";"):
            if ":" in decl:
                k, v = decl.split(":", 1)
                st[k.strip()] = v.strip()
    for attr in ("font-family", "font-size", "font-weight", "font-style",
                 "letter-spacing", "fill"):
        if el.get(attr):
            st[attr] = el.get(attr)
    return st


def px(v, default=None):
    if v is None:
        return default
    m = re.match(r"^\s*(-?[\d.]+)", v)
    return float(m.group(1)) if m else default


# ---------------------------------------------------------------- shaping
def run_to_path(txt, x, y, st):
    family = st.get("font-family", "")
    size = px(st.get("font-size"), 16.0)
    weight = px(st.get("font-weight"))
    fstyle = (st.get("font-style") or "").strip()
    path, wght, wdth = resolve_font(family, weight, fstyle)
    tt, hbfont = get_font(path, wght, wdth)
    upem = tt["head"].unitsPerEm
    scale = size / upem

    ls = st.get("letter-spacing", "0")
    if ls.endswith("em"):
        extra = float(ls[:-2] or 0) * size
    elif ls.endswith("px"):
        extra = float(ls[:-2] or 0)
    else:
        extra = 0.0

    buf = hb.Buffer()
    buf.add_str(txt)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})

    glyphset = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    spen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    pen_x = x
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = order[info.codepoint]
        gx = pen_x + pos.x_offset * scale
        gy = y - pos.y_offset * scale
        tp = TransformPen(spen, (scale, 0, 0, -scale, gx, gy))
        glyphset[gname].draw(tp)
        pen_x += pos.x_advance * scale + extra
    return spen.getCommands()


# ---------------------------------------------------------------- walk
def collect_runs(el, css, inherited, x, y, out):
    """Percorre <text>/<tspan> juntando (texto, x, y, estilo)."""
    st = style_of(el, css, inherited)
    cx = px(el.get("x"), x)
    cy = px(el.get("y"), y)

    if el.text and el.text.strip():
        out.append((el.text, cx, cy, st))
    for child in el:
        tag = child.tag.split("}")[-1]
        if tag == "tspan":
            collect_runs(child, css, st, cx, cy, out)
        if child.tail and child.tail.strip():
            out.append((child.tail, cx, cy, st))


def convert(src, dst, fill=None, strip_style=True, pad_right=0.0):
    raw = open(src, encoding="utf-8").read()
    tree = ET.ElementTree(ET.fromstring(raw))
    root = tree.getroot()

    css = {}
    for style_el in root.iter(f"{{{SVG}}}style"):
        css.update(parse_css(style_el.text or ""))

    parents = {c: p for p in root.iter() for c in p}
    for text_el in list(root.iter(f"{{{SVG}}}text")):
        runs = []
        collect_runs(text_el, css, {}, 0.0, 0.0, runs)
        g = ET.Element(f"{{{SVG}}}g")
        if text_el.get("transform"):
            g.set("transform", text_el.get("transform"))
        for txt, x, y, st in runs:
            d = run_to_path(txt, x, y, st)
            if not d.strip():
                continue
            p = ET.SubElement(g, f"{{{SVG}}}path")
            p.set("d", d)
            p.set("fill", fill or st.get("fill", "#000"))
        parent = parents[text_el]
        idx = list(parent).index(text_el)
        parent.remove(text_el)
        parent.insert(idx, g)

    # recolore o que sobrou (poligonos do losango) e dispensa o <style>
    if fill:
        for el in root.iter():
            tag = el.tag.split("}")[-1]
            if tag in ("polygon", "path", "rect", "circle", "polyline"):
                el.set("fill", fill)
                if el.get("class"):
                    cls = el.get("class")
                    props = {}
                    for c in cls.split():
                        props.update(css.get(c, {}))
                    if props.get("fill-rule"):
                        el.set("fill-rule", props["fill-rule"])
                    del el.attrib["class"]
    if strip_style:
        for parent in list(root.iter()):
            for child in list(parent):
                if child.tag == f"{{{SVG}}}style":
                    parent.remove(child)
        for parent in list(root.iter()):
            for child in list(parent):
                if child.tag == f"{{{SVG}}}defs" and len(child) == 0:
                    parent.remove(child)
        for el in root.iter():
            if el.get("class") and el.tag != f"{{{SVG}}}svg":
                del el.attrib["class"]

    # O contorno real e ~0,1% mais largo que a caixa do Illustrator (instancia
    # variavel vs. estatica da Noto Serif). Sem folga, a haste final do "m" da
    # Bracerum encosta na borda do viewBox e o <img> corta a sobra.
    if pad_right:
        x, y, w, h = (float(v) for v in re.split(r"[ ,]+", root.get("viewBox").strip()))
        root.set("viewBox", f"{x:g} {y:g} {w + pad_right:g} {h:g}")

    out = ET.tostring(root, encoding="unicode")
    out = '<?xml version="1.0" encoding="UTF-8"?>\n' + out + "\n"
    open(dst, "w", encoding="utf-8").write(out)
    print(f"  {dst}  ({len(out)//1024 or 1} KB)")


# ---------------------------------------------------------------- favicon
FAVICON_TPL = """<?xml version="1.0" encoding="UTF-8"?>
<!-- GERADO por docs/build_logos.py a partir de assets/FavIcon{{Preto,Branco}}.svg.
     Um arquivo so: o proprio SVG troca de cor com o tema do navegador.
     Chrome ignora o atributo media em <link rel="icon">, entao a media query
     tem que morar aqui dentro — e nao em dois links. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}">
  <style>
    path, polygon {{ fill: {light}; }}
    @media (prefers-color-scheme: dark) {{
      path, polygon {{ fill: {dark}; }}
    }}
  </style>
{shapes}
</svg>
"""


def build_favicon(src_light, dst, light, dark):
    """Junta os dois favicons do cliente num SVG que troca de cor sozinho."""
    raw = open(src_light, encoding="utf-8").read()
    viewbox = re.search(r'viewBox="([^"]+)"', raw).group(1)
    shapes = []
    for tag, attrs in re.findall(r"<(polygon|path)\s+([^>]*?)/>", raw):
        keep = " ".join(
            f'{k}="{v}"' for k, v in re.findall(r'(\w[\w-]*)="([^"]*)"', attrs)
            if k in ("points", "d")
        )
        shapes.append(f'  <{tag} {keep} fill-rule="evenodd"/>')
    out = FAVICON_TPL.format(
        viewbox=viewbox, light=light, dark=dark, shapes="\n".join(shapes)
    )
    open(dst, "w", encoding="utf-8").write(out)
    print(f"  {dst}  ({len(out) // 1024 or 1} KB)")


# ---------------------------------------------------------------- build
CREAM = "#fff8ef"   # mesmo creme dos logos do Park em assets/logo/
INK = "#0e0d0b"     # --ink do style.css

# (svg do cliente, nome de saida, folga a direita no viewBox)
# A folga do Hotel: o contorno real fica ~0,2 unidade mais largo que a caixa
# do Illustrator e o <img> cortava a ultima haste do "m" de Bracerum.
LOCKUPS = [
    ("Bracerum Hotel/SVG/Logo Hotel 02.svg", "hotel", 1.0),
    ("Bracerum Resort/SVG/Logo Resort 04.svg", "resort", 0.0),
    ("Bracerum Select/SVG/Logo Select 01.svg", "select", 0.0),
]


def main():
    assets = os.path.join(ROOT, "assets")
    print("logos dos sub-projetos:")
    for src, name, pad in LOCKUPS:
        for suffix, fill in (("cream", CREAM), ("ink", INK)):
            convert(
                os.path.join(assets, src),
                os.path.join(assets, "logo", f"{name}-{suffix}.svg"),
                fill,
                pad_right=pad,
            )
    print("favicon:")
    build_favicon(
        os.path.join(assets, "FavIconPreto.svg"),
        os.path.join(assets, "favicon.svg"),
        light=INK,
        dark=CREAM,
    )


if __name__ == "__main__":
    main()
