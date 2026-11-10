#!/usr/bin/env python3
"""Separa capa e logo de cada produto para cadastro (CV CRM, redes, apresentações).

Gera docs/capas-e-logos/ com quatro pastas — Residence, Outlet Premium, Loteamentos e Hotel —
cada uma com logo/ (SVG + PNG transparente claro/escuro + quadrado 1080) e capa/ (JPG).

Fontes:
- Folders impressos do cliente no Google Drive (V1/V3 de 05–06/11/2026). Os títulos das capas
  ("Bracerum Residence", "Premium Outlet", "Parque Industrial") estão em curvas no PDF: o script
  copia esses caminhos vetoriais, então o logo sai em SVG exato, sem redesenho.
- As fotos de capa são as imagens embutidas nos mesmos PDFs, no tamanho original.
- Hotel e Bracerum Park: os logos já tratados em assets/logo/ (ver docs/build_logos.py).
- Fotos do hotel: renders originais da pasta "Imagens BracerumPark Finalizadas" do Drive.

Uso:  pip install pymupdf pillow
      python3 docs/build_capas_logos.py <pasta-de-trabalho>
Os PDFs (15–50 MB, acima do limite do conector do Drive) são baixados pelo link público.
"""
import os
import shutil
import subprocess
import sys

import pymupdf as fitz
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "capas-e-logos")
WORK = sys.argv[1] if len(sys.argv) > 1 else "/tmp/capas-logos"

DRIVE = {  # nome local -> id no Drive
    "outlet.pdf": "1WwvYJ-67-42M1gHP5W2vm7DY0usmgAOo",           # Folder Bracerum Premium Outlet Impressao V1
    "residence-aptos.pdf": "1xILbVCamAIkkV82SWAFYnrc58DkiHGqe",  # Folder Bracerum Residence V3 - Impressao
    "residence-casas.pdf": "1Y6ANn99W7xitwlXICFsSByQ5c7pedm3n",  # Folder Bracerum Residence Casas - Impressao
    "park.pdf": "1xxV9KfirdGxa4AZkC1i0aSBSfaf4_rYa",             # Folder Bracerum Park V3 - Impressao
    "hotel-cupula-dia.png": "1Gn5XPjNXSKxkUPgEcCOhM44Vmu14MIp0",
    "hotel-varandas-cupula.png": "1lNHQeUJxZxF8yilJjghqUgzue0lgkt7P",
    "residence-torre.png": "1iuFNg_AwR2YhsxzDMWBgdqrnmk_IDxGs",  # FACHADA 03Q-01
    # logo atual do Park (pasta "00 - Logos"), o mesmo dos folders: "BRACERUM / P A R K".
    # O de assets/logo/ é o lockup anterior, com "Paraguay 2026". O "Logo Horizontal" dessa
    # pasta só tem o texto, sem o losango — a versão horizontal sai do topo da capa do folder.
    "park-vertical.svg": "1R_oyiV-dryLhSTiB73MKyFAxvdZjsWqZ",    # Logo Vertical - Branca
}

CREME = (0.9863, 0.9508, 0.9003)   # cor dos títulos nos folders
CLARO = "#fbf2e6"
ESCURO = "#40362e"                 # marrom de fundo dos folders
TRIM_Y = (44.0078, 610.937)        # linha de corte (200 mm de altura)


def baixar():
    os.makedirs(WORK, exist_ok=True)
    for nome, fid in DRIVE.items():
        dst = os.path.join(WORK, nome)
        if os.path.exists(dst):
            continue
        url = f"https://drive.google.com/uc?export=download&id={fid}&confirm=t"
        subprocess.run(["curl", "-sSL", "--max-time", "300", "-o", dst, url], check=True)


def pdf(nome):
    return fitz.open(os.path.join(WORK, nome))


# ---------- logo vetorial ----------
def _perto(a, b, t=0.03):
    return a is not None and all(abs(x - y) < t for x, y in zip(a, b))


def formas(nome, pagina, clip):
    out = []
    for d in pdf(nome)[pagina].get_drawings():
        if d.get("type") in ("f", "fs") and _perto(d.get("fill"), CREME) and fitz.Rect(clip).contains(d["rect"]):
            out.append(d)
    return out


