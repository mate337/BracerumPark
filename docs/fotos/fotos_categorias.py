#!/usr/bin/env python3
"""Separa as 55 fotos de "Imagens BracerumPark Finalizadas" pelas 4 categorias do padrão de códigos
(docs/padrao-de-codigos.md) e gera o script PowerShell que organiza a pasta no computador do usuário.

Fonte: pasta do Google Drive 1CETdiYdL13Jhh2twQe6kAF10yvMt1YF6 (mesmo nome da pasta local), listada em
2026-11-04 — nome e tamanho em bytes de cada arquivo. O script casa os arquivos pelo nome e, se o nome
local for outro (os originais vinham como "Imagem do Codex …"), pelo tamanho exato.
"""
import os
from collections import Counter, defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))

H, CC = r'1 Hotel\Bracerum Hotel', r'1 Hotel\Centro de Convenções'
VIS, VIAS, PORT, POSTO = (r'2 Cidade\Vistas aéreas e boulevard', r'2 Cidade\Vias', r'2 Cidade\Portaria',
                          r'2 Cidade\Posto e Clube do Caminhoneiro')
GALP, HANG = r'3 Loteamento\302 Lotes industriais (galpões)', r'3 Loteamento\303 Hangares e aeroporto'
RES = r'4 Condomínios\402 Bracerum Resort'
DUP = r'_Duplicadas'

FOTOS = [  # (nome no Drive, bytes, pasta)
    ('Hotel - Fachada com varandas verdes.png', 3175737, H),
    ('Hotel - Fachada com varandas verdes e a cúpula ao lado.png', 3184953, H),
    ('Hotel - Varanda com mesa de jantar (entardecer).png', 2929994, H),
    ('Hotel - Varanda com daybed e vista para a cúpula.png', 2870085, H),
    ('Hotel - Apartamento com cabeceira de madeira.png', 2662545, H),
    ('Hotel - Poltrona na varanda, detalhe (vertical).png', 2109428, H),
    ('Hotel - Quarto com varanda e vista para o rio (dia).png', 2527877, H),
    ('Hotel - Quarto com varanda e vista para o rio (entardecer).png', 2503789, H),
    ('Hotel - Suíte com vista para o parque.png', 2532809, H),
    ('Hotel - Recepção (noite).png', 2358618, H),
    ('Hotel - Recepção (dia).png', 2737518, H),
    ('Centro de Convenções - Átrio com arcos brancos, vista ampla.png', 2935323, CC),
    ("Centro de Convenções - Cúpula de vidro com espelho d'água (entardecer).png", 2221028, CC),
    ('Centro de Convenções - Cúpula de vidro e torre do hotel (dia).png', 3014386, CC),
    ('Centro de Convenções - Foyer com executivo em primeiro plano (vertical).png', 2351484, CC),
    ('Centro de Convenções - Foyer em evento.png', 2857799, CC),
    ('Centro de Convenções - Auditório de 1.200 lugares, vista do fundo.png', 2218147, CC),
    ('Centro de Convenções - Auditório, vista lateral com telão.png', 2528045, CC),
    ('Centro de Convenções - Átrio e recepção sob a cúpula.png', 2978593, CC),
    ('Centro de Convenções - Átrio e recepção sob a cúpula (variação).png', 2818109, CC),
    ('Centro de Convenções - Restaurante sob a cúpula (dia).png', 3064973, CC),
    ('Centro de Convenções - Restaurante sob a cúpula (anoitecer).png', 2731482, CC),
    ('Centro de Convenções - Restaurante e bar sob a cúpula (noite).png', 2880573, CC),
    ('Park - Vista aérea geral do masterplan.png', 3391385, VIS),
    ('Park - Vista aérea com o Rio Paraguai.png', 3332388, VIS),
    ('Park - Boulevard visto do alto, vista ampla com hotel ao fundo.png', 2751727, VIS),
    ('Vias - Boulevard arborizado com palmeiras.png', 2470051, VIAS),
    ('Vias - Boulevard com galpões e hotel ao fundo (vertical).png', 1990760, VIAS),
    ('Vias - Rotatória com paisagismo.png', 2619718, VIAS),
    ('Portaria - Entrada principal com guarita.png', 2290485, PORT),
    ('Clube do Caminhoneiro - Posto de abastecimento (noite).png', 2465334, POSTO),
    ('Park - Boulevard visto do alto, galpão e caminhão na doca.png', 3007021, GALP),
    ('Galpões - Galpão e via interna.png', 2392197, GALP),
    ('Galpões - Docas de carga, capacete em primeiro plano.png', 2367184, GALP),
    ('Galpões - Galpão com pórtico azul e avenida.png', 2589273, GALP),
    ('Hangares - Pátio com jato executivo.png', 1849141, HANG),
    ('Hangares - Interior do hangar com jato.png', 2258328, HANG),
    ('Hangares - Hangar Bracerum com jato (anoitecer).png', 2212007, HANG),
    ('Pista de pouso - Vista aérea da pista e dos hangares.png', 2653206, HANG),
    ('Pista de pouso - Cabeceira da pista.png', 2315565, HANG),
    ('Pista de pouso - Cabeceira da pista (variação).png', 2215793, HANG),
    ('Resort - Lago e casas do condomínio.png', 2725081, RES),
    ('Resort - Casas na rua de calçamento.png', 2828122, RES),
    ('Resort - Rua residencial arborizada.png', 3137601, RES),
    ('Resort - Casa com garagem coberta (dia).png', 2746920, RES),
    ('Resort - Casa com garagem coberta (pôr do sol).png', 2602191, RES),
    ('Resort - Quadra poliesportiva.png', 2482126, RES),
    ('Resort - Piscina e quincho (amenities).png', 2279401, RES),
    ('Resort - Quincho e praça de convivência (amenities).png', 2477522, RES),
    # cópias exatas (mesmo tamanho do original): vão para _Duplicadas, nada é apagado
    ('Centro de Convenções - Átrio com arcos brancos, vista ampla (cópia).png', 2935323, DUP),
    ('Centro de Convenções - Foyer com executivo em primeiro plano (vertical) (cópia).png', 2351484, DUP),
    ('Centro de Convenções - Auditório de 1.200 lugares, vista do fundo (cópia).png', 2218147, DUP),
    ('Clube do Caminhoneiro - Posto de abastecimento (noite) (cópia).png', 2465334, DUP),
    ('Resort - Casa com garagem coberta (dia) (cópia).png', 2746920, DUP),
    ('Resort - Quadra poliesportiva (cópia).png', 2482126, DUP),
]

