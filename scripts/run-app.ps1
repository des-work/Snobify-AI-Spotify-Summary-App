param()
$ErrorActionPreference = "Stop"
$root = "C:\Users\desmo\AI Programs\Snobify"
$ui = Join-Path $root "app"
Write-Host "Starting Snobify UI..." -ForegroundColor Cyan
Push-Location $ui
if(-not (Test-Path "node_modules")){ npm i }
npm run dev
Pop-Location