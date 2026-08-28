import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, negotiateLocale, LOCALES } from "@/i18n/config";

/* Every page lives under `/<locale>/…`, so a request without one gets sent to
 * the language its browser asked for. The alternative — an unprefixed default
 * language — reads better in a URL but makes an Italian page unlinkable, which
 * for a directory meant to be found is the wrong trade. */

const LOCALE_COOKIE = "wavvon_locale";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    // Remember an explicit choice, so the switcher survives a visit to `/`.
    const res = NextResponse.next();
    if (req.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // A first segment shaped like a language tag but not one we speak is a
  // request for a language we do not have — `/fr/hubs` should say so, not
  // become `/en/fr/hubs`, which 404s on a path nobody asked for.
  if (/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(first)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = cookie && isLocale(cookie) ? cookie : negotiateLocale(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  // A redirect rather than a rewrite: the reader ends up with the language in
  // the address bar, which is the thing they can copy and send.
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except API routes, Next's own assets, and files with an
  // extension — a favicon has no business being redirected to /en/favicon.ico.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

export { LOCALE_COOKIE, LOCALES, DEFAULT_LOCALE };
