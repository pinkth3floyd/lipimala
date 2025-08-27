import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Removed deprecated serverComponentsExternalPackages
  },
  serverExternalPackages: ['@huggingface/transformers'],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
    };
    
    // Add specific handling for transformers
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@huggingface/transformers');
    }
    
    // Add node polyfills for transformers
    config.resolve.alias = {
      ...config.resolve.alias,
      'fs': false,
      'path': false,
      'crypto': false,
    };
    
    return config;
  },
  // Add environment variables for better model loading
  env: {
    HUGGINGFACE_CACHE_DIR: process.env.HUGGINGFACE_CACHE_DIR || '/tmp/huggingface_cache',
    // NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4000',
  },
  // Add transpilePackages to ensure transformers is properly bundled
  // transpilePackages: ['@huggingface/transformers'],
};

export default nextConfig;


