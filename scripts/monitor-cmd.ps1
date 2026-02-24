$endTime = (Get-Date).AddSeconds(90)
$seen = @{}
Write-Host "=== Monitoring cmd.exe/conhost.exe spawns for 90s ==="
Write-Host ""
while ((Get-Date) -lt $endTime) {
    $procs = Get-Process -Name 'cmd','conhost' -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        $key = $p.Id
        if (-not $seen.ContainsKey($key)) {
            $seen[$key] = $true
            $ts = (Get-Date).ToString('HH:mm:ss.fff')
            try {
                $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction SilentlyContinue).CommandLine
            } catch { $cmdLine = '(unknown)' }
            Write-Host "[$ts] PID=$($p.Id) Name=$($p.ProcessName) CMD=$cmdLine"
        }
    }
    Start-Sleep -Milliseconds 150
}
Write-Host ""
Write-Host "=== Done. Total unique cmd/conhost spawns: $($seen.Count) ==="
