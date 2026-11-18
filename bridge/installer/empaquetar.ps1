<#
  Crea bridge\dist\FitWe-Bridge.zip: el paquete que se lleva al PC de recepcion.
  No incluye node_modules, config.json (credenciales) ni registros.
  Uso:  powershell -File bridge\installer\empaquetar.ps1
#>
$ErrorActionPreference = "Stop"
$bridge = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $bridge "dist"
$stage = Join-Path $dist "FitWe-Bridge"
$zip = Join-Path $dist "FitWe-Bridge.zip"

if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item (Join-Path $bridge "src") $stage -Recurse
Copy-Item (Join-Path $bridge "installer") $stage -Recurse
foreach ($f in "Instalar.bat", "Desinstalar.bat", "README.md", "package.json", "package-lock.json", "config.example.json") {
  Copy-Item (Join-Path $bridge $f) $stage
}
# El empaquetador no se lleva al PC de recepcion.
Remove-Item (Join-Path $stage "installer\empaquetar.ps1") -Force

Compress-Archive -Path $stage -DestinationPath $zip -Force
Remove-Item $stage -Recurse -Force
Write-Host "Paquete creado: $zip"
Write-Host ("Tamano: {0:N0} KB" -f ((Get-Item $zip).Length / 1KB))
