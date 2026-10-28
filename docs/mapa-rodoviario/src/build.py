"""Mapa rodoviário do Bracerum Park — PDF 16:9.

Esquerda: o Paraguai oriental com as rotas até as fronteiras.
Direita: o entorno imediato (Villeta, Terport, Assunção, Puerto Falcón, Alberdi).

Regerar (a partir de docs/mapa-rodoviario/):
  pip install shapely mapbox-vector-tile
  python3 src/fetch.py tiles                      # tiles OpenFreeMap (não versionados)
  curl -L -o ne/countries.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson
  Noto Serif em fonts/NotoSerif.ttf e fonts/NotoSerif-Italic.ttf; logo em logo.svg
    (cp ../../assets/logo/logo-horizontal-cream.svg logo.svg)
  python3 src/routes.py routes.json               # só se os pontos mudarem (OSRM)
  python3 src/build.py mapa.html && node src/shot.js "$PWD/mapa.html" mapa.png 1920 1080 mapa-rodoviario-bracerum-park.pdf
"""
import sys, os, json, math, html
sys.path.insert(0, os.path.dirname(__file__))
from shapely.geometry import LineString, Point
from shapely.ops import substring
from engine import View, load, load_countries, d_of, along, haversine, merge_lines
from base import base_layers, PAL

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 1080
SPLIT = 1120

PARK = (-25.771694, -57.732389)

# km/tempo: catálogo do cliente (fonte de verdade do site). Puerto Falcón e
# Pedro Juan Caballero não estão no catálogo: rota OSRM, arredondada.
DEST = {
    "terport": dict(ll=(-25.6128, -57.6050), kind="port", name="Terport Villeta",
                    sub="Porto de contêineres", km="23 km", t="20 min"),
    "asuncion": dict(ll=(-25.2867, -57.6470), kind="cap", name="Assunção",
                     sub="Capital do Paraguai", km="65 km", t="1 h 10"),
    "falcon": dict(ll=(-25.2643, -57.7245), kind="bord", name="Puerto Falcón | Clorinda",
                   sub="Fronteira AR · ponte sobre o Pilcomayo", km="96 km", t="1 h 40"),
    "alberdi": dict(ll=(-26.1870, -58.1290), kind="bord", name="Alberdi | Formosa",
                    sub="Fronteira AR · balsa no rio Paraguai", km="72 km", t="1 h"),
    "posadas": dict(ll=(-27.3738, -55.8734), kind="bord", name="Encarnación | Posadas",
                    sub="Fronteira AR · ponte sobre o Paraná", km="355 km", t="4 h 40"),
    "amizade": dict(ll=(-25.5095, -54.6022), kind="bord", name="Ciudad del Este | Foz do Iguaçu",
                    sub="Fronteira BR · Ponte da Amizade", km="360 km", t="5 h"),
    "pjc": dict(ll=(-22.5498, -55.7384), kind="bord", name="Pedro Juan Caballero | Ponta Porã",
                sub="Fronteira BR · divisa seca", km="525 km", t="8 h 20"),
}


def esc(s):
    return html.escape(s, quote=True)


def halo_text(x, y, s, cls, anchor="start", extra=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" class="{cls}" text-anchor="{anchor}" {extra}>'
            f'{s}</text>')


