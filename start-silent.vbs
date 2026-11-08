Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start Unified Server silently (0 = completely hidden)
WshShell.Run "cmd.exe /c cd /d """ & projectPath & "\backend"" && node dist/server.js", 0, False

WScript.Sleep 2500

' 2. Start Cloudflare Tunnel silently (0 = completely hidden, logs to tunnel.log)
WshShell.Run "cmd.exe /c cd /d """ & projectPath & """ && cloudflared.exe tunnel --url http://localhost:5000 --no-autoupdate > tunnel.log 2>&1", 0, False
