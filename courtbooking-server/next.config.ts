import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    turbopack: {
        root: '.',
    },
    staticPageGenerationTimeout: 120,
    /* config options here */
};

export default nextConfig;
