<#
  Desinstala FitWe Bridge: detiene el programa, quita el arranque automatico y, si se desea, borra la carpeta.
#>
param(
  [string]$InstallDir = "C:\FitWeBridge",
  [string]$TaskName = "FitWeBridge",
  [switch]$RemoveFiles
)


if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "  [OK] Tarea de arranque eliminada"
} else {
  Write-Host "  No hay tarea de arranque instalada"
}

# Parar el proceso si quedo en marcha.
$dir = (Resolve-Path $InstallDir -ErrorAction SilentlyContinue)
if ($dir) {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$($dir.Path)*src*index.js*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host "  [OK] Programa detenido" }
}

if (-not $RemoveFiles -and (Test-Path $InstallDir)) {
  $a = Read-Host "  Borrar tambien la carpeta $InstallDir (incluye config.json y el registro)? (s/N)"
  $RemoveFiles = $a -match "^[sS]"
}
if ($RemoveFiles -and (Test-Path $InstallDir)) {
  Set-Location $env:TEMP
  Remove-Item $InstallDir -Recurse -Force
  Write-Host "  [OK] Carpeta borrada"
}
Write-Host "  Desinstalacion terminada."
