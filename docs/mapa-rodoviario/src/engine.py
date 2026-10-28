"""Motor do mapa: lê tiles vetoriais OpenMapTiles (OpenFreeMap / OSM), projeta em
Web Mercator para uma janela em pixels e devolve geometrias prontas para SVG."""
import math, os, json
from collections import defaultdict
from shapely.geometry import shape, box, LineString, Point, Polygon, MultiPolygon, MultiLineString
from shapely.ops import unary_union, linemerge, polygonize, substring, nearest_points
from shapely import affinity, make_valid, set_precision
import mapbox_vector_tile as mvt


def mercY(lat):
    return math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


def invY(Y):
    return math.degrees(2 * math.atan(math.exp(math.radians(Y))) - math.pi / 2)


def tx(lon, z):
    return int((lon + 180) / 360 * 2 ** z)


def ty(lat, z):
    r = math.radians(lat)
    return int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** z)


def haversine(a, b):
    (la1, lo1), (la2, lo2) = a, b
    p = math.pi / 180
    h = (math.sin((la2 - la1) * p / 2) ** 2 +
         math.cos(la1 * p) * math.cos(la2 * p) * math.sin((lo2 - lo1) * p / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(h))


class View:
    """Janela de mapa: centro, escala (px por grau de longitude) e tamanho em px."""

    def __init__(self, z, lon0, lon1, lat_top, lat_bot, w, h):
        self.z, self.w, self.h = z, w, h
        sx = w / (lon1 - lon0)
        sy = h / (mercY(lat_top) - mercY(lat_bot))
        self.s = min(sx, sy)
        self.lonc = (lon0 + lon1) / 2
        self.Yc = (mercY(lat_top) + mercY(lat_bot)) / 2

    def px(self, lat, lon):
        return ((lon - self.lonc) * self.s + self.w / 2,
                (self.Yc - mercY(lat)) * self.s + self.h / 2)

    def ll(self, x, y):
        return invY(self.Yc - (y - self.h / 2) / self.s), (x - self.w / 2) / self.s + self.lonc

    def km_px(self, lat):
        """px por km na latitude dada."""
        return self.s / (111.32 * math.cos(math.radians(lat)))

    def tile_affine(self, x, y, E):
        n = 2 ** self.z
        a = 360 / (n * E) * self.s
        xoff = (x / n * 360 - 180 - self.lonc) * self.s + self.w / 2
        yoff = (self.Yc - 180 * (1 - 2 * y / n)) * self.s + self.h / 2
        return [a, 0, 0, a, xoff, yoff]

    def frame(self, m=0):
        return box(-m, -m, self.w + m, self.h + m)


WANT = {"water", "waterway", "boundary", "transportation", "transportation_name",
        "place", "landuse", "landcover", "water_name"}


def load(view, tiledir, margin=60):
    """Lê todos os tiles da janela e devolve (camada, props, geom-em-px)."""
    frame = view.frame(margin)
    lat_b, lon_l = view.ll(-margin, view.h + margin)
    lat_t, lon_r = view.ll(view.w + margin, -margin)
    z = view.z
    out = []
    for x in range(tx(lon_l, z), tx(lon_r, z) + 1):
        for y in range(ty(lat_t, z), ty(lat_b, z) + 1):
            p = os.path.join(tiledir, str(z), f"{x}_{y}.pbf")
            if not os.path.exists(p):
                print("  falta tile", p)
                continue
            d = mvt.decode(open(p, "rb").read(), default_options={"y_coord_down": True})
            for lname, layer in d.items():
                if lname not in WANT:
                    continue
                E = layer.get("extent", 4096)
                tb = box(0, 0, E, E)
                A = view.tile_affine(x, y, E)
                for f in layer["features"]:
                    try:
                        g = shape(f["geometry"])
                    except Exception:
                        continue
                    if g.is_empty:
                        continue
                    if not g.is_valid:
                        g = make_valid(g)
                    if g.geom_type != "Point":
                        g = g.intersection(tb)
                    elif not tb.covers(g):
                        continue
                    if g.is_empty:
                        continue
                    g = affinity.affine_transform(g, A)
                    if g.geom_type != "Point":
                        g = g.intersection(frame)
                    elif not frame.covers(g):
                        continue
                    if g.is_empty:
                        continue
                    out.append((lname, f["properties"], g))
    return out


def polys(g):
    if g.is_empty:
        return []
    if g.geom_type == "Polygon":
        return [g]
    if g.geom_type == "MultiPolygon":
        return list(g.geoms)
    if g.geom_type == "GeometryCollection":
        r = []
        for h in g.geoms:
            r += polys(h)
        return r
    return []


def lines(g):
    if g.is_empty:
        return []
    if g.geom_type == "LineString":
        return [g]
    if g.geom_type == "MultiLineString":
        return list(g.geoms)
    if g.geom_type == "GeometryCollection":
        r = []
        for h in g.geoms:
            r += lines(h)
        return r
    return []


def union_polys(gs, simp=0.25, grid=0.01):
    ps = []
    for g in gs:
        ps += polys(g)
    if not ps:
        return Polygon()
    u = unary_union([set_precision(p, grid) for p in ps])
    return u.simplify(simp, preserve_topology=True)


def merge_lines(gs, simp=0.3, grid=0.01):
    ls = []
    for g in gs:
        ls += lines(g)
    if not ls:
        return MultiLineString()
    u = unary_union([set_precision(l, grid) for l in ls])
    m = linemerge(u) if u.geom_type != "LineString" else u
    return m.simplify(simp, preserve_topology=False)


def d_of(g, prec=1):
    """Geometria shapely -> atributo d do SVG."""
    f = f"{{:.{prec}f}}"

    def ring(cs, close):
        cs = list(cs)
        if len(cs) < 2:
            return ""
        s = "M" + " ".join(f.format(x) + "," + f.format(y) for x, y in cs[:1])
        s += "L" + " ".join(f.format(x) + "," + f.format(y) for x, y in cs[1:])
        return s + ("Z" if close else "")

    parts = []
    for p in polys(g):
        parts.append(ring(p.exterior.coords, True))
        for i in p.interiors:
            parts.append(ring(i.coords, True))
    for l in lines(g):
        parts.append(ring(l.coords, False))
    return "".join(parts)


def country_faces(view, items, countries, margin=60):
    """Polígonos por país a partir das linhas de fronteira do OSM (admin_level 2),
    que acompanham os rios exatamente; o Natural Earth só decide de quem é cada face."""
    bl = [l for (ln, p, g) in items if ln == "boundary" and p.get("admin_level") == 2
          for l in lines(g)]
    # as linhas vêm cortadas por tile; uma folga de 0,6 px fecha as emendas
    cut = unary_union(bl).buffer(0.6)
    rest = view.frame(margin).difference(cut)
    faces = defaultdict(list)
    for f in polys(rest):
        if f.area < 4:
            continue
        rp = f.representative_point()
        lat, lon = view.ll(rp.x, rp.y)
        pt = Point(lon, lat)
        iso = None
        for code, geom in countries.items():
            if geom.contains(pt):
                iso = code
                break
        faces[iso or "?"].append(f.buffer(0.7))
    return {k: unary_union(v) for k, v in faces.items()}


def load_countries(path, codes=("PRY", "ARG", "BRA", "BOL", "URY")):
    d = json.load(open(path))
    out = {}
    for f in d["features"]:
        p = f["properties"]
        c = p.get("ADM0_A3") or p.get("ISO_A3")
        if c in codes:
            out[c] = shape(f["geometry"]).buffer(0)
    return out


def along(line, pt, length, smooth=6):
    """Trecho de `length` px da linha, centrado no ponto mais próximo de `pt`,
    suavizado e orientado da esquerda para a direita (para textPath)."""
    d = line.project(pt)
    length = min(length, line.length)
    a = min(max(0, d - length / 2), line.length - length)
    b = a + length
    seg = substring(line, a, b)
    seg = seg.simplify(smooth)
    cs = list(seg.coords)
    if cs[0][0] > cs[-1][0]:
        cs = cs[::-1]
    # Chaikin para tirar quinas
    for _ in range(3):
        if len(cs) < 3:
            break
        n = [cs[0]]
        for (x0, y0), (x1, y1) in zip(cs[:-1], cs[1:]):
            n += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1),
                  (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
        n.append(cs[-1])
        cs = n
    return LineString(cs)
