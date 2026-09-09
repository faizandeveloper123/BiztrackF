@echo off
title BizTrack Launcher
echo ============================================
echo  BizTrack - Backend + Frontend Launcher
echo ============================================
echo.

set "ROOT=%~dp0"

rem --- Backend ---
if exist "%ROOT%backend\.venv\Scripts\activate.bat" (
    echo [1/2] Starting Backend on http://localhost:8000
    start "BizTrack Backend" cmd /c ""%ROOT%start-backend.bat""
) else (
    echo [WARN] Backend virtual environment not found: backend\.venv
    echo        Run: cd backend && python -m venv .venv
    echo.
)

rem --- Frontend ---
if exist "%ROOT%frontend\node_modules" (
    echo [2/2] Starting Frontend on http://localhost:3000
    start "BizTrack Frontend" cmd /c ""%ROOT%start-frontend.bat""
) else (
    echo [WARN] Frontend dependencies not installed: frontend\node_modules
    echo        Run: cd frontend && npm install
    echo.
)

echo.
echo Both servers launched in separate windows.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000  (API docs: /docs)
echo.
echo If a window says a port is already in use, the server is
echo already running - just use it.
echo.
pause