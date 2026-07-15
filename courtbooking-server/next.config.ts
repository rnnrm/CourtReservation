import type { NextConfig } from "next";
import path from "path";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    staticPageGenerationTimeout: 120,
    outputFileTracingRoot: path.join(__dirname),
    async rewrites() {
        return [
            { source: "/api/:path*", destination: "/api/:path*" },
            { source: "/_next/:path*", destination: "/_next/:path*" },
            // Fallback all other requests to the SPA index in public
            { source: "/:path*", destination: "/index.html" },
        ];
    },
};

export default nextConfig;
