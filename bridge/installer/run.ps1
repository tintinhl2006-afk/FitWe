<#
  Lanza el programa y guarda lo que escribe en bridge.log. Es lo que ejecuta la tarea de Windows.
  Se puede ejecutar a mano:  powershell -File run.ps1
#>
$here = $PSScriptRoot
$node = Join-Path $here "node\node.exe"
if (-not (Test-Path $node)) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) { Write-Error "No se encuentra Node.js"; exit 1 }
  $node = $cmd.Source
}

$log = Join-Path $here "bridge.log"
if ((Test-Path $log) -and ((Get-Item $log).Length -gt 5MB)) {
  Move-Item $log "$log.old" -Force
}

Set-Location $here
$script = Join-Path $here "src\index.js"
# cmd para que el registro se guarde en UTF-8 (PowerShell 5.1 escribiria UTF-16).
& cmd.exe /c "`"$node`" `"$script`" >> `"$log`" 2>&1"
exit $LASTEXITCODE
