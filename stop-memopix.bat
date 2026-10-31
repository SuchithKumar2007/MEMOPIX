@echo off
title Stop MEMOPIX
echo Stopping all MEMOPIX services on port 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
taskkill /F /FI "WINDOWTITLE eq MEMOPIX*" >nul 2>&1
echo All MEMOPIX services have been stopped.
timeout /t 2 >nul
