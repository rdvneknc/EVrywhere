Set-Location (Join-Path $PSScriptRoot "..\ocm_api")
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "ocm_api/.env olusturuldu — OCM_KEY doldurun." -ForegroundColor Yellow
}
npm install --silent 2>$null
npm start
