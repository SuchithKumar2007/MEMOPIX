@echo off
title MEMOPIX - Enable Windows Auto-Start
echo ===================================================
echo     MEMOPIX - Enable Permanent Windows Auto-Start
echo ===================================================
echo.
set PROJECT=d:\Suchith\Project\5TB NEW
set VBS=%PROJECT%\start-silent.vbs
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\MEMOPIX.lnk\"); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS%\"'; $s.WorkingDirectory = '%PROJECT%'; $s.Save()"

echo [SUCCESS] MEMOPIX will now start automatically and silently in the background
echo           every time your laptop turns on or restarts!
echo.
echo No manual command or window needed anymore!
echo.
pause
