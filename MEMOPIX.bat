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

echo Launching Standalone Desktop App...
start msedge.exe --app=http://localhost:5000

echo.
echo ======================================================================
echo                       HOW TO USE ON ANDROID
echo ======================================================================
echo  1. On Home Wi-Fi: Open http://192.168.29.61:5000 on your phone
echo  2. On Mobile Data: Check the "MEMOPIX Mobile Tunnel" window for
echo     your https://....trycloudflare.com link
echo  3. Tap "Install App" in MEMOPIX to install to your Android Home Screen!
echo.
echo  You can safely minimize these windows or close Antigravity.
echo ======================================================================
echo.
