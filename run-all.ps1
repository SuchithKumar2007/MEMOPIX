$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\backend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$root\backend" -WindowStyle Minimized

Start-Sleep -Seconds 2

Set-Location "$root\frontend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$root\frontend" -WindowStyle Minimized

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
