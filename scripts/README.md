# Snobify Scripts

This directory contains various utility scripts for managing and running Snobify.

## Main Launchers

- **`launch-snobify.ps1`** - Main launcher script (recommended)
- **`launch-enhanced.ps1`** - Enhanced launcher with advanced features
- **`Launch Snobify.bat`** - Windows batch file launcher
- **`Snobify-Launcher.bat`** - Alternative batch launcher

## Utility Scripts

- **`setup.ps1`** - Initial setup and dependency installation
- **`clean.ps1`** - Clean up temporary files and caches
- **`diagnose.ps1`** - Diagnostic script for troubleshooting
- **`import-profile.ps1`** - Import music data profiles
- **`start-server-debug.ps1`** - Start server in debug mode
- **`test.ps1`** - Run tests

## Usage

For most users, simply run:
```powershell
.\launch-snobify.ps1
```

For advanced users with specific needs:
```powershell
.\launch-enhanced.ps1 -DebugMode -NoCache
```
