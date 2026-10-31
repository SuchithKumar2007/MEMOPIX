@echo off
title Stop MEMOPIX Cloud
echo Stopping all MEMOPIX servers and tunnels...
taskkill /f /im cloudflared.exe >nul 2>nul
taskkill /f /im node.exe >nul 2>nul
echo MEMOPIX servers stopped successfully.
timeout /t 2 >nul
