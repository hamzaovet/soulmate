$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('D:\Work\abuadel-soulmate\test_sc.lnk')
$sc.TargetPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$sc.Arguments = '--app=https://abuadel-soulmate.vercel.app/pos --window-size=1366,768'
$sc.Save()

$read = $ws.CreateShortcut('D:\Work\abuadel-soulmate\test_sc.lnk')
Write-Host "Target: $($read.TargetPath)"
Write-Host "Arguments: $($read.Arguments)"
