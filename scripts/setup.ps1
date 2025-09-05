param([string]$Profile = "default")
$ErrorActionPreference = "Stop"

$root = "C:\Users\desmo\AI Programs\Snobify"
$server = Join-Path $root "server"
$app = Join-Path $root "app"
$profiles = Join-Path $root "profiles"
$defaultProfile = Join-Path $profiles $Profile
$sampleData = Join-Path $root "Music data\spotify_playlists\liked_songs.csv"

Write-Host "Snobify Setup — Initializing project" -ForegroundColor Cyan

# Check Node.js
$node = node -v 2>$null
if(-not $node){ 
    Write-Host "Node.js not found. Please install LTS from nodejs.org" -ForegroundColor Red
    exit 1 
}
Write-Host "Node: $node" -ForegroundColor Green

# Create profile directory if it doesn't exist
if(-not (Test-Path $defaultProfile)){
    New-Item -ItemType Directory -Path $defaultProfile -Force | Out-Null
    Write-Host "Created profile directory: $defaultProfile" -ForegroundColor Green
}

# Copy sample data if no CSV exists
$historyCsv = Join-Path $defaultProfile "history.csv"
if(-not (Test-Path $historyCsv) -and (Test-Path $sampleData)){
    Copy-Item $sampleData $historyCsv
    Write-Host "Copied sample data to $historyCsv" -ForegroundColor Green
} elseif(-not (Test-Path $historyCsv)){
    Write-Host "No sample data found. Please add your CSV to $historyCsv" -ForegroundColor Yellow
}

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Cyan
Push-Location $server
if(-not (Test-Path "node_modules")){ 
    npm install 
    Write-Host "Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Server dependencies already installed" -ForegroundColor Yellow
}
Pop-Location

# Install app dependencies
Write-Host "Installing app dependencies..." -ForegroundColor Cyan
Push-Location $app
if(-not (Test-Path "node_modules")){ 
    npm install 
    Write-Host "App dependencies installed" -ForegroundColor Green
} else {
    Write-Host "App dependencies already installed" -ForegroundColor Yellow
}
Pop-Location

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Run 'scripts\run.ps1' to start the server" -ForegroundColor Cyan
Write-Host "Run 'scripts\run-app.ps1' to start the frontend" -ForegroundColor Cyan


