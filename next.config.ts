import type { NextConfig } from "next";

const isExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  basePath: isExport ? "/nexaura-tenders" : "",
  images: {
    unoptimized: true,
  },
  // Proxy API requests to backend in development (no reverse proxy)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v2/:path*",
        destination: `${backendUrl}/api/v2/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
