@echo off
chcp 65001 >nul
title ติดตั้ง UDTC Display Manager บนเครื่องแม่ข่าย
cd /d "%~dp0"

net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo  กรุณาคลิกขวาที่ไฟล์นี้ แล้วเลือก "Run as administrator"
  echo.
  pause & exit /b
)
where node >nul 2>nul || (echo ไม่พบ Node.js กรุณาติดตั้งจาก https://nodejs.org แล้วลองใหม่ & pause & exit /b)
for /f %%p in ('node -p "require('./config.json').port"') do set PORT=%%p

echo.
echo  [1/3] เปิดพอร์ต %PORT% ใน Windows Firewall ...
netsh advfirewall firewall delete rule name="UDTC Display Manager" >nul 2>&1
netsh advfirewall firewall add rule name="UDTC Display Manager" dir=in action=allow protocol=TCP localport=%PORT% profile=any >nul && echo        เรียบร้อย

echo  [2/3] ตั้งให้ระบบทำงานอัตโนมัติเมื่อเปิดเครื่อง (ทำงานเบื้องหลัง ไม่ต้อง login) ...
schtasks /Delete /TN "UDTC Display Manager" /F >nul 2>&1
schtasks /Create /TN "UDTC Display Manager" /TR "\"%~dp0run-server.bat\"" /SC ONSTART /RU SYSTEM /RL HIGHEST /F >nul && echo        เรียบร้อย

echo  [3/3] เริ่มระบบ ...
schtasks /Run /TN "UDTC Display Manager" >nul
timeout /t 3 /nobreak >nul

echo.
echo  ===========================================================
echo   ติดตั้งเสร็จแล้ว — เครื่องลูกข่ายเข้าใช้งานได้ที่
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo     http://%%b:%PORT%/        ^(หลังบ้าน /admin^)
)
echo   บันทึกการทำงาน: logs\server.log
echo  ===========================================================
echo.
pause
