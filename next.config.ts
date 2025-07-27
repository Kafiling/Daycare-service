import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // External packages that should not be bundled by Next.js
  serverExternalPackages: [],
  
  // Configure Turbopack (now stable in Next.js 15)
  turbopack: {
    // Configure Turbopack for better development experience
    resolveAlias: {
      // Add any alias configurations here if needed
    },
  },
};

export default nextConfig;
