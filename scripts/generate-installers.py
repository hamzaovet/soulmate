import os

# 1. install-both-desktop.bat
install_both = r'''@echo off
chcp 65001 >nul
title تثبيت أيقونات حلواني أبو عادل وسول ميت كافيه VIP

echo ========================================================
echo   جاري تثبيت أيقونات حلواني أبو عادل وسول ميت كافيه VIP...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $d = [Environment]::GetFolderPath('Desktop'); $p = [Environment]::GetFolderPath('Programs'); $dirAbu = Join-Path $env:LOCALAPPDATA 'AbuAdelPatisserie'; $dirSoul = Join-Path $env:LOCALAPPDATA 'SoulmateCafe'; New-Item -ItemType Directory -Force -Path $dirAbu | Out-Null; New-Item -ItemType Directory -Force -Path $dirSoul | Out-Null; $icoAbu = Join-Path $dirAbu 'abuadel.ico'; $icoSoul = Join-Path $dirSoul 'soulmate.ico'; Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/abuadel.ico' -OutFile $icoAbu -UseBasicParsing; Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/soulmate.ico' -OutFile $icoSoul -UseBasicParsing; $browser = 'msedge.exe'; if (Test-Path \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\") { $browser = \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\") { $browser = \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\") { $browser = \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\" } elseif (Test-Path \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\") { $browser = \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\" }; $ws = New-Object -ComObject WScript.Shell; $dataAbu = Join-Path $dirAbu 'Data'; $dataSoul = Join-Path $dirSoul 'Data'; $s1 = $ws.CreateShortcut((Join-Path $d 'temp1.lnk')); $s1.TargetPath = $browser; $s1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir=\"\"' + $dataAbu + '\"\" --window-size=1366,768'; $s1.IconLocation = $icoAbu + ',0'; $s1.Description = 'حلواني أبو عادل'; $s1.Save(); Move-Item (Join-Path $d 'temp1.lnk') (Join-Path $d 'حلواني أبو عادل.lnk') -Force; $s2 = $ws.CreateShortcut((Join-Path $d 'temp2.lnk')); $s2.TargetPath = $browser; $s2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir=\"\"' + $dataSoul + '\"\" --window-size=1366,768'; $s2.IconLocation = $icoSoul + ',0'; $s2.Description = 'سول ميت كافيه VIP'; $s2.Save(); Move-Item (Join-Path $d 'temp2.lnk') (Join-Path $d 'سول ميت كافيه VIP.lnk') -Force; $sp1 = $ws.CreateShortcut((Join-Path $p 'temp1.lnk')); $sp1.TargetPath = $browser; $sp1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir=\"\"' + $dataAbu + '\"\" --window-size=1366,768'; $sp1.IconLocation = $icoAbu + ',0'; $sp1.Save(); Move-Item (Join-Path $p 'temp1.lnk') (Join-Path $p 'حلواني أبو عادل.lnk') -Force; $sp2 = $ws.CreateShortcut((Join-Path $p 'temp2.lnk')); $sp2.TargetPath = $browser; $sp2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir=\"\"' + $dataSoul + '\"\" --window-size=1366,768'; $sp2.IconLocation = $icoSoul + ',0'; $sp2.Save(); Move-Item (Join-Path $p 'temp2.lnk') (Join-Path $p 'سول ميت كافيه VIP.lnk') -Force; Write-Host 'SUCCESS'"

if %ERRORLEVEL% equ 0 (
  echo.
  echo [√] تم تثبيت أيقونة حلواني أبو عادل وأيقونة سول ميت كافيه VIP بنجاح على سطح المكتب وقائمة Start!
) else (
  echo.
  echo [!] حدث خطأ أثناء التثبيت.
)

pause
exit /b 0
'''

