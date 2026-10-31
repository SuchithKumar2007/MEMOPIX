@echo off
setlocal
cd /d "%~dp0frontend"
title Deploy MEMOPIX to Vercel

echo ===================================================
echo   Deploying MEMOPIX to Vercel
echo ===================================================
echo.

echo [1/2] Building frontend for production...
call npm.cmd run build

echo [2/2] Deploying to Vercel...
call npx.cmd vercel --prod --yes

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS! MEMOPIX is live on Vercel!
    echo ===================================================
) else (
    echo.
    echo If this is your first time deploying to Vercel, please complete the browser login prompt.
)

echo.
pause
