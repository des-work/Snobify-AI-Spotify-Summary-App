# ============================================================================
# ENHANCED SNOBIFY LAUNCHER - Optimized Connection Management
# ============================================================================

param(
    [string]$Profile = "default",
    [switch]$SkipDependencies,
    [switch]$DebugMode,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

# Get the script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SNOBIFY ENHANCED LAUNCHER" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Project Root: $root" -ForegroundColor Gray
Write-Host "Profile: $Profile" -ForegroundColor Gray
Write-Host "Debug Mode: $DebugMode" -ForegroundColor Gray
Write-Host "Skip Dependencies: $SkipDependencies" -ForegroundColor Gray
Write-Host "No Cache: $NoCache" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# SYSTEM CHECKS
# ============================================================================

function Test-SystemRequirements {
    Write-Host "Checking system requirements..." -ForegroundColor Yellow
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion -match "v(\d+)\.") {
            $majorVersion = [int]$matches[1]
            if ($majorVersion -lt 18) {
                Write-Host "Warning: Node.js version $nodeVersion detected. Recommended: v18+" -ForegroundColor Yellow
            } else {
                Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "npm not found. Please install npm first." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Check available ports
    $serverPort = 8899
    $frontendPort = 5173
    
    try {
        $serverInUse = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction SilentlyContinue
        if ($serverInUse) {
            Write-Host "Warning: Port $serverPort is already in use" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Port $serverPort is available" -ForegroundColor Green
    }
    
    try {
        $frontendInUse = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
        if ($frontendInUse) {
            Write-Host "Warning: Port $frontendPort is already in use" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Port $frontendPort is available" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ============================================================================
# DEPENDENCY MANAGEMENT
# ============================================================================

function Install-Dependencies {
    param($Path, $Name)
    
    if ($SkipDependencies) {
        Write-Host "Skipping dependency installation for $Name" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Checking dependencies for $Name..." -ForegroundColor Yellow
    
    if (-not (Test-Path (Join-Path $Path "node_modules"))) {
        Write-Host "Installing dependencies for $Name..." -ForegroundColor Yellow
        Push-Location $Path
        try {
            npm install
            Write-Host "Dependencies installed for $Name" -ForegroundColor Green
        } catch {
            Write-Host "Failed to install dependencies for $Name" -ForegroundColor Red
            throw
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "Dependencies already installed for $Name" -ForegroundColor Green
    }
}

# ============================================================================
# SERVER MANAGEMENT
# ============================================================================

function Start-Server {
    param($ServerPath)
    
    Write-Host "Starting Snobify Server..." -ForegroundColor Yellow
    
    $serverJob = Start-Job -ScriptBlock {
        param($path, $debug)
        Set-Location $path
        
        if ($debug) {
            $env:DEBUG = "true"
            $env:NODE_ENV = "development"
        }
        
        npm run dev
    } -ArgumentList $ServerPath, $DebugMode
    
    # Wait for server to start
    Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    # Check server health
    $maxAttempts = 10
    $attempt = 0
    
    do {
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8899/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "Server is healthy and responding" -ForegroundColor Green
                $serverHealthy = $true
                break
            }
        } catch {
            Write-Host "Health check attempt $attempt/$maxAttempts failed" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } while ($attempt -lt $maxAttempts)
    
    if (-not $serverHealthy) {
        Write-Host "Server failed to start or is not responding" -ForegroundColor Red
        if ($serverJob.HasMoreData) {
            Write-Host "Server output:" -ForegroundColor Red
            Receive-Job $serverJob
        }
        throw "Server startup failed"
    }
    
    return $serverJob
}

# ============================================================================
# FRONTEND MANAGEMENT
# ============================================================================

function Start-Frontend {
    param($AppPath)
    
    Write-Host "Starting Snobify Frontend..." -ForegroundColor Yellow
    
    Push-Location $AppPath
    try {
        if ($DebugMode) {
            $env:DEBUG = "true"
            $env:NODE_ENV = "development"
        }
        
        if ($NoCache) {
            $env:VITE_NO_CACHE = "true"
        }
        
        npm run dev
    } finally {
        Pop-Location
    }
}

# ============================================================================
# CLEANUP
# ============================================================================

function Stop-Services {
    param($ServerJob)
    
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    
    if ($ServerJob) {
        Stop-Job $ServerJob -ErrorAction SilentlyContinue
        Remove-Job $ServerJob -ErrorAction SilentlyContinue
    }
    
    Write-Host "Services stopped" -ForegroundColor Green
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    # System checks
    Test-SystemRequirements
    
    # Set paths
    $serverPath = Join-Path $root "server"
    $appPath = Join-Path $root "app"
    
    # Verify paths exist
    if (-not (Test-Path $serverPath)) {
        Write-Host "Server directory not found: $serverPath" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    if (-not (Test-Path $appPath)) {
        Write-Host "App directory not found: $appPath" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "All paths verified" -ForegroundColor Green
    Write-Host ""
    
    # Install dependencies
    Install-Dependencies $serverPath "Server"
    Install-Dependencies $appPath "Frontend"
    
    Write-Host ""
    
    # Start server
    $serverJob = Start-Server $serverPath
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  SNOBIFY IS READY!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Server: http://127.0.0.1:8899" -ForegroundColor Cyan
    Write-Host "Health: http://127.0.0.1:8899/health" -ForegroundColor Cyan
    Write-Host "Debug:  http://127.0.0.1:8899/debug" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Starting frontend..." -ForegroundColor Yellow
    Write-Host ""
    
    # Start frontend
    Start-Frontend $appPath
    
} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
} finally {
    # Cleanup
    if ($serverJob) {
        Stop-Services $serverJob
    }
}

Write-Host ""
Write-Host "Snobify session ended. Press Enter to close this window." -ForegroundColor Cyan
Read-Host
