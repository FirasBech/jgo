@echo off
REM Start the Career Dashboard bridge and open it in your browser.
REM Configuration (Anthropic / Adzuna keys, port) is read from a .env file - see .env.example.
title Career Dashboard

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found. Install it from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting the Career Dashboard...
echo   A browser tab will open at http://localhost:8787 shortly.
echo   Keep THIS window open while you use it (close it to stop).
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process http://localhost:8787"

node "%~dp0server.mjs"

echo.
echo Dashboard stopped. Press any key to close.
pause >nul
