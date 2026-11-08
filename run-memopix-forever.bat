@echo off
set "ROOT=%~dp0"
title MEMOPIX - 5 TB Private Memory Cloud (Permanent Runner)

echo ======================================================================
echo           MEMOPIX - 5 TB PRIVATE PHOTO, VIDEO & AUDIO CLOUD
echo ======================================================================
echo.
echo [1/4] Starting Backend Server (Port 5000)...
start "MEMOPIX-Backend" cmd /k "cd /d "%~dp0backend" & npm.cmd run dev"

timeout /t 8 /nobreak >nul

echo [2/4] Starting Frontend Server (Port 5173)...
start "MEMOPIX-Frontend" cmd /k "cd /d "%~dp0frontend" & npm.cmd run dev"

timeout /t 6 /nobreak >nul

echo [3/4] Opening MEMOPIX in browser...
start http://localhost:5173

echo [4/4] Starting Cloudflare Public Tunnel (Worldwide Access)...
start "MEMOPIX-Cloudflare-Tunnel" cmd /k "cd /d "%~dp0" & title MEMOPIX Cloudflare Tunnel & cloudflared.exe tunnel --url http://localhost:5173 --no-autoupdate"

echo.
echo ======================================================================
echo                     MEMOPIX IS NOW RUNNING!
echo ======================================================================
echo.
echo  [LOCAL] Browser opened automatically:
echo      ==> http://localhost:5173
echo.
echo  [WI-FI] On same home network (fastest):
echo      ==> http://192.168.29.61:5173
echo.
echo  [WORLDWIDE] On mobile data:
echo      ==> Check the "MEMOPIX-Cloudflare-Tunnel" window for https:// link!
echo.
echo  NOTE: You can completely CLOSE Antigravity!
echo  These servers run independently in Windows and will stay online.
echo ======================================================================
echo.
pause
