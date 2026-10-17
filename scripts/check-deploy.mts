// Checks a live deployment from the outside (T-22; v2 checks added in T-32). Read-only: only GET requests, no login.
//   node scripts/check-deploy.mts https://rifaldiradya.com --production
//   node scripts/check-deploy.mts https://devstaging.rifaldiradya.com
// --production expects an indexable site (robots allow, index meta, www → non-www redirect);
// without it the site must stay hidden from search engines (noindex, Disallow: /).
// Exits with code 1 when any check fails.

const [, , rawUrl, flag] = process.argv;
if (!rawUrl) {
  console.error("Usage: node scripts/check-deploy.mts <https://site> [--production]");
  process.exit(2);
}
const origin = new URL(rawUrl).origin;
const production = flag === "--production";
const results: { ok: boolean; name: string; detail: string }[] = [];

function check(name: string, ok: boolean, detail = "") {
  results.push({ ok, name, detail });
}

async function get(path: string, init: RequestInit = {}) {
  return fetch(path.startsWith("http") ? path : `${origin}${path}`, {
    redirect: "manual",
    headers: { "user-agent": "rifaldiradya-check-deploy" },
    ...init,
  });
}

const attr = (html: string, pattern: RegExp) => pattern.exec(html)?.[1]?.replaceAll("&#x27;", "'");

// Pages
for (const [path, status] of [
  ["/", 200],
  ["/work", 200],
  ["/privacy", 200],
  ["/id", 200],
  ["/id/work", 200],
  ["/id/privacy", 200],
  ["/this-page-does-not-exist", 404],
] as const) {
  const response = await get(path);
  check(`GET ${path} → ${status}`, response.status === status, `got ${response.status}`);
}

// Homepage head and headers
const home = await get("/");
const html = await home.text();
const headers = home.headers;
check("X-Frame-Options DENY", headers.get("x-frame-options") === "DENY");
check("X-Content-Type-Options nosniff", headers.get("x-content-type-options") === "nosniff");
check(
  "Strict-Transport-Security",
  (headers.get("strict-transport-security") ?? "").includes("max-age="),
);
check("Referrer-Policy", headers.get("referrer-policy") === "strict-origin-when-cross-origin");
const metaCsp = attr(html, /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
check(
  "CSP in <meta> (the CDN replaces the header)",
  Boolean(metaCsp?.includes("default-src 'self'")),
  metaCsp ? "" : "missing",
);

const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
check(
  "Canonical on this origin",
  canonical === origin || canonical === `${origin}/`,
  `got ${canonical}`,
);
const hreflangId = attr(html, /<link rel="alternate" hrefLang="id" href="([^"]+)"/);
check("hreflang id → /id", hreflangId === `${origin}/id`, `got ${hreflangId}`);
const ogImage = attr(html, /<meta property="og:image" content="([^"]+)"/);
check("og:image on this origin", ogImage === `${origin}/og/en.png`, `got ${ogImage}`);
const robotsMeta = attr(html, /<meta name="robots" content="([^"]+)"/);
check(
  production ? "Page is indexable" : "Page is hidden from search (noindex)",
  production ? robotsMeta === "index, follow" : robotsMeta === "noindex, nofollow",
  `got ${robotsMeta}`,
);
check("JSON-LD in the HTML", html.includes('<script type="application/ld+json">'));

// v2 content (Delta SDD section 10): new meta, LinkedIn, no GitHub while it is empty (AC-13)
const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]?.replaceAll("&amp;", "&");
check(
  "v2 title on /",
  title === "Rifaldi Radya Pratama, Software Engineer (Full-Stack .NET)",
  `got ${title}`,
);
check(
  "v2 chapters on /",
  ["#top", "#about", "#contact"].every((id) => html.includes(`id="${id.slice(1)}"`)),
);
check(
  "LinkedIn links to /in/rifaldiradya (page + JSON-LD)",
  (html.match(/https:\/\/www\.linkedin\.com\/in\/rifaldiradya/g) ?? []).length >= 2,
);
check("No GitHub link while it is empty (D-19)", !html.includes("github.com"));
check("Download CV link on /", html.includes('href="/cv/rifaldi-radya-pratama-cv.pdf"'));

// robots.txt and sitemap
const robots = await (await get("/robots.txt")).text();
check(
  production ? "robots.txt allows crawling + lists the sitemap" : "robots.txt disallows everything",
  production
    ? robots.includes("Allow: /") && robots.includes(`Sitemap: ${origin}/sitemap.xml`)
    : robots.includes("Disallow: /") && !robots.includes("Allow: /"),
  robots.replaceAll("\n", " | "),
);
const sitemap = await (await get("/sitemap.xml")).text();
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
check(
  "sitemap.xml has 6 URLs on this origin",
  locs.length === 6 && locs.every((loc) => loc.startsWith(origin)),
  `${locs.length} URLs`,
);

// Static files and admin
check("favicon.ico", (await get("/favicon.ico")).status === 200);
check("OG image", (await get("/og/en.png")).status === 200);
const cv = await get("/cv/rifaldi-radya-pratama-cv.pdf");
check(
  "CV PDF → 200 application/pdf",
  cv.status === 200 && (cv.headers.get("content-type") ?? "").includes("application/pdf"),
  `got ${cv.status} ${cv.headers.get("content-type") ?? ""}`,
);
const admin = await get("/admin/login");
check(
  "Admin sends X-Robots-Tag noindex",
  (admin.headers.get("x-robots-tag") ?? "").includes("noindex"),
);

// Redirects
const host = new URL(origin).host;
const insecure = await get(`http://${host}/work`);
check(
  "http → https",
  [301, 302, 307, 308].includes(insecure.status) &&
    (insecure.headers.get("location") ?? "").startsWith("https://"),
  `got ${insecure.status} ${insecure.headers.get("location") ?? ""}`,
);
if (production) {
  const www = await get(`https://www.${host}/work`).catch((error: Error) => error);
  const ok =
    !(www instanceof Error) &&
    www.status === 301 &&
    www.headers.get("location") === `${origin}/work`;
  check(
    "www → non-www (301, same path)",
    ok,
    www instanceof Error ? www.message : `got ${www.status} ${www.headers.get("location") ?? ""}`,
  );
}

for (const { ok, name, detail } of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  (${detail})` : ""}`);
}
const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed for ${origin}`);
process.exit(failed ? 1 : 0);
