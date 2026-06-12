@echo off
title Spinora Game Vault Bot
cd /d "%~dp0"

echo.
echo ============================================================
echo   SPINORA GAME VAULT BOT
echo ============================================================
echo.
echo   BEFORE this works you need:
echo     [x] start-chrome-for-bot.bat was run
echo     [x] VPN is ON in that Chrome window (if the panel needs it)
echo     [x] https://agent.gamevault999.com is LOGGED IN
echo.
echo ============================================================
echo.

curl.exe -s -o nul -w "%%{http_code}" http://127.0.0.1:9224/json/version 2>nul | findstr /r "^200$" >nul
if errorlevel 1 (
  echo  ERROR: Bot Chrome is not running on port 9224.
  echo  Run start-chrome-for-bot.bat first.
  echo.
  pause
  exit /b 1
)

npm start
pause
