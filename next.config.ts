import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Next.js workspace root inference warnings when multiple lockfiles exist
  // outside the project directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
