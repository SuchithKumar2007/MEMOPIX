@echo off
setlocal
cd /d "%~dp0"
title MEMOPIX — 5 TB Private Cloud Storage

echo ===================================================
echo   Starting MEMOPIX (5 TB Private Memory Cloud)
echo ===================================================
echo.

echo Starting Backend Server on port 5000...
start "MEMOPIX Backend" /min cmd.exe /c "cd /d "%~dp0backend" && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on port 5173...
start "MEMOPIX Frontend" /min cmd.exe /c "cd /d "%~dp0frontend" && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo Opening MEMOPIX in your browser...
start http://localhost:5173

echo.
echo MEMOPIX is running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
