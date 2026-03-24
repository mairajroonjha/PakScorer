import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "true" || process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  trailingSlash: staticExport,
  images: staticExport
    ? {
        unoptimized: true
      }
    : undefined,
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: staticExport ? "true" : "false"
  },
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
