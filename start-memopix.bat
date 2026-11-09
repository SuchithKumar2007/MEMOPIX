@echo off
title MEMOPIX Backend Launcher
echo ============================================
echo   MEMOPIX - Starting Backend + Tunnel
echo ============================================

set PROJECT="d:\Suchith\Project\5TB NEW"
set BACKEND=%PROJECT%\backend
set CLOUDFLARED=%PROJECT%\cloudflared.exe
set LOGFILE=%PROJECT%\tunnel.log

:: Kill any old backend/tunnel instances
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM cloudflared.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start backend
echo [1/3] Starting MEMOPIX backend on port 5000...
start "MEMOPIX Backend" /MIN cmd /c "cd /d %BACKEND% && node dist\server.js"
timeout /t 4 /nobreak >nul

:: Start Cloudflare tunnel and capture URL to log file
echo [2/3] Starting Cloudflare tunnel...
del /f /q "%LOGFILE%" >nul 2>&1
start "Cloudflare Tunnel" /MIN cmd /c "cd /d %PROJECT% && cloudflared.exe tunnel --url http://localhost:5000 2>&1 | tee "%LOGFILE%""
echo Waiting for tunnel URL...
timeout /t 12 /nobreak >nul

:: Extract tunnel URL from log
for /f "tokens=5" %%u in ('findstr /c:"trycloudflare.com" "%LOGFILE%" 2^>nul') do (
  set TUNNEL_URL=%%u
)

echo [3/3] Tunnel URL: %TUNNEL_URL%

:: Register tunnel URL with backend (so mobile can discover it)
if not "%TUNNEL_URL%"=="" (
  curl -s -X POST http://localhost:5000/api/tunnel-url -H "Content-Type: application/json" -d "{\"tunnelUrl\":\"%TUNNEL_URL%\",\"secret\":\"memopix-tunnel-secret-2024\"}" >nul 2>&1
  echo Tunnel registered with backend.
)

echo.
echo ============================================
echo   MEMOPIX is RUNNING!
echo   Laptop:  http://localhost:5000
echo   Mobile:  %TUNNEL_URL%
echo ============================================
echo.
echo Keep this window open. Close to stop MEMOPIX.
pause
