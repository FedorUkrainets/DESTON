#!/usr/bin/env bash
# =============================================================================
# DESTON — daily Postgres backup. Schedule via cron:
#   0 3 * * * /opt/deston/deploy/scripts/backup-db.sh >> /var/log/deston-backup.log 2>&1
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/../.."

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/opt/deston/backups"
mkdir -p "$BACKUP_DIR"

# Read POSTGRES_* from .env without sourcing the whole file.
DB_USER="$(grep ^POSTGRES_USER= .env | cut -d= -f2-)"
DB_NAME="$(grep ^POSTGRES_DB=  .env | cut -d= -f2-)"

docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists \
  | gzip -9 > "${BACKUP_DIR}/deston-${STAMP}.sql.gz"

# Keep last 14 backups.
ls -1t "${BACKUP_DIR}"/deston-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "Backup created: ${BACKUP_DIR}/deston-${STAMP}.sql.gz"
