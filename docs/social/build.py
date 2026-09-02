#!/usr/bin/env python3
"""
Bracerum Park — gerador dos carrosséis de Instagram.

Lê docs/social/content.json, monta uma página HTML por slide (1080 × 1350),
fotografa em Chromium headless com 2× de supersampling e grava o PNG final
em assets/social/<carrossel>/<carrossel>-NN.png com 300 DPI de metadado.

    python3 docs/social/build.py            # tudo
    python3 docs/social/build.py 01 05      # só os carrosséis cujo slug começa assim

Fontes: Noto Serif (display) + TeX Gyre Heros, clone métrico da Helvetica.
"""
import json, os, re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

ROOT   = Path(__file__).resolve().parents[2]
HERE   = Path(__file__).resolve().parent
OUT    = ROOT / "assets" / "social"
W, H   = 1080, 1350
SCALE  = 2                      # supersampling
DPI    = 300
CHROME = next((p for p in [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
] if os.path.exists(p)), None)

CSS = (HERE / "theme.css").read_text(encoding="utf-8")


def asset(rel):
    return "file://" + str(ROOT / rel)


def logo(kind, tone):
    return asset(f"assets/logo/logo-{kind}-{tone}.svg")


# ----------------------------------------------------------------- fragmentos
GRAIN = """<svg class="grain" xmlns="http://www.w3.org/2000/svg">
  <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
  <feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#g)"/></svg>"""

FRAME_COVER = """<svg class="frame" viewBox="0 0 1080 1350">
  <path d="M0 352 H1080"/>
  <path d="M636 352 L96 1350"/>
  <path d="M1080 1004 H700 L618 1086 V1350"/>
</svg>"""

FRAME_EDGE = """<svg class="frame" viewBox="0 0 1080 1350">
  <path d="M72 214 H1008"/>
  <path d="M1008 1214 H150 L72 1136"/>
</svg>"""

FRAME_CTA = """<svg class="frame" viewBox="0 0 1080 1350">
  <path d="M0 306 H1080"/>
  <path d="M0 1218 H1080"/>
  <path d="M0 388 L82 306"/>
  <path d="M1080 1136 L998 1218"/>
</svg>"""

ICONS = {
    # bandeira do Paraguai, simplificada: duas faixas e o disco central
    "py": """<svg viewBox="0 0 64 44" fill="none"><rect x="2" y="4" width="60" height="8" fill="#f7f3ea"/>
        <rect x="2" y="32" width="60" height="8" fill="#f7f3ea"/><rect x="2" y="20" width="60" height="4" fill="#f7f3ea"/>
        <circle cx="32" cy="22" r="7" fill="#0e0d0b" stroke="#f7f3ea" stroke-width="4"/></svg>""",
    # bandeira do Brasil, simplificada: losango e esfera
    "br": """<svg viewBox="0 0 64 44" fill="none"><path d="M32 3 61 22 32 41 3 22Z" fill="#f7f3ea"/>
        <circle cx="32" cy="22" r="8" fill="#0e0d0b"/><circle cx="32" cy="22" r="3.4" fill="#f7f3ea"/></svg>""",
    # barras: projetado como uma cidade
    "chart": """<svg viewBox="0 0 64 44" fill="none"><rect x="6" y="24" width="12" height="17" fill="#f7f3ea"/>
        <rect x="26" y="10" width="12" height="31" fill="#f7f3ea"/><rect x="46" y="18" width="12" height="23" fill="#f7f3ea"/></svg>""",
}

LINK_ICON = """<svg viewBox="0 0 48 48" fill="none" stroke="#f7f3ea" stroke-width="2.6"
  stroke-linecap="round"><path d="M20 28a8 8 0 0 0 11.3 0l7-7A8 8 0 0 0 27 9.7l-4 4"/>
  <path d="M28 20a8 8 0 0 0-11.3 0l-7 7A8 8 0 0 0 21 38.3l4-4"/></svg>"""


def foot(meta, idx, total, tone_paper=False):
    return (f'<div class="foot"><div><b>{idx:02d}</b> / {total:02d}</div>'
            f'<div>{meta["series"]}</div></div>')


def icons_row(meta):
    cells = "".join(
        f'<div>{ICONS[i["icon"]]}<span>{i["label"]}</span></div>' for i in meta["trio"])
    return f'<div class="icons">{cells}</div>'


