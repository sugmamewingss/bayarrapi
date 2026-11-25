@echo off
setlocal
set "TARGET=%~dp0BayarRapi.bat"
set "ICON=%~dp0apps\web\public\brand\bayarrapi.ico"
set "WORK=%~dp0."
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'BayarRapi.lnk')); $s.TargetPath=$env:TARGET; $s.WorkingDirectory=$env:WORK; $s.IconLocation=$env:ICON; $s.Description='Jalankan prototipe BayarRapi'; $s.Save()"
if errorlevel 1 (
  echo [X] Gagal membuat shortcut.
) else (
  echo Shortcut "BayarRapi" sudah dibuat di Desktop.
)
pause
