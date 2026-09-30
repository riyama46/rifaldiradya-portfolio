import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((part) => part.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("Content-Security-Policy (SDD section 6)", () => {
  const csp = contentSecurityPolicy();

  it("locks everything to this site by default and forbids framing, plugins, and base tags", () => {
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("allows only Google Tag Manager as an outside script, and no eval in production", () => {
    expect(directive(csp, "script-src")).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
    ]);
    expect(csp).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
  });

  it("lets GA4 send data, nothing else", () => {
    expect(directive(csp, "connect-src")).toEqual([
      "'self'",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.googletagmanager.com",
    ]);
  });
});

describe("other security headers", () => {
  const byName = (dev: boolean) =>
    Object.fromEntries(securityHeaders({ dev }).map(({ key, value }) => [key, value]));

  it("sends the standard set", () => {
    const headers = byName(false);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  it("skips HSTS in development", () => {
    expect(byName(true)).not.toHaveProperty("Strict-Transport-Security");
  });
});

describe("CSP in <meta> (Hostinger's CDN replaces the header)", () => {
  it("is the header policy minus frame-ancestors, which browsers ignore in meta", () => {
    const header = contentSecurityPolicy();
    const meta = contentSecurityPolicy({ meta: true });
    expect(meta).not.toContain("frame-ancestors");
    expect(header.replace("; frame-ancestors 'none'", "")).toBe(meta);
  });
});
