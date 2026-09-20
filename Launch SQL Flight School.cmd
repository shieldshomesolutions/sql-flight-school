@echo off
cd /d "%~dp0"
set "FLIGHT_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "FLIGHT_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 22 or newer from https://nodejs.org then try again.
    pause
    exit /b 1
  )
)
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while using SQL Flight School.
"%FLIGHT_NODE%" server.mjs --open
pause
