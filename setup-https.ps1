# HTTPS Setup Guide for Video Processing App
# Choose the appropriate option for your environment

Write-Host "🔐 HTTPS Setup Options for Video Processing App" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Choose your setup:" -ForegroundColor Cyan
Write-Host "1. Development (Self-signed certificate)" -ForegroundColor Yellow
Write-Host "2. Production (Let's Encrypt)" -ForegroundColor Yellow
Write-Host "3. Production (Custom certificate)" -ForegroundColor Yellow
Write-Host "4. Skip HTTPS (Accept browser warnings)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Setting up development HTTPS..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Steps to follow:" -ForegroundColor Cyan
        Write-Host "1. Run: .\generate-dev-cert.ps1" -ForegroundColor White
        Write-Host "2. Install the generated certificate to trust it" -ForegroundColor White
        Write-Host "3. Restart your development server" -ForegroundColor White
        Write-Host "4. Access your app at https://localhost:3000" -ForegroundColor White
        Write-Host ""
        $runNow = Read-Host "Generate certificate now? (y/n)"
        if ($runNow -eq "y" -or $runNow -eq "Y") {
            .\generate-dev-cert.ps1
        }
    }
    
    "2" {
        Write-Host "Production setup with Let's Encrypt" -ForegroundColor Green
        Write-Host ""
        Write-Host "Requirements:" -ForegroundColor Yellow
        Write-Host "- Domain name pointing to your server" -ForegroundColor White
        Write-Host "- Ubuntu/Debian server" -ForegroundColor White
        Write-Host "- Port 80 and 443 accessible" -ForegroundColor White
        Write-Host ""
        Write-Host "Run on your server: ./setup-letsencrypt.sh" -ForegroundColor Cyan
    }
    
    "3" {
        Write-Host "Production setup with custom certificate" -ForegroundColor Green
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Obtain SSL certificate from your provider" -ForegroundColor White
        Write-Host "2. Update nginx-https.conf with your certificate paths" -ForegroundColor White
        Write-Host "3. Replace nginx.conf with nginx-https.conf" -ForegroundColor White
        Write-Host "4. Restart nginx" -ForegroundColor White
    }
    
    "4" {
        Write-Host "Skipping HTTPS setup" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Note: Browser will show security warnings" -ForegroundColor Red
        Write-Host "This is acceptable for development but not recommended for production" -ForegroundColor Red
    }
    
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Additional Information:" -ForegroundColor Cyan
Write-Host "- The subtitle processing error has been fixed" -ForegroundColor Green
Write-Host "- HTTPS will resolve the blob URL security warning" -ForegroundColor Green
Write-Host "- Your app will work with HTTP, but browsers prefer HTTPS" -ForegroundColor Yellow
