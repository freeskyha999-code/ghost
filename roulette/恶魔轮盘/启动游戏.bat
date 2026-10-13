@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 恶魔轮盘 启动器

where node >nul 2>nul
if errorlevel 1 goto :nonode

if not exist "node_modules\three\build\three.min.js" goto :install
if not exist "node_modules\peerjs\dist\peerjs.min.js" goto :install
if not exist "node_modules\ws\index.js" goto :install
goto :run

:install
echo [1/3] 正在安装依赖，请稍候...
call npm install
if errorlevel 1 goto :npmfail

:run
echo [2/3] 启动服务器...
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 goto :open
start "恶魔轮盘 服务器 - 关闭此窗口即停止服务" /min cmd /c "node server.js"
powershell -NoProfile -Command "for($i=0;$i -lt 40;$i++){ if(Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue){exit 0}; Start-Sleep -Milliseconds 300 }; exit 1"
if errorlevel 1 goto :startfail

:open
echo [3/3] 打开游戏...
start "" "http://localhost:8080"
echo.
echo 本机游玩:  http://localhost:8080
echo 局域网联机的朋友访问 (同一 WiFi/网段):
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { '    http://' + $_.IPAddress + ':8080' }"
echo.
echo 跨网联机: 主菜单选 "P2P 联机 (PeerJS)"，创建房间后把房间号发给对方。
echo 服务器在后台最小化窗口中运行，关闭那个窗口即可停止。
timeout /t 6 >nul
exit /b 0

:nonode
echo 未检测到 Node.js，请先安装: https://nodejs.org
pause
exit /b 1

:npmfail
echo 依赖安装失败，请检查网络后重试 (npm install)。
pause
exit /b 1

:startfail
echo 服务器启动失败，请手动运行 node server.js 查看报错。
pause
exit /b 1
