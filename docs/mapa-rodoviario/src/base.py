"""Camadas de fundo (terra por país, água, rios, estradas, fronteira) em SVG."""
from collections import defaultdict
from shapely.geometry import Point
from engine import union_polys, merge_lines, d_of, country_faces, lines

PAL = {
    # versão clara: "ink" é o fundo/halo, "paper" o traço principal, "sand" o acento marrom
    "ink": "#ffffff", "py": "#f4efe4", "urban": "#e4dccb",
    "water": "#bcd4e6", "river": "#4f8dbd",
    "road1": "#c4b38c", "road2": "#d9cfb9", "road3": "#e6dfd0",
    "border": "#473315", "sand": "#473315", "paper": "#0e0d0b",
}

BIG_RIVERS = {"Río Paraguay", "Rio Paraguai", "Rio Paraná", "Río Paraná"}
MAIN_RIVERS = BIG_RIVERS | {"Río Pilcomayo", "Río Tebicuary", "Río Tebicuary Mí", "Rio Iguaçu", "Río Acaray",
                            "Río Monday", "Rio Apa", "Río Aquidabán", "Río Jejuí", "Río Ypané", "Río Bermejo",
                            "Río Confuso", "Río Salado", "Río Negro", "Río Manduvirá", "Rio Piquiri",
                            "Río Aguaray Guazú", "Río Pilcomayo (brazo sur)", "Río Paraná"}


def base_layers(view, items, countries, detail=False):
    g = defaultdict(list)
    named_rivers = defaultdict(list)
    for ln, p, geom in items:
        cls = p.get("class")
        if ln == "water" and cls in ("lake", "river", "pond", "ocean"):
            g["water"].append(geom)
        elif ln == "waterway" and cls in ("river", "canal") or (detail and ln == "waterway" and cls == "stream" and p.get("name")):
            nm = p.get("name") or ""
            key = "river_big" if nm in BIG_RIVERS else "river" if nm in MAIN_RIVERS else "creek"
            g[key].append(geom)
            if nm:
                named_rivers[nm].append(geom)
        elif ln == "landuse" and cls in ("residential", "suburb", "neighbourhood", "commercial", "industrial", "retail"):
            g["urban"].append(geom)
        elif ln == "transportation" and not p.get("brunnel") == "tunnel":
            if cls in ("motorway", "trunk"):
                g["road1"].append(geom)
            elif cls == "primary":
                g["road2"].append(geom)
            elif detail and cls in ("secondary", "tertiary"):
                g["road3"].append(geom)
            elif cls == "ferry":
                g["ferry"].append(geom)
        elif ln == "boundary" and p.get("admin_level") == 2 and not p.get("maritime"):
            g["border"].append(geom)

    faces = country_faces(view, items, countries)
    W = {"road1": 1.5 if not detail else 2.2, "road2": 0.9 if not detail else 1.5,
         "road3": 0.9, "river": 0.9 if not detail else 1.3, "river_big": 1.7 if not detail else 1.8,
         "creek": 0.6 if not detail else 0.8}

    out = [f'<rect width="{view.w}" height="{view.h}" fill="{PAL["ink"]}"/>']
    if "PRY" in faces:
        out.append(f'<path d="{d_of(faces["PRY"].simplify(0.3))}" fill="{PAL["py"]}"/>')
    if g["urban"]:
        out.append(f'<path d="{d_of(union_polys(g["urban"], 0.4))}" fill="{PAL["urban"]}"/>')
    water = union_polys(g["water"], 0.2)
    out.append(f'<path d="{d_of(water)}" fill="{PAL["water"]}" fill-rule="evenodd"/>')
    for k in ("creek", "river", "river_big"):
        if g[k]:
            op = ' stroke-opacity=".45"' if k == "creek" else ""
            out.append(f'<path d="{d_of(merge_lines(g[k], 0.3))}" fill="none" stroke="{PAL["river"]}"{op} '
                       f'stroke-width="{W[k]}" stroke-linecap="round" stroke-linejoin="round"/>')
    for k in ("road3", "road2", "road1"):
        if g[k]:
            out.append(f'<path d="{d_of(merge_lines(g[k], 0.3))}" fill="none" stroke="{PAL[k]}" '
                       f'stroke-width="{W[k]}" stroke-linecap="round" stroke-linejoin="round"/>')
    if g["ferry"]:
        out.append(f'<path d="{d_of(merge_lines(g["ferry"], 0.3))}" fill="none" stroke="{PAL["sand"]}" '
                   f'stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="3 3"/>')
    if g["border"]:
        bd = d_of(merge_lines(g["border"], 0.3))
        out.append(f'<path d="{bd}" fill="none" stroke="{PAL["border"]}" stroke-opacity=".13" '
                   f'stroke-width="{8 if detail else 6}" stroke-linejoin="round" stroke-linecap="round"/>')
        out.append(f'<path d="{bd}" fill="none" stroke="{PAL["border"]}" stroke-opacity=".7" '
                   f'stroke-width="1.2" stroke-dasharray="6 3 1.5 3"/>')
    rivers = {k: merge_lines(v, 0.5) for k, v in named_rivers.items()}
    return "\n".join(out), rivers, water, faces
