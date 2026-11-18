<#
  Instalador del programa local de recepcion de FitWe.
  Se lanza con doble clic en Instalar.bat. No necesita permisos de administrador.

  Parametros (opcionales, para instalaciones sin preguntas):
    -InstallDir   carpeta de instalacion (por defecto C:\FitWeBridge)
    -ConfigFile   un config.json ya preparado: se copia y no se hacen preguntas
    -NoAutostart  no crear la tarea que arranca el programa con Windows
    -SkipCheck    no ejecutar la comprobacion final
#>
param(
  [string]$InstallDir = "C:\FitWeBridge",
  [string]$ConfigFile = "",
  [string]$TaskName = "FitWeBridge",
  [switch]$NoAutostart,
  [switch]$SkipCheck
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Source = Split-Path -Parent $PSScriptRoot
$MinNode = [version]"20.0.0"

function Say($m)  { Write-Host $m }
function Step($m) { Write-Host ""; Write-Host "== $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  [!]  $m" -ForegroundColor Yellow }

# ---------------------------------------------------------------- Node.js
function Get-SystemNode {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) { return $null }
  $v = ((& $cmd.Source --version) -replace "^v", "").Split("-")[0]
  if ([version]$v -ge $MinNode) { return $cmd.Source }
  return $null
}

function Install-PortableNode([string]$dest) {
  Say "  Node.js no esta instalado (o es muy antiguo). Descargando una copia para este programa..."
  $index = Invoke-RestMethod "https://nodejs.org/dist/index.json"
  $rel = $index | Where-Object { $_.lts -and $_.version -like "v22.*" -and ($_.files -contains "win-x64-zip") } | Select-Object -First 1
  if (-not $rel) { throw "No se encontro una version de Node.js 22 LTS en nodejs.org" }
  $ver = $rel.version
  $zipName = "node-$ver-win-x64.zip"
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("fitwe-node-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp $zipName
    Invoke-WebRequest "https://nodejs.org/dist/$ver/$zipName" -OutFile $zip -UseBasicParsing
    $sums = (Invoke-WebRequest "https://nodejs.org/dist/$ver/SHASUMS256.txt" -UseBasicParsing).Content
    $line = ($sums -split "`n") | Where-Object { $_ -match [regex]::Escape($zipName) } | Select-Object -First 1
    $expected = ($line -split "\s+")[0].Trim().ToLower()
    $actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    if (-not $expected -or $expected -ne $actual) { throw "La descarga de Node.js esta danada (la suma de comprobacion no coincide)" }
    Expand-Archive $zip -DestinationPath $tmp -Force
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Move-Item (Join-Path $tmp "node-$ver-win-x64") $dest
  } finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
  return (Join-Path $dest "node.exe")
}

# ---------------------------------------------------------------- Preguntas
function Ask([string]$label, [string]$default = "") {
  $suffix = if ($default) { " [$default]" } else { "" }
  while ($true) {
    $v = Read-Host "  $label$suffix"
    if (-not $v) { $v = $default }
    if ($v) { return $v.Trim() }
    Warn "Este dato es necesario."
  }
}

function AskSecret([string]$label) {
  while ($true) {
    $s = Read-Host "  $label" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
    try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($plain) { return $plain }
    Warn "Este dato es necesario."
  }
}

function Get-ComPorts {
  $found = @()
  try {
    foreach ($e in Get-CimInstance Win32_PnPEntity -ErrorAction Stop) {
      if ($e.Name -match "\((COM\d+)\)") { $found += [pscustomobject]@{ Port = $Matches[1]; Name = $e.Name } }
    }
  } catch { }
  # Respaldo: puertos que Windows lista aunque no tengan descripcion.
  try {
    foreach ($name in [System.IO.Ports.SerialPort]::GetPortNames()) {
      if (-not ($found | Where-Object { $_.Port -eq $name })) { $found += [pscustomobject]@{ Port = $name; Name = "(sin descripcion)" } }
    }
  } catch { }
  return @($found)
}