def marker(kind, x, y, big=False):
    if kind == "park":
        r = 11 if big else 8
        return (f'<g class="mk-park"><rect x="{x - r * 1.9:.1f}" y="{y - r * 1.9:.1f}" width="{r * 3.8:.1f}" '
                f'height="{r * 3.8:.1f}" transform="rotate(45 {x:.1f} {y:.1f})" fill="none" '
                f'stroke="{PAL["paper"]}" stroke-opacity=".45" stroke-width="1"/>'
                f'<rect x="{x - r:.1f}" y="{y - r:.1f}" width="{2 * r}" height="{2 * r}" '
                f'transform="rotate(45 {x:.1f} {y:.1f})" fill="{PAL["paper"]}" stroke="{PAL["ink"]}" stroke-width="2"/></g>')
    if kind == "port":
        return (f'<rect x="{x - 6:.1f}" y="{y - 6:.1f}" width="12" height="12" fill="{PAL["sand"]}" '
                f'stroke="{PAL["ink"]}" stroke-width="2"/>')
    if kind == "cap":
        return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="none" stroke="{PAL["paper"]}" stroke-width="1.6"/>'
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="{PAL["paper"]}"/>')
    if kind == "bord":
        return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="8" fill="{PAL["ink"]}" stroke="{PAL["sand"]}" stroke-width="2"/>'
                f'<line x1="{x:.1f}" y1="{y - 5:.1f}" x2="{x:.1f}" y2="{y + 5:.1f}" stroke="{PAL["sand"]}" stroke-width="2"/>')
    if kind == "town":
        return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="{PAL["paper"]}" fill-opacity=".7"/>'
    return ""


def dest_label(d, x, y, dx, dy, anchor="start", size="l"):
    """Bloco: NOME / km · tempo / descrição. (x,y) é o marcador; dx,dy o deslocamento."""
    lx, ly = x + dx, y + dy
    name = esc(d["name"]).replace(" | ", ' <tspan class="sep">↔</tspan> ')
    km_cls = "d-km" if size == "l" else "d-km d-km--s"
    out = [halo_text(lx, ly, name.upper(), "d-name", anchor),
           halo_text(lx, ly + (31 if size == "l" else 27),
                     f'{esc(d["km"])}<tspan class="d-t"> · {esc(d["t"])}</tspan>', km_cls, anchor),
           halo_text(lx, ly + (51 if size == "l" else 45), esc(d["sub"]), "d-sub", anchor)]
    return "".join(out)


def leader(x0, y0, x1, y1):
    return (f'<path d="M{x0:.1f},{y0:.1f}L{x1:.1f},{y1:.1f}" stroke="{PAL["paper"]}" stroke-opacity=".5" '
            f'stroke-width="1" fill="none"/>')


def river_label(view, rivers, name, at, text, off=12, span=2.6, cls="riv"):
    """Rótulo reto na direção geral do rio (a corda de um trecho longo), deslocado
    `off` px para o lado: seguir os meandros deixava o texto ilegível."""
    line = rivers.get(name)
    if line is None or line.is_empty:
        print("  rio sem linha:", name)
        return ""
    p = Point(view.px(*at))
    tl = len(text) * 8.2
    if line.geom_type == "MultiLineString":
        ok = [g for g in line.geoms if g.length >= tl] or list(line.geoms)
        line = min(ok, key=lambda g: g.distance(p))
    L = min(tl * span, line.length)
    d = line.project(p)
    a = min(max(0, d - L / 2), line.length - L)
    seg = substring(line, a, a + L)
    (x0, y0), (x1, y1) = seg.coords[0], seg.coords[-1]
    ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
    if ang > 90:
        ang -= 180
    elif ang < -90:
        ang += 180
    c = line.interpolate(d)
    r = math.radians(ang)
    cx, cy = c.x - math.sin(r) * off, c.y + math.cos(r) * off
    return (f'<text class="{cls}" text-anchor="middle" transform="translate({cx:.1f} {cy:.1f}) rotate({ang:.1f})" '
            f'dy="4">{esc(text)}</text>')


def shield(x, y, ref):
    w = 7.2 * len(ref) + 12
    return (f'<g class="shield"><rect x="{x - w / 2:.1f}" y="{y - 9:.1f}" width="{w:.1f}" height="18" '
            f'fill="{PAL["ink"]}" stroke="{PAL["sand"]}" stroke-opacity=".75" stroke-width="1"/>'
            f'<text x="{x:.1f}" y="{y + 4:.1f}" text-anchor="middle">{esc(ref)}</text></g>')


