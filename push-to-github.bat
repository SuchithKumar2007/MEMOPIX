@echo off
setlocal
cd /d "%~dp0"
title Push MEMOPIX to GitHub

echo ===================================================
echo   Pushing MEMOPIX to GitHub Repository
echo   Repo: https://github.com/SuchithKumar2007/Cloud_Storage
echo ===================================================
echo.

set "GIT_EXE=%LOCALAPPDATA%\MinGit\cmd\git.exe"
if not exist "%GIT_EXE%" (
    where git.exe >nul 2>&1
    if %errorlevel% equ 0 (
        set "GIT_EXE=git.exe"
    ) else (
        echo Error: git.exe not found!
        pause
        exit /b 1
    )
)

echo [1/3] Adding changes...
"%GIT_EXE%" add .

echo [2/3] Committing changes...
"%GIT_EXE%" commit -m "feat: complete MEMOPIX 5 TB Private Photo & Video Cloud application" >nul 2>&1

echo [3/3] Pushing to origin main...
"%GIT_EXE%" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS! All files pushed to GitHub successfully!
    echo   https://github.com/SuchithKumar2007/Cloud_Storage
    echo ===================================================
) else (
    echo.
    echo If GitHub asked for authentication, please sign in or paste your GitHub Token.
)

echo.
pause