PS1 = r'''# Organiza "Imagens BracerumPark Finalizadas" nas 4 categorias do Bracerum Park
# (1 Hotel · 2 Cidade · 3 Loteamento · 4 Condomínios). Gerado por docs/fotos/fotos_categorias.py.
#
#   Simular (não move nada):  powershell -ExecutionPolicy Bypass -File organizar-fotos.ps1 -Simular
#   Organizar:                powershell -ExecutionPolicy Bypass -File organizar-fotos.ps1
#   Desfazer:                 powershell -ExecutionPolicy Bypass -File organizar-fotos.ps1 -Desfazer
#
# Só MOVE arquivos dentro da própria pasta (nada é apagado). Casa cada foto pelo nome e, se o nome for
# outro, pelo tamanho exato em bytes — nesse caso também renomeia para o nome descritivo. Cópias exatas
# vão para "_Duplicadas". Grava organizar-fotos-log.csv na pasta, que o -Desfazer usa para voltar tudo.
param(
  [string]$Pasta = "$env:USERPROFILE\OneDrive\Desktop\Imagens BracerumPark Finalizadas",
  [switch]$Simular,
  [switch]$Desfazer
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Pasta)) { $Pasta = 'C:\Users\User\OneDrive\Desktop\Imagens BracerumPark Finalizadas' }
if (-not (Test-Path -LiteralPath $Pasta)) { throw "Pasta não encontrada: $Pasta (use -Pasta 'caminho')" }
$log = Join-Path $Pasta 'organizar-fotos-log.csv'

if ($Desfazer) {
  if (-not (Test-Path -LiteralPath $log)) { throw "Não há $log para desfazer." }
  Import-Csv -LiteralPath $log -Encoding UTF8 | ForEach-Object {
    $de = Join-Path $Pasta $_.Destino; $para = Join-Path $Pasta $_.Original
    if (Test-Path -LiteralPath $de) { Move-Item -LiteralPath $de -Destination $para; Write-Host "voltou: $($_.Original)" }
  }
  Remove-Item -LiteralPath $log
  Write-Host 'Pronto: tudo de volta (as pastas vazias ficaram; pode apagá-las).'
  return
}

$mapa = @(
@@MAPA@@
)
$porNome = @{}; $porTam = @{}
foreach ($m in $mapa) { $porNome[$m.N] = $m; if (-not $porTam.ContainsKey($m.B)) { $porTam[$m.B] = @() }; $porTam[$m.B] += $m }
$usados = @{}
$linhas = @(); $semPar = @()
foreach ($f in Get-ChildItem -LiteralPath $Pasta -File | Where-Object { $_.Extension -match '^\.(png|jpe?g|webp)$' }) {
  $m = $porNome[$f.Name]
  if (-not $m -and $porTam.ContainsKey([int64]$f.Length)) {
    $m = $porTam[[int64]$f.Length] | Where-Object { -not $usados.ContainsKey($_.N) } | Select-Object -First 1
  }
  if (-not $m) { $semPar += $f.Name; continue }
  $usados[$m.N] = $true
  $dir = Join-Path $Pasta $m.D
  $dest = Join-Path $m.D $m.N
  if ($Simular) { Write-Host "[simulação] $($f.Name)  ->  $dest"; continue }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  if (Test-Path -LiteralPath (Join-Path $Pasta $dest)) { $semPar += "$($f.Name) (já existe em $dest)"; continue }
  Move-Item -LiteralPath $f.FullName -Destination (Join-Path $Pasta $dest)
  $linhas += [pscustomobject]@{ Original = $f.Name; Destino = $dest }
  Write-Host "$($f.Name)  ->  $dest"
}
if (-not $Simular -and $linhas.Count) {
  $antes = @(); if (Test-Path -LiteralPath $log) { $antes = @(Import-Csv -LiteralPath $log -Encoding UTF8) }
  ($antes + $linhas) | Export-Csv -LiteralPath $log -NoTypeInformation -Encoding UTF8
}
Write-Host ''
Write-Host ("Organizadas: {0} de {1} fotos conhecidas." -f ($(if ($Simular) { $usados.Count } else { $linhas.Count }), $mapa.Count))
if ($semPar.Count) { Write-Host 'Ficaram onde estavam (sem correspondência):'; $semPar | ForEach-Object { Write-Host "  $_" } }
$faltam = $mapa | Where-Object { -not $usados.ContainsKey($_.N) }
if ($faltam) { Write-Host 'Não encontradas na pasta:'; $faltam | ForEach-Object { Write-Host "  $($_.N)" } }
'''


