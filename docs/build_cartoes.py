#!/usr/bin/env python3
"""Gera os cartões de visita digitais do Bracerum Park.

Para cada pessoa em PESSOAS grava:
  <slug>/index.html          a página  → bracerumpark.com/<slug>
  <slug>/<nome-sobrenome>.vcf  o "Salvar contato" (vCard 3.0)
  docs/cartoes/qr-<slug>-{ink,cream}.svg  e  qr-<slug>.png   QR Codes para impressão

WhatsApp (um botão por número, Brasil primeiro) e e-mail são da pessoa; Instagram, LinkedIn e site são do Park.
CSS e JS ficam em cartao/ (compartilhados). Para um cartão novo: acrescentar
a pessoa em PESSOAS, rodar  `python3 docs/build_cartoes.py`  e pôr o slug no
vercel.json (rewrite igual aos outros). Requer `pip install segno` só para os QR.
"""
from html import escape
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://bracerumpark.com"

# Fonte: cartões impressos enviados pelo cliente em 2026-11-09.
# phones: o primeiro é o principal (Brasil, quando a pessoa tem os dois). Todos são WhatsApp.
# name: (primeira linha, segunda linha em itálico) · vcard_n: (sobrenome, nome, nomes do meio)
PESSOAS = [
    {
        "slug": "cleberpavao",
        "first": "Cleber",
        "name": ("Cleber", "Pavão"),
        "vcard_n": ("Pavão", "Cleber", ""),
        "role": {"pt": "Business Development", "en": "Business Development", "es": "Business Development"},
        "email": "cleber@bracerum.com",
        "phones": [("5511986516065", "+55 11 98651-6065", "br"), ("595985516065", "+595 985 516 065", "py")],
    },
    {
        "slug": "sydneysavi",
        "first": "Sydney",
        "name": ("Sydney Marcos", "Savi"),
        "vcard_n": ("Savi", "Sydney", "Marcos"),
        "role": {"pt": "Business Development", "en": "Business Development", "es": "Business Development"},
        "email": "sydney@bracerum.com",
        "phones": [("5547988030200", "+55 47 98803-0200", "br"), ("595983030200", "+595 983 030 200", "py")],
    },
    {
        "slug": "athospavao",
        "first": "Athos",
        "name": ("Athos", "Pavão"),
        "vcard_n": ("Pavão", "Athos", ""),
        "role": None,
        "email": "athospavao@bracerum.com",
        "phones": [("5511953409125", "+55 11 95340-9125", "br"), ("595983516065", "+595 983 516 065", "py")],
    },
    {
        "slug": "juniopadua",
        "first": "Junio",
        "name": ("Junio Felipe", "de Pádua"),
        "vcard_n": ("de Pádua", "Junio", "Felipe"),
        "role": {"pt": "Arquiteto", "en": "Architect", "es": "Arquitecto"},
        "email": "arq@bracerum.com",
        "phones": [("5544999140995", "+55 44 99914-0995", "br")],
    },
    {
        "slug": "vaniarosa",
        "first": "Vania",
        "name": ("Vania Cunha", "da Rosa"),
        "vcard_n": ("da Rosa", "Vania", "Cunha"),
        "role": {"pt": "Advogada", "en": "Lawyer", "es": "Abogada"},
        "email": "vania@bracerum.com",
        "phones": [("595983522000", "+595 983 522 000", "py")],
    },
]

INSTAGRAM = "https://www.instagram.com/bracerumpark/"
LINKEDIN = "https://py.linkedin.com/company/bracerumpark"
COUNTRY_PT = {"py": "Paraguai", "br": "Brasil"}

ICO = {
    "wa": '<svg class="link__ico" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.06 3 3.4 8.66 3.4 15.64c0 2.23.58 4.4 1.69 6.32L3.3 28.7l6.9-1.81a12.6 12.6 0 0 0 5.84 1.49h.01c6.98 0 12.64-5.66 12.64-12.64C28.69 8.66 23.02 3 16.04 3zm0 22.99h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.23-3.98 1.05 1.06-3.88-.25-.4a10.47 10.47 0 0 1-1.61-5.61c0-5.8 4.72-10.52 10.53-10.52 2.81 0 5.45 1.1 7.44 3.08a10.46 10.46 0 0 1 3.08 7.45c0 5.8-4.72 10.52-10.53 10.52zm5.77-7.88c-.32-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.57-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.35-.26-.62-.52-.53-.71-.54l-.6-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.33 1.34.52 1.8.67.76.24 1.45.21 1.99.13.61-.09 1.87-.77 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.6-.37z"/></svg>',
    "mail": '<svg class="link__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14"/><path d="M3.5 5.5L12 12.5l8.5-7"/></svg>',
    "ig": '<svg class="link__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>',
    "in": '<svg class="link__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10.5V17M8 7.2v.1M11.5 17v-6.5M11.5 13.2c0-1.6 1.1-2.7 2.5-2.7s2.5.9 2.5 2.7V17"/></svg>',
    "web": '<svg class="link__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    "save": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 20c.6-3.7 3.2-6 6.5-6 1.6 0 3 .5 4.1 1.4M18 14v7M14.5 17.5h7"/></svg>',
}
# Losango da marca (o mesmo do pino do masterplan).
LOSANGO = '<svg class="who__mark" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M11 1.5L20.5 11 11 20.5 1.5 11z"/><path d="M11 7l4 4-4 4-4-4z" fill="currentColor" stroke="none"/></svg>'


