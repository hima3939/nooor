import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives next to other checkouts that contain their own
  // lockfiles, so pin the tracing root to this folder. Without it Next.js
  // infers `E:\1 recorde` and warns about multiple lockfiles.
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
