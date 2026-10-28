"""Baixa tiles vetoriais do OpenFreeMap (OpenMapTiles, dados OSM) para um bbox."""
import math, os, sys, json, time, urllib.request
UA = {"User-Agent": "BracerumPark-map/1.0 (print map build)"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
OUT = sys.argv[1]
TJ = json.loads(get("https://tiles.openfreemap.org/planet"))
TPL = TJ["tiles"][0]
def tx(lon, z): return int((lon + 180) / 360 * 2**z)
def ty(lat, z):
    r = math.radians(lat)
    return int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2**z)
def fetch(z, w, s, e, n):
    d = os.path.join(OUT, str(z)); os.makedirs(d, exist_ok=True)
    xs = range(tx(w, z), tx(e, z) + 1); ys = range(ty(n, z), ty(s, z) + 1)
    print(f"z{z}: {len(xs)}x{len(ys)} tiles")
    for x in xs:
        for y in ys:
            p = os.path.join(d, f"{x}_{y}.pbf")
            if os.path.exists(p): continue
            for t in range(4):
                try:
                    data = get(TPL.format(z=z, x=x, y=y))
                    open(p, "wb").write(data); break
                except Exception as ex:
                    print("retry", z, x, y, ex); time.sleep(2 ** t)
print(TPL)
fetch(8, -62.0, -29.0, -53.0, -21.0)     # regional
fetch(11, -58.45, -26.4, -57.15, -25.0)  # detalhe Villeta-Assunção
