$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"
$env:NODE_PATH = "$nodeDir\node_modules"

Write-Host "Node version: $(& "$nodeDir\node.exe" --version)"
Write-Host "npm version: $(& "$nodeDir\npm.cmd" --version)"

Write-Host "`n=== Installing Server Dependencies ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\server"
& "$nodeDir\npm.cmd" install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Server install failed!" -ForegroundColor Red
    exit 1 
}

Write-Host "`n=== Installing Client Dependencies ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\client"
& "$nodeDir\npm.cmd" install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Client install failed!" -ForegroundColor Red
    exit 1 
}

Write-Host "`n=== Seeding Database ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\server"
& "$nodeDir\node.exe" database/seed.js

Write-Host "`n=== ALL DONE! ===" -ForegroundColor Green