def _d(dr):
    s, cur = [], None
    P = lambda p: f"{p.x:.2f},{p.y:.2f}"
    longe = lambda a, b: cur is None or abs(a.x - b.x) > 1e-3 or abs(a.y - b.y) > 1e-3
    for it in dr["items"]:
        k = it[0]
        if k in ("l", "c"):
            if longe(cur, it[1]):
                s.append("M" + P(it[1]))
            if k == "l":
                s.append("L" + P(it[2])); cur = it[2]
            else:
                s.append("C" + P(it[2]) + " " + P(it[3]) + " " + P(it[4])); cur = it[4]
        elif k == "re":
            r = it[1]; s.append(f"M{r.x0:.2f},{r.y0:.2f}H{r.x1:.2f}V{r.y1:.2f}H{r.x0:.2f}Z"); cur = None
        elif k == "qu":
            q = it[1]; s.append("M" + P(q.ul) + "L" + P(q.ur) + "L" + P(q.lr) + "L" + P(q.ll) + "Z"); cur = None
    if dr.get("closePath"):
        s.append("Z")
    return "".join(s)


def svg_de_formas(ds, cor):
    u = fitz.Rect()
    for d in ds:
        u |= d["rect"]
    # viewBox na origem: desloca os caminhos
    paths = "".join(
        f'<path d="{_d(d)}"{" fill-rule=\"evenodd\"" if d.get("even_odd") else ""}/>' for d in ds)
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {u.width:.2f} {u.height:.2f}" '
            f'width="{u.width:.2f}" height="{u.height:.2f}">'
            f'<g fill="{cor}" transform="translate({-u.x0:.2f} {-u.y0:.2f})">{paths}</g></svg>\n')


def recolorir(svg_txt, cor):
    """Pinta um SVG de logo com `cor`. Tira o <style> do Illustrator (.cls-1 cheio, .cls-2 evenodd)
    e põe o preenchimento em cada caminho: muito leitor de SVG (e o próprio MuPDF) ignora o CSS."""
    import re
    svg_txt = re.sub(r"<defs>\s*<style>.*?</style>\s*</defs>", "", svg_txt, flags=re.S)
    svg_txt = svg_txt.replace('class="cls-2"', f'fill="{cor}" fill-rule="evenodd"')
    svg_txt = svg_txt.replace('class="cls-1"', f'fill="{cor}"')
    return re.sub(r'fill="#[0-9a-fA-F]{3,6}"', f'fill="{cor}"', svg_txt)


def png_do_svg(svg_txt, dst, largura=2000):
    pg = fitz.open(stream=svg_txt.encode(), filetype="svg")[0]
    z = largura / pg.rect.width
    pg.get_pixmap(matrix=fitz.Matrix(z, z), alpha=True).save(dst)


