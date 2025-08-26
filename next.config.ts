import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   serverExternalPackages: ['@huggingface/transformers'],
  // },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;


