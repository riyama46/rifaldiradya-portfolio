import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_HEADER } from "@/lib/locale-header";

const CANONICAL_HOST = "rifaldiradya.com";
const ADMIN_SESSION_COOKIE = "admin_session";
const NOINDEX = "noindex, nofollow";

const isUnder = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Lets app/global-not-found.tsx (which gets no route params) render the 404 in the URL's locale.
function withLocale(request: NextRequest, locale: "en" | "id") {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return { request: { headers } };
}

// Rules follow docs/specs/SDD.md section 5. Trailing slashes are handled earlier by Next.js (308).
// Locale never comes from Accept-Language, IP, or cookies (App Flow G1).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (request.headers.get("host") ?? request.nextUrl.host).split(":")[0].toLowerCase();

  // 1. www → canonical host
  if (host === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(`https://${CANONICAL_HOST}${pathname}${search}`, 301);
  }

  // 2. API routes and static files
  if (isUnder(pathname, "/api") || /\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  // 4. /en prefix is never canonical
  if (isUnder(pathname, "/en")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 301);
  }

  // 5-6. Admin: quick cookie filter only; real session check is requireAdmin() on the server.
  if (isUnder(pathname, "/admin")) {
    if (pathname !== "/admin/login" && !request.cookies.has(ADMIN_SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      const response = NextResponse.redirect(url, 302);
      response.headers.set("X-Robots-Tag", NOINDEX);
      return response;
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", NOINDEX);
    return response;
  }

  // 7. Indonesian routes map directly onto app/[lang]
  if (isUnder(pathname, "/id")) {
    return NextResponse.next(withLocale(request, "id"));
  }

  // 8. Everything else is English, served without a prefix
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url, withLocale(request, "en"));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
