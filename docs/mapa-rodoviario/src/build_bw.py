"""Mapa de localização do Bracerum Park — preto e branco, 16:9.

Malha viária completa do OSM (tiles z12 do OpenFreeMap) entre Assunção e o Park,
água em hachura, três marcos (Park, Terport, aeroporto ASU) e um mapa do
Paraguai no canto mostrando onde fica Villeta.

Regerar (a partir de docs/mapa-rodoviario/, mesmos pré-requisitos do build.py):
  python3 -c "exec(open('src/fetch.py').read().split('print(TPL)')[0]); fetch(12, -58.35, -25.92, -56.95, -25.10)" tiles
  cp ../../assets/logo/logo-horizontal-white.svg logo-white.svg
  python3 src/build_bw.py pb.html && node src/shot.js "$PWD/pb.html" pb.png 1920 1080 mapa-localizacao-pb-bracerum-park.pdf
"""
import sys, os, json, math, html
sys.path.insert(0, os.path.dirname(__file__))
from collections import defaultdict
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from engine import View, load, d_of, union_polys, merge_lines, polys, load_countries

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 1080
BG, FG = "#0b0b0b", "#f4f4f2"

PARK = (-25.771694, -57.732389)
TERPORT = (-25.6128, -57.6050)
ASU = (-25.2400, -57.5191)           # Aeroporto Internacional Silvio Pettirossi
ASUNCION = (-25.2867, -57.6470)

ROAD_W = {"motorway": 2.6, "trunk": 2.4, "primary": 1.8, "secondary": 1.35,
          "tertiary": 1.05, "minor": 0.55}
ROAD_OP = {"motorway": 1, "trunk": 1, "primary": .95, "secondary": .85, "tertiary": .7, "minor": .42}


def esc(s):
    return html.escape(s, quote=True)


def base(view, items):
    g = defaultdict(list)
    for ln, p, geom in items:
        cls = p.get("class")
        if ln == "water" and cls in ("lake", "river", "pond"):
            g["water"].append(geom)
        elif ln == "waterway" and cls == "river":
            g["river"].append(geom)
        elif ln == "transportation" and cls in ROAD_W and p.get("brunnel") != "tunnel":
            g[cls].append(geom)
        elif ln == "transportation" and cls == "ferry":
            g["ferry"].append(geom)
    water = union_polys(g["water"], 0.25)
    water = unary_union([q for q in polys(water) if q.area > 60])
    out = [f'<rect width="{view.w}" height="{view.h}" fill="{BG}"/>',
           f'<path d="{d_of(water)}" fill="url(#hatch)" fill-rule="evenodd" stroke="{FG}" '
           f'stroke-opacity=".75" stroke-width=".8"/>']
    if g["river"]:
        out.append(f'<path d="{d_of(merge_lines(g["river"], 0.3))}" fill="none" stroke="{FG}" '
                   f'stroke-opacity=".7" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>')
    for cls in ("minor", "tertiary", "secondary", "primary", "trunk", "motorway"):
        if g[cls]:
            out.append(f'<path d="{d_of(merge_lines(g[cls], 0.25))}" fill="none" stroke="{FG}" '
                       f'stroke-opacity="{ROAD_OP[cls]}" stroke-width="{ROAD_W[cls]}" '
                       f'stroke-linecap="round" stroke-linejoin="round"/>')
    if g["ferry"]:
        out.append(f'<path d="{d_of(merge_lines(g["ferry"], 0.3))}" fill="none" stroke="{FG}" '
                   f'stroke-opacity=".7" stroke-width="1" stroke-dasharray="3 3"/>')
    return "\n".join(out)


