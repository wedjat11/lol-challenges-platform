const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Railway: produces .next/standalone/server.js
  output: 'standalone',
  // Prevent Next.js from guessing the wrong workspace root
  outputFileTracingRoot: path.join(__dirname, '../'),

  reactStrictMode: true,

  compiler: {
    // Strip console.* calls in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // NEXT_PUBLIC_* variables are inlined at build time automatically.
  // Declare them in Railway's "Variables" panel before deploying:
  //   NEXT_PUBLIC_API_URL            → https://your-backend.up.railway.app/v1
  //   NEXT_PUBLIC_GOOGLE_CLIENT_ID   → your-google-client-id
};

module.exports = nextConfig;