def shield_on_road(view, items, ref, near, dxy=(0, 0)):
    """Escudo de rodovia sobre o trecho com esse `ref` mais próximo de `near`."""
    p = Point(view.px(*near))
    best = None
    for ln, props, g in items:
        if ln == "transportation_name" and props.get("ref") and ref in props["ref"].split(";"):
            dd = g.distance(p)
            if best is None or dd < best[0]:
                best = (dd, g)
    if best is None:
        print("  sem rodovia", ref)
        return ""
    q = best[1].interpolate(best[1].project(p))
    return shield(q.x + dxy[0], q.y + dxy[1], ref)


def route_paths(view, R, keys, dashed=()):
    halo, line = [], []
    for k in keys:
        pts = [view.px(a, b) for a, b in R[k]["pts"]]
        l = LineString(pts).simplify(0.35)
        d = d_of(l)
        halo.append(f'<path d="{d}"/>')
        line.append(f'<path d="{d}"/>')
    return (f'<g fill="none" stroke="{PAL["sand"]}" stroke-opacity=".16" stroke-width="11" '
            f'stroke-linecap="round" stroke-linejoin="round">{"".join(halo)}</g>'
            f'<g fill="none" stroke="{PAL["sand"]}" stroke-width="3.2" stroke-linecap="round" '
            f'stroke-linejoin="round">{"".join(line)}</g>')


def scalebar(view, x, y, km, lat=PARK[0], label=None):
    w = km * view.km_px(lat)
    half = w / 2
    return (f'<g class="scale"><rect x="{x}" y="{y}" width="{half:.1f}" height="4" fill="{PAL["paper"]}"/>'
            f'<rect x="{x + half:.1f}" y="{y}" width="{half:.1f}" height="4" fill="none" stroke="{PAL["paper"]}" stroke-width="1"/>'
            f'<text x="{x}" y="{y - 8}" class="sc">0</text>'
            f'<text x="{x + w:.1f}" y="{y - 8}" class="sc" text-anchor="middle">{label or f"{km} km"}</text></g>')


def place_xy(view, items, name, ll):
    """Ponto do OSM com esse nome mais perto de `ll`; sem ele, o próprio `ll`."""
    ex, ey = view.px(*ll)
    best = None
    for ln, p, g in items:
        if ln == "place" and p.get("name") == name and g.geom_type == "Point":
            dd = math.hypot(g.x - ex, g.y - ey)
            if dd < 40 and (best is None or dd < best[0]):
                best = (dd, (g.x, g.y))
    if best is None:
        print("  sem lugar no OSM, uso a coordenada:", name)
        return ex, ey
    return best[1]


def towns(view, items, spec):
    """spec: [(nome_osm, (lat, lon), rótulo, dx, dy, anchor)]"""
    out = []
    for nm, ll, lbl, dx, dy, anc in spec:
        x, y = place_xy(view, items, nm, ll)
        out.append(marker("town", x, y))
        out.append(halo_text(x + dx, y + dy, esc(lbl), "town", anc))
    return "".join(out)


