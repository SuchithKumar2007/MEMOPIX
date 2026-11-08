Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run """" & currentDir & "\cloudflared.exe"" tunnel --url http://localhost:5000 --no-autoupdate", 1, False
