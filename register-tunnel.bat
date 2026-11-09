@echo off
curl -s -X POST http://localhost:5000/api/tunnel-url -H "Content-Type: application/json" -d "{\"tunnelUrl\":\"https://organ-marketing-sing-fine.trycloudflare.com\",\"secret\":\"memopix-tunnel-secret-2024\"}"
echo.
echo Tunnel URL Registered.
