@echo off
echo Creating Snobify Desktop Shortcut...

REM Get the current directory
set "CURRENT_DIR=%~dp0"

REM Get the desktop path
for /f "tokens=*" %%i in ('powershell -command "[Environment]::GetFolderPath('Desktop')"') do set "DESKTOP=%%i"

REM Create the shortcut
powershell -command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\Snobify.lnk'); $Shortcut.TargetPath = '%CURRENT_DIR%start-snobify.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Snobify Music Analysis App'; $Shortcut.Save()"

echo.
echo Desktop shortcut created successfully!
echo You can now double-click "Snobify" on your desktop to start the app.
echo.
pause
