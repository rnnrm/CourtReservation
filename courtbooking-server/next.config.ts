import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    turbopack: {
        // relative to this config file
        root: 'C:/myne/code/dotnet/v9/CourtBooking/courtbooking-server',
    },
    staticPageGenerationTimeout: 120,
    /* config options here */
};

export default nextConfig;
