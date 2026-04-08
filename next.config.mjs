/**
 * FacilityH2O — Next.js Config
 * Author & Owner: Antoine W. Riley Sr.
 * © 2026 Antoine W. Riley Sr. / FacilityH2O Inc.. All Rights Reserved.
 * Copyright Registration Filed — U.S. Copyright Office
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Production hardening ───────────────────────────────────────────────────
  
  // Minify + obfuscate with SWC (Next.js default, fastest)
  swcMinify: true,

  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Disable source maps in production — prevents reverse engineering
  productionBrowserSourceMaps: false,

  // Compress output
  compress: true,

  // Power header removal — don't reveal Next.js version
  poweredByHeader: false,

  // ── Security headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Remove server info
          { key: 'Server', value: '' },
        ],
      },
      {
        // API CORS — allow mobile app access
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: 'https://www.facilityh2o.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Cookie, X-FacilityH2O-User' },
        ],
      },
    ];
  },
};

export default nextConfig;
