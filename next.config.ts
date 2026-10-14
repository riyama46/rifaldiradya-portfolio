import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

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
  // SDD section 6: CSP and the other security headers on every response.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders({ dev: process.env.NODE_ENV === "development" }),
      },
    ];
  },
  experimental: {
    // Needed because the root layout lives in the dynamic app/[lang] segment; a nested
    // not-found.tsx there only renders client-side. See docs/decisions/DECISIONS.md (T-03).
    globalNotFound: true,
  },
};

export default nextConfig;
