#!/usr/bin/env bash
# Run Prisma seed inside the running app container.
set -euo pipefail
cd "$(dirname "$0")/../.."
docker compose -f docker-compose.prod.yml run --rm app npx tsx prisma/seed.ts
