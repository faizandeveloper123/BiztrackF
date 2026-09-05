#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

export PATH="${HOME}/.local/bin:${PATH}"

exec uv run fastapi run \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 2 \
  --proxy-headers \
  --forwarded-allow-ips '*'
