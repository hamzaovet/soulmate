$ws = New-Object -ComObject WScript.Shell
$d = [Environment]::GetFolderPath('Desktop')
$s1 = $ws.CreateShortcut((Join-Path $d 'حلواني أبو عادل.lnk'))
$s2 = $ws.CreateShortcut((Join-Path $d 'سول ميت كافيه VIP.lnk'))

Write-Host "--- Abu Adel ---"
Write-Host "Target: $($s1.TargetPath)"
Write-Host "Args:   $($s1.Arguments)"
Write-Host "Icon:   $($s1.IconLocation)"

Write-Host "`n--- Soul Mate ---"
Write-Host "Target: $($s2.TargetPath)"
Write-Host "Args:   $($s2.Arguments)"
Write-Host "Icon:   $($s2.IconLocation)"
