import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Needed because the root layout lives in the dynamic app/[lang] segment; a nested
    // not-found.tsx there only renders client-side. See docs/DECISIONS.md (T-03).
    globalNotFound: true,
  },
};

export default nextConfig;
