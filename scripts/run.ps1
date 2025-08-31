param([string]$Profile = "default")
$ErrorActionPreference = "Stop"
$root = "C:\Users\desmo\AI Programs\Snobify"
$server = Join-Path $root "server"
Write-Host "Starting Snobify server..." -ForegroundColor Cyan
Push-Location $server
if(-not (Test-Path "node_modules")){ npm i }
npm run dev
Pop-Location
