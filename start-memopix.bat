@echo off
setlocal
cd /d "%~dp0"
title MEMOPIX — 5 TB Private Cloud Storage

echo ===================================================
echo   Starting MEMOPIX (5 TB Private Memory Cloud)
echo ===================================================
echo.

echo Starting Unified Server on port 5000...
start "MEMOPIX Server" /min cmd.exe /c "cd /d "%~dp0backend" && node dist/server.js"

timeout /t 3 /nobreak >nul

echo Starting Cloudflare Tunnel for Mobile access...
start "MEMOPIX Tunnel" /min cmd.exe /c "cd /d "%~dp0" && cloudflared.exe tunnel --url http://localhost:5000 --no-autoupdate"

timeout /t 2 /nobreak >nul

echo Opening MEMOPIX on your Laptop...
start http://localhost:5000

echo.
echo ===================================================
echo  Laptop Access: http://localhost:5000
echo  Mobile Access (Home Wi-Fi): http://192.168.1.3:5000
echo ===================================================
echo.
