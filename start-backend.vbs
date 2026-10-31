Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /k cd /d ""d:\Suchith\Project\Cloud 5TB\backend"" & npm.cmd run dev", 1, False