function AskPort([string]$label, $ports, [bool]$optional) {
  while ($true) {
    $hint = if ($optional) { " (Enter para no usar)" } else { "" }
    $v = (Read-Host "  $label$hint").Trim().ToUpper()
    if (-not $v -and $optional) { return "" }
    if ($v -match "^COM\d+$") { return $v }
    Warn "Escribe un puerto como COM3."
  }
}

function Read-ConfigFromUser {
  Say ""
  Say "  Responde a lo siguiente. Si no sabes algo, preguntalo a quien configuro la controladora."
  Say ""
  Say "  --- FitWe ---"
  $url = Ask "Direccion de FitWe (https://...)"
  $email = Ask "Correo de la cuenta del gimnasio"
  $pass = AskSecret "Contrasena de esa cuenta"

  Say ""
  Say "  --- Controladora Hikvision ---"
  $ip = Ask "IP de la controladora (por ejemplo 192.168.1.64)"
  $cu = Ask "Usuario de la controladora" "admin"
  $cp = AskSecret "Contrasena de la controladora"

  Say ""
  Say "  --- Lectores de QR ---"
  $ports = @(Get-ComPorts)
  if ($ports.Count -gt 0) {
    Say "  Puertos COM detectados en este PC:"
    foreach ($p in $ports) { Say ("    {0}  -  {1}" -f $p.Port, $p.Name) }
  } else {
    Warn "No se detecta ningun puerto COM. Conecta el lector y pon el modo 'USB virtual serial port' (ver el manual del lector)."
  }
  $entry = AskPort "Puerto del lector de ENTRADA" $ports $false
  $exit = AskPort "Puerto del lector de SALIDA" $ports $true

  $readers = @(@{ name = "entrada"; port = $entry; baudRate = 9600; direction = "entry"; door = 1 })
  if ($exit) { $readers += @{ name = "salida"; port = $exit; baudRate = 9600; direction = "exit"; door = 2 } }

  $baseUrl = if ($ip -match "^https?://") { $ip } else { "http://$ip" }
  return @{
    fitwe      = @{ url = $url; email = $email; password = $pass }
    controller = @{ url = $baseUrl; user = $cu; password = $cp }
    readers    = $readers
  }
}

function Write-ConfigFile([string]$path, $cfg) {
  $json = $cfg | ConvertTo-Json -Depth 6
  # UTF-8 SIN marca BOM: Node no la admite al leer el JSON.
  [IO.File]::WriteAllText($path, $json, (New-Object Text.UTF8Encoding($false)))
}

function Protect-ConfigFile([string]$path) {
  # Solo el usuario actual y el sistema pueden leer la contrasena guardada.
  try {
    & icacls $path /inheritance:r /grant:r "$($env:USERNAME):(R,W)" "SYSTEM:(R,W)" | Out-Null
    Ok "config.json protegido: solo lo puede leer este usuario"
  } catch {
    Warn "No se pudieron restringir los permisos de config.json: $($_.Exception.Message)"
  }
}

# ---------------------------------------------------------------- Instalacion
Write-Host ""
Write-Host "  Instalador de FitWe Bridge (lector de QR -> torno)" -ForegroundColor White
Write-Host "  Carpeta de instalacion: $InstallDir"

Step "1/6  Node.js"
$nodeExe = Get-SystemNode
if ($nodeExe) {
  Ok "Node.js encontrado: $nodeExe"
} else {
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  $nodeExe = Install-PortableNode (Join-Path $InstallDir "node")
  Ok "Node.js descargado y verificado"
}
$nodeDir = Split-Path -Parent $nodeExe
$env:PATH = "$nodeDir;$env:PATH"
$npm = Join-Path $nodeDir "npm.cmd"
if (-not (Test-Path $npm)) { $npm = (Get-Command npm -ErrorAction Stop).Source }

