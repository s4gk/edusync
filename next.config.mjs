/** @type {import('next').NextConfig} */

// El backend NestJS (school_management) corre en :5000 con prefijo /api.
// Proxyeamos /api/* desde Next para que el navegador hable con el mismo
// origen (:3003) → sin CORS, y las cookies (refreshToken httpOnly) fluyen.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
