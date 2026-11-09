#!/usr/bin/env python3
"""Monta a cópia enxuta do site para publicar pela Vercel CLI.

Enquanto a conta GitHub estiver sinalizada (a Vercel não lê o repositório),
a publicação é feita a partir de uma cópia dos arquivos do git SEM docs/,
scripts/, workflows/, *.md/*.txt e sem os originais do cliente que nenhuma
página usa (~37 MB em vez de 161 MB — o plano Hobby limita o envio pela CLI).

Uso (a partir do main):
    python3 docs/pacote_vercel.py /caminho/da/copia
    cd /caminho/da/copia && vercel deploy --prod --yes --token proxyinjected \\
        --scope team_M5fGTN1hNkSvweDXEjfrauUl
Depois conferir no ar que nenhuma página pede arquivo que ficou de fora.
"""
import json
import os
import shutil
import subprocess
import sys

TEAM = "team_M5fGTN1hNkSvweDXEjfrauUl"
PROJECT = "prj_XPkSGpHbPCKCOAeTdm0lqhmycyK9"
# Pastas de material-fonte do cliente: entram só os arquivos que alguma página cita.
FONTE = ("assets/Bracerum Hotel/", "assets/Bracerum Resort/", "assets/Bracerum Select/",
         "assets/SVG/", "assets/Atualizadas")


def main(out):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    files = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")[:-1]
    paginas = [f for f in files if f.endswith((".html", ".js", ".css", ".json")) and not f.startswith("docs/")]
    citado = "".join(open(f, encoding="utf-8", errors="ignore").read() for f in paginas)

    if os.path.exists(out):
        shutil.rmtree(out)
    n = tam = 0
    for f in files:
        if f.startswith(("docs/", "scripts/", "workflows/")) or f.endswith((".md", ".txt")):
            continue
        if f.startswith("assets/") and (f.count("/") == 1 or f.startswith(FONTE)):
            nome = f.split("/", 1)[1]
            if nome not in citado and nome.replace(" ", "%20") not in citado:
                continue
        if not os.path.isfile(f):
            continue
        dest = os.path.join(out, f)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(f, dest)
        n += 1
        tam += os.path.getsize(f)
    os.makedirs(os.path.join(out, ".vercel"), exist_ok=True)
    with open(os.path.join(out, ".vercel", "project.json"), "w") as fh:
        json.dump({"orgId": TEAM, "projectId": PROJECT}, fh)
    print(f"{n} arquivos, {tam / 1e6:.1f} MB em {out}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(os.path.abspath(sys.argv[1]))
