Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """d:\Suchith\Project\Cloud 5TB\cloudflared.exe"" tunnel --url http://localhost:5173 --no-autoupdate", 1, False
