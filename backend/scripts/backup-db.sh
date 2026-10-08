#!/usr/bin/env bash
#
# Backup de EduSync: base de datos PostgreSQL + archivos subidos.
#
# La base sola no basta. `uploads/` guarda las fotos y los documentos de
# identidad de estudiantes, acudientes y personal (modelo Document + avatarUrl);
# restaurar la base sin ellos deja fichas que apuntan a archivos que ya no
# existen. Por eso van juntos, con el mismo sello de tiempo.
#
# - Base en formato custom comprimido (pg_dump -Fc) → restaurable con pg_restore.
# - Uploads en tar.gz. Si la carpeta está vacía no se crea el tar (no es un error:
#   el sistema puede estar recién puesto en marcha).
# - Rota ambos por igual pasados RETENTION_DAYS.
#
# Uso:  ./scripts/backup-db.sh
# Cron: 0 3 * * * cd /home/dev/edusync/backend && ./scripts/backup-db.sh >> backups/backup.log 2>&1
#
# Variables (opcionales):
#   BACKUP_DIR       carpeta destino (default: ./backups)
#   RETENTION_DAYS   días a conservar (default: 14)

set -euo pipefail

cd "$(dirname "$0")/.."

# --- DATABASE_URL del .env, sin el query (?schema=…) que pg_dump no acepta ---
if [[ ! -f .env ]]; then echo "✗ No se encontró .env"; exit 1; fi
DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"'')"
if [[ -z "${DATABASE_URL:-}" ]]; then echo "✗ DATABASE_URL no definida en .env"; exit 1; fi
CONN="${DATABASE_URL%%\?*}"   # corta desde el primer '?'

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/edusync_$STAMP.dump"

echo "[$(date '+%F %T')] Respaldando base → $OUT"
pg_dump -Fc --no-owner --no-privileges -f "$OUT" "$CONN"
echo "[$(date '+%F %T')] ✓ Base OK ($(du -h "$OUT" | cut -f1))"

# --- archivos subidos ---
if [[ -d uploads ]] && [[ -n "$(ls -A uploads 2>/dev/null)" ]]; then
  OUT_FILES="$BACKUP_DIR/edusync_uploads_$STAMP.tar.gz"
  tar -czf "$OUT_FILES" uploads
  echo "[$(date '+%F %T')] ✓ Uploads OK ($(du -h "$OUT_FILES" | cut -f1), $(find uploads -type f | wc -l) archivo(s))"
else
  echo "[$(date '+%F %T')] · Sin uploads que respaldar."
fi

# --- rotación (base y uploads a la vez, para que no se desparejen) ---
BORRADOS="$(find "$BACKUP_DIR" \( -name 'edusync_*.dump' -o -name 'edusync_uploads_*.tar.gz' \) \
  -type f -mtime "+$RETENTION_DAYS" -print -delete | wc -l)"
echo "[$(date '+%F %T')] Rotación: $BORRADOS archivo(s) > $RETENTION_DAYS días eliminados."
