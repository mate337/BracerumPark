"""Pré-calcula as rotas reais (por vias) do Bracerum Park até cada ponto,
usando o OSRM, e grava assets/routes.json. Assim o site não depende de
nenhuma API em tempo de execução."""
import json, time, urllib.request, urllib.parse

PARK = (-25.771694, -57.732389)

DEST = {
    # portos
    "Terport Villeta": (-25.5296, -57.5568),
    "Puerto Seguro Fluvial": (-25.4728, -57.5539),
    "Caacupemí Villeta": (-25.5060, -57.5450),
    "Emb. Puerto Alegre": (-25.7930, -57.7565),
    "Puerto Lobato": (-25.8085, -57.7660),
    "Terminal Villa Oliva": (-26.0060, -57.8890),
    "Porto de Assunção": (-25.2780, -57.6430),
    "Porto de Alberdi": (-26.1870, -58.1290),
    # rodovias
    "Assunção": (-25.2867, -57.6470),
    "Ciudad del Este": (-25.5097, -54.6111),
    "Foz do Iguaçu": (-25.5163, -54.5854),
    "Curitiba": (-25.4284, -49.2733),
    "Porto Alegre": (-30.0346, -51.2177),
    "Encarnación": (-27.3306, -55.8667),
    "Buenos Aires": (-34.6037, -58.3816),
    "Córdoba": (-31.4201, -64.1888),
    # aeroportos
    "Aeroporto Silvio Pettirossi (ASU)": (-25.2400, -57.5200),
    "Aeroporto Guaraní (AGT)": (-25.4547, -54.8428),
    # referências
    "Subestação da ANDE": (-25.7550, -57.7600),
}

def simplify(coords, tol=0.0016):
    """Douglas-Peucker leve, para reduzir o peso do arquivo mantendo o traçado."""
    if len(coords) < 3:
        return coords
    def d(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0:
            return ((x - x1) ** 2 + (y - y1) ** 2) ** .5
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2) ** .5
    dmax, idx = 0, 0
    for i in range(1, len(coords) - 1):
        dist = d(coords[i], coords[0], coords[-1])
        if dist > dmax:
            dmax, idx = dist, i
    if dmax > tol:
        return simplify(coords[:idx + 1], tol)[:-1] + simplify(coords[idx:], tol)
    return [coords[0], coords[-1]]

out = {}
for name, (lat, lng) in DEST.items():
    url = (f"https://router.project-osrm.org/route/v1/driving/"
           f"{PARK[1]},{PARK[0]};{lng},{lat}?overview=full&geometries=geojson")
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            data = json.loads(r.read())
        route = data["routes"][0]
        pts = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]  # [lat,lng]
        before = len(pts)
        # tolerância proporcional: rotas curtas ficam fiéis, longas ficam leves
        km = route["distance"] / 1000
        tol = max(0.00012, min(0.0018, km * 0.0000042))
        pts = simplify(pts, tol)
        out[name] = {
            "km": round(route["distance"] / 1000, 1),
            "min": round(route["duration"] / 60),
            "pts": [[round(a, 5), round(b, 5)] for a, b in pts],
        }
        print(f"  {name:38s} {out[name]['km']:>7.1f} km  {out[name]['min']:>4d} min  "
              f"{before}->{len(pts)} pts")
    except Exception as e:
        print(f"  {name:38s} FALHOU: {e}")
    time.sleep(1.2)

with open("/home/user/BracerumPark/assets/routes.json", "w") as f:
    json.dump(out, f, separators=(",", ":"))
import os
print(f"\nassets/routes.json — {len(out)}/{len(DEST)} rotas, "
      f"{round(os.path.getsize('/home/user/BracerumPark/assets/routes.json')/1024)} KB")
