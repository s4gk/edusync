#!/usr/bin/env bash
#
# Prueba de RESTAURACIÓN del backup más reciente de EduSync.
#
# Un backup que nadie ha restaurado nunca no es un backup: es un fichero grande
# que da tranquilidad. Esto lo restaura sobre una base desechable y comprueba
# que la copia sirve REALMENTE para volver a levantar el colegio:
#   - que pg_restore termina sin errores,
#   - que están las tablas y las CLAVES FORÁNEAS,
#   - que están los datos que hacen al sistema utilizable: personas, notas y
#     asistencia. Un dump con el esquema completo y las notas vacías restaura
#     "sin errores" y deja el año académico perdido.
#   - que el tar de uploads del mismo sello de tiempo existe y se puede leer:
#     las fichas apuntan a esos archivos, y un backup de base sin ellos deja
#     fotos y documentos rotos.
#
# No toca la base de producción: crea y borra la suya.
#
# Uso:  ./scripts/backup-db.sh && ./scripts/verify-restore.sh

set -uo pipefail
cd "$(dirname "$0")/.."

BD_PRUEBA="${BD_PRUEBA:-edusync_restore_test}"
DUMP="$(ls -t backups/edusync_*.dump 2>/dev/null | head -1)"

if [[ -z "$DUMP" ]]; then echo "✗ No hay ningún dump en backups/"; exit 1; fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
CONN="${DATABASE_URL%%\?*}"
USUARIO="$(sed -E 's|.*://([^:]+):.*|\1|' <<<"$CONN")"
export PGPASSWORD="$(sed -E 's|.*://[^:]+:([^@]+)@.*|\1|' <<<"$CONN")"
HOST="$(sed -E 's|.*@([^:/]+).*|\1|' <<<"$CONN")"
BD_REAL="$(basename "$CONN")"

if [[ "$BD_PRUEBA" == "$BD_REAL" ]]; then
  echo "✗ BD_PRUEBA coincide con la base real ($BD_REAL). Abortado."; exit 1
fi

echo "Dump:  $DUMP  ($(du -h "$DUMP" | cut -f1), $(date -r "$DUMP" '+%F %T'))"
echo "Base de prueba: $BD_PRUEBA"

psql -h "$HOST" -U "$USUARIO" -d postgres -c "DROP DATABASE IF EXISTS \"$BD_PRUEBA\"" >/dev/null 2>&1
createdb -h "$HOST" -U "$USUARIO" "$BD_PRUEBA" || { echo "✗ No se pudo crear la base de prueba"; exit 1; }
limpiar() { psql -h "$HOST" -U "$USUARIO" -d postgres -c "DROP DATABASE IF EXISTS \"$BD_PRUEBA\"" >/dev/null 2>&1; }
trap limpiar EXIT

echo -n "Restaurando… "
ERRORES="$(pg_restore -h "$HOST" -U "$USUARIO" -d "$BD_PRUEBA" --no-owner --no-privileges -j 4 "$DUMP" 2>&1 | grep -c "^pg_restore: error" || true)"
echo "hecho (${ERRORES} errores)"

q() { psql -h "$HOST" -U "$USUARIO" -d "$BD_PRUEBA" -tAc "$1" 2>/dev/null || echo 0; }

TABLAS="$(q "select count(*) from pg_tables where schemaname='public'")"
FKS="$(q "select count(*) from pg_constraint where contype='f'")"
USUARIOS="$(q "select count(*) from users")"
ESTUDIANTES="$(q "select count(*) from students")"
NOTAS="$(q "select count(*) from grade_records")"
ASISTENCIA="$(q "select count(*) from attendances")"

# --- uploads del mismo sello de tiempo que el dump ---
STAMP="$(basename "$DUMP" .dump | sed 's/^edusync_//')"
TAR="backups/edusync_uploads_$STAMP.tar.gz"
ARCHIVOS_EN_BD="$(q "select count(*) from documents")"
if [[ -f "$TAR" ]]; then
  if tar -tzf "$TAR" >/dev/null 2>&1; then
    ARCHIVOS_EN_TAR="$(tar -tzf "$TAR" | grep -vc '/$' || echo 0)"
    UPLOADS_OK=1
  else
    ARCHIVOS_EN_TAR=0; UPLOADS_OK=0
  fi
else
  ARCHIVOS_EN_TAR=0
  # Sin documentos registrados, no tener tar es correcto, no un fallo.
  [[ "$ARCHIVOS_EN_BD" -eq 0 ]] && UPLOADS_OK=1 || UPLOADS_OK=0
fi

echo
echo "  tablas ............ $TABLAS"
echo "  claves foráneas ... $FKS"
echo "  usuarios .......... $USUARIOS"
echo "  estudiantes ....... $ESTUDIANTES"
echo "  notas ............. $NOTAS"
echo "  asistencia ........ $ASISTENCIA"
echo "  documentos en BD .. $ARCHIVOS_EN_BD  (archivos en el tar: $ARCHIVOS_EN_TAR)"
echo

FALLOS=0
[[ "$ERRORES" -gt 0 ]]      && { echo "✗ pg_restore reportó errores"; FALLOS=1; }
[[ "$TABLAS" -lt 30 ]]      && { echo "✗ faltan tablas (esperadas ~35)"; FALLOS=1; }
[[ "$FKS" -lt 40 ]]         && { echo "✗ faltan claves foráneas (esperadas ~46)"; FALLOS=1; }
[[ "$USUARIOS" -lt 1 ]]     && { echo "✗ no hay usuarios: nadie podría entrar al sistema"; FALLOS=1; }
[[ "$ESTUDIANTES" -lt 1 ]]  && { echo "✗ no hay estudiantes"; FALLOS=1; }
[[ "$NOTAS" -lt 1 ]]        && { echo "✗ no hay notas: el año académico se habría perdido"; FALLOS=1; }
[[ "$ASISTENCIA" -lt 1 ]]   && { echo "✗ no hay asistencia"; FALLOS=1; }
[[ "$UPLOADS_OK" -eq 0 ]]   && { echo "✗ hay $ARCHIVOS_EN_BD documento(s) en la base pero el tar de uploads falta o está corrupto: las fichas quedarían con archivos rotos"; FALLOS=1; }

if [[ "$FALLOS" -eq 0 ]]; then
  echo "✅ RESTAURACIÓN VÁLIDA: el backup sirve para volver a levantar EduSync."
  exit 0
fi
echo "❌ RESTAURACIÓN NO VÁLIDA — este backup no serviría."
exit 1
