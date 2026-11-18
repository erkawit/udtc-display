@echo off
chcp 65001 >nul
cd /d "%~dp0"
net session >nul 2>&1
if errorlevel 1 ( echo กรุณาคลิกขวา แล้วเลือก "Run as administrator" & pause & exit /b )
for /f %%p in ('node -p "require('./config.json').port"') do set PORT=%%p
schtasks /End /TN "UDTC Display Manager" >nul 2>&1
for /f "tokens=5" %%i in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do taskkill /PID %%i /F >nul 2>&1
wmic process where "name='node.exe' and commandline like '%%server.js%%'" call terminate >nul 2>&1
timeout /t 2 /nobreak >nul
schtasks /Run /TN "UDTC Display Manager" && echo เริ่มระบบใหม่แล้ว
pause
