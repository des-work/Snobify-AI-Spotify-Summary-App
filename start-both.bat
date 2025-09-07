@echo off
title Snobify - Starting Both Services
echo.
echo ========================================
echo    SNOBIFY - STARTING BOTH SERVICES
echo ========================================
echo.

echo Starting Server...
start "Snobify Server" cmd /k "cd /d %~dp0server && npm run dev"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Snobify Frontend" cmd /k "cd /d %~dp0app && npm run dev"

echo.
echo ========================================
echo    BOTH SERVICES STARTING!
echo ========================================
echo.
echo Server: http://127.0.0.1:8899
echo Frontend: http://localhost:5173
echo.
echo Two new windows will open.
echo Close this window when done.
echo.
pause
