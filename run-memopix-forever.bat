@echo off
set "ROOT=%~dp0"
title MEMOPIX - 5 TB Private Memory Cloud (Permanent Runner)

echo ======================================================================
echo           MEMOPIX - 5 TB PRIVATE PHOTO, VIDEO & AUDIO CLOUD
echo ======================================================================
echo.
echo [1/3] Starting Backend Server (Port 5000)...
start "MEMOPIX-Backend" cmd /k "cd /d "%~dp0backend" & npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Server (Port 5173)...
start "MEMOPIX-Frontend" cmd /k "cd /d "%~dp0frontend" & npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Cloudflare Public Tunnel (Worldwide Access)...
start "MEMOPIX-Cloudflare-Tunnel" cmd /k "cd /d "%~dp0" & title MEMOPIX Cloudflare Tunnel & cloudflared.exe tunnel --url http://localhost:5173 --no-autoupdate"

echo.
echo ======================================================================
echo                     OPEN ON YOUR ANDROID PHONE
echo ======================================================================
echo.
echo  [A] ON HOME WI-FI (FASTEST 5 TB DIRECT TRANSFER, NEVER EXPIRES):
echo      ==> http://192.168.29.61:5173
echo.
echo  [B] WORLDWIDE ON MOBILE DATA:
echo      ==> Check the "MEMOPIX-Cloudflare-Tunnel" window for your https:// link!
echo.
echo  NOTE: You can completely CLOSE Antigravity! 
echo  These servers run independently in Windows and will stay online.
echo ======================================================================
echo.
pause
