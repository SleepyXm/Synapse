import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn-avatars.huggingface.co"],
  },
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
