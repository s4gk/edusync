module.exports = {
  apps: [
    {
      name: 'school-backend',
      script: './apps/backend/dist/main.js',
      cwd: '/root/school_management',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        FRONTEND_URL: 'http://89.117.146.226:5001',
        DATABASE_URL: 'postgresql://schoolapp:schoolapp2026@localhost:5432/school_management?schema=public',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      },
      env_file: '/root/school_management/.env',
    },
    {
      name: 'school-frontend',
      script: 'npx',
      args: 'serve -s apps/frontend/dist -l 5001',
      cwd: '/root/school_management',
      interpreter: 'none',
    }
  ]
};
