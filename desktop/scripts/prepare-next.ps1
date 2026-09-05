$ErrorActionPreference = "Stop"
$desktopRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $desktopRoot -Parent
$frontend = Join-Path $repoRoot "frontend"
$bundleDest = Join-Path $desktopRoot "src-tauri/bundled/next"

Set-Location $frontend
npm run build
$standalone = Join-Path $frontend ".next/standalone/server.js"
if (-not (Test-Path $standalone)) {
  throw "Next standalone missing. Ensure frontend/next.config.js has output: 'standalone'."
}
Copy-Item -Recurse -Force (Join-Path $frontend ".next/static") (Join-Path $frontend ".next/standalone/.next/static")
$pub = Join-Path $frontend "public"
if (Test-Path $pub) {
  Copy-Item -Recurse -Force $pub (Join-Path $frontend ".next/standalone/public")
}
Set-Location $desktopRoot
if (Test-Path $bundleDest) {
  Remove-Item -Recurse -Force $bundleDest
}
New-Item -ItemType Directory -Force -Path $bundleDest | Out-Null
$standaloneDir = Join-Path $frontend ".next/standalone"
Get-ChildItem -Path $standaloneDir | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination (Join-Path $bundleDest $_.Name) -Recurse -Force
}