def quadrado(svg_txt, dst, fundo=ESCURO, lado=1080, ocupa=0.72):
    tmp = dst + ".tmp.png"
    png_do_svg(svg_txt, tmp, largura=1600)
    logo = Image.open(tmp).convert("RGBA"); os.remove(tmp)
    esc = min(lado * ocupa / logo.width, lado * ocupa / logo.height)
    logo = logo.resize((round(logo.width * esc), round(logo.height * esc)), Image.LANCZOS)
    base = Image.new("RGBA", (lado, lado), fundo)
    base.alpha_composite(logo, ((lado - logo.width) // 2, (lado - logo.height) // 2))
    base.convert("RGB").save(dst)


def gravar_logo(pasta, base, svg_claro, svg_escuro):
    os.makedirs(pasta, exist_ok=True)
    for sufixo, txt in (("claro", svg_claro), ("escuro", svg_escuro)):
        open(os.path.join(pasta, f"{base}-{sufixo}.svg"), "w").write(txt)
        png_do_svg(txt, os.path.join(pasta, f"{base}-{sufixo}.png"))
    quadrado(svg_claro, os.path.join(pasta, f"{base}-quadrado.png"))


# ---------- capas ----------
def jpg(img, dst, q=90, maximo=3200):
    if img.width > maximo:  # a foto da casa vem com 5458 px; 3200 basta para qualquer capa
        img = img.resize((maximo, round(img.height * maximo / img.width)), Image.LANCZOS)
    img.convert("RGB").save(dst, "JPEG", quality=q, optimize=True, progressive=True)


def capa_folder(nome, pagina, x0, x1, dst, dpi=300):
    z = dpi / 72
    pix = pdf(nome)[pagina].get_pixmap(matrix=fitz.Matrix(z, z), colorspace=fitz.csRGB,
                                        clip=fitz.Rect(x0, TRIM_Y[0], x1, TRIM_Y[1]))
    jpg(Image.frombytes("RGB", (pix.width, pix.height), pix.samples), dst)


def foto_embutida(nome, xref, dst):
    pix = fitz.Pixmap(pdf(nome), xref)
    if pix.alpha:
        pix = fitz.Pixmap(pix, 0)
    if pix.colorspace.n != 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    jpg(Image.frombytes("RGB", (pix.width, pix.height), pix.samples), dst)


def foto_arquivo(src, dst):
    jpg(Image.open(src), dst)


def main():
    baixar()
    for sub in ("01-bracerum-residence", "02-bracerum-outlet-premium", "03-loteamentos", "04-hotel"):
        shutil.rmtree(os.path.join(OUT, sub), ignore_errors=True)  # README.md e previa.jpg ficam
    W = lambda *p: os.path.join(WORK, *p)

    # 01 Residence — título da capa do folder dos apartamentos (o "B" começa no painel vizinho)
    p = os.path.join(OUT, "01-bracerum-residence")
    ds = formas("residence-aptos.pdf", 0, (1900, 370, 2781, 600))
    gravar_logo(os.path.join(p, "logo"), "bracerum-residence",
                svg_de_formas(ds, CLARO), svg_de_formas(ds, ESCURO))
    c = os.path.join(p, "capa"); os.makedirs(c)
    capa_folder("residence-aptos.pdf", 0, 2063.7, 2736.92, os.path.join(c, "capa-folder-apartamentos.jpg"))
    capa_folder("residence-casas.pdf", 1, 2063.7, 2736.92, os.path.join(c, "capa-folder-casas.jpg"))
    foto_arquivo(W("residence-torre.png"), os.path.join(c, "foto-torre-apartamentos.jpg"))
    foto_embutida("residence-aptos.pdf", 52, os.path.join(c, "foto-piscina-praia.jpg"))
    foto_embutida("residence-aptos.pdf", 50, os.path.join(c, "foto-casa.jpg"))

    # 02 Outlet Premium — "PREMIUM OUTLET" da capa do folder
    p = os.path.join(OUT, "02-bracerum-outlet-premium")
    ds = formas("outlet.pdf", 1, (700, 300, 1400, 655))
    gravar_logo(os.path.join(p, "logo"), "premium-outlet",
                svg_de_formas(ds, CLARO), svg_de_formas(ds, ESCURO))
    c = os.path.join(p, "capa"); os.makedirs(c)
    capa_folder("outlet.pdf", 1, 714.88, 1385.75, os.path.join(c, "capa-folder.jpg"))
    foto_embutida("outlet.pdf", 171, os.path.join(c, "foto-boulevard-lojas.jpg"))
    foto_embutida("outlet.pdf", 203, os.path.join(c, "foto-fachada-bracerum-outlet.jpg"))

    # 03 Loteamentos — logo do Bracerum Park (não há logo próprio) + "Parque Industrial" do folder
    p = os.path.join(OUT, "03-loteamentos")
    lg = os.path.join(p, "logo")
    txt = open(W("park-vertical.svg")).read()
    gravar_logo(lg, "bracerum-park-vertical", recolorir(txt, CLARO), recolorir(txt, ESCURO))
    ds = formas("park.pdf", 1, (2085, 0, 2781, 200))
    gravar_logo(lg, "bracerum-park-horizontal", svg_de_formas(ds, CLARO), svg_de_formas(ds, ESCURO))
    ds = formas("park.pdf", 0, (0, 480, 700, 655))
    gravar_logo(lg, "titulo-parque-industrial", svg_de_formas(ds, CLARO), svg_de_formas(ds, ESCURO))
    c = os.path.join(p, "capa"); os.makedirs(c)
    capa_folder("park.pdf", 1, 2063.7, 2736.92, os.path.join(c, "capa-folder-cidade-industrial.jpg"))
    capa_folder("park.pdf", 0, 44.0078, 717.23, os.path.join(c, "capa-folder-parque-industrial.jpg"))
    foto_embutida("park.pdf", 171, os.path.join(c, "foto-galpao-avenida.jpg"))
    foto_embutida("park.pdf", 208, os.path.join(c, "foto-hangar.jpg"))

    # 04 Hotel — selo do cliente já convertido em curvas (assets/logo/hotel-*.svg)
    p = os.path.join(OUT, "04-hotel")
    txt = open(os.path.join(ROOT, "assets", "logo", "hotel-cream.svg")).read()
    gravar_logo(os.path.join(p, "logo"), "bracerum-hotel", recolorir(txt, CLARO), recolorir(txt, ESCURO))
    c = os.path.join(p, "capa"); os.makedirs(c)
    foto_arquivo(W("hotel-cupula-dia.png"), os.path.join(c, "foto-hotel-cupula-dia.jpg"))
    foto_arquivo(W("hotel-varandas-cupula.png"), os.path.join(c, "foto-hotel-varandas.jpg"))
    foto_arquivo(os.path.join(ROOT, "assets", "web", "hero-hotel-noturno.jpg"),
                 os.path.join(c, "foto-hotel-noturno.jpg"))

    for raiz, _, arqs in sorted(os.walk(OUT)):
        for a in sorted(arqs):
            f = os.path.join(raiz, a)
            print(f"{os.path.relpath(f, OUT):70s} {os.path.getsize(f)/1024:8.0f} KB")


if __name__ == "__main__":
    main()
