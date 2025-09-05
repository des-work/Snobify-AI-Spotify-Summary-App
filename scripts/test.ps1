param([string]$Profile = "default")
$ErrorActionPreference = "Stop"

$root = "C:\Users\desmo\AI Programs\Snobify"
$server = Join-Path $root "server"
$app = Join-Path $root "app"

Write-Host "Snobify Test - Checking system health" -ForegroundColor Cyan

# Test 1: Check Node.js installation
Write-Host "Test 1: Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    if ($nodeVersion) {
        Write-Host "PASS: Node.js found - $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Node.js not found in PATH" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "FAIL: Node.js not found in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check npm installation
Write-Host "Test 2: Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v 2>$null
    if ($npmVersion) {
        Write-Host "PASS: npm found - $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "FAIL: npm not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: npm not found" -ForegroundColor Red
    exit 1
}

# Test 3: Check if dependencies are installed
Write-Host "Test 3: Checking dependencies..." -ForegroundColor Yellow
$serverDeps = Test-Path (Join-Path $server "node_modules")
$appDeps = Test-Path (Join-Path $app "node_modules")

if ($serverDeps) {
    Write-Host "PASS: Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "FAIL: Server dependencies missing" -ForegroundColor Red
    Write-Host "Run: cd server && npm install" -ForegroundColor Yellow
}

if ($appDeps) {
    Write-Host "PASS: App dependencies installed" -ForegroundColor Green
} else {
    Write-Host "FAIL: App dependencies missing" -ForegroundColor Red
    Write-Host "Run: cd app && npm install" -ForegroundColor Yellow
}

# Test 4: Check if sample data exists
Write-Host "Test 4: Checking sample data..." -ForegroundColor Yellow
$sampleData = Join-Path $root "profiles\default\history.csv"
if (Test-Path $sampleData) {
    Write-Host "PASS: Sample data found" -ForegroundColor Green
} else {
    Write-Host "FAIL: No sample data found" -ForegroundColor Red
    Write-Host "Expected: $sampleData" -ForegroundColor Yellow
}

# Test 5: Check if ports are free
Write-Host "Test 5: Checking ports..." -ForegroundColor Yellow
$port8899 = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 8899 -and $_.State -eq "Listen" }
$port5173 = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5173 -and $_.State -eq "Listen" }

if ($port8899) {
    Write-Host "WARN: Port 8899 is in use (server port)" -ForegroundColor Yellow
} else {
    Write-Host "PASS: Port 8899 is free" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "WARN: Port 5173 is in use (app port)" -ForegroundColor Yellow
} else {
    Write-Host "PASS: Port 5173 is free" -ForegroundColor Green
}

Write-Host "Test complete!" -ForegroundColor Cyan
