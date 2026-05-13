# scripts/build-backend.ps1 - empacota backend como .exe standalone via PyInstaller.
#
# Saída: backend/dist/jarvstranscript-backend/
#   - jarvstranscript-backend.exe
#   - _internal/ (libs + DLLs CUDA + ONNX model)
#
# Esse .exe é o sidecar consumido pelo Tauri MSI (próxima sub-fase).
#
# Uso:
#   .\scripts\build-backend.ps1                 # build padrao
#   .\scripts\build-backend.ps1 -Clean          # apaga dist/build antes
#   .\scripts\build-backend.ps1 -SmokeOnly      # so testa o .exe ja existente

[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$SmokeOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$pyVenv = Join-Path $backend ".venv\Scripts\python.exe"
$spec = Join-Path $backend "build-backend.spec"
$distRoot = Join-Path $backend "dist\jarvstranscript-backend"
$exePath = Join-Path $distRoot "jarvstranscript-backend.exe"

if (-not (Test-Path $pyVenv)) {
    Write-Host "[build] venv ausente em $pyVenv" -ForegroundColor Red
    exit 1
}

if (-not $SmokeOnly) {
    if ($Clean) {
        Write-Host "[build] limpando dist/ e build/" -ForegroundColor Cyan
        Remove-Item -Recurse -Force (Join-Path $backend "dist") -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force (Join-Path $backend "build") -ErrorAction SilentlyContinue
    }

    Write-Host "[build] rodando PyInstaller (1a vez leva ~5-10min)..." -ForegroundColor Cyan
    Push-Location $backend
    try {
        & $pyVenv -m PyInstaller $spec --clean --noconfirm
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[build] PyInstaller falhou (exit $LASTEXITCODE)" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $exePath)) {
    Write-Host "[build] .exe nao gerado em $exePath" -ForegroundColor Red
    exit 1
}

$sizeBytes = (Get-ChildItem -Recurse $distRoot | Measure-Object -Property Length -Sum).Sum
$sizeMb = [math]::Round($sizeBytes / 1MB, 1)
Write-Host "[build] OK - $exePath" -ForegroundColor Green
Write-Host "[build] bundle total: $sizeMb MB" -ForegroundColor Green
