import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // untuk ImgProxy / external image links
    ],
  },
};

export default nextConfig;
