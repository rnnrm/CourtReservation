import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 120,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "/api/:path*" },
      { source: "/_next/:path*", destination: "/_next/:path*" },
      // SPA fallback (serves public/index.html for non-API and non-_next routes)
      { source: "/:path*", destination: "/index.html" },
    ];
  },
};

export default nextConfig;
