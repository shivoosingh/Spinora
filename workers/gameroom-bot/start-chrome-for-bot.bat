@echo off
title Spinora - Chrome for Gameroom Bot (VPN)
cd /d "%~dp0"

set "PROFILE=%LOCALAPPDATA%\SpinoraGameroomBot"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if not exist "%CHROME%" (
  echo Could not find Google Chrome.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   GAMEROOM BOT - CHROME SETUP
echo ============================================================
echo.
echo   This opens a SEPARATE Chrome (not your normal one) on port 9225.
echo.
echo   FIRST TIME:
echo     1. Chrome opens - install your VPN extension if the panel needs it
echo     2. Turn VPN ON in that Chrome (if required)
echo     3. Go to: https://agentserver1.gameroom777.com/admin/login
echo     4. Log in to the agent panel manually (handles the CAPTCHA)
echo.
echo   EVERY TIME AFTER:
echo     1. Run this file
echo     2. Make sure the panel is logged in
echo     3. Then run start-bot.bat
echo.
echo ============================================================
echo.

start "" "%CHROME%" --remote-debugging-port=9225 --user-data-dir="%PROFILE%" "https://agentserver1.gameroom777.com/admin/login"

echo Chrome started on port 9225. Open https://agentserver1.gameroom777.com/admin/login and log in.
echo Set GAMEROOM_CDP_URL=http://localhost:9225 in .env, then run start-bot.bat
pause
