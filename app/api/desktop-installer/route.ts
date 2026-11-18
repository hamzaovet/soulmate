import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/desktop-installer
 * Dynamically generates a Windows .bat desktop-icon installer pointing to the
 * exact live deployed Soulmate URL (no hardcoded old domain!).
 */
export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const cleanOrigin = origin.replace(/\/+$/, "");

  const psScript = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ws = New-Object -ComObject WScript.Shell
$d = [Environment]::GetFolderPath('Desktop')
$p = [Environment]::GetFolderPath('Programs')

$browser = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
if (-not (Test-Path $browser)) { $browser = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' }
if (-not (Test-Path $browser)) { $browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' }
if (-not (Test-Path $browser)) { $browser = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' }

$dirSoul = Join-Path $env:LOCALAPPDATA 'SoulmateCafeStandalone'
New-Item -ItemType Directory -Force -Path $dirSoul | Out-Null
$icoSoul = Join-Path $dirSoul 'soulmate.ico'
try {
  Invoke-WebRequest -Uri '${cleanOrigin}/soulmate.ico' -OutFile $icoSoul -UseBasicParsing
} catch {}

$lnkDesktop = Join-Path $d 'Soulmate Cafe POS.lnk'
$s1 = $ws.CreateShortcut($lnkDesktop)
$s1.TargetPath = $browser
$s1.Arguments = '--app=${cleanOrigin}/login --user-data-dir="' + $dirSoul + '\\Data" --window-size=1366,768'
if (Test-Path $icoSoul) { $s1.IconLocation = "$icoSoul,0" }
$s1.Description = 'Soulmate Dessert & Coffee POS'
$s1.Save()

$lnkStart = Join-Path $p 'Soulmate Cafe POS.lnk'
$s2 = $ws.CreateShortcut($lnkStart)
$s2.TargetPath = $browser
$s2.Arguments = '--app=${cleanOrigin}/login --user-data-dir="' + $dirSoul + '\\Data" --window-size=1366,768'
if (Test-Path $icoSoul) { $s2.IconLocation = "$icoSoul,0" }
$s2.Description = 'Soulmate Dessert & Coffee POS'
$s2.Save()

Write-Host "SUCCESS"
`;

  const encoded = Buffer.from(psScript, "utf16le").toString("base64");
  const batContent = [
    "@echo off",
    "chcp 65001 >nul",
    "title تثبيت أيقونة كافيه سول ميت — Soulmate POS",
    "echo ========================================================",
    "echo   جاري تثبيت أيقونة سول ميت كافيه على سطح المكتب...",
    "echo ========================================================",
    `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
    "if %ERRORLEVEL% equ 0 (",
    "  echo.",
    "  echo [OK] تم تثبيت أيقونة Soulmate Cafe POS بنجاح على سطح المكتب!",
    ") else (",
    "  echo.",
    "  echo [!] حدث خطأ أثناء التثبيت، يرجى تشغيل الملف كمسؤول.",
    ")",
    "pause",
    "exit /b 0",
  ].join("\r\n");

  return new NextResponse(batContent, {
    status: 200,
    headers: {
      "Content-Type": "application/x-bat; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Soulmate-Desktop-Installer.bat"',
    },
  });
}
