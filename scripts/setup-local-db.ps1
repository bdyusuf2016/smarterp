# =========================================================================
# SmartERP Enterprise — Windows Local PostgreSQL Database Setup Script
# =========================================================================

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🐘 SmartERP Local PostgreSQL Setup & Initialization" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# 1. Check if psql or createdb is in PATH
$createdbCmd = Get-Command createdb -ErrorAction SilentlyContinue

if (-not $createdbCmd) {
    # Check default installation paths
    $defaultPgPaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin"
    )

    foreach ($p in $defaultPgPaths) {
        if (Test-Path "$p\createdb.exe") {
            $env:Path += ";$p"
            $createdbCmd = Get-Command "$p\createdb.exe"
            Write-Host "✓ Found PostgreSQL binaries at: $p" -ForegroundColor Green
            break
        }
    }
}

$dbName = "smarterp_db"
$dbUser = "postgres"

Write-Host "`n[1/3] Checking / Creating Database '$dbName'..." -ForegroundColor Yellow

if ($createdbCmd) {
    try {
        & createdb -U $dbUser $dbName 2>$null
        Write-Host "✓ Database '$dbName' created successfully (or already exists)." -ForegroundColor Green
    } catch {
        Write-Host "Notice: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ 'createdb' command not found in PATH." -ForegroundColor Yellow
    Write-Host "   Please ensure PostgreSQL is installed and database '$dbName' is created." -ForegroundColor Gray
    Write-Host "   You can create it via pgAdmin or run: CREATE DATABASE $dbName; in psql." -ForegroundColor Gray
}

Write-Host "`n[2/3] Running Drizzle Migrations..." -ForegroundColor Yellow
npm run db:migrate

Write-Host "`n[3/3] Seeding Initial Business Categories & Demo Data..." -ForegroundColor Yellow
npm run db:seed

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎉 Setup Complete! Run 'npm run dev' to start SmartERP" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
