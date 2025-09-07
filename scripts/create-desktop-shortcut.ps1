# Create Desktop Shortcut for Snobify
# This script creates a desktop shortcut that launches Snobify

$ErrorActionPreference = "Stop"

# Get the script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

Write-Host "🎵 Creating Snobify Desktop Shortcut..." -ForegroundColor Cyan

# Paths
$batchFile = Join-Path $scriptDir "Launch Snobify.bat"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Snobify.lnk"

# Verify the batch file exists
if (-not (Test-Path $batchFile)) {
    Write-Host "❌ Batch file not found: $batchFile" -ForegroundColor Red
    exit 1
}

try {
    # Create WScript.Shell object
    $WshShell = New-Object -comObject WScript.Shell
    
    # Create shortcut
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batchFile
    $Shortcut.WorkingDirectory = $scriptDir
    $Shortcut.Description = "Launch Snobify Music Analysis App"
    $Shortcut.IconLocation = "shell32.dll,13"
    
    # Save the shortcut
    $Shortcut.Save()
    
    Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host "📍 Shortcut location: $shortcutPath" -ForegroundColor Cyan
    Write-Host "🎯 Target: $batchFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now double-click the 'Snobify' shortcut on your desktop to launch the app!" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error creating shortcut: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host