def build():
    C = load_countries(os.path.join(ROOT, "ne/countries.geojson"))
    R = json.load(open(os.path.join(ROOT, "routes.json")))
    region = View(8, -60.9, -53.9, -21.6, -27.75, SPLIT, H)
    detail = View(11, -58.28, -57.30, -25.12, -26.30, W - SPLIT, H)

    # ------------------------------------------------------------------ regional
    it = load(region, os.path.join(ROOT, "tiles"))
    base, rivers, water, faces = base_layers(region, it, C)
    v = region
    g = [base]
    # moldura do detalhe
    x0, y0 = v.px(detail.ll(0, 0)[0], detail.ll(0, 0)[1])
    x1, y1 = v.px(detail.ll(detail.w, detail.h)[0], detail.ll(detail.w, detail.h)[1])
    g.append(route_paths(v, R, ["posadas", "amizade", "pjc", "asuncion", "terport", "falcon", "alberdi"]))
    g.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1 - x0:.1f}" height="{y1 - y0:.1f}" fill="none" '
             f'stroke="{PAL["paper"]}" stroke-opacity=".75" stroke-width="1.2"/>')
    g.append(halo_text(x0, y0 - 8, "DETALHE →", "frame-tag"))

    # rios
    g.append(river_label(v, rivers, "Río Paraguay", (-24.35, -57.35), "Rio Paraguai"))
    g.append(river_label(v, rivers, "Rio Paraná", (-24.6, -54.33), "Rio Paraná"))
    g.append(river_label(v, rivers, "Rio Paraná", (-27.5, -58.2), "Rio Paraná", off=16))
    g.append(river_label(v, rivers, "Río Pilcomayo", (-24.6, -59.4), "Rio Pilcomayo"))
    g.append(river_label(v, rivers, "Río Tebicuary", (-26.58, -57.7), "Rio Tebicuary", off=-12))

    # países
    for txt, ll in (("PARAGUAI", (-24.2, -55.75)), ("ARGENTINA", (-25.75, -59.85)),
                    ("ARGENTINA", (-27.1, -54.85)), ("BRASIL", (-22.2, -55.0))):
        x, y = v.px(*ll)
        g.append(halo_text(x, y, " ".join(txt), "country", "middle"))

    g.append(towns(v, it, [
        ("Coronel Oviedo", (-25.447, -56.440), "Coronel Oviedo", 0, -10, "middle"),
        ("Concepción", (-23.406, -57.434), "Concepción", -7, 4, "end"),
        ("Pilar", (-26.858, -58.300), "Pilar", 8, 4, "start"),
        ("San Juan Bautista", (-26.669, -57.145), "San Juan Bautista", 7, 4, "start"),
        ("Paraguarí", (-25.620, -57.147), "Paraguarí", 7, 12, "start"),
        ("Salto del Guairá", (-24.063, -54.306), "Salto del Guairá", -7, 4, "end"),
        ("San Pedro de Ycuamandiyú", (-24.088, -57.075), "San Pedro", 7, 4, "start"),
    ]))

    # escudos
    for ref, near in (("PY01", (-26.55, -57.02)), ("PY02", (-25.38, -56.95)), ("PY07", (-25.47, -55.6)),
                      ("PY06", (-26.6, -55.5)), ("PY03", (-24.3, -56.45)), ("PY05", (-23.25, -56.3)),
                      ("BR-277", (-25.5, -54.35)), ("RN12", (-27.42, -57.4))):
        g.append(shield_on_road(v, it, ref, near))

    # destinos
    for k, (dx, dy, anc) in {"posadas": (-16, -60, "end"), "amizade": (-14, 38, "end"),
                             "pjc": (-16, -4, "end")}.items():
        d = DEST[k]
        x, y = v.px(*d["ll"])
        g.append(marker(d["kind"], x, y))
        g.append(dest_label(d, x, y, dx, dy, anc))
    # nomes curtos do lado de lá da fronteira
    xy = place_xy(v, it, "Asunción", DEST["asuncion"]["ll"])
    g.append(halo_text(xy[0] + 12, xy[1] - 8, "Assunção", "town town--hi"))
    px, py = v.px(*PARK)
    g.append(marker("park", px, py))
    g.append(halo_text(px + 18, py + 22, "BRACERUM PARK", "park-name"))

    region_svg = "\n".join(g)

    # ------------------------------------------------------------------ detalhe
    it2 = load(detail, os.path.join(ROOT, "tiles"))
    base2, rivers2, water2, faces2 = base_layers(detail, it2, C, detail=True)
    v = detail
    g = [base2]
    g.append(route_paths(v, R, ["posadas", "amizade", "pjc", "asuncion", "terport", "falcon", "alberdi"]))
    g.append(river_label(v, rivers2, "Río Paraguay", (-25.92, -57.98), "Rio Paraguai", off=-16))
    # para onde seguem as rotas longas que saem pela borda leste
    fr = v.frame().exterior
    exits = {}
    for k in ("amizade", "pjc", "posadas"):
        ls = LineString([v.px(a, b) for a, b in R[k]["pts"]])
        q = ls.intersection(fr)
        q = q if q.geom_type == "Point" else list(q.geoms)[0]
        exits.setdefault((round(q.x), round(q.y)), []).append(k)
    names = {"amizade": "Ciudad del Este", "pjc": "Pedro Juan Caballero", "posadas": "Encarnación"}
    for (ex, ey), ks in exits.items():
        txt = " · ".join(names[k] for k in ks)
        g.append(halo_text(ex - 10, ey - 9, f'{esc(txt)} <tspan class="arr">→</tspan>', "exit", "end"))
    for txt, ll in (("ARGENTINA", (-25.62, -58.05)), ("PARAGUAI", (-25.86, -57.47))):
        x, y = v.px(*ll)
        g.append(halo_text(x, y, " ".join(txt), "country country--d", "middle"))
    g.append(towns(v, it2, [
        ("Villeta", (-25.5045, -57.5694), "Villeta", 9, 4, "start"),
        ("Formosa", (-26.185, -58.173), "Formosa", 0, 20, "middle"),
        ("San Antonio", (-25.42, -57.55), "San Antonio", 8, 4, "start"),
        ("Itá", (-25.508, -57.363), "Itá", -8, 4, "end"),
        ("Guarambaré", (-25.49, -57.455), "Guarambaré", 8, 4, "start"),
        ("Villa Oliva", (-26.006, -57.887), "Villa Oliva", 8, 4, "start"),
    ]))
    for k, (dx, dy, anc, lx, ly) in {
        "asuncion": (20, -2, "start", None, None),
        "falcon": (-22, 4, "end", None, None),
        "terport": (20, -6, "start", None, None),
        "alberdi": (20, -26, "start", None, None),
    }.items():
        d = DEST[k]
        x, y = v.px(*d["ll"])
        g.append(marker(d["kind"], x, y))
        g.append(dest_label(d, x, y, dx, dy, anc))
    px, py = v.px(*PARK)
    g.append(marker("park", px, py, big=True))
    g.append(halo_text(px + 30, py - 4, "BRACERUM PARK", "park-name park-name--l"))
    g.append(halo_text(px + 30, py + 18, "Villeta · Central · Paraguai", "park-sub"))
    g.append(scalebar(v, 40, H - 40, 10))
    detail_svg = "\n".join(g)
    return region_svg, detail_svg, region, detail


