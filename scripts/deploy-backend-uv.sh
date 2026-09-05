#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ensure-uv.sh
source "${SCRIPT_DIR}/ensure-uv.sh"

BACKEND_DIR="${1:-$(cd "${SCRIPT_DIR}/../backend" && pwd)}"

cd "${BACKEND_DIR}"

echo "Syncing backend dependencies (frozen lockfile)..."
uv sync --frozen --no-dev

if [ -f "${BACKEND_DIR}/.env" ] && [ -d "${BACKEND_DIR}/alembic/versions" ]; then
  version_count=$(find "${BACKEND_DIR}/alembic/versions" -maxdepth 1 -name '*.py' | wc -l)
  if [ "${version_count}" -gt 0 ]; then
    "${SCRIPT_DIR}/run-migrations.sh" "${BACKEND_DIR}"
  fi
fi

echo "Backend ready at ${BACKEND_DIR}/.venv"
