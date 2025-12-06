import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  // Base path for GitHub Pages project site (username.github.io/image-resizer)
  basePath: isProd ? '/image-resizer' : '',
  assetPrefix: isProd ? '/image-resizer/' : '',
  // Disable server-side image optimization since all processing is client-side
  images: {
    unoptimized: true,
  },
  // Make basePath available to client components
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? '/image-resizer' : '',
  },
};

export default nextConfig;