CSS = """
@font-face{font-family:"Noto Serif";src:url("fonts/NotoSerif.ttf");font-weight:100 900;font-style:normal}
@font-face{font-family:"Noto Serif";src:url("fonts/NotoSerif-Italic.ttf");font-weight:100 900;font-style:italic}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;background:#0e0d0b;overflow:hidden}
body{position:relative;font-family:Helvetica,"Helvetica Neue",Arial,"Liberation Sans",sans-serif;color:#f7f3ea;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
svg{position:absolute;top:0;display:block}
svg text{paint-order:stroke;stroke:#0e0d0b;stroke-linejoin:round}
.d-name{font:700 13px Helvetica,Arial,sans-serif;letter-spacing:.14em;fill:#f7f3ea;stroke-width:4px}
.d-name .sep{fill:#cbb88f;font-weight:400}
.d-km{font:400 27px "Noto Serif",serif;fill:#f7f3ea;stroke-width:5px}
.d-km--s{font-size:23px}
.d-t{font-style:italic;fill:#cbb88f}
.d-sub{font:400 12.5px Helvetica,Arial,sans-serif;fill:#cbb88f;fill-opacity:.85;stroke-width:4px;letter-spacing:.02em}
.town{font:400 12.5px Helvetica,Arial,sans-serif;fill:#f7f3ea;fill-opacity:.62;stroke-width:3.5px}
.town--hi{font-weight:700;fill-opacity:.85;letter-spacing:.06em}
.country{font:600 17px Helvetica,Arial,sans-serif;fill:#f7f3ea;fill-opacity:.26;stroke-width:0;letter-spacing:.32em}
.country--d{font-size:15px}
.riv{font:italic 400 14.5px "Noto Serif",serif;fill:#7eb2d6;stroke-width:3.5px;letter-spacing:.04em}
.shield text{font:700 10.5px Helvetica,Arial,sans-serif;fill:#cbb88f;stroke-width:0;letter-spacing:.04em}
.park-name{font:700 14px Helvetica,Arial,sans-serif;letter-spacing:.2em;fill:#f7f3ea;stroke-width:5px}
.park-name--l{font-size:17px}
.park-sub{font:italic 400 15px "Noto Serif",serif;fill:#cbb88f;stroke-width:4px}
.exit{font:italic 400 14px "Noto Serif",serif;fill:#cbb88f;stroke-width:4px}
.arr{font-family:Helvetica,Arial,"Liberation Sans",sans-serif;font-style:normal}
.frame-tag{font:700 10.5px Helvetica,Arial,sans-serif;letter-spacing:.18em;fill:#f7f3ea;fill-opacity:.75;stroke-width:3px}
.sc{font:400 11.5px Helvetica,Arial,sans-serif;fill:#f7f3ea;fill-opacity:.7;stroke-width:0}
.divider{position:absolute;top:0;bottom:0;left:1120px;width:2px;background:#0e0d0b}
.head{position:absolute;left:48px;top:44px;width:470px}
.eyebrow{font:700 12.5px Helvetica,Arial,sans-serif;letter-spacing:.24em;color:#cbb88f;text-transform:uppercase;
  display:flex;align-items:center;gap:12px}
.eyebrow::before{content:"";width:28px;height:1px;background:#cbb88f}
.logo{display:block;width:250px;height:auto}
h1{font:400 66px/1 "Noto Serif",serif;margin-top:34px;letter-spacing:-.01em}
h1 em{font-style:italic;color:#cbb88f}
.lede{font:400 16px/1.5 Helvetica,Arial,sans-serif;color:rgba(247,243,234,.72);margin-top:16px;max-width:400px}
.veil{position:absolute;left:0;top:0;width:760px;height:420px;
  background:radial-gradient(ellipse 100% 100% at 0 0,rgba(14,13,11,.94) 0,rgba(14,13,11,.8) 45%,rgba(14,13,11,0) 100%)}
.legend{position:absolute;left:32px;bottom:32px;width:318px;padding:20px 20px 18px;font:400 12.5px/1.35 Helvetica,Arial,sans-serif;
  color:rgba(247,243,234,.8);background:rgba(14,13,11,.86);border:1px solid rgba(203,184,143,.18)}
.legend .sc-row{display:flex;align-items:flex-end;justify-content:space-between;margin-top:16px;padding-top:14px;
  border-top:1px solid rgba(203,184,143,.18)}
.legend .sc-row svg text{paint-order:normal}
.legend h3{font:700 11px Helvetica,Arial,sans-serif;letter-spacing:.22em;color:#cbb88f;text-transform:uppercase;margin-bottom:10px}
.legend ul{list-style:none;display:grid;gap:7px}
.legend li{display:flex;align-items:center;gap:12px}
.legend svg{position:static;flex:none}
.dtag{position:absolute;left:1160px;top:40px;font:700 11px Helvetica,Arial,sans-serif;letter-spacing:.22em;
  color:#cbb88f;text-transform:uppercase}
.dtag b{display:block;font:italic 400 20px "Noto Serif",serif;letter-spacing:0;color:#f7f3ea;text-transform:none;margin-top:6px}
.foot{position:absolute;left:1122px;right:0;bottom:0;height:120px;
  background:linear-gradient(to top,rgba(14,13,11,.9),rgba(14,13,11,0))}
.credits{position:absolute;right:32px;bottom:18px;font:400 10px Helvetica,Arial,sans-serif;color:rgba(247,243,234,.5);
  text-align:right;max-width:720px;line-height:1.45}
"""


