#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
sleep 1.5
open -a "Google Chrome" "http://127.0.0.1:$PORT/index.html" 2>/dev/null || open "http://127.0.0.1:$PORT/index.html"
echo "游戏已启动：http://127.0.0.1:$PORT/index.html"
echo "关闭此窗口会停止服务。按回车退出。"
read
kill %1 2>/dev/null
