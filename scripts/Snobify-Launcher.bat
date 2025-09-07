@echo off
title Snobify Music Analysis App
color 0A

echo.
echo ========================================
echo    🎵 Snobify Music Analysis App 🎵
echo ========================================
echo.

cd /d "%~dp0\.."

echo Starting Snobify with enhanced debugging...
echo.

REM Start the server with debugging first
echo Starting server in background...
start "Snobify Server" powershell.exe -ExecutionPolicy Bypass -File "scripts\start-server-debug.ps1"

REM Wait for server to start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Start the frontend
echo Starting frontend...
cd app
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)
npm run dev

echo.
echo Snobify session ended.
pause
