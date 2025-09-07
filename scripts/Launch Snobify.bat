@echo off
title Snobify Music Analysis App
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "launch-snobify.ps1"
pause
