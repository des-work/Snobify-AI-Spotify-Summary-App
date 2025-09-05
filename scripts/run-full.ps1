param([string]$Profile = "default")
$ErrorActionPreference = "Stop"

$root = "C:\Users\desmo\AI Programs\Snobify"
$server = Join-Path $root "server"
$app = Join-Path $root "app"

Write-Host "Starting Snobify (Full Stack)..." -ForegroundColor Cyan

# Start server in background
Write-Host "Starting server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    param($serverPath)
    Set-Location $serverPath
    npm run dev
} -ArgumentList $server

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start app
Write-Host "Starting frontend..." -ForegroundColor Yellow
Push-Location $app
npm run dev
Pop-Location

# Cleanup
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
