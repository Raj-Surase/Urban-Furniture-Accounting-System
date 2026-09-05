# Windows 1-Click Setup for Urban Furniture Accounting System
$ErrorActionPreference = "Stop"

$workspace = $PSScriptRoot
$env:PATH = "C:\tools\php;" + $env:PATH

Write-Host "========================================================"
Write-Host "🚀 Setting up Urban Furniture Accounting System"
Write-Host "========================================================"

# 1. Root dependencies
Write-Host "`n📦 Installing root orchestrator dependencies..."
Set-Location $workspace
& npm.cmd install --no-audit --no-fund

# 2. Realtime server
Write-Host "`n⚡ Setting up Realtime WebSocket server..."
Set-Location "$workspace\realtime"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
& npm.cmd install --no-audit --no-fund

# 3. Backend (Laravel 13 API)
Write-Host "`n🐘 Setting up Laravel API Backend..."
Set-Location "$workspace\backend"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace 'DB_CONNECTION=pgsql', 'DB_CONNECTION=sqlite'
    $envContent = $envContent -replace 'DB_CONNECTION=mysql', 'DB_CONNECTION=sqlite'
    Set-Content -Path ".env" -Value $envContent
}
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" -Force | Out-Null
}
if (-not (Test-Path "bootstrap\cache")) {
    New-Item -ItemType Directory -Path "bootstrap\cache" -Force | Out-Null
}
& composer.bat install --prefer-dist --no-interaction
& php.exe artisan key:generate --force
& php.exe artisan migrate:fresh --seed --force

# 4. Frontend (React + Vite)
Write-Host "`n⚛️ Setting up React + Vite Frontend..."
Set-Location "$workspace\frontend"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
& npm.cmd install --no-audit --no-fund
& npm.cmd run build

Write-Host "`n========================================================"
Write-Host "🎉 Setup Complete! Everything is wired and ready to run."
Write-Host "👉 Start all services: dev.bat or npm run dev"
Write-Host "========================================================"
