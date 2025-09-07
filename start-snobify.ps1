# ============================================================================
# SNOBIFY - SIMPLE STARTUP SCRIPT
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SNOBIFY - SIMPLE STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "server\package.json")) {
    Write-Host "ERROR: Not in Snobify directory" -ForegroundColor Red
    Write-Host "Please run this from the Snobify root folder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "app\package.json")) {
    Write-Host "ERROR: App directory not found" -ForegroundColor Red
    Write-Host "Please run this from the Snobify root folder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js first" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    Write-Host "Please install npm first" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting Snobify Server..." -ForegroundColor Yellow

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev" -WindowStyle Normal

Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "Starting Snobify Frontend..." -ForegroundColor Yellow

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\app'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    SNOBIFY IS STARTING UP!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server: http://127.0.0.1:8899" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both windows will open automatically." -ForegroundColor White
Write-Host "Close this window when done." -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to close this window"
