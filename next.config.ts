import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@upstash/redis", "@upstash/ratelimit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
