@echo off
title BizTrack Backend
echo Starting BizTrack Backend...
echo.

cd /d "%~dp0backend"

set PYTHONIOENCODING=utf-8

echo Checking if port 8000 is already in use...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo Backend is ALREADY running on http://localhost:8000
    echo.
    pause
    exit /b
)

echo Activating virtual environment and starting server...
echo.
echo Backend will run at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server.
echo.

call .venv\Scripts\activate.bat
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo Backend stopped.
pause
