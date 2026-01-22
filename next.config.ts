import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // External packages that should not be bundled by Next.js
  serverExternalPackages: [],

  // Configure Turbopack (now stable in Next.js 15)
  // Turbopack doesn't need special configuration for suppressing warnings
  // It's already optimized for faster builds
  turbopack: {
    resolveAlias: {
      // Add any alias configurations here if needed
    },
  },

  // Suppress webpack warnings from Supabase realtime-js (only used in production builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/@supabase\/realtime-js/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