def text(x, y, s, cls, anchor="middle", extra=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" class="{cls}" text-anchor="{anchor}" {extra}>{s}</text>'


# ícones 24x24, desenhados em branco sobre um recorte preto (o "knockout" que
# afasta as ruas do símbolo, como no mapa de referência)
PLANE = ('<path d="M12 1.6c.9 0 1.5.8 1.5 1.7v5.6l8 4.7v2.1l-8-2.5v5.1l2.3 1.7v1.6L12 21l-3.8 1v-1.6'
         'l2.3-1.7v-5.1l-8 2.5v-2.1l8-4.7V3.3c0-.9.6-1.7 1.5-1.7z" fill="#f4f4f2"/>')
ANCHOR = ('<g fill="none" stroke="#f4f4f2" stroke-width="1.8" stroke-linecap="round">'
          '<circle cx="12" cy="4.2" r="2.2"/><path d="M12 6.4V21.5M7.5 9.6h9"/>'
          '<path d="M3.6 13.2c0 4.9 3.8 8.3 8.4 8.3s8.4-3.4 8.4-8.3"/>'
          '<path d="M2 14.6l1.6-1.8 1.7 1.8M18.7 14.6l1.7-1.8 1.6 1.8"/></g>')


def icon(x, y, svg, size=30):
    s = size / 24
    return (f'<rect x="{x - size / 2 - 7:.1f}" y="{y - size / 2 - 7:.1f}" width="{size + 14}" height="{size + 14}" fill="{BG}"/>'
            f'<g transform="translate({x - size / 2:.1f} {y - size / 2:.1f}) scale({s:.3f})">{svg}</g>')


def park_mark(x, y):
    r = 13
    return (f'<rect x="{x - 30}" y="{y - 30}" width="60" height="60" transform="rotate(45 {x:.1f} {y:.1f})" fill="{BG}"/>'
            f'<rect x="{x - r * 1.75:.1f}" y="{y - r * 1.75:.1f}" width="{r * 3.5:.1f}" height="{r * 3.5:.1f}" '
            f'transform="rotate(45 {x:.1f} {y:.1f})" fill="none" stroke="{FG}" stroke-width="1"/>'
            f'<rect x="{x - r:.1f}" y="{y - r:.1f}" width="{2 * r}" height="{2 * r}" '
            f'transform="rotate(45 {x:.1f} {y:.1f})" fill="{FG}"/>')


def place_xy(view, items, name, ll):
    ex, ey = view.px(*ll)
    best = None
    for ln, p, g in items:
        if ln == "place" and p.get("name") == name and g.geom_type == "Point":
            dd = math.hypot(g.x - ex, g.y - ey)
            if dd < 60 and (best is None or dd < best[0]):
                best = (dd, (g.x, g.y))
    return best[1] if best else (ex, ey)


def inset_paraguay(countries, w=250, h=290):
    """Silhueta do Paraguai (Natural Earth) com Villeta marcada."""
    py = countries["PRY"]
    v = View(0, -62.8, -54.1, -19.2, -27.7, w, h)
    from shapely import affinity
    lon0, lat0 = v.ll(0, 0)[1], v.ll(0, 0)[0]
    # projeta vértice a vértice (Mercator)
    def proj(geom):
        from shapely.ops import transform
        return transform(lambda xs, ys, z=None: tuple(zip(*[v.px(yy, xx) for xx, yy in zip(xs, ys)])), geom)
    pp = proj(py).simplify(0.4)
    x, y = v.px(-25.5045, -57.5694)
    ax, ay = v.px(*ASUNCION)
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<path d="{d_of(pp)}" fill="url(#hatch2)" stroke="{FG}" stroke-width="1.3" stroke-linejoin="round"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="15" fill="none" stroke="{FG}" stroke-width="1"/>'
            f'<rect x="{x - 5:.1f}" y="{y - 5:.1f}" width="10" height="10" transform="rotate(45 {x:.1f} {y:.1f})" fill="{FG}"/>'
            f'<text x="{x - 22:.1f}" y="{y + 5:.1f}" class="in-lbl" text-anchor="end">VILLETA</text>'
            f'</svg>')


