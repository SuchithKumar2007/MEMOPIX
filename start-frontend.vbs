Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd.exe /k cd /d """ & currentDir & "\frontend"" & npm.cmd run dev", 1, False