# 2. abuadel-desktop-installer.bat
install_abuadel = r'''@echo off
chcp 65001 >nul
title تثبيت أيقونة حلواني أبو عادل

echo ========================================================
echo   جاري تثبيت أيقونة حلواني أبو عادل على سطح المكتب...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $d = [Environment]::GetFolderPath('Desktop'); $p = [Environment]::GetFolderPath('Programs'); $dirAbu = Join-Path $env:LOCALAPPDATA 'AbuAdelPatisserie'; New-Item -ItemType Directory -Force -Path $dirAbu | Out-Null; $icoAbu = Join-Path $dirAbu 'abuadel.ico'; Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/abuadel.ico' -OutFile $icoAbu -UseBasicParsing; $browser = 'msedge.exe'; if (Test-Path \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\") { $browser = \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\") { $browser = \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\") { $browser = \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\" } elseif (Test-Path \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\") { $browser = \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\" }; $ws = New-Object -ComObject WScript.Shell; $dataAbu = Join-Path $dirAbu 'Data'; $s1 = $ws.CreateShortcut((Join-Path $d 'temp_abu.lnk')); $s1.TargetPath = $browser; $s1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir=\"\"' + $dataAbu + '\"\" --window-size=1366,768'; $s1.IconLocation = $icoAbu + ',0'; $s1.Description = 'حلواني أبو عادل'; $s1.Save(); Move-Item (Join-Path $d 'temp_abu.lnk') (Join-Path $d 'حلواني أبو عادل.lnk') -Force; $sp1 = $ws.CreateShortcut((Join-Path $p 'temp_abu.lnk')); $sp1.TargetPath = $browser; $sp1.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=ABU_ADEL_PATISSERIE --user-data-dir=\"\"' + $dataAbu + '\"\" --window-size=1366,768'; $sp1.IconLocation = $icoAbu + ',0'; $sp1.Save(); Move-Item (Join-Path $p 'temp_abu.lnk') (Join-Path $p 'حلواني أبو عادل.lnk') -Force; Write-Host 'SUCCESS'"

if %ERRORLEVEL% equ 0 (
  echo.
  echo [√] تم تثبيت أيقونة حلواني أبو عادل بنجاح على سطح المكتب وقائمة Start!
) else (
  echo.
  echo [!] حدث خطأ أثناء التثبيت.
)

pause
exit /b 0
'''

# 3. soulmate-desktop-installer.bat
install_soulmate = r'''@echo off
chcp 65001 >nul
title تثبيت أيقونة سول ميت كافيه VIP

echo ========================================================
echo   جاري تثبيت أيقونة سول ميت كافيه VIP على سطح المكتب...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $d = [Environment]::GetFolderPath('Desktop'); $p = [Environment]::GetFolderPath('Programs'); $dirSoul = Join-Path $env:LOCALAPPDATA 'SoulmateCafe'; New-Item -ItemType Directory -Force -Path $dirSoul | Out-Null; $icoSoul = Join-Path $dirSoul 'soulmate.ico'; Invoke-WebRequest -Uri 'https://abuadel-soulmate.vercel.app/soulmate.ico' -OutFile $icoSoul -UseBasicParsing; $browser = 'msedge.exe'; if (Test-Path \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\") { $browser = \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\") { $browser = \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\" } elseif (Test-Path \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\") { $browser = \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\" } elseif (Test-Path \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\") { $browser = \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\" }; $ws = New-Object -ComObject WScript.Shell; $dataSoul = Join-Path $dirSoul 'Data'; $s2 = $ws.CreateShortcut((Join-Path $d 'temp_soul.lnk')); $s2.TargetPath = $browser; $s2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir=\"\"' + $dataSoul + '\"\" --window-size=1366,768'; $s2.IconLocation = $icoSoul + ',0'; $s2.Description = 'سول ميت كافيه VIP'; $s2.Save(); Move-Item (Join-Path $d 'temp_soul.lnk') (Join-Path $d 'سول ميت كافيه VIP.lnk') -Force; $sp2 = $ws.CreateShortcut((Join-Path $p 'temp_soul.lnk')); $sp2.TargetPath = $browser; $sp2.Arguments = '--app=https://abuadel-soulmate.vercel.app/login?outlet=SOULMATE_CAFE --user-data-dir=\"\"' + $dataSoul + '\"\" --window-size=1366,768'; $sp2.IconLocation = $icoSoul + ',0'; $sp2.Save(); Move-Item (Join-Path $p 'temp_soul.lnk') (Join-Path $p 'سول ميت كافيه VIP.lnk') -Force; Write-Host 'SUCCESS'"

if %ERRORLEVEL% equ 0 (
  echo.
  echo [√] تم تثبيت أيقونة سول ميت كافيه VIP بنجاح على سطح المكتب وقائمة Start!
) else (
  echo.
  echo [!] حدث خطأ أثناء التثبيت.
)

pause
exit /b 0
'''

def write_crlf(filename, content):
    crlf_content = content.strip().replace("\r\n", "\n").replace("\n", "\r\n") + "\r\n"
    with open(filename, "wb") as f:
        f.write(crlf_content.encode("utf-8"))
    print(f"Wrote {filename} with CRLF ({len(crlf_content)} chars)")

write_crlf("public/install-both-desktop.bat", install_both)
write_crlf("public/abuadel-desktop-installer.bat", install_abuadel)
write_crlf("public/soulmate-desktop-installer.bat", install_soulmate)
print("Done generating all 3 batch installers!")
