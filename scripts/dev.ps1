# scripts/dev.ps1 - sobe backend Python + Tauri dev na mesma sessao.
#
# Sem flags: usa o que estiver em data/config.json (settings persistido).
# Com flags: cada flag passada sobrescreve via env var.
#
# Uso:
#   .\scripts\dev.ps1                                # respeita data/config.json
#   .\scripts\dev.ps1 -Model large-v3-turbo
#   .\scripts\dev.ps1 -Mode toggle -Device cpu
#   .\scripts\dev.ps1 -Vad off                       # debug sem VAD
#
# Ctrl+C neste console encerra o Tauri dev e mata o backend.

[CmdletBinding()]
param(
    [string]$Model,
    [ValidateSet("auto", "cuda", "cpu")]
    [string]$Device,
    [ValidateSet("ptt", "toggle")]
    [string]$Mode,
    [ValidateSet("silero", "rms", "off")]
    [string]$Vad
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pyVenv = Join-Path $root "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $pyVenv)) {
    Write-Host "[dev] venv do backend nao encontrado em $pyVenv" -ForegroundColor Red
    Write-Host "[dev] rode primeiro: cd backend; python -m venv .venv; .venv\Scripts\Activate.ps1; pip install -e `".[dev]`"" -ForegroundColor Yellow
    exit 1
}

# Path absoluto do config.json — backend Python E shell Rust leem do mesmo lugar
# independente de quem foi iniciado em qual CWD.
$env:JARVSTRANSCRIPT_CONFIG_PATH = Join-Path $root "data\config.json"

# So seta env var pra cada flag EXPLICITAMENTE passada. Sem flag = backend le
# do data/config.json. Quem usa esse script no dia-a-dia so roda .\scripts\dev.ps1.
$summary = @()
if ($PSBoundParameters.ContainsKey("Model"))  { $env:JARVSTRANSCRIPT_MODEL  = $Model;  $summary += "model=$Model" }
if ($PSBoundParameters.ContainsKey("Device")) { $env:JARVSTRANSCRIPT_DEVICE = $Device; $summary += "device=$Device" }
if ($PSBoundParameters.ContainsKey("Mode"))   { $env:JARVSTRANSCRIPT_MODE   = $Mode;   $summary += "mode=$Mode" }
if ($PSBoundParameters.ContainsKey("Vad"))    { $env:JARVSTRANSCRIPT_VAD    = $Vad;    $summary += "vad=$Vad" }

if ($summary.Count -gt 0) {
    Write-Host "[dev] override via env: $($summary -join ' ')" -ForegroundColor Cyan
} else {
    Write-Host "[dev] sem overrides - backend usa data/config.json" -ForegroundColor Cyan
}

$backend = Start-Process -PassThru -FilePath $pyVenv -ArgumentList "-m", "jarvstranscript.main" -WorkingDirectory $root -WindowStyle Normal

$backendPid = $backend.Id
Write-Host "[dev] backend PID=$backendPid - aguardando ws://127.0.0.1:7979 aceitar..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $tcp = New-Object Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 7979)
        $tcp.Close()
        $ready = $true
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

if (-not $ready) {
    Write-Host "[dev] backend nao subiu em 30s - abortando" -ForegroundColor Red
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "[dev] backend pronto. Subindo Tauri dev (primeira vez compila Rust - leva minutos)..." -ForegroundColor Green
try {
    Push-Location $root
    npm run tauri dev
} finally {
    Pop-Location
    Write-Host "[dev] encerrando backend (PID=$backendPid)..." -ForegroundColor Cyan
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
}
