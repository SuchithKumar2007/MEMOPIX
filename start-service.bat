@echo off
set PROJECT=d:\Suchith\Project\5TB NEW
set BACKEND=%PROJECT%\backend
set CLOUDFLARED=%PROJECT%\cloudflared.exe
set LOGFILE=%PROJECT%\tunnel.log

:: 1. Kill any existing instances to avoid port conflicts
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM cloudflared.exe /T >nul 2>&1
ping 127.0.0.1 -n 2 >nul

:: 2. Start backend server
cd /d "%BACKEND%"
start "MEMOPIX-Backend" /MIN node dist\server.js
ping 127.0.0.1 -n 4 >nul

:: 3. Start Cloudflare Tunnel
cd /d "%PROJECT%"
del /f /q "%LOGFILE%" >nul 2>&1
start "MEMOPIX-Tunnel" /MIN cloudflared.exe tunnel --url http://localhost:5000 --no-autoupdate > "%LOGFILE%" 2>&1

:: 4. Wait for tunnel URL
ping 127.0.0.1 -n 9 >nul

:: 5. Extract and register tunnel URL
for /f "usebackq tokens=*" %%u in (`powershell -NoProfile -Command "$m = (Get-Content '%LOGFILE%' -ErrorAction SilentlyContinue) | Select-String -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com'; if ($m) { $m.Matches[0].Value }"`) do (
  set TUNNEL_URL=%%u
)

if not "%TUNNEL_URL%"=="" (
  powershell -NoProfile -Command "Invoke-RestMethod -Uri 'http://localhost:5000/api/tunnel-url' -Method Post -ContentType 'application/json' -Body (@{tunnelUrl='%TUNNEL_URL%'; secret='memopix-tunnel-secret-2024'} | ConvertTo-Json)" >nul 2>&1
  echo %TUNNEL_URL% > "%PROJECT%\tunnel_url.txt"
)
