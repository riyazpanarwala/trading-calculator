@echo off
setlocal enabledelayedexpansion

:: Navigate to the directory of this batch file
cd /d "%~dp0"

echo ========================================================
echo       Universal Trading Calculator - Release APK Tag
echo ========================================================
echo.

:: Verify git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not found in PATH!
    echo.
    pause
    exit /b 1
)

:: Display existing tags for reference
echo Existing tags:
git tag --sort=-v:refname
echo.

:PROMPT_VERSION
set "VERSION="
set /p "VERSION=Enter version to release (e.g. 1.0.10 or v1.0.10): "

if "%VERSION%"=="" (
    echo [ERROR] Version cannot be empty. Please enter a version.
    echo.
    goto PROMPT_VERSION
)

:: Remove spaces
set "VERSION=%VERSION: =%"

:: Ensure leading 'v'
if not "%VERSION:~0,1%"=="v" (
    set "TAG=v%VERSION%"
) else (
    set "TAG=%VERSION%"
)

echo.
echo --------------------------------------------------------
echo Target Tag: %TAG%
echo --------------------------------------------------------
echo.

set "CONFIRM=Y"
set /p "CONFIRM=Create and push '%TAG%' to GitHub? (Y/n): "
if /i "%CONFIRM%"=="n" (
    echo.
    echo [CANCELLED] Tag creation aborted.
    echo.
    pause
    exit /b 0
)

echo.
echo [1/2] Creating annotated tag %TAG%...
git tag -a "%TAG%" -m "Release %TAG%"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Could not create tag %TAG%. (It may already exist)
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Pushing tag %TAG% to origin...
git push origin "%TAG%"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push tag %TAG% to remote repository.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCCESS] Tag %TAG% created and pushed!
echo.
echo The GitHub Actions APK build workflow is now running:
echo https://github.com/riyazpanarwala/trading-calculator/actions
echo ========================================================
echo.
pause
