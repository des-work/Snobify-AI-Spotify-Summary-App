param()
$ErrorActionPreference = "Stop"
function Fail($msg){ Write-Host $msg -ForegroundColor Red; exit 1 }
$root = "C:\Users\desmo\AI Programs\Snobify"
$server = Join-Path $root "server"
$profiles = Join-Path $root "profiles"
$csv = Join-Path $profiles "default\history.csv"

Write-Host "Snobify Diagnose — preflight checks" -ForegroundColor Cyan
$node = node -v 2>$null
if(-not $node){ Fail "Node.js not found. Install LTS from nodejs.org" }
Write-Host "Node: $node"

$ports = @(8899,5173)
foreach($p in $ports){
  $inUse = (Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p -and $_.State -eq "Listen" })
  if($inUse){ Write-Host "Port $p ALREADY IN USE" -ForegroundColor Yellow } else { Write-Host "Port $p is free" }
}

foreach($d in @($root, $server, $profiles)){ if(-not (Test-Path $d)){ Fail "Missing: $d" } }

if(-not (Test-Path $csv)){ Write-Host "CSV missing at $csv (ok if not imported yet)" -ForegroundColor Yellow }
else{
  $head = Get-Content $csv -TotalCount 1
  $need = @("Track URI")
  foreach($n in $need){ if($head -notmatch [regex]::Escape($n)){ Fail "CSV missing required column: '$n'" } }
  Write-Host "CSV header OK"
}
Write-Host "Diagnose complete."

# App presence
$ui = Join-Path $root "app"
if(-not (Test-Path $ui)){ Write-Host "App folder missing: $ui" -ForegroundColor Yellow } else { Write-Host "App present at $ui" }
# Port check: 5173
$p = 5173
$inUse = (Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p -and $_.State -eq "Listen" })
if($inUse){ Write-Host "Port $p ALREADY IN USE (Vite?)" -ForegroundColor Yellow } else { Write-Host "Port $p is free" }