def vcf_name(p):
    """cleber-pavao.vcf — é o nome com que o arquivo chega no Android."""
    import unicodedata
    s = unicodedata.normalize("NFKD", " ".join(p["name"])).encode("ascii", "ignore").decode()
    return "-".join(s.lower().split()) + ".vcf"


def page(p):
    name = " ".join(p["name"])
    role = p.get("role")
    slug = p["slug"]
    url = f"{SITE}/{slug}"
    wa_text = quote(f"Olá, {p['first']}. Recebi seu cartão do Bracerum Park e gostaria de saber mais sobre o projeto.")
    e = escape
    # Um botão de WhatsApp por número, o principal (Brasil) primeiro.
    wa_links = "\n".join(f"""    <a class="link js-wa" data-phone="{num}" target="_blank" rel="noopener"
       href="https://wa.me/{num}?text={wa_text}">
      {ICO['wa']}
      <span class="link__txt">
        <span class="link__title">WhatsApp</span>
        <span class="link__sub"><span data-t="{pais}">{COUNTRY_PT[pais]}</span> · {label}</span>
      </span>
      <span class="link__arrow" aria-hidden="true">↗</span>
    </a>""" for num, label, pais in p["phones"])
    role_html = (f'\n    <p class="who__role" data-en="{e(role["en"])}" data-es="{e(role["es"])}">{e(role["pt"])}</p>'
                 if role else "")
    who = f"{name} · {role['pt']}" if role else name
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>{e(name)} — Bracerum Park · Cartão digital</title>
<meta name="description" content="{e(who)} · Bracerum Park, cidade industrial multiuso em Villeta, Paraguai. WhatsApp, e-mail, redes e site." />
<meta name="theme-color" content="#000000" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="profile" />
<meta property="og:url" content="{url}" />
<meta property="og:title" content="{e(who)} · Bracerum Park" />
<meta property="og:description" content="Cartão digital — Bracerum Park, Villeta Industrial City · Paraguai · Mercosul." />
<meta property="og:image" content="{SITE}/assets/web/og-linktree.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
<!--
  Cartão de visita digital ({url}). GERADO por docs/build_cartoes.py —
  editar os dados lá e rodar de novo, não aqui. Caminhos relativos "../":
  funcionam em /{slug} e em /{slug}/.
-->
<link rel="stylesheet" href="../cartao/cartao.css?v=3" />
<script src="../tracking.js?v=1" defer></script>
</head>
<body data-first="{e(p['first'])}" data-name="{e(name)}">

