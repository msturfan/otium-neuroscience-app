import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["highlight.js"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
