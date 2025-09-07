# Snobify Desktop Launcher
# This script launches the full Snobify application (server + frontend)

param([string]$Profile = "default")

$ErrorActionPreference = "Stop"

# Get the script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

Write-Host "Starting Snobify Music Analysis App..." -ForegroundColor Cyan
Write-Host "Project Root: $root" -ForegroundColor Gray
Write-Host "Profile: $Profile" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
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

# Function to start server
function Start-Server {
    param($serverPath)
    
    Write-Host "🚀 Starting Snobify Server..." -ForegroundColor Yellow
    
    # Check if node_modules exists, install if not
    if (-not (Test-Path (Join-Path $serverPath "node_modules"))) {
        Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
        Push-Location $serverPath
        npm install
        Pop-Location
    }
    
    # Start server
    Push-Location $serverPath
    npm run dev
    Pop-Location
}

# Function to start frontend
function Start-Frontend {
    param($appPath)
    
    Write-Host "🎨 Starting Snobify Frontend..." -ForegroundColor Yellow
    
    # Check if node_modules exists, install if not
    if (-not (Test-Path (Join-Path $appPath "node_modules"))) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        Push-Location $appPath
        npm install
        Pop-Location
    }
    
    # Start frontend
    Push-Location $appPath
    npm run dev
    Pop-Location
}

# Set paths
$serverPath = Join-Path $root "server"
$appPath = Join-Path $root "app"

# Verify paths exist
if (-not (Test-Path $serverPath)) {
    Write-Host "❌ Server directory not found: $serverPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $appPath)) {
    Write-Host "❌ App directory not found: $appPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All paths verified" -ForegroundColor Green
Write-Host ""

try {
    # Start server in background job
    Write-Host "🔄 Starting server in background..." -ForegroundColor Cyan
    $serverJob = Start-Job -ScriptBlock ${function:Start-Server} -ArgumentList $serverPath
    
    # Wait for server to start
    Write-Host "⏳ Waiting for server to initialize..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    # Check if server job is still running
    if ($serverJob.State -eq "Running") {
        Write-Host "✅ Server started successfully" -ForegroundColor Green
        Write-Host "🌐 Server should be available at: http://127.0.0.1:8899" -ForegroundColor Cyan
        Write-Host ""
        
        # Start frontend
        Write-Host "🔄 Starting frontend..." -ForegroundColor Cyan
        Start-Frontend $appPath
    } else {
        Write-Host "❌ Server failed to start" -ForegroundColor Red
        Write-Host "Server job state: $($serverJob.State)" -ForegroundColor Red
        if ($serverJob.HasMoreData) {
            Write-Host "Server output:" -ForegroundColor Red
            Receive-Job $serverJob
        }
    }
} catch {
    Write-Host "❌ Error starting Snobify: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup background job
    if ($serverJob) {
        Write-Host ""
        Write-Host "🛑 Stopping server..." -ForegroundColor Yellow
        Stop-Job $serverJob -ErrorAction SilentlyContinue
        Remove-Job $serverJob -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Snobify session ended. Press Enter to close this window." -ForegroundColor Cyan
Read-Host
