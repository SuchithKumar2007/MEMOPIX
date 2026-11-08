@echo off
set GIT=C:\Users\HP\AppData\Local\MinGit\cmd\git.exe
cd /d "d:\Suchith\Project\5TB NEW"
%GIT% add -A
%GIT% commit -m "fix: bust stale caches (v2 keys), delete ghost Roddy Theme audio, rebuild frontend+backend"
%GIT% push origin main
echo DONE
