#!/usr/bin/env bash
# =============================================================================
# DESTON — deploy/update script for Selectel VPS.
# Run from /opt/deston/ as the deploy user.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/../.."

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building images and starting"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "==> Pruning old images"
docker image prune -f

echo "==> Status:"
docker compose -f docker-compose.prod.yml ps

echo "==> Tailing app logs (Ctrl+C to detach)"
docker compose -f docker-compose.prod.yml logs -f app
