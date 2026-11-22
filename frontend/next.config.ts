// frontend/next.config.ts

import type { NextConfig } from "next";

function getBackendApiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  const isDeployment =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production";

  if (!configuredUrl && isDeployment) {
    throw new Error(
      [
        "Missing NEXT_PUBLIC_BACKEND_URL.",
        "Set it in the frontend project's Vercel environment variables.",
        "Use the deployed backend API URL, including /api.",
        "Example format: https://your-backend-domain.example/api",
        "Do not use localhost in a deployed environment.",
      ].join(" "),
    );
  }

  const value = (
    configuredUrl || "http://localhost:4000/api"
  ).replace(/\/+$/, "");

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL must be a valid absolute URL.",
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL must use http:// or https://.",
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL must not contain credentials, query parameters, or a URL fragment.",
    );
  }

  if (isDeployment) {
    const hostname = url.hostname.toLowerCase();

    const isLoopback =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("127.") ||
      hostname === "[::1]" ||
      hostname === "::1";

    if (isLoopback) {
      throw new Error(
        "NEXT_PUBLIC_BACKEND_URL cannot point to localhost or a loopback address in production.",
      );
    }

    if (url.protocol !== "https:") {
      throw new Error(
        "NEXT_PUBLIC_BACKEND_URL must use HTTPS in production.",
      );
    }
  }

  if (url.pathname.replace(/\/+$/, "") !== "/api") {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL must end with /api for this project's backend.",
    );
  }

  return value;
}

const backendApiUrl = getBackendApiUrl();

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
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
