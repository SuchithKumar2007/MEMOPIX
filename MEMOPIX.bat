@echo off
set "ROOT=%~dp0"
cd /d "%ROOT%"
title MEMOPIX Cloud - 5 TB App

echo ======================================================================
echo           MEMOPIX - 5 TB PRIVATE PHOTO, VIDEO & AUDIO CLOUD
echo ======================================================================
echo.

echo [1/2] Starting Unified Server (UI + 5 TB API on Port 5000)...
start "MEMOPIX-Server" cmd /k "cd /d ""%ROOT%backend"" & title MEMOPIX Server & node dist/server.js"

echo [2/2] Starting Cloudflare Mobile Tunnel...
start "MEMOPIX-Tunnel" cmd /k "cd /d ""%ROOT%"" & title MEMOPIX Mobile Tunnel & cloudflared.exe tunnel --url http://localhost:5000 --no-autoupdate"

echo.
echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo Launching Standalone Desktop App on Laptop...
start msedge.exe --app=http://localhost:5000

echo.
echo ======================================================================
echo                   HOW TO USE ON MOBILE (PHONE)
echo ======================================================================
echo  1. ON HOME WI-FI (Same network as laptop):
echo     ==^> Open: http://192.168.1.3:5000 on your phone browser
echo.
echo  2. ON MOBILE DATA / ANYWHERE IN THE WORLD:
echo     ==^> Check the "MEMOPIX Mobile Tunnel" window for your
echo         https://...trycloudflare.com link
echo.
echo  3. INSTALL AS APP ON ANDROID:
echo     ==^> Open either link in Chrome on your phone
echo     ==^> Tap the 3 dots (top right) -^> "Install App" or "Add to Home Screen"
echo.
echo  Both Laptop and Mobile now connect directly to Neon PostgreSQL!
echo  You can safely minimize these windows.
echo ======================================================================
echo.
pause
