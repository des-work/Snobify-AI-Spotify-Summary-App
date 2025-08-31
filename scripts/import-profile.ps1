param([Parameter(Mandatory=$true)][string]$Name,[Parameter(Mandatory=$true)][string]$Csv)
$ErrorActionPreference = "Stop"
$root = "C:\Users\desmo\AI Programs\Snobify"
$dest = Join-Path $root ("profiles\" + $Name)
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Force $Csv (Join-Path $dest "history.csv")
Write-Host "Imported profile '$Name' to $dest"
