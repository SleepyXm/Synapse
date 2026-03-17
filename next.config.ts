import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn-avatars.huggingface.co"],
  },
  async rewrites() {
    return [
      {
      }
    ];
  },
};

export default nextConfig;
