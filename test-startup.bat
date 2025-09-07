@echo off
title Snobify - Test Startup
echo.
echo ========================================
echo    SNOBIFY - TEST STARTUP
echo ========================================
echo.

echo Testing Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

echo.
echo Testing npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

echo.
echo Testing server directory...
if not exist "server\package.json" (
    echo ERROR: Server directory not found
    pause
    exit /b 1
)
echo Server directory: OK

echo.
echo Testing app directory...
if not exist "app\package.json" (
    echo ERROR: App directory not found
    pause
    exit /b 1
)
echo App directory: OK

echo.
echo Testing server dependencies...
cd server
if not exist "node_modules" (
    echo Installing server dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
)
echo Server dependencies: OK
cd ..

echo.
echo Testing app dependencies...
cd app
if not exist "node_modules" (
    echo Installing app dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install app dependencies
        pause
        exit /b 1
    )
)
echo App dependencies: OK
cd ..

echo.
echo ========================================
echo    ALL TESTS PASSED!
echo ========================================
echo.
echo Ready to start Snobify!
echo Run: start-snobify.bat
echo.
pause
