@echo off
title Spinora Cash Machine Bot
cd /d "%~dp0"

echo.
echo ============================================================
echo   SPINORA CASH MACHINE BOT
echo ============================================================
echo.
echo   BEFORE this works you need:
echo     [x] start-chrome-for-bot.bat was run
echo     [x] VPN is ON in that Chrome window (if the panel needs it)
echo     [x] https://agentserver.cashmachine777.com/admin is LOGGED IN (User Management open)
echo.
echo ============================================================
echo.

curl.exe -s -o nul -w "%%{http_code}" http://127.0.0.1:9226/json/version 2>nul | findstr /r "^200$" >nul
if errorlevel 1 (
  echo  ERROR: Bot Chrome is not running on port 9226.
  echo  Run start-chrome-for-bot.bat first.
  echo.
  pause
  exit /b 1
)

echo  Chrome detected on port 9226. Starting bot...
echo.
call npm start

echo.
echo ============================================================
echo   Bot stopped. Read any error above.
echo ============================================================
pause