def fit(text, base, cap, floor=0.72):
    """Reduz o corpo de texto quando o bloco é longo, para nada estourar o slide."""
    n = len(re.sub("<[^>]+>", "", text))
    if n <= cap:
        return base
    return max(int(base * floor), int(base * cap / n))


# ------------------------------------------------------------------- os slides
def s_cover(s, meta, i, n):
    cred = (f'<div class="credit" style="left:var(--m);bottom:186px">{s["credit"]}</div>'
            if s.get("credit") else "")
    size = 82 if len(re.sub("<[^>]+>", "", s["title"])) <= 46 else 70
    return f"""
<div class="slide">
  <div class="bg"><img src="{asset(s['image'])}"></div><div class="veil veil--cover"></div>
  {FRAME_COVER}
  <div class="stack" style="top:150px"><img class="logo-c" src="{logo('compact','white')}"></div>
  <div class="stack" style="bottom:250px">
    <h1 class="h-cover" style="font-size:{size}px">{s['title']}</h1>
  </div>
  <div class="stack" style="bottom:150px"><div class="eyebrow">{s['eyebrow']}</div></div>
  {cred}
  {foot(meta, i, n)}
</div>"""


def s_text(s, meta, i, n):
    paper = s.get("bg") == "paper"
    tone = "brown" if paper else "white"
    body = "".join(f"<p>{p}</p>" for p in s["body"])
    fs = fit(" ".join(s["body"]), 32, 430)
    return f"""
<div class="slide {'slide--paper' if paper else ''}">
  {FRAME_EDGE}
  <img class="logo-h" src="{logo('horizontal',tone)}">
  <div class="stack" style="top:300px"><div class="eyebrow">{s['eyebrow']}</div>
    <h2 class="h-lg" style="margin-top:34px">{s['title']}</h2>
  </div>
  <div class="stack" style="bottom:170px">
    <div class="rule" style="margin-bottom:46px"></div>
    <div class="body" style="font-size:{fs}px">{body}</div>
  </div>
  {foot(meta, i, n)}
</div>"""


def s_stat(s, meta, i, n):
    val = s["value"]
    size = 300 if len(val) <= 2 else (250 if len(val) <= 3 else 200)
    unit = f'<span class="unit">{s["unit"]}</span>' if s.get("unit") else ""
    fs = fit(s["body"], 30, 400)
    return f"""
<div class="slide">
  {FRAME_EDGE}
  <img class="logo-h" src="{logo('horizontal','white')}">
  <div class="stack" style="top:300px"><div class="eyebrow">{s['eyebrow']}</div></div>
  <div class="stack" style="top:390px">
    <div class="stat" style="font-size:{size}px">{val}{unit}</div>
    <div class="stat-cap" style="margin-top:44px">{s['caption']}</div>
  </div>
  <div class="stack" style="bottom:170px">
    <div class="rule" style="margin-bottom:40px"></div>
    <div class="body" style="font-size:{fs}px">{s['body']}</div>
  </div>
  {foot(meta, i, n)}
</div>"""


def s_list(s, meta, i, n):
    paper = s.get("bg") == "paper"
    tone = "brown" if paper else "white"
    items = s["items"]
    dense = len(items) >= 6
    k_fs, v_fs, pad = (28, 24, "20px 0") if dense else (34, 27, "28px 0")
    rows = "".join(
        f'<tr><td class="k" style="font-size:{k_fs}px;padding:{pad}">{it["k"]}</td>'
        f'<td class="v" style="font-size:{v_fs}px;padding:{pad}">{it["v"]}</td></tr>'
        for it in items)
    return f"""
<div class="slide {'slide--paper' if paper else ''}">
  {FRAME_EDGE}
  <img class="logo-h" src="{logo('horizontal',tone)}">
  <div class="stack" style="top:300px"><div class="eyebrow">{s['eyebrow']}</div>
    <h2 class="h-lg" style="margin-top:32px;font-size:{56 if dense else 62}px">{s['title']}</h2>
    <table class="rows" style="margin-top:{44 if dense else 60}px">{rows}</table>
  </div>
  {foot(meta, i, n)}
</div>"""


