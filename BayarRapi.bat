@echo off
setlocal
title BayarRapi
cd /d "%~dp0apps\web"
echo ==========================================
echo    BayarRapi - menjalankan prototipe
echo ==========================================
echo.

where node >nul 2>nul || (echo [X] Node.js belum terpasang. Unduh di https://nodejs.org lalu jalankan lagi. & pause & exit /b 1)

if not exist ".env" (
  copy "..\..\.env.example" ".env" >nul
  echo [!] apps\web\.env belum ada, dibuat dari .env.example. Aplikasi berjalan dalam mode simulasi.
)

if not exist "node_modules" (
  echo [1/3] Memasang dependensi, hanya sekali dan butuh beberapa menit...
  call npm install || (echo [X] npm install gagal. & pause & exit /b 1)
) else (
  echo [1/3] Dependensi sudah terpasang.
)

echo [2/3] Menyiapkan database...
call npx prisma migrate deploy >nul 2>nul || (echo [X] Gagal menyiapkan database. & pause & exit /b 1)

set "NGROK_DOMAIN="
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do if /i "%%A"=="NGROK_DOMAIN" set "NGROK_DOMAIN=%%B"
if defined NGROK_DOMAIN call :tunnel

echo [3/3] Menjalankan server. Browser akan terbuka otomatis.
echo       Biarkan jendela ini terbuka. Tutup jendela ini untuk menghentikan BayarRapi.
echo.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call npm run dev
pause
exit /b 0

:tunnel
where ngrok >nul 2>nul
if errorlevel 1 (
  echo [!] NGROK_DOMAIN terisi, tapi ngrok belum terpasang. Webhook Xendit tidak akan sampai.
  exit /b 0
)
echo [i] Tunnel ngrok dibuka di jendela terpisah: https://%NGROK_DOMAIN%
start "BayarRapi - ngrok" ngrok http --url=%NGROK_DOMAIN% 3000
exit /b 0
