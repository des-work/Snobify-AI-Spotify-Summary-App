# Snobify Server Startup with Comprehensive Debugging
# This script starts the server with full debugging and error reporting

param([string]$Profile = "default")

$ErrorActionPreference = "Stop"

# Get the script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$serverPath = Join-Path $root "server"

Write-Host "🎵 Starting Snobify Server with Debug Mode..." -ForegroundColor Cyan
Write-Host "📁 Project Root: $root" -ForegroundColor Gray
Write-Host "👤 Profile: $Profile" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Verify server directory exists
if (-not (Test-Path $serverPath)) {
    Write-Host "❌ Server directory not found: $serverPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if package.json exists
$packageJsonPath = Join-Path $serverPath "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Host "❌ package.json not found in server directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Server directory verified" -ForegroundColor Green

# Check if node_modules exists, install if not
$nodeModulesPath = Join-Path $serverPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    Push-Location $serverPath
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Check if the new server file exists
$newServerPath = Join-Path $serverPath "src\server.ts"
$oldServerPath = Join-Path $serverPath "src\index.ts"

if (Test-Path $newServerPath) {
    Write-Host "🚀 Starting with new optimized server..." -ForegroundColor Cyan
    $serverFile = "server.ts"
} elseif (Test-Path $oldServerPath) {
    Write-Host "⚠️ Using legacy server (new server not found)..." -ForegroundColor Yellow
    $serverFile = "index.ts"
} else {
    Write-Host "❌ No server file found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Start the server
Write-Host "🔄 Starting server..." -ForegroundColor Cyan
Write-Host "📄 Server file: $serverFile" -ForegroundColor Gray
Write-Host ""

Push-Location $serverPath

try {
    # Set environment variables for debugging
    $env:NODE_ENV = "development"
    $env:DEBUG = "true"
    
    # Start the server with detailed output
    Write-Host "🎯 Server should start on: http://127.0.0.1:8899" -ForegroundColor Green
    Write-Host "🏥 Health check: http://127.0.0.1:8899/health" -ForegroundColor Green
    Write-Host "🐛 Debug info: http://127.0.0.1:8899/debug" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    
    npm run dev
    
} catch {
    Write-Host ""
    Write-Host "❌ Server failed to start!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if port 8899 is already in use" -ForegroundColor White
    Write-Host "2. Verify all dependencies are installed" -ForegroundColor White
    Write-Host "3. Check the server logs above for specific errors" -ForegroundColor White
    Write-Host "4. Try running 'npm install' in the server directory" -ForegroundColor White
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "👋 Server session ended. Press Enter to close this window." -ForegroundColor Cyan
Read-Host
