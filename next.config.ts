import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Deshabilitar optimización de imágenes si sharp no funciona en el servidor
    unoptimized: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',

    // Configuración de optimización de imágenes
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,

    // Permitir imágenes del mismo dominio y del directorio uploads
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.centrodulmar.com',
      },
      {
        protocol: 'https',
        hostname: 'centrodulmar.com',
      },
    ],
  },

  // Optimización del compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers para mejor SEO y seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
