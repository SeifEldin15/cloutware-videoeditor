# Generate Self-Signed SSL Certificate for Development
# Run this script in PowerShell as Administrator

Write-Host "Creating self-signed SSL certificate for development..." -ForegroundColor Green

# Create certificates directory if it doesn't exist
$certDir = ".\certs"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force
}

# Generate private key and certificate
$certParams = @{
    Subject = "CN=localhost"
    KeyAlgorithm = "RSA"
    KeyLength = 2048
    NotAfter = (Get-Date).AddYears(1)
    CertStoreLocation = "Cert:\CurrentUser\My"
    KeyUsage = "DigitalSignature", "KeyEncipherment"
    TextExtension = @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
}

$cert = New-SelfSignedCertificate @certParams

# Export certificate and private key
$certPath = Join-Path $certDir "localhost.crt"
$keyPath = Join-Path $certDir "localhost.key"

# Export certificate
Export-Certificate -Cert $cert -FilePath $certPath -Type CERT

# Export private key (requires password)
$password = ConvertTo-SecureString -String "development123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath (Join-Path $certDir "localhost.pfx") -Password $password

Write-Host "Certificate generated successfully!" -ForegroundColor Green
Write-Host "Certificate: $certPath" -ForegroundColor Yellow
Write-Host "Private Key: Available in localhost.pfx" -ForegroundColor Yellow
Write-Host "Password: development123" -ForegroundColor Yellow

Write-Host "`nTo trust this certificate:" -ForegroundColor Cyan
Write-Host "1. Double-click localhost.pfx" -ForegroundColor White
Write-Host "2. Install to 'Trusted Root Certification Authorities'" -ForegroundColor White
Write-Host "3. Use password: development123" -ForegroundColor White
