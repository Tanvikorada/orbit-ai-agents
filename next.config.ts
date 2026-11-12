import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browsers and crawlers still ask for /favicon.ico; serve the Orbit icon there too.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
