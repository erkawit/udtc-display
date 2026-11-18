@echo off
REM ไฟล์นี้ถูกเรียกโดย Task Scheduler (ทำงานเบื้องหลัง) — ไม่ต้องเปิดเอง
cd /d "%~dp0"
if not exist logs mkdir logs
:loop
echo [%date% %time%] starting >> logs\server.log
node server.js >> logs\server.log 2>&1
echo [%date% %time%] stopped, restart in 5s >> logs\server.log
timeout /t 5 /nobreak >nul
goto loop
