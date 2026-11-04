# Organiza "Imagens BracerumPark Finalizadas" nas 4 categorias do Bracerum Park
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
  @{ N = 'Hotel - Fachada com varandas verdes.png'; B = [int64]3175737; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Fachada com varandas verdes e a cúpula ao lado.png'; B = [int64]3184953; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Varanda com mesa de jantar (entardecer).png'; B = [int64]2929994; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Varanda com daybed e vista para a cúpula.png'; B = [int64]2870085; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Apartamento com cabeceira de madeira.png'; B = [int64]2662545; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Poltrona na varanda, detalhe (vertical).png'; B = [int64]2109428; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Quarto com varanda e vista para o rio (dia).png'; B = [int64]2527877; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Quarto com varanda e vista para o rio (entardecer).png'; B = [int64]2503789; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Suíte com vista para o parque.png'; B = [int64]2532809; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Recepção (noite).png'; B = [int64]2358618; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Hotel - Recepção (dia).png'; B = [int64]2737518; D = '1 Hotel\Bracerum Hotel' },
  @{ N = 'Centro de Convenções - Átrio com arcos brancos, vista ampla.png'; B = [int64]2935323; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Cúpula de vidro com espelho d''água (entardecer).png'; B = [int64]2221028; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Cúpula de vidro e torre do hotel (dia).png'; B = [int64]3014386; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Foyer com executivo em primeiro plano (vertical).png'; B = [int64]2351484; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Foyer em evento.png'; B = [int64]2857799; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Auditório de 1.200 lugares, vista do fundo.png'; B = [int64]2218147; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Auditório, vista lateral com telão.png'; B = [int64]2528045; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Átrio e recepção sob a cúpula.png'; B = [int64]2978593; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Átrio e recepção sob a cúpula (variação).png'; B = [int64]2818109; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Restaurante sob a cúpula (dia).png'; B = [int64]3064973; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Restaurante sob a cúpula (anoitecer).png'; B = [int64]2731482; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Centro de Convenções - Restaurante e bar sob a cúpula (noite).png'; B = [int64]2880573; D = '1 Hotel\Centro de Convenções' },
  @{ N = 'Park - Vista aérea geral do masterplan.png'; B = [int64]3391385; D = '2 Cidade\Vistas aéreas e boulevard' },
  @{ N = 'Park - Vista aérea com o Rio Paraguai.png'; B = [int64]3332388; D = '2 Cidade\Vistas aéreas e boulevard' },
  @{ N = 'Park - Boulevard visto do alto, vista ampla com hotel ao fundo.png'; B = [int64]2751727; D = '2 Cidade\Vistas aéreas e boulevard' },
  @{ N = 'Vias - Boulevard arborizado com palmeiras.png'; B = [int64]2470051; D = '2 Cidade\Vias' },
  @{ N = 'Vias - Boulevard com galpões e hotel ao fundo (vertical).png'; B = [int64]1990760; D = '2 Cidade\Vias' },
  @{ N = 'Vias - Rotatória com paisagismo.png'; B = [int64]2619718; D = '2 Cidade\Vias' },
  @{ N = 'Portaria - Entrada principal com guarita.png'; B = [int64]2290485; D = '2 Cidade\Portaria' },
  @{ N = 'Clube do Caminhoneiro - Posto de abastecimento (noite).png'; B = [int64]2465334; D = '2 Cidade\Posto e Clube do Caminhoneiro' },
  @{ N = 'Park - Boulevard visto do alto, galpão e caminhão na doca.png'; B = [int64]3007021; D = '3 Loteamento\302 Lotes industriais (galpões)' },
  @{ N = 'Galpões - Galpão e via interna.png'; B = [int64]2392197; D = '3 Loteamento\302 Lotes industriais (galpões)' },
  @{ N = 'Galpões - Docas de carga, capacete em primeiro plano.png'; B = [int64]2367184; D = '3 Loteamento\302 Lotes industriais (galpões)' },
  @{ N = 'Galpões - Galpão com pórtico azul e avenida.png'; B = [int64]2589273; D = '3 Loteamento\302 Lotes industriais (galpões)' },
  @{ N = 'Hangares - Pátio com jato executivo.png'; B = [int64]1849141; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Hangares - Interior do hangar com jato.png'; B = [int64]2258328; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Hangares - Hangar Bracerum com jato (anoitecer).png'; B = [int64]2212007; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Pista de pouso - Vista aérea da pista e dos hangares.png'; B = [int64]2653206; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Pista de pouso - Cabeceira da pista.png'; B = [int64]2315565; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Pista de pouso - Cabeceira da pista (variação).png'; B = [int64]2215793; D = '3 Loteamento\303 Hangares e aeroporto' },
  @{ N = 'Resort - Lago e casas do condomínio.png'; B = [int64]2725081; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Casas na rua de calçamento.png'; B = [int64]2828122; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Rua residencial arborizada.png'; B = [int64]3137601; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Casa com garagem coberta (dia).png'; B = [int64]2746920; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Casa com garagem coberta (pôr do sol).png'; B = [int64]2602191; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Quadra poliesportiva.png'; B = [int64]2482126; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Piscina e quincho (amenities).png'; B = [int64]2279401; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Resort - Quincho e praça de convivência (amenities).png'; B = [int64]2477522; D = '4 Condomínios\402 Bracerum Resort' },
  @{ N = 'Centro de Convenções - Átrio com arcos brancos, vista ampla (cópia).png'; B = [int64]2935323; D = '_Duplicadas' },
  @{ N = 'Centro de Convenções - Foyer com executivo em primeiro plano (vertical) (cópia).png'; B = [int64]2351484; D = '_Duplicadas' },
  @{ N = 'Centro de Convenções - Auditório de 1.200 lugares, vista do fundo (cópia).png'; B = [int64]2218147; D = '_Duplicadas' },
  @{ N = 'Clube do Caminhoneiro - Posto de abastecimento (noite) (cópia).png'; B = [int64]2465334; D = '_Duplicadas' },
  @{ N = 'Resort - Casa com garagem coberta (dia) (cópia).png'; B = [int64]2746920; D = '_Duplicadas' },
  @{ N = 'Resort - Quadra poliesportiva (cópia).png'; B = [int64]2482126; D = '_Duplicadas' }
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