Step "2/6  Copiando el programa"
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
if ((Resolve-Path $Source).Path -ne (Resolve-Path $InstallDir).Path) {
  Copy-Item (Join-Path $Source "src") $InstallDir -Recurse -Force
  foreach ($f in "package.json", "package-lock.json", "config.example.json", "README.md") {
    Copy-Item (Join-Path $Source $f) $InstallDir -Force
  }
}
Copy-Item (Join-Path $PSScriptRoot "run.ps1") $InstallDir -Force
Copy-Item (Join-Path $PSScriptRoot "uninstall.ps1") $InstallDir -Force
$bat = "@echo off`r`nchcp 65001 >nul`r`ntitle Desinstalar FitWe Bridge`r`n" +
  "powershell -NoProfile -ExecutionPolicy Bypass -File `"%~dp0uninstall.ps1`" -InstallDir `"%~dp0.`"`r`necho.`r`npause`r`n"
[IO.File]::WriteAllText((Join-Path $InstallDir "Desinstalar.bat"), $bat, (New-Object Text.ASCIIEncoding))
Ok "Archivos copiados"

Step "3/6  Instalando dependencias"
Push-Location $InstallDir
try {
  $env:NODE_ENV = "production"
  & $npm ci --omit=dev --no-audit --no-fund 2>&1 | ForEach-Object { Write-Host "    $_" }
  if ($LASTEXITCODE -ne 0) { throw "npm ci fallo (codigo $LASTEXITCODE). Revisa que el PC tenga internet." }
} finally { Pop-Location }
Ok "Dependencias instaladas"

Step "4/6  Configuracion"
$configPath = Join-Path $InstallDir "config.json"
if ($ConfigFile) {
  Copy-Item $ConfigFile $configPath -Force
  Ok "Usando el config.json indicado"
} elseif (Test-Path $configPath) {
  $keep = Read-Host "  Ya existe una configuracion. Mantenerla? (S/n)"
  if ($keep -match "^[nN]") { Write-ConfigFile $configPath (Read-ConfigFromUser) } else { Ok "Se mantiene la configuracion actual" }
} else {
  Write-ConfigFile $configPath (Read-ConfigFromUser)
}
Protect-ConfigFile $configPath

Step "5/6  Comprobacion"
if ($SkipCheck) {
  Warn "Comprobacion omitida"
} else {
  Push-Location $InstallDir
  try {
    & $nodeExe (Join-Path $InstallDir "src\index.js") --check 2>&1 | ForEach-Object { Write-Host "    $_" }
    if ($LASTEXITCODE -ne 0) {
      Warn "Hay puntos por corregir. Es normal si la controladora o el lector aun no estan conectados."
      Warn "Puedes repetir la comprobacion mas tarde con:  cd $InstallDir ; node src\index.js --check"
    } else {
      Ok "Todo correcto"
    }
  } finally { Pop-Location }
}

Step "6/6  Arranque automatico"
if ($NoAutostart) {
  Warn "Omitido. Para arrancarlo a mano:  powershell -File $InstallDir\run.ps1"
} else {
  try {
    $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$InstallDir\run.ps1`""
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg -WorkingDirectory $InstallDir
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User "$($env:USERDOMAIN)\$($env:USERNAME)"
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
      -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force `
      -Description "Lee el lector de QR, valida en FitWe y abre el torno" | Out-Null
    Start-ScheduledTask -TaskName $TaskName
    Ok "Tarea '$TaskName' creada: arranca sola al iniciar sesion en Windows y se reinicia si falla"
  } catch {
    Warn "No se pudo crear el arranque automatico: $($_.Exception.Message)"
    Warn "Arranca el programa a mano con:  powershell -File $InstallDir\run.ps1"
  }
}

Write-Host ""
Write-Host "  Instalacion terminada." -ForegroundColor Green
Say "  - Registro de lo que ocurre:  $InstallDir\bridge.log"
Say "  - Para cambiar la configuracion: edita $InstallDir\config.json y reinicia la tarea (o el PC)"
Say "  - Para desinstalar: doble clic en $InstallDir\Desinstalar.bat"
Say "  - Recuerda desactivar la suspension del PC en Opciones de energia."
