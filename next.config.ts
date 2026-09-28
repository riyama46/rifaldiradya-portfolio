import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Cloudinary does the resizing (lib/images/loader.ts); keep the width set small (SDD section 3).
    loader: "custom",
    loaderFile: "./lib/images/loader.ts",
    deviceSizes: [640, 960, 1280, 1600],
    imageSizes: [],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    // Needed because the root layout lives in the dynamic app/[lang] segment; a nested
    // not-found.tsx there only renders client-side. See docs/DECISIONS.md (T-03).
    globalNotFound: true,
  },
};

export default nextConfig;
