import type { NextConfig } from "next";

// Static export for GitHub Pages. The site is served from /<repo>/, so the Pages
// workflow sets NEXT_PUBLIC_BASE_PATH; locally it is empty and dev/build behave as normal.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
