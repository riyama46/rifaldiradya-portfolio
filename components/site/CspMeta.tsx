import { contentSecurityPolicy } from "@/lib/security-headers";

/**
 * The same CSP as the response header, repeated in <head>: Hostinger's CDN replaces the
 * Content-Security-Policy header with its own `upgrade-insecure-requests` (seen on devstaging), so
 * the header alone never reaches visitors there. Browsers enforce both policies. Rendered first in
 * <head> so it covers the scripts after it.
 */
export function CspMeta() {
  return (
    <meta
      httpEquiv="Content-Security-Policy"
      content={contentSecurityPolicy({ dev: process.env.NODE_ENV === "development", meta: true })}
    />
  );
}
