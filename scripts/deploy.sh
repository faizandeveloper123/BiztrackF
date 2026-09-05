#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# shellcheck source=ensure-uv.sh
source "${SCRIPT_DIR}/ensure-uv.sh"

echo "Starting deployment..."

echo "Setting up backend..."
"${SCRIPT_DIR}/deploy-backend-uv.sh" "${PROJECT_ROOT}/backend"

echo "Setting up frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm ci

echo "Building frontend..."
npm run build

echo "Preparing standalone static assets..."
node scripts/prepare-standalone.js
if [ ! -d .next/standalone/.next/static ]; then
  echo "Missing .next/standalone/.next/static after prepare-standalone"
  exit 1
fi
if [ ! -d .next/standalone/public ]; then
  echo "Missing .next/standalone/public after prepare-standalone"
  exit 1
fi

cd ..

echo "Restarting PM2 processes..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "Saving PM2 configuration..."
pm2 save

echo "Deployment completed successfully!"
echo ""
echo "PM2 Status:"
pm2 status
