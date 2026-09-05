#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ensure-uv.sh
source "${SCRIPT_DIR}/ensure-uv.sh"

BACKEND_DIR="${1:-$(cd "${SCRIPT_DIR}/../backend" && pwd)}"

cd "${BACKEND_DIR}"

if [ ! -f .env ]; then
  echo "Error: backend/.env not found (DATABASE_URL required)"
  exit 1
fi

echo "Stopping backend before migrations..."
pm2 stop biztrack-backend 2>/dev/null || true
sleep 2
pkill -f 'alembic upgrade head' 2>/dev/null || true

echo "Running Alembic migrations..."
uv run alembic upgrade head

echo "Migrations completed successfully"
