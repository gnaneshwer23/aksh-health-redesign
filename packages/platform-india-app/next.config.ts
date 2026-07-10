import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@akshhealth/foundation"],
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
