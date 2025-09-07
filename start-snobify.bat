@echo off
title Snobify - Simple Startup
echo.
echo ========================================
echo    SNOBIFY - SIMPLE STARTUP
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "server\package.json" (
    echo ERROR: Not in Snobify directory
    echo Please run this from the Snobify root folder
    pause
    exit /b 1
)

if not exist "app\package.json" (
    echo ERROR: App directory not found
    echo Please run this from the Snobify root folder
    pause
    exit /b 1
)

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js first
    pause
    exit /b 1
)

echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found
    echo Please install npm first
    pause
    exit /b 1
)

echo.
echo Starting Snobify Server...
echo.

REM Start server in new window
start "Snobify Server" cmd /k "cd server && npm run dev"

echo Waiting for server to start...
timeout /t 8 /nobreak >nul

echo.
echo Starting Snobify Frontend...
echo.

REM Start frontend in new window
start "Snobify Frontend" cmd /k "cd app && npm run dev"

echo.
echo ========================================
echo    SNOBIFY IS STARTING UP!
echo ========================================
echo.
echo Server: http://127.0.0.1:8899
echo Frontend: http://localhost:5173
echo.
echo Both windows will open automatically.
echo Close this window when done.
echo.
pause
