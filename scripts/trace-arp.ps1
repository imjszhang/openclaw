$endTime = (Get-Date).AddSeconds(120)
Write-Host "=== Tracing parent of 'arp -a' cmd.exe spawns (120s) ==="
Write-Host ""

while ((Get-Date) -lt $endTime) {
    $cmds = Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" -ErrorAction SilentlyContinue
    foreach ($c in $cmds) {
        if ($c.CommandLine -and $c.CommandLine -match 'arp') {
            $ts = (Get-Date).ToString('HH:mm:ss.fff')
            $ppid = $c.ParentProcessId
            Write-Host "[$ts] CMD PID=$($c.ProcessId) PPID=$ppid"
            Write-Host "  CommandLine: $($c.CommandLine)"
            try {
                $parent = Get-CimInstance Win32_Process -Filter "ProcessId=$ppid" -ErrorAction SilentlyContinue
                if ($parent) {
                    Write-Host "  Parent Name: $($parent.Name)"
                    Write-Host "  Parent Path: $($parent.ExecutablePath)"
                    Write-Host "  Parent CMD:  $($parent.CommandLine)"
                    $gppid = $parent.ParentProcessId
                    $gparent = Get-CimInstance Win32_Process -Filter "ProcessId=$gppid" -ErrorAction SilentlyContinue
                    if ($gparent) {
                        Write-Host "  Grandparent: $($gparent.Name) (PID=$gppid) Path=$($gparent.ExecutablePath)"
                    }
                } else {
                    Write-Host "  Parent process $ppid not found (already exited)"
                }
            } catch {
                Write-Host "  Error querying parent: $_"
            }
            Write-Host ""
        }
    }
    Start-Sleep -Milliseconds 200
}
Write-Host "=== Done ==="