def legend_html(region):
    def sw(svg):
        return f'<svg width="34" height="20" viewBox="0 0 34 20">{svg}</svg>'
    rows = [
        (sw(f'<rect x="10" y="3" width="14" height="14" transform="rotate(45 17 10)" fill="{PAL["paper"]}"/>'), "Bracerum Park"),
        (sw(f'<path d="M2,10H32" stroke="{PAL["sand"]}" stroke-opacity=".2" stroke-width="10"/><path d="M2,10H32" stroke="{PAL["sand"]}" stroke-width="3.2"/>'),
         "Rota rodoviária a partir do Park"),
        (sw(f'<circle cx="17" cy="10" r="7" fill="{PAL["ink"]}" stroke="{PAL["sand"]}" stroke-width="2"/><line x1="17" y1="6" x2="17" y2="14" stroke="{PAL["sand"]}" stroke-width="2"/>'),
         "Passagem de fronteira"),
        (sw(f'<rect x="11" y="4" width="12" height="12" fill="{PAL["sand"]}"/>'), "Porto"),
        (sw(f'<path d="M2,10H32" stroke="{PAL["road1"]}" stroke-width="2.2"/>'), "Rodovia nacional"),
        (sw(f'<path d="M2,10H32" stroke="{PAL["border"]}" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="6 3 1.5 3"/>'),
         "Fronteira internacional"),
        (sw(f'<rect x="2" y="5" width="30" height="10" fill="{PAL["water"]}"/><path d="M2,10H32" stroke="{PAL["river"]}" stroke-width="1.6"/>'),
         "Rio / lago"),
    ]
    lis = "".join(f"<li>{a}<span>{b}</span></li>" for a, b in rows)
    w = 100 * region.km_px(PARK[0])
    sc = (f'<svg width="{w + 30:.0f}" height="30" viewBox="0 0 {w + 30:.0f} 30">'
          f'<rect x="1" y="22" width="{w / 2:.1f}" height="4" fill="{PAL["paper"]}"/>'
          f'<rect x="{1 + w / 2:.1f}" y="22.5" width="{w / 2:.1f}" height="3" fill="none" stroke="{PAL["paper"]}"/>'
          f'<text x="1" y="14" class="sc">0</text><text x="{1 + w / 2:.1f}" y="14" class="sc" text-anchor="middle">50</text>'
          f'<text x="{1 + w:.1f}" y="14" class="sc" text-anchor="middle">100 km</text></svg>')
    north = (f'<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13,2 L21,24 L13,19 L5,24Z" fill="{PAL["paper"]}"/>'
             f'<text x="13" y="33" class="sc" text-anchor="middle">N</text></svg>')
    return (f'<div class="legend"><h3>Legenda</h3><ul>{lis}</ul>'
            f'<div class="sc-row">{sc}{north}</div></div>')


