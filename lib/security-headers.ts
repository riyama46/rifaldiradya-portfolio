// HTTP security headers for every response (SDD section 6), applied in next.config.ts.
//
// CSP without nonces on purpose: a nonce needs every page rendered per request, and the public
// pages are static (SDD section 6). 'unsafe-inline' for scripts is what Next.js needs for its inline
// bootstrap scripts in that mode; the site never renders user HTML, and JSON-LD is escaped.
// Google hosts are only for GA4, which the browser loads after the visitor clicks Accept (T-19).

const GOOGLE_TAG = "https://www.googletagmanager.com";
const GA_COLLECT = ["https://*.google-analytics.com", "https://*.analytics.google.com"];

export function contentSecurityPolicy({ dev = false } = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Development only: React uses eval for readable server error stacks (Next.js CSP guide).
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), GOOGLE_TAG],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...GA_COLLECT, "https://*.googletagmanager.com"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...GA_COLLECT, "https://*.googletagmanager.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

export function securityHeaders({ dev = false } = {}): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ dev }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    // One year, this host only: the staging0/staging1 demo subdomains are not covered by this app,
    // so includeSubDomains/preload are left out. Browsers ignore HSTS on plain http (local dev).
    ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
  ];
}
