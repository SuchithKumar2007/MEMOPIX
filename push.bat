@echo off
set GIT=C:\Users\HP\AppData\Local\MinGit\cmd\git.exe
cd /d "d:\Suchith\Project\5TB NEW"
%GIT% add -A
%GIT% commit -m "fix: multi-secret token verification, prevent stream connection drops, bust caches v3, and refresh video stream on retry"
%GIT% push origin main
echo DONE
