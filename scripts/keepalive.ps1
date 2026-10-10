# Keeps the free-tier Supabase project from auto-pausing.
#
# The GitHub Actions workflow (.github/workflows/supabase-keepalive.yml) is the
# preferred solution because it runs on GitHub's infra and works even when this
# PC is off. Use this only if you prefer a local scheduler, e.g.:
#
#   schtasks /Create /SC WEEKLY /D MON,WED,FRI /TN "NYD Keepalive" ^
#     /TR "powershell -NoProfile -ExecutionPolicy Bypass -File <this file>" /F
#
# Reads the anon key from .env. Never put a service_role key in this file.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env'

if (-not (Test-Path $envFile)) {
    Write-Output "No .env found at $envFile"
    exit 1
}

$envMap = @{}
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') {
        $envMap[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
    }
}

$url = $envMap['VITE_SUPABASE_URL']
$key = $envMap['VITE_SUPABASE_ANON_KEY']

if (-not $url -or -not $key) {
    Write-Output "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
    exit 1
}

$headers = @{ apikey = $key; Authorization = "Bearer $key" }

try {
    $r = Invoke-WebRequest -Uri "$url/rest/v1/categories?select=id&limit=1" `
        -Headers $headers -Method Get -TimeoutSec 30 -UseBasicParsing
    Write-Output "Keepalive OK - HTTP $($r.StatusCode) at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    exit 0
} catch {
    $status = 'n/a'
    try { $status = [int]$_.Exception.Response.StatusCode } catch {}
    Write-Output "Keepalive FAILED - status $status - $($_.Exception.Message)"
    Write-Output "If this is NXDOMAIN, the project is paused. Resume it in the Supabase dashboard."
    exit 1
}