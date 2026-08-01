#!/bin/bash
# Arranque del backend NestJS bajo el usuario `dev`, en :5055, contra la misma DB/Redis.
# Cargamos ./.env vía `source` (maneja bien la llave PEM en una línea con \n) ANTES de
# node, así PrismaClient ve DATABASE_URL desde el inicio. PORT lo forzamos a 5055.
cd /home/dev/edusync/backend || exit 1
set -a
source ./.env
set +a
export PORT=5055
export NODE_ENV=production
exec node apps/backend/dist/apps/backend/src/main.js
