@echo off
chcp 65001 >nul
title HR Sync Service Manager

echo ═══════════════════════════════════════════
echo   HR Device Sync Service
echo   Hikvision DS-K1T342MFWX ↔ Supabase
echo ═══════════════════════════════════════════
echo.

:: Check if PM2 is installed
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] PM2 not installed. Installing...
    npm install -g pm2
    echo.
)

:: Check if hr-sync is already running
pm2 describe hr-sync >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Restarting hr-sync service...
    pm2 restart hr-sync
) else (
    echo [*] Starting hr-sync service...
    pm2 start ecosystem.config.cjs
)

pm2 save >nul 2>&1

echo.
echo ═══════════════════════════════════════════
echo   Service Status:
echo ═══════════════════════════════════════════
pm2 status
echo.
echo ═══════════════════════════════════════════
echo   The sync service is now running in the
echo   background. You can close this window.
echo.
echo   To view logs:  pm2 logs hr-sync
echo   To stop:       pm2 stop hr-sync
echo ═══════════════════════════════════════════
echo.
pause
