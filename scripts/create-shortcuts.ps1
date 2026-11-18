$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$browser = if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { 
    'C:\Program Files\Google\Chrome\Application\chrome.exe' 
} else { 
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' 
}

# 1. Abu Adel
$s1 = $ws.CreateShortcut((Join-Path $desktop "temp_abuadel.lnk"))
$s1.TargetPath = $browser
$s1.Arguments = "--app=https://abuadel-soulmate.vercel.app/pos --window-size=1366,768"
$s1.IconLocation = "D:\Work\abuadel-soulmate\public\abuadel.ico,0"
$s1.Description = "حلواني أبو عادل"
$s1.Save()
Move-Item (Join-Path $desktop "temp_abuadel.lnk") (Join-Path $desktop "حلواني أبو عادل.lnk") -Force

# 2. Soul Mate
$s2 = $ws.CreateShortcut((Join-Path $desktop "temp_soulmate.lnk"))
$s2.TargetPath = $browser
$s2.Arguments = "--app=https://abuadel-soulmate.vercel.app/pos --window-size=1366,768"
$s2.IconLocation = "D:\Work\abuadel-soulmate\public\soulmate.ico,0"
$s2.Description = "سول ميت كافيه VIP"
$s2.Save()
Move-Item (Join-Path $desktop "temp_soulmate.lnk") (Join-Path $desktop "سول ميت كافيه VIP.lnk") -Force

Write-Host "Both desktop shortcuts created successfully on $desktop"
