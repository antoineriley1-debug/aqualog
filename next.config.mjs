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
    // Build CSP — Next.js requires 'unsafe-inline' for its runtime scripts.
    // Tighten further (nonces) once the app is on a stable release.
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : '*.supabase.co';

    const csp = [
      "default-src 'self'",
      // Next.js injects inline scripts; 'unsafe-eval' needed for HMR in dev
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Allow fetch/WS to Supabase + same origin
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Block this page from being framed (belt-and-suspenders with X-Frame-Options)
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          { key: 'Content-Security-Policy', value: csp },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — enforce HTTPS for 1 year (production only)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : []),
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
