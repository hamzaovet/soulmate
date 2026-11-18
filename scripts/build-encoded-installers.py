import base64

# Common helper functions in PowerShell
ps_common_prefix = r'''
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ws = New-Object -ComObject WScript.Shell
$d = [Environment]::GetFolderPath('Desktop')
$p = [Environment]::GetFolderPath('Programs')

$browser = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $browser)) { $browser = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
if (-not (Test-Path $browser)) { $browser = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' }
if (-not (Test-Path $browser)) { $browser = 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' }
'''

# 1. install-both
ps_both = ps_common_prefix + r'''
$dirAbu = Join-Path $env:LOCALAPPDATA 'AbuAdelPatisserie'
$dirSoul = Join-Path $env:LOCALAPPDATA 'SoulmateCafe'
New-Item -ItemType Directory -Force -Path $dirAbu | Out-Null
New-Item -ItemType Directory -Force -Path $dirSoul | Out-Null

$icoAbu = Join-Path $dirAbu 'abuadel.ico'
$icoSoul = Join-Path $dirSoul 'soulmate.ico'

Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/abuadel.ico' -OutFile $icoAbu -UseBasicParsing
Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/soulmate.ico' -OutFile $icoSoul -UseBasicParsing

# Abu Adel
$t1 = Join-Path $d 'temp_abu.lnk'
$s1 = $ws.CreateShortcut($t1)
$s1.TargetPath = $browser
$s1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir="' + $dirAbu + '\Data" --window-size=1366,768'
$s1.IconLocation = "$icoAbu,0"
$s1.Description = 'حلواني أبو عادل'
$s1.Save()
Move-Item $t1 (Join-Path $d 'حلواني أبو عادل.lnk') -Force

# Soul Mate
$t2 = Join-Path $d 'temp_soul.lnk'
$s2 = $ws.CreateShortcut($t2)
$s2.TargetPath = $browser
$s2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir="' + $dirSoul + '\Data" --window-size=1366,768'
$s2.IconLocation = "$icoSoul,0"
$s2.Description = 'سول ميت كافيه VIP'
$s2.Save()
Move-Item $t2 (Join-Path $d 'سول ميت كافيه VIP.lnk') -Force

# Start Menu
$tp1 = Join-Path $p 'temp_abu.lnk'
$sp1 = $ws.CreateShortcut($tp1)
$sp1.TargetPath = $browser
$sp1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir="' + $dirAbu + '\Data" --window-size=1366,768'
$sp1.IconLocation = "$icoAbu,0"
$sp1.Save()
Move-Item $tp1 (Join-Path $p 'حلواني أبو عادل.lnk') -Force

$tp2 = Join-Path $p 'temp_soul.lnk'
$sp2 = $ws.CreateShortcut($tp2)
$sp2.TargetPath = $browser
$sp2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir="' + $dirSoul + '\Data" --window-size=1366,768'
$sp2.IconLocation = "$icoSoul,0"
$sp2.Save()
Move-Item $tp2 (Join-Path $p 'سول ميت كافيه VIP.lnk') -Force

Write-Host "SUCCESS"
'''

# 2. install-abuadel
ps_abu = ps_common_prefix + r'''
$dirAbu = Join-Path $env:LOCALAPPDATA 'AbuAdelPatisserie'
New-Item -ItemType Directory -Force -Path $dirAbu | Out-Null
$icoAbu = Join-Path $dirAbu 'abuadel.ico'
Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/abuadel.ico' -OutFile $icoAbu -UseBasicParsing

$t1 = Join-Path $d 'temp_abu.lnk'
$s1 = $ws.CreateShortcut($t1)
$s1.TargetPath = $browser
$s1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir="' + $dirAbu + '\Data" --window-size=1366,768'
$s1.IconLocation = "$icoAbu,0"
$s1.Description = 'حلواني أبو عادل'
$s1.Save()
Move-Item $t1 (Join-Path $d 'حلواني أبو عادل.lnk') -Force

$tp1 = Join-Path $p 'temp_abu.lnk'
$sp1 = $ws.CreateShortcut($tp1)
$sp1.TargetPath = $browser
$sp1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir="' + $dirAbu + '\Data" --window-size=1366,768'
$sp1.IconLocation = "$icoAbu,0"
$sp1.Save()
Move-Item $tp1 (Join-Path $p 'حلواني أبو عادل.lnk') -Force

Write-Host "SUCCESS"
'''

# 3. install-soulmate
ps_soul = ps_common_prefix + r'''
$dirSoul = Join-Path $env:LOCALAPPDATA 'SoulmateCafe'
New-Item -ItemType Directory -Force -Path $dirSoul | Out-Null
$icoSoul = Join-Path $dirSoul 'soulmate.ico'
Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/soulmate.ico' -OutFile $icoSoul -UseBasicParsing

$t2 = Join-Path $d 'temp_soul.lnk'
$s2 = $ws.CreateShortcut($t2)
$s2.TargetPath = $browser
$s2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir="' + $dirSoul + '\Data" --window-size=1366,768'
$s2.IconLocation = "$icoSoul,0"
$s2.Description = 'سول ميت كافيه VIP'
$s2.Save()
Move-Item $t2 (Join-Path $d 'سول ميت كافيه VIP.lnk') -Force

$tp2 = Join-Path $p 'temp_soul.lnk'
$sp2 = $ws.CreateShortcut($tp2)
$sp2.TargetPath = $browser
$sp2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir="' + $dirSoul + '\Data" --window-size=1366,768'
$sp2.IconLocation = "$icoSoul,0"
$sp2.Save()
Move-Item $tp2 (Join-Path $p 'سول ميت كافيه VIP.lnk') -Force

Write-Host "SUCCESS"
'''

def make_bat(title, banner, ps_code, success_msg):
    b64 = base64.b64encode(ps_code.encode("utf-16le")).decode("ascii")
    bat = f"""@echo off
chcp 65001 >nul
title {title}

echo ========================================================
echo   {banner}
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand {b64}

if %ERRORLEVEL% equ 0 (
  echo.
  echo [√] {success_msg}
) else (
  echo.
  echo [!] حدث خطأ أثناء التثبيت، يرجى المحاولة كمسؤول.
)

pause
exit /b 0
"""
    return bat.strip().replace("\r\n", "\n").replace("\n", "\r\n") + "\r\n"

with open("public/install-both-desktop.bat", "wb") as f:
    f.write(make_bat("تثبيت حلواني أبو عادل وسول ميت كافيه VIP", "جاري تثبيت أيقونات حلواني أبو عادل وسول ميت كافيه VIP...", ps_both, "تم تثبيت أيقونة حلواني أبو عادل وسول ميت كافيه VIP بنجاح على الديسك توب وقائمة ابدأ!").encode("utf-8"))

with open("public/abuadel-desktop-installer.bat", "wb") as f:
    f.write(make_bat("تثبيت حلواني أبو عادل", "جاري تثبيت أيقونة حلواني أبو عادل...", ps_abu, "تم تثبيت أيقونة حلواني أبو عادل بنجاح على الديسك توب وقائمة ابدأ!").encode("utf-8"))

with open("public/soulmate-desktop-installer.bat", "wb") as f:
    f.write(make_bat("تثبيت سول ميت كافيه VIP", "جاري تثبيت أيقونة سول ميت كافيه VIP...", ps_soul, "تم تثبيت أيقونة سول ميت كافيه VIP بنجاح على الديسك توب وقائمة ابدأ!").encode("utf-8"))

print("Successfully wrote all 3 batch files with Base64 EncodedCommand!")
