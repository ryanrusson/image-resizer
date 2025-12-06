import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server-side image optimization since all processing is client-side
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
