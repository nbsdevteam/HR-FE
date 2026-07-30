@echo off
chcp 65001 >nul
title HR Historical Data Sync

echo ==================================================
echo   Historical Attendance Data Sync
echo   Syncing from device start to today
echo ==================================================
echo.

cd /d "%~dp0"

REM Default start date - change this to your device earliest data
set START_DATE=2025-03-01

REM Get today date in YYYY-MM-DD format
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set dt=%%a
set TODAY=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%

echo [*] Sync range: %START_DATE% to %TODAY%
echo.
echo     This may take several minutes depending on
echo     how much data your device has stored.
echo.
echo ==================================================
echo.

node manual-sync.mjs %START_DATE% %TODAY%

echo.
echo ==================================================
echo   Sync complete!
echo ==================================================
echo.
pause
