$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"
$env:NODE_PATH = "$nodeDir\node_modules"

Write-Host "Starting Complaint Management System Development Servers..." -ForegroundColor Cyan
& "$nodeDir\npm.cmd" run dev