def main():
    assert len(FOTOS) == 55 and len({f[0] for f in FOTOS}) == 55
    # tamanho repetido só pode aparecer entre original e cópia
    por_tam = defaultdict(list)
    for n, b, d in FOTOS:
        por_tam[b].append((n, d))
    for b, l in por_tam.items():
        assert len(l) == 1 or (len(l) == 2 and sum(d == DUP for _, d in l) == 1), l
    esc = lambda s: s.replace("'", "''")
    mapa = ',\n'.join(f"  @{{ N = '{esc(n)}'; B = [int64]{b}; D = '{esc(d)}' }}" for n, b, d in FOTOS)
    with open(os.path.join(AQUI, 'organizar-fotos.ps1'), 'w', encoding='utf-8-sig', newline='\r\n') as f:
        f.write(PS1.replace('@@MAPA@@', mapa))

    grupos = defaultdict(list)
    for n, b, d in FOTOS:
        grupos[d].append(n)
    md = ['# Fotos finalizadas por categoria (04/11/2026)', '',
          'As 55 fotos da pasta **"Imagens BracerumPark Finalizadas"** (Google Drive '
          '`1CETdiYdL13Jhh2twQe6kAF10yvMt1YF6`, mesma pasta do Desktop do usuário) separadas pelas 4 categorias do '
          '`docs/padrao-de-codigos.md`. 49 fotos únicas + 6 cópias exatas. Para organizar a pasta local: '
          '`docs/fotos/organizar-fotos.ps1` (gerado por `fotos_categorias.py`).', '',
          '| Categoria | Pasta | Fotos |', '|---|---|---|']
    for d in [H, CC, VIS, VIAS, PORT, POSTO, GALP, HANG, RES, DUP]:
        md.append(f"| {d.split(chr(92))[0]} | {d.split(chr(92))[-1]} | {len(grupos[d])} |")
    md += ['', '**Sem foto:** Bracerum Residence (4·01), Bracerum Market (2·01), Outlet Premium (3·01) e Hub de '
           'serviços (3·04).', '']
    for d in [H, CC, VIS, VIAS, PORT, POSTO, GALP, HANG, RES, DUP]:
        md.append(f'## {d.replace(chr(92), " / ")}')
        md += [f'- {n}' for n in grupos[d]] + ['']
    open(os.path.join(AQUI, 'README.md'), 'w', encoding='utf-8').write('\n'.join(md))
    print(Counter(d.split('\\')[0] for _, _, d in FOTOS))


if __name__ == '__main__':
    main()
