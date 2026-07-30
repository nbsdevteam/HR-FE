@echo off
chcp 65001 >nul
title HR System - Shutdown

echo ╔══════════════════════════════════════════════╗
echo ║     HR Management System - Shutdown          ║
echo ╚══════════════════════════════════════════════╝
echo.

echo Stopping Device Sync Service...
pm2 stop hr-sync 2>nul
echo ✓ Done
echo.
pause
