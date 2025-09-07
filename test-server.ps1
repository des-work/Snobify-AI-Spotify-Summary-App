# Test server connectivity and data
Write-Host "Testing Snobify Server..." -ForegroundColor Cyan

# Start server in background
Write-Host "Starting server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\desmo\AI Programs\Snobify\server"
    npm run dev
}

# Wait for server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test health endpoint
try {
    Write-Host "Testing health endpoint..." -ForegroundColor Yellow
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8899/health" -UseBasicParsing
    Write-Host "Health check: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Health response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test stats endpoint
try {
    Write-Host "Testing stats endpoint..." -ForegroundColor Yellow
    $statsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8899/api/stats?profile=default" -UseBasicParsing
    Write-Host "Stats check: $($statsResponse.StatusCode)" -ForegroundColor Green
    $statsData = $statsResponse.Content | ConvertFrom-Json
    Write-Host "Stats data keys: $($statsData.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
    if ($statsData.stats) {
        Write-Host "Track count: $($statsData.stats.tracks.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "Stats check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test debug endpoint
try {
    Write-Host "Testing debug endpoint..." -ForegroundColor Yellow
    $debugResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8899/debug?profile=default" -UseBasicParsing
    Write-Host "Debug check: $($debugResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Debug check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Server job state: $($serverJob.State)" -ForegroundColor Cyan
Write-Host "Press Enter to stop server and exit..."
Read-Host

# Cleanup
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
