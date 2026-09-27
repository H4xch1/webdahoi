import type { NextConfig } from "next";

const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
