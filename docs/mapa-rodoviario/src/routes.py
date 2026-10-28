"""Rotas reais (OSRM, por vias) do Bracerum Park até os destinos do mapa."""
import json, sys, time, urllib.request
PARK = (-25.771694, -57.732389)
DEST = {
    "terport":  (-25.6128, -57.6050),   # Terminales Portuarias S.A. (OSM), Villeta
    "asuncion": (-25.2867, -57.6470),   # mesmo ponto do site
    "falcon":   (-25.2643, -57.7245),   # Puente Internacional San Ignacio de Loyola
    "alberdi":  (-26.1870, -58.1290),   # porto/balsa de Alberdi (mesmo ponto do site)
    "posadas":  (-27.3738, -55.8734),   # Puente San Roque González de Santa Cruz
    "amizade":  (-25.5095, -54.6022),   # Puente de la Amistad
    "pjc":      (-22.5498, -55.7384),   # Pedro Juan Caballero
}
UA = {"User-Agent": "BracerumPark-map/1.0"}
out = {}
for k, (lat, lng) in DEST.items():
    u = (f"https://router.project-osrm.org/route/v1/driving/{PARK[1]},{PARK[0]};{lng},{lat}"
         "?overview=full&geometries=geojson")
    r = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read())["routes"][0]
    out[k] = {"km": round(r["distance"] / 1000, 1), "min": round(r["duration"] / 60),
              "pts": [[round(c[1], 5), round(c[0], 5)] for c in r["geometry"]["coordinates"]]}
    print(f"{k:10s} {out[k]['km']:7.1f} km {out[k]['min']:5d} min {len(out[k]['pts'])} pts")
    time.sleep(1.2)
json.dump(out, open(sys.argv[1], "w"))