def s_photo(s, meta, i, n):
    cred = (f'<div class="credit" style="left:var(--m);top:660px">{s["credit"]}</div>'
            if s.get("credit") else "")
    fs = fit(s["body"], 29, 360)
    return f"""
<div class="slide">
  <div class="bg" style="height:720px"><img src="{asset(s['image'])}"></div>
  <div class="veil veil--photo" style="height:720px"></div>
  <div style="position:absolute;left:0;right:0;top:720px;bottom:0;background:var(--ink)"></div>
  <svg class="frame" viewBox="0 0 1080 1350"><path d="M72 720 H1008"/>
    <path d="M1008 1214 H150 L72 1136"/></svg>
  <img class="logo-h" src="{logo('horizontal','white')}">
  {cred}
  <div class="stack" style="top:800px"><div class="eyebrow">{s['eyebrow']}</div>
    <h2 class="h-md" style="margin-top:28px">{s['title']}</h2>
    <div class="body" style="font-size:{fs}px;margin-top:34px">{s['body']}</div>
  </div>
  {foot(meta, i, n)}
</div>"""


def s_trio(s, meta, i, n):
    cells = "".join(
        f'<div><div class="big">{it["big"]}</div><div class="rule"></div>'
        f'<div class="lbl">{it["label"]}</div></div>' for it in s["items"])
    return f"""
<div class="slide">
  {FRAME_EDGE}
  <img class="logo-h" src="{logo('horizontal','white')}">
  <div class="stack" style="top:300px"><div class="eyebrow">{s['eyebrow']}</div>
    <h2 class="h-lg" style="margin-top:34px">{s['title']}</h2>
  </div>
  <div class="stack" style="bottom:190px"><div class="trio">{cells}</div></div>
  {foot(meta, i, n)}
</div>"""


def s_cta(s, meta, i, n):
    return f"""
<div class="slide">
  <div class="bg bg--blur"><img src="{asset(s['image'])}"></div>
  <div class="veil veil--cta"></div>{GRAIN}
  {FRAME_CTA}
  <div class="stack" style="top:392px"><img class="logo-c" src="{logo('compact','white')}"></div>
  <div class="stack" style="top:762px">
    <div class="pill"><span>{meta['cta']}</span>{LINK_ICON}</div>
  </div>
  <div class="stack" style="top:1006px">{icons_row(meta)}</div>
  <div class="stack" style="bottom:96px"><div class="legal">{meta['disclaimer']}</div></div>
</div>"""


BUILDERS = {"cover": s_cover, "text": s_text, "stat": s_stat,
            "list": s_list, "photo": s_photo, "trio": s_trio, "cta": s_cta}


def page(html):
    return (f"<!doctype html><meta charset='utf-8'><style>{CSS}</style>"
            f"<body>{html}</body>")


def shoot(html, dest, tmp):
    src = tmp / "slide.html"
    src.write_text(page(html), encoding="utf-8")
    raw = tmp / "raw.png"
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                    "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-color-profile=srgb", "--disable-lcd-text",
                    f"--force-device-scale-factor={SCALE}",
                    f"--window-size={W},{H+100}", f"--screenshot={raw}",
                    f"file://{src}"],
                   check=True, capture_output=True)
    im = Image.open(raw).convert("RGB")
    im = im.crop((0, 0, W * SCALE, H * SCALE))          # a janela é mais alta de propósito
    im = im.resize((W, H), Image.LANCZOS)
    im.save(dest, "PNG", dpi=(DPI, DPI), optimize=True)
    return dest


def main():
    data = json.loads((HERE / "content.json").read_text(encoding="utf-8"))
    meta = data["meta"]
    only = sys.argv[1:]
    tmp = Path(tempfile.mkdtemp(prefix="bp-social-"))
    total_files = 0
    for car in data["carousels"]:
        if only and not any(car["slug"].startswith(o) for o in only):
            continue
        folder = OUT / car["slug"]
        folder.mkdir(parents=True, exist_ok=True)
        n = len(car["slides"])
        for i, s in enumerate(car["slides"], 1):
            dest = folder / f"{car['slug']}-{i:02d}.png"
            shoot(BUILDERS[s["type"]](s, meta, i, n), dest, tmp)
            total_files += 1
            print(f"  {dest.relative_to(ROOT)}")
        print(f"✓ {car['name']} — {n} slides")
    print(f"\n{total_files} imagens · {W}×{H}px · {DPI} DPI")


if __name__ == "__main__":
    if not CHROME:
        sys.exit("Chromium não encontrado.")
    main()
