@echo off
title BizTrack Frontend
echo Starting BizTrack Frontend...
echo.

cd /d "%~dp0frontend"

set PATH=C:\Program Files\nodejs;%PATH%

echo Checking if port 3000 is already in use...
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo Frontend is ALREADY running on http://localhost:3000
    echo.
    pause
    exit /b
)

echo Starting Next.js dev server...
echo.
echo Frontend will run at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

echo.
echo Frontend stopped.
pause
