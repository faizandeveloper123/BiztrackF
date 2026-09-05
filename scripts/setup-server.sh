#!/bin/bash

set -e

echo "Starting BizTrack server setup..."

if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root or with sudo"
  exit 1
fi

echo "Updating system packages..."
apt-get update
apt-get upgrade -y

echo "Installing required packages..."
apt-get install -y \
  curl \
  git \
  build-essential \
  python3 \
  python3-pip \
  python3-venv \
  nodejs \
  npm \
  nginx \
  postgresql-client \
  certbot \
  python3-certbot-nginx

echo "Installing uv..."
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="${HOME}/.local/bin:${PATH}"
if ! grep -q '.local/bin' "${HOME}/.bashrc" 2>/dev/null; then
  echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc"
fi

echo "Installing PM2 globally..."
npm install -g pm2

echo "Setting up PM2 startup script..."
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo "Creating application directory..."
APP_DIR="/opt/biztrack"
mkdir -p $APP_DIR
chown $SUDO_USER:$SUDO_USER $APP_DIR

echo "Creating logs directory..."
mkdir -p $APP_DIR/logs
chown $SUDO_USER:$SUDO_USER $APP_DIR/logs

echo "Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/biztrack << 'NGINX_CONFIG'
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/biztrack /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx configuration..."
nginx -t

echo "Starting Nginx..."
systemctl enable nginx
systemctl restart nginx

echo "Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to $APP_DIR"
echo "2. Set up your .env files in backend/ and frontend/"
echo "3. Run the deployment script: ./scripts/deploy.sh"
echo "4. Configure SSL with: certbot --nginx -d your-domain.com"