def build():
    C = load_countries(os.path.join(ROOT, "ne/countries.geojson"))
    v = View(12, -58.22, -56.96, -25.17, -25.885, W, H)
    print("escala", round(v.s), "px/grau", round(v.km_px(-25.5), 1), "px/km")
    it = load(v, os.path.join(ROOT, "tiles"), margin=30)
    g = [base(v, it)]

    # rótulos de área
    for txt, ll, cls in (("A R G E N T I N A", (-25.56, -57.97), "country"),
                         ("P A R A G U A I", (-25.60, -57.30), "country"),
                         ("RIO PARAGUAI", None, None)):
        if ll:
            x, y = v.px(*ll)
            g.append(text(x, y, txt, cls))
    # rio: rótulo reto ao lado do canal, como no mapa de referência
    for ll, ang, anc in (((-25.455, -57.665), -62, "middle"), ((-25.70, -57.76), -58, "middle")):
        x, y = v.px(*ll)
        g.append(f'<text class="riv" text-anchor="{anc}" transform="translate({x:.1f} {y:.1f}) rotate({ang})">'
                 f'RIO PARAGUAI</text>')
    lx, ly = v.px(-25.33, -57.305)
    g.append(text(lx, ly, "LAGO YPACARAÍ", "riv"))

    for nm, ll, lbl, dx, dy, anc in (
        ("Asunción", ASUNCION, "ASSUNÇÃO", 0, -26, "middle"),
        ("Villeta", (-25.5045, -57.5694), "VILLETA", 12, 5, "start"),
        ("Clorinda", (-25.284, -57.718), "CLORINDA", -12, 5, "end"),
        ("San Lorenzo", (-25.34, -57.51), "SAN LORENZO", 12, 5, "start"),
        ("Itá", (-25.508, -57.363), "ITÁ", 12, 5, "start"),
        ("Lambaré", (-25.346, -57.606), "LAMBARÉ", 12, 5, "start"),
        ("Capiatá", (-25.355, -57.445), "CAPIATÁ", 12, 5, "start"),
    ):
        x, y = place_xy(v, it, nm, ll)
        big = nm == "Asunción"
        if not big:
            g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="{FG}" stroke="{BG}" stroke-width="2"/>')
        g.append(text(x + dx, y + dy, lbl, "town town--big" if big else "town", anc))

    # marcos
    x, y = v.px(*ASU)
    g.append(icon(x, y, PLANE))
    g.append(text(x, y + 40, "AEROPORTO", "poi"))
    g.append(text(x, y + 60, "INTERNACIONAL ASU", "poi"))
    x, y = v.px(*TERPORT)
    g.append(icon(x, y, ANCHOR))
    g.append(text(x + 30, y + 6, "TERPORT", "poi poi--l", "start"))
    g.append(text(x + 30, y + 26, "terminal de contêineres", "poi-sub", "start"))
    x, y = v.px(*PARK)
    g.append(park_mark(x, y))
    g.append(text(x + 40, y + 2, "BRACERUM PARK", "park", "start"))
    g.append(text(x + 40, y + 28, "Villeta · Paraguai", "poi-sub poi-sub--l", "start"))

    # escala
    km5 = 5 * v.km_px(PARK[0])
    sx, sy = 1290, 1036
    g.append(f'<g><rect x="{sx}" y="{sy}" width="{km5:.1f}" height="3" fill="{FG}"/>'
             f'<rect x="{sx + km5:.1f}" y="{sy}" width="{km5:.1f}" height="3" fill="none" stroke="{FG}" stroke-width=".8"/>'
             f'<text x="{sx}" y="{sy - 8}" class="sc">0</text>'
             f'<text x="{sx + km5:.1f}" y="{sy - 8}" class="sc" text-anchor="middle">5</text>'
             f'<text x="{sx + 2 * km5:.1f}" y="{sy - 8}" class="sc" text-anchor="middle">10 km</text></g>')
    return "\n".join(g), v, inset_paraguay(C)


CSS = """
@font-face{font-family:"Noto Serif";src:url("fonts/NotoSerif.ttf");font-weight:100 900;font-style:normal}
@font-face{font-family:"Noto Serif";src:url("fonts/NotoSerif-Italic.ttf");font-weight:100 900;font-style:italic}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;background:#0b0b0b;overflow:hidden}
body{position:relative;font-family:Helvetica,Arial,"Liberation Sans",sans-serif;color:#f4f4f2;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
svg{display:block}
svg text{paint-order:stroke;stroke:#0b0b0b;stroke-linejoin:round;fill:#f4f4f2}
.map{position:absolute;inset:0}
.country{font:400 22px "Noto Serif",serif;letter-spacing:.32em;fill-opacity:.55;stroke-width:6px}
.riv{font:italic 400 15px "Noto Serif",serif;letter-spacing:.22em;stroke-width:5px}
.town{font:400 13px "Noto Serif",serif;letter-spacing:.14em;stroke-width:5px;fill-opacity:.9}
.town--big{font-size:22px;letter-spacing:.24em;fill-opacity:1;stroke-width:7px}
.poi{font:400 15px "Noto Serif",serif;letter-spacing:.16em;stroke-width:6px}
.poi--l{font-size:19px}
.poi-sub{font:italic 400 14px "Noto Serif",serif;stroke-width:5px;fill-opacity:.8}
.poi-sub--l{font-size:17px}
.park{font:700 22px Helvetica,Arial,sans-serif;letter-spacing:.22em;stroke-width:8px}
.sc{font:400 11px Helvetica,Arial,sans-serif;stroke-width:0}
.in-lbl{font:400 12px "Noto Serif",serif;letter-spacing:.18em;stroke-width:4px}
.head{position:absolute;left:56px;top:52px;padding:22px 26px 22px 0;background:#0b0b0b;box-shadow:0 0 0 22px #0b0b0b}
.logo{display:block;width:230px}
.eyebrow{margin-top:16px;font:400 13px "Noto Serif",serif;letter-spacing:.26em}
.inset{position:absolute;left:56px;bottom:56px;padding:18px 20px 14px;background:#0b0b0b;border:1px solid rgba(244,244,242,.5)}
.inset .t{font:400 12px "Noto Serif",serif;letter-spacing:.3em;margin-bottom:10px}
.note{position:absolute;right:56px;bottom:84px;width:380px;padding:18px 0 0;background:#0b0b0b;box-shadow:0 0 0 20px #0b0b0b;
  font:400 11.5px/1.55 Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-align:justify}
.note b{font-weight:700}
.north{position:absolute;right:56px;top:56px}
.credit{position:absolute;right:56px;bottom:22px;font:400 9.5px Helvetica,Arial,sans-serif;color:rgba(244,244,242,.55)}
"""

DEFS = (f'<defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">'
        f'<path d="M0,2H4" stroke="{FG}" stroke-width=".7" stroke-opacity=".6"/></pattern>'
        f'<pattern id="hatch2" patternUnits="userSpaceOnUse" width="4" height="4">'
        f'<path d="M0,2H4" stroke="{FG}" stroke-width=".6" stroke-opacity=".35"/></pattern></defs>')


def page(svg, v, inset):
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Bracerum Park — Localização</title><style>{CSS}</style></head><body>
<svg class="map" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}{svg}</svg>
<div class="head"><img class="logo" src="logo-white.svg" alt="Bracerum Park"><div class="eyebrow">VILLETA · PARAGUAI</div></div>
<div class="inset"><div class="t">PARAGUAI</div>
<svg width="0" height="0" style="position:absolute">{DEFS}</svg>{inset}</div>
<svg class="north" width="30" height="44" viewBox="0 0 30 44"><path d="M15,2 L24,28 L15,22 L6,28Z" fill="#f4f4f2"/>
<text x="15" y="42" text-anchor="middle" style="font:400 12px 'Noto Serif',serif;stroke-width:0">N</text></svg>
<div class="note"><b>A localização</b> — o Bracerum Park fica em Villeta, no Departamento Central, à margem do rio Paraguai,
a hidrovia que liga o país ao Atlântico. O Terport, terminal de contêineres de Villeta, está a 23 km pela estrada;
Assunção e o Aeroporto Internacional Silvio Pettirossi (ASU), a cerca de uma hora.</div>
<div class="credit">Base cartográfica © colaboradores do OpenStreetMap (ODbL) · OpenMapTiles · OpenFreeMap</div>
</body></html>"""


if __name__ == "__main__":
    out = sys.argv[1]
    svg, v, inset = build()
    open(out, "w").write(page(svg, v, inset))
    print("ok", out)
