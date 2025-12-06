import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  // Base path for GitHub Pages project site (username.github.io/image-resizer)
  basePath: '/image-resizer',
  assetPrefix: '/image-resizer/',
  // Disable server-side image optimization since all processing is client-side
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
