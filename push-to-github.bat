@echo off
title Push to GitHub - Webapp
echo ===================================================
echo   Pushing code to https://github.com/sager77i/Webapp.git
echo ===================================================
cd /d "%~dp0"
git push -u origin main
echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Push completed successfully!
) else (
    echo [ERROR] Push failed. Please check your GitHub login or token.
)
echo ===================================================
pause

