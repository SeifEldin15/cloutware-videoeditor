#!/bin/bash
# Setup Let's Encrypt SSL Certificate
# Run this on your production server

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Replace YOUR_DOMAIN with your actual domain
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

echo "Setting up SSL certificate for $DOMAIN..."

# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Update nginx configuration
sudo cp nginx-https.conf /etc/nginx/nginx.conf

# Update certificate paths in nginx config
sudo sed -i "s|/etc/ssl/certs/your-cert.pem|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/nginx.conf
sudo sed -i "s|/etc/ssl/private/your-key.pem|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/nginx.conf

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Starting nginx with HTTPS..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Setup automatic renewal
    echo "Setting up automatic certificate renewal..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
    
    echo "HTTPS setup complete! Your site should now be accessible at https://$DOMAIN"
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi
