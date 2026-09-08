@echo off
setlocal

:: Navigate to project root where this batch file lives
cd /d "%~dp0"

:: Check if Node is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js or add it to PATH.
    echo.
    pause
    exit /b 1
)

:: Run the interactive version increment and release script
node scripts/release-tag.js

:: Keep window open
pause
