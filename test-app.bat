@echo off
title Snobify - Test App
echo.
echo ========================================
echo    SNOBIFY - TEST APP
echo ========================================
echo.

echo Starting Server...
start "Snobify Server" cmd /k "cd /d %~dp0server && npm run dev"

echo Waiting 8 seconds for server to start...
timeout /t 8 /nobreak >nul

echo Opening test page...
start "" "%~dp0app\test.html"

echo.
echo ========================================
echo    TEST PAGE OPENED!
echo ========================================
echo.
echo The test page will automatically check:
echo - Server connection
echo - Health endpoint
echo - Stats endpoint
echo.
echo If the test page shows errors, the server
echo is not running properly.
echo.
echo If the test page shows success, then the
echo issue is with the React app.
echo.
pause
