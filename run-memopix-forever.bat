@echo off
set "ROOT=%~dp0"
title MEMOPIX - 5 TB Private Memory Cloud (Permanent Runner)

echo ======================================================================
echo           MEMOPIX - 5 TB PRIVATE PHOTO, VIDEO & AUDIO CLOUD
echo ======================================================================
echo.
echo [1/3] Starting Unified Backend Server (Port 5000)...
start "MEMOPIX-Backend" cmd /k "cd /d "%~dp0backend" & node dist/server.js"

timeout /t 4 /nobreak >nul

echo [2/3] Opening MEMOPIX in Laptop Browser...
start http://localhost:5000

echo [3/3] Starting Cloudflare Mobile Tunnel (Worldwide Access)...
start "MEMOPIX-Cloudflare-Tunnel" cmd /k "cd /d "%~dp0" & title MEMOPIX Cloudflare Tunnel & cloudflared.exe tunnel --url http://localhost:5000 --no-autoupdate"

echo.
echo ======================================================================
echo                     MEMOPIX IS NOW RUNNING!
echo ======================================================================
echo.
echo  [LAPTOP] Browser opened:
echo      ==^> http://localhost:5000
echo.
echo  [MOBILE - HOME WI-FI]:
echo      ==^> http://192.168.1.3:5000
echo.
echo  [MOBILE - ANYWHERE / 4G / 5G]:
echo      ==^> Check the "MEMOPIX-Cloudflare-Tunnel" window for your
echo          https://...trycloudflare.com link!
echo.
echo  [INSTALL ON PHONE]:
echo      ==^> Open either link in Chrome on your phone
echo      ==^> Tap "Install App" or 3-dots -^> "Add to Home screen"
echo ======================================================================
echo.
pause
