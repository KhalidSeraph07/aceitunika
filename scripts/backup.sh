#!/bin/bash
# Backup script para PostgreSQL - Aceitunas SAS
# Uso: ./scripts/backup.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-aceitunas_v2}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "$BACKUP_DIR"

FILENAME="backup_${DB_NAME}_${DATE}.sql.gz"
OUTPUT_PATH="${BACKUP_DIR}/${FILENAME}"

PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --compress=9 \
    --clean \
    --if-exists \
    -f "$OUTPUT_PATH"

echo "Backup guardado: $OUTPUT_PATH"

# Mantener solo los últimos 30 backups
cd "$BACKUP_DIR" && ls -t *.sql.gz | tail -n +31 | xargs -r rm

echo "Backup completado. Total de backups: $(ls *.sql.gz 2>/dev/null | wc -l)"
