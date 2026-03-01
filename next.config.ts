import type { NextConfig } from "next";

// STATIC_EXPORT=true → static HTML export (for nginx / GitHub Pages)
// GITHUB_PAGES=true  → adds basePath for repo subdirectory serving
const isExport =
  process.env.STATIC_EXPORT === "true" ||
  process.env.GITHUB_PAGES === "true";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  basePath: isGitHubPages ? "/nexaura-tenders" : "",
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
