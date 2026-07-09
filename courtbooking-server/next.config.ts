import type { NextConfig } from "next";
import path from "path";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(__dirname),
    // Disable Turbopack on Vercel to avoid builder incompatibilities
    ...(isVercel
        ? {}
        : {
              turbopack: {
                  root: path.join(__dirname),
              },
          }),
};

export default nextConfig;