def page(region_svg, detail_svg, region, detail):
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Bracerum Park — Mapa rodoviário</title><style>{CSS}</style></head><body>
<svg style="left:0" width="{region.w}" height="{region.h}" viewBox="0 0 {region.w} {region.h}">{region_svg}</svg>
<svg style="left:{SPLIT}px" width="{detail.w}" height="{detail.h}" viewBox="0 0 {detail.w} {detail.h}">{detail_svg}</svg>
<div class="divider"></div>
<div class="veil"></div>
<div class="foot"></div>
<div class="head">
  <img class="logo" src="logo.svg" alt="Bracerum Park">
  <h1>Mapa <em>rodoviário</em></h1>
  <p class="lede">Distâncias por estrada a partir do Park, em Villeta, até o porto, a capital e as passagens de fronteira com a Argentina e o Brasil.</p>
</div>
{legend_html(region)}
<div class="dtag">Detalhe<b>Villeta · Assunção · Clorinda</b></div>
<div class="credits">Distâncias e tempos por estrada: catálogo Bracerum Park; Puerto Falcón e Pedro Juan Caballero calculados pela rota (OSRM).<br>
Base cartográfica © colaboradores do OpenStreetMap (ODbL) · OpenMapTiles · OpenFreeMap. Tempos de referência para veículo leve · outubro de 2026.</div>
</body></html>"""


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "mapa.html")
    r, d, rv, dv = build()
    open(out, "w").write(page(r, d, rv, dv))
    print("ok", out)
