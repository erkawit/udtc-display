@echo off
chcp 65001 >nul
title UDTC Display Manager
cd /d "%~dp0"
where node >nul 2>nul || (echo ไม่พบ Node.js กรุณาติดตั้งจาก https://nodejs.org & pause & exit /b)
REM เปลี่ยนพอร์ตได้ที่ไฟล์ config.json
for /f %%p in ('node -p "require('./config.json').port"') do set PORT=%%p
start "" http://localhost:%PORT%/admin
node server.js
pause