<main class="wrap">

  <div class="top in">
    <a class="top__brand" href="../" aria-label="Bracerum Park — site"><img src="../assets/logo/logo-horizontal-white.svg" alt="Bracerum Park" /></a>
    <div class="lang" role="group" aria-label="Idioma / Language / Idioma">
      <button type="button" data-lang="pt" aria-pressed="true">PT</button>
      <button type="button" data-lang="en" aria-pressed="false">EN</button>
      <button type="button" data-lang="es" aria-pressed="false">ES</button>
    </div>
  </div>

  <header class="who in" style="--i:1">
    {LOSANGO}
    <h1 class="who__name">{e(p['name'][0])} <em>{e(p['name'][1])}</em></h1>{role_html}
    <p class="who__org">Bracerum Park</p>
    <p class="who__place" data-t="place">Villeta Industrial City — Paraguai · Mercosul</p>
  </header>

  <a class="save in" style="--i:2" href="../{slug}/{vcf_name(p)}" data-track="save_contact">
    {ICO['save']}<span data-t="save">Salvar contato</span>
  </a>

  <!-- 01 · CONTATO (pessoal) -->
  <section class="group in" style="--i:3" aria-labelledby="g1">
    <div class="group__head"><span class="group__n">01</span><h2 class="group__t" id="g1" data-t="g.contact">Contato</h2></div>
{wa_links}
    <a class="link js-mail" data-mail="{e(p['email'])}" href="mailto:{e(p['email'])}?subject=Bracerum%20Park">
      {ICO['mail']}
      <span class="link__txt">
        <span class="link__title" data-t="mail.t">E-mail</span>
        <span class="link__sub">{e(p['email'])}</span>
      </span>
      <span class="link__arrow" aria-hidden="true">↗</span>
    </a>
  </section>

  <!-- 02 · BRACERUM PARK (oficial) -->
  <section class="group in" style="--i:4" aria-labelledby="g2">
    <div class="group__head"><span class="group__n">02</span><h2 class="group__t" id="g2" data-t="g.park">Bracerum Park</h2></div>
    <a class="link" href="{INSTAGRAM}" target="_blank" rel="noopener">
      {ICO['ig']}
      <span class="link__txt">
        <span class="link__title">Instagram</span>
        <span class="link__sub">@bracerumpark</span>
      </span>
      <span class="link__arrow" aria-hidden="true">↗</span>
    </a>
    <a class="link" href="{LINKEDIN}" target="_blank" rel="noopener">
      {ICO['in']}
      <span class="link__txt">
        <span class="link__title">LinkedIn</span>
        <span class="link__sub">Bracerum Park</span>
      </span>
      <span class="link__arrow" aria-hidden="true">↗</span>
    </a>
    <a class="link link--hero" href="../">
      <span class="shot"><img src="../assets/web/fotos/park-boulevard-aereo.jpg" alt="" loading="lazy" /></span>
      <span class="row">
        {ICO['web']}
        <span class="link__txt">
          <span class="link__title" data-t="site.t">Conheça o <em>Bracerum Park</em></span>
          <span class="link__sub">bracerumpark.com</span>
        </span>
        <span class="link__arrow" aria-hidden="true">→</span>
      </span>
    </a>
  </section>

  <footer class="foot in" style="--i:5">
    <span data-t="rights">© 2026 Bracerum Park. Todos os direitos reservados.</span>
  </footer>
</main>

<script src="../cartao/cartao.js?v=2"></script>
</body>
</html>
"""


def vcard(p):
    def esc(s):
        return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:" + ";".join(esc(x) for x in (p["vcard_n"][0], p["vcard_n"][1], p["vcard_n"][2], "", "")),
        f"FN:{esc(' '.join(p['name']))}",
        "ORG:Bracerum Park",
    ]
    if p.get("role"):
        lines.append(f"TITLE:{esc(p['role']['pt'])}")
    for i, (num, _label, _pais) in enumerate(p["phones"]):
        kind = "CELL,VOICE,pref" if i == 0 else "CELL,VOICE"
        lines.append(f"TEL;TYPE={kind}:+{num}")
    lines += [
        f"EMAIL;TYPE=INTERNET,WORK:{p['email']}",
        f"URL:{SITE}/{p['slug']}",
        f"URL;TYPE=Site:{SITE}/",
        f"X-SOCIALPROFILE;TYPE=instagram:{INSTAGRAM}",
        f"X-SOCIALPROFILE;TYPE=linkedin:{LINKEDIN}",
        "ADR;TYPE=WORK:;;Acceso Sur · Ruta PY19;Villeta;Departamento Central;;Paraguay",
        "NOTE:Bracerum Park — Villeta Industrial City\\, Paraguay · Mercosur",
        "END:VCARD",
    ]
    return "\r\n".join(lines) + "\r\n"


def qr(p):
    try:
        import segno
    except ImportError:
        print("  (segno ausente — QR Codes não gerados; pip install segno)")
        return
    out = ROOT / "docs" / "cartoes"
    out.mkdir(parents=True, exist_ok=True)
    url = f"{SITE}/{p['slug']}"
    code = segno.make(url, error="q", micro=False)
    code.save(out / f"qr-{p['slug']}-ink.svg", scale=10, border=4, dark="#0e0d0b", light=None, xmldecl=False)
    code.save(out / f"qr-{p['slug']}-cream.svg", scale=10, border=4, dark="#f7f3ea", light="#0e0d0b", xmldecl=False)
    code.save(out / f"qr-{p['slug']}.png", scale=40, border=4, dark="#0e0d0b", light="#ffffff")
    print(f"  QR {url} → versão {code.designator}")


def main():
    for p in PESSOAS:
        d = ROOT / p["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(page(p), encoding="utf-8")
        for old in d.glob("*.vcf"):
            old.unlink()
        (d / vcf_name(p)).write_bytes(vcard(p).encode("utf-8"))
        print(f"{p['slug']}/index.html + {vcf_name(p)}")
        qr(p)


if __name__ == "__main__":
    main()
