// Backend NestJS bajo el usuario `dev` (no root), en :5055, contra la misma DB/Redis.
// pm2 carga ./.env con env_file → DATABASE_URL/REDIS/JWT_* quedan en process.env ANTES
// de que arranque Node (evita que PrismaClient lea el env antes de tiempo). PORT lo
// sobrescribimos a 5055 (env tiene prioridad sobre env_file).
module.exports = {
  apps: [
    {
      name: 'edusync-backend',
      script: 'apps/backend/dist/apps/backend/src/main.js',
      cwd: '/home/dev/edusync/backend',
      env_file: '/home/dev/edusync/backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: '5055',
      },
    },
  ],
};
