import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch as doesProxyMatch,
} from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function run(url: string, init: { cookie?: string; host?: string } = {}) {
  const headers = new Headers();
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.host) headers.set("host", init.host);
  return proxy(new NextRequest(url, { headers }));
}

describe("proxy matcher", () => {
  it.each(["/", "/work", "/id", "/admin", "/api/admin/login", "/favicon.ico"])(
    "runs on %s",
    (url) => {
      expect(doesProxyMatch({ config, url })).toBe(true);
    },
  );

  it.each(["/_next/static/chunk.js", "/_next/image?url=x"])("skips %s", (url) => {
    expect(doesProxyMatch({ config, url })).toBe(false);
  });
});

describe("rule 1: www to canonical host", () => {
  it("redirects 301 keeping path and query", () => {
    const res = run("https://www.rifaldiradya.com/work?x=1", { host: "www.rifaldiradya.com" });
    expect(res.status).toBe(301);
    expect(getRedirectUrl(res)).toBe("https://rifaldiradya.com/work?x=1");
  });

  it("also applies to api and static paths", () => {
    const res = run("https://www.rifaldiradya.com/robots.txt", { host: "www.rifaldiradya.com" });
    expect(getRedirectUrl(res)).toBe("https://rifaldiradya.com/robots.txt");
  });

  it("leaves the canonical and local hosts alone", () => {
    expect(
      getRedirectUrl(run("https://rifaldiradya.com/work", { host: "rifaldiradya.com" })),
    ).toBeNull();
    expect(
      getRedirectUrl(run("http://localhost:3000/work", { host: "localhost:3000" })),
    ).toBeNull();
  });
});

describe("rule 2: api and files pass through", () => {
  it.each([
    "/api/admin/login",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/og/en.png",
    "/media/01JIMAGE000000000000000000-640.webp",
  ])("%s is not rewritten", (path) => {
    const res = run(`http://localhost:3000${path}`);
    expect(isRewrite(res)).toBe(false);
    expect(getRedirectUrl(res)).toBeNull();
  });
});

describe("rule 4: /en prefix", () => {
  it.each([
    ["/en", "http://localhost:3000/"],
    ["/en/work", "http://localhost:3000/work"],
    ["/en/privacy?a=b", "http://localhost:3000/privacy?a=b"],
  ])("%s redirects 301 to %s", (path, target) => {
    const res = run(`http://localhost:3000${path}`);
    expect(res.status).toBe(301);
    expect(getRedirectUrl(res)).toBe(target);
  });

  it("does not touch paths that merely start with en", () => {
    expect(getRedirectUrl(run("http://localhost:3000/english"))).toBeNull();
  });
});

describe("rules 5-6: admin", () => {
  it("redirects 302 to login with next when there is no session cookie", () => {
    const res = run("http://localhost:3000/admin/projects/new");
    expect(res.status).toBe(302);
    expect(getRedirectUrl(res)).toBe(
      "http://localhost:3000/admin/login?next=%2Fadmin%2Fprojects%2Fnew",
    );
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("lets the login page through with noindex", () => {
    const res = run("http://localhost:3000/admin/login");
    expect(getRedirectUrl(res)).toBeNull();
    expect(isRewrite(res)).toBe(false);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("lets requests with a session cookie through with noindex", () => {
    const res = run("http://localhost:3000/admin", { cookie: "admin_session=abc" });
    expect(getRedirectUrl(res)).toBeNull();
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("does not treat /administrator as admin", () => {
    const res = run("http://localhost:3000/administrator");
    expect(getRewrittenUrl(res)).toBe("http://localhost:3000/en/administrator");
  });
});

describe("rules 7-8: locales", () => {
  it.each(["/id", "/id/work", "/id/privacy"])("%s passes through unchanged", (path) => {
    const res = run(`http://localhost:3000${path}`);
    expect(isRewrite(res)).toBe(false);
    expect(getRedirectUrl(res)).toBeNull();
  });

  it.each([
    ["/", "http://localhost:3000/en"],
    ["/work", "http://localhost:3000/en/work"],
    ["/privacy", "http://localhost:3000/en/privacy"],
    ["/idea", "http://localhost:3000/en/idea"],
  ])("%s is rewritten (not redirected) to %s", (path, target) => {
    const res = run(`http://localhost:3000${path}`);
    expect(isRewrite(res)).toBe(true);
    expect(getRewrittenUrl(res)).toBe(target);
  });

  it.each([
    ["/", "en"],
    ["/does-not-exist", "en"],
    ["/id", "id"],
    ["/id/does-not-exist", "id"],
  ])("passes the locale of %s to the app as %s", (path, locale) => {
    const res = run(`http://localhost:3000${path}`);
    expect(res.headers.get("x-middleware-request-x-locale")).toBe(locale);
  });

  it("never reads Accept-Language or lang_pref", () => {
    const headers = new Headers({ "accept-language": "id-ID,id;q=0.9", cookie: "lang_pref=id" });
    const res = proxy(new NextRequest("http://localhost:3000/work", { headers }));
    expect(getRewrittenUrl(res)).toBe("http://localhost:3000/en/work");
  });
});
