import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, makePng, missingCredentials, signIn } from "./helpers";

// T-20: the CSP must block nothing the site itself needs (SDD: "if the CSP blocks something, fix
// the allowlist, don't switch it off"). Every violation on the page is recorded and must be zero.

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const list: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = list;
    document.addEventListener("securitypolicyviolation", (event) =>
      list.push(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
}
// Security software on the test machine (Kaspersky injects a form checker into login pages) is
// correctly blocked by the CSP; it is not the site's code, so it doesn't count here.
const LOCAL_SECURITY_SOFTWARE = /kaspersky-labs\.com/;

const violations = async (page: Page) =>
  (await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])).filter(
    (entry) => !LOCAL_SECURITY_SOFTWARE.test(entry),
  );

test("security headers are on every response", async ({ request }) => {
  for (const path of ["/", "/id/work", "/admin/login", "/robots.txt", "/og/en.png"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"], path).toBe("max-age=31536000");
  }
});

// D-39 / AC-12: the CDN obeys this header, so a stale copy lives at most ~2 minutes.
test("public HTML is cached briefly", async ({ request }) => {
  for (const path of ["/", "/id", "/work", "/id/work"]) {
    const response = await request.get(path);
    expect(response.headers()["cache-control"], path).toBe(
      "s-maxage=60, stale-while-revalidate=60",
    );
  }
});

test("public pages and GA4 after Accept run without CSP violations", async ({ page }) => {
  await recordViolations(page);
  // A stand-in for gtag.js served from the real Google host, so the CSP allowlist is exercised.
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "window.__gtagLoaded = true;" }),
  );
  for (const path of ["/", "/work", "/id", "/id/privacy", "/does-not-exist"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(page), path).toEqual([]);
  }

  await page.goto("/");
  await page
    .getByRole("region", { name: "Cookie choice" })
    .getByRole("button", { name: "Accept" })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __gtagLoaded?: boolean }).__gtagLoaded))
    .toBe(true);
  expect(await violations(page)).toEqual([]);
});

test.describe("admin", () => {
  test.skip(!hasCredentials, missingCredentials);

  test("sign-in, list, form and image upload run without CSP violations", async ({ page }) => {
    await recordViolations(page);
    await signIn(page, "/admin/profile");
    await page.locator('input[type="file"]').setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: await makePng(page, 800, 800, "CSP"),
    });
    await expect(page.getByRole("img", { name: "Thumbnail preview" })).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.goto("/admin/projects/new");
    await page.waitForLoadState("networkidle");
    expect(await violations(page)).toEqual([]);
    await page.goto("/admin");
    expect(await violations(page)).toEqual([]);
  });
});

test("every page type also carries the CSP in <meta> (the CDN overwrites the header)", async ({
  request,
}) => {
  for (const path of ["/", "/id/work", "/does-not-exist", "/admin/login"]) {
    const html = await (await request.get(path)).text();
    const head = html.slice(0, html.indexOf("</head>"));
    const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/
      .exec(head)?.[1]
      ?.replaceAll("&#x27;", "'"); // the attribute is HTML-escaped; browsers read it as '
    expect(meta, path).toContain("default-src 'self'");
    expect(meta, path).toContain("object-src 'none'");
    expect(meta, path).not.toContain("frame-ancestors");
  }
});

test("with the CDN's header instead of ours, the <meta> CSP still blocks a foreign script", async ({
  page,
}) => {
  // Replay Hostinger: the page as served, but its CSP header replaced by upgrade-insecure-requests.
  await page.route("http://localhost:3100/", async (route) => {
    const response = await route.fetch();
    const headers = {
      ...response.headers(),
      "content-security-policy": "upgrade-insecure-requests",
    };
    await route.fulfill({ response, headers });
  });
  await recordViolations(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await violations(page)).toEqual([]); // the site itself still runs

  await page.evaluate(() => {
    const script = document.createElement("script");
    script.src = "https://evil.example.com/steal.js";
    document.head.append(script);
  });
  await expect
    .poll(() => violations(page))
    .toContainEqual(expect.stringContaining("https://evil.example.com/steal.js"));
});
