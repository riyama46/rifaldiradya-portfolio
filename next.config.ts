import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Thumbnails are stored at these widths in MySQL and served from /media (lib/images/loader.ts).
    loader: "custom",
    loaderFile: "./lib/images/loader.ts",
    deviceSizes: [640, 960, 1280, 1600],
    imageSizes: [],
  },
  experimental: {
    // Needed because the root layout lives in the dynamic app/[lang] segment; a nested
    // not-found.tsx there only renders client-side. See docs/DECISIONS.md (T-03).
    globalNotFound: true,
  },
};

export default nextConfig;
