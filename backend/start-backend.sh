#!/bin/bash
export NODE_ENV=production
export PORT=5000
export FRONTEND_URL=http://89.117.146.226:6060
export DATABASE_URL="postgresql://schoolapp:schoolapp2026@localhost:5432/school_management?schema=public"
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_ACCESS_EXPIRES_IN=15m
export JWT_REFRESH_EXPIRES_IN=7d
export COOKIE_SECURE=false
export JWT_PRIVATE_KEY="$(cat /root/school_management/.jwt_private.key)"
export JWT_PUBLIC_KEY="$(cat /root/school_management/.jwt_public.key)"
exec node /root/school_management/apps/backend/dist/apps/backend/src/main.js
