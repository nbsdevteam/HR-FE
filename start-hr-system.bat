@echo off
chcp 65001 >nul
title HR System - Startup

echo ╔══════════════════════════════════════════════╗
echo ║     HR Management System - Startup           ║
echo ╚══════════════════════════════════════════════╝
echo.

:: ── 1. Start the Device Sync Service (PM2) ──
echo [1/2] Starting Device Sync Service (PM2)...
cd /d "%~dp0device-sync"

:: Check if PM2 is installed
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo      ERROR: PM2 is not installed. Run: npm install -g pm2
    pause
    exit /b 1
)

:: Check if already running
pm2 describe hr-sync >nul 2>&1
if %errorlevel% equ 0 (
    echo      hr-sync is already running — restarting...
    pm2 restart hr-sync
) else (
    echo      Starting hr-sync daemon...
    pm2 start ecosystem.config.cjs
)
echo      ✓ Device Sync Service started
echo.

:: ── 2. Start the Vite Dev Server (React app) ──
echo [2/2] Starting HR Web App (Vite)...
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo      Installing dependencies...
    npm install
)

echo      ✓ Opening dev server — browser will launch automatically
echo.
echo ══════════════════════════════════════════════
echo   PM2 Commands:
echo     pm2 status          — see running services
echo     pm2 logs hr-sync    — view sync logs
echo     pm2 monit           — real-time dashboard
echo ══════════════════════════════════════════════
echo.

:: Start Vite (this keeps the window open)
npm run dev
