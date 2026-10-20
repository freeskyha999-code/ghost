@echo off
chcp 65001 >nul
title 深夜便利店
cd /d "%~dp0"
set "PORT=8765"
where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "python -m http.server %PORT% --bind 127.0.0.1"
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    start "" cmd /c "py -m http.server %PORT% --bind 127.0.0.1"
  ) else (
    echo 没有找到 Python，改用直接打开（离线模式）。
    start "" "%~dp0index.html"
    pause
    exit /b
  )
)
timeout /t 2 /nobreak >nul
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER (
  start "" "%BROWSER%" --autoplay-policy=no-user-gesture-required "http://127.0.0.1:%PORT%/index.html"
) else (
  start "" "http://127.0.0.1:%PORT%/index.html"
)
echo 游戏已启动：http://127.0.0.1:%PORT%/index.html
echo 关闭这个窗口会停止游戏服务。
pause
