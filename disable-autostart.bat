@echo off
title MEMOPIX - Disable Windows Auto-Start
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MEMOPIX.lnk" 2>nul
echo MEMOPIX auto-start has been removed from Windows Startup.
pause
