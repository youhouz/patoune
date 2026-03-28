import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer", "playwright", "bullmq", "ioredis"],
};

export default nextConfig;
