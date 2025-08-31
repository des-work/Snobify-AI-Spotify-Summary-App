param()
$ErrorActionPreference = "Stop"
$root = "C:\Users\desmo\AI Programs\Snobify"
Write-Host "Cleaning cache and node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$root\cache" -ErrorAction SilentlyContinue
Get-ChildItem $root -Recurse -Force -Directory -Filter node_modules | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$root\cache" | Out-Null
Write-Host "Clean complete."
