Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Run start-service.bat completely invisible (0 = hidden)
WshShell.Run "cmd.exe /c """ & projectPath & "\start-service.bat""", 0, False
