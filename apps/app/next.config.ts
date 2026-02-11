import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "cdn.martianwallet.xyz",
      },
    ],
  },
};

export default nextConfig;
