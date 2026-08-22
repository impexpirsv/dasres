import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { contentRepository } from "./lib/content/repository";
import { defaultLocale, isLocale, type Locale } from "./lib/locale";
import {
  InMemoryRateLimiter,
  type RateLimitResult,
} from "./lib/security/rate-limit";
import { validateRequestOrigin } from "./lib/security/request-origin";
import {
  getTrustedClientIdentifier,
} from "./lib/security/trusted-client-ip";

const isDevelopment =
  process.env.NODE_ENV === "development";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAXIMUM_BUCKET_COUNT = 10_000;

type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

const rateLimiter = new InMemoryRateLimiter(
  MAXIMUM_BUCKET_COUNT,
);

const handleLocaleRouting = createMiddleware(routing);

export type ProxyBranch =
  | "api"
  | "public-locale"
  | "legacy-public"
  | "dashboard"
  | "auth"
  | "static"
  | "unknown";

const STATIC_FILE_PATTERN = /\.[^/]+$/;

function hasPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isStaticPath(pathname: string): boolean {
  return (
    hasPathPrefix(pathname, "/_next") ||
    pathname === "/sitemap.xml" ||
    hasPathPrefix(pathname, "/sitemaps") ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon.") ||
    pathname === "/apple-icon" ||
    pathname.startsWith("/apple-icon.") ||
    STATIC_FILE_PATTERN.test(pathname)
  );
}

const LEGACY_PUBLIC_PATH_PATTERN = /^\/(?:companies|experts|opportunities)(?:\/[^/]+)?\/?$|^\/(?:about|contact|pricing|faq|privacy|terms|cookies)\/?$|^\/help(?:\/[^/]+)?\/?$|^\/resources(?:\/[^/]+(?:\/[^/]+)?)?\/?$/;

export function isLegacyPublicPath(pathname: string): boolean {
  return pathname === "/" || LEGACY_PUBLIC_PATH_PATTERN.test(pathname);
}

function getCookieLocale(request: NextRequest): Locale {
  const candidate = request.cookies.get("NEXT_LOCALE")?.value;
  return candidate && isLocale(candidate) ? candidate : defaultLocale;
}

async function getLegacyRedirectLocale(
  pathname: string,
  cookieLocale: Locale,
): Promise<Locale | null> {
  const articleMatch = /^\/resources\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!articleMatch) return cookieLocale;

  const [, category, slug] = articleMatch;
  const records = (await contentRepository.getAll({ status: "published" }))
    .filter((record) => record.slug === slug && record.canonical === `/resources/${category}/${slug}`);
  if (records.length === 0) return null;

  return records.some((record) => record.locale === cookieLocale)
    ? cookieLocale
    : records.some((record) => record.locale === defaultLocale)
      ? defaultLocale
      : records.some((record) => record.locale === "en")
        ? "en"
        : records[0].locale;
}

async function hasPublishedLocalizedArticle(pathname: string): Promise<boolean> {
  const match = /^\/([^/]+)\/resources\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!match) return true;

  const [, locale, category, slug] = match;
  if (!isLocale(locale)) return false;

  const records = await contentRepository.getAll({ status: "published" });
  return records.some(
    (record) =>
      record.locale === locale &&
      record.slug === slug &&
      record.canonical === `/resources/${category}/${slug}`,
  );
}

export async function getLegacyRedirectPath(
  request: NextRequest,
): Promise<string | null> {
  const { pathname } = request.nextUrl;
  if (!isLegacyPublicPath(pathname)) return null;
  const normalizedPath = pathname === "/" ? "" : pathname.replace(/\/$/, "");
  const locale = await getLegacyRedirectLocale(normalizedPath, getCookieLocale(request));
  return locale ? `/${locale}${normalizedPath}` : null;
}

function getPrefixedPublicLocale(pathname: string): Locale | null {
  const segments = pathname.split("/");
  const candidate = segments[1];

  if (!candidate || !isLocale(candidate)) {
    return null;
  }

  const unprefixedPath = `/${segments.slice(2).join("/")}`;

  if (
    hasPathPrefix(unprefixedPath, "/api") ||
    hasPathPrefix(unprefixedPath, "/dashboard") ||
    hasPathPrefix(unprefixedPath, "/login") ||
    hasPathPrefix(unprefixedPath, "/register") ||
    hasPathPrefix(unprefixedPath, "/forgot-password") ||
    hasPathPrefix(unprefixedPath, "/reset-password") ||
    hasPathPrefix(unprefixedPath, "/verify-email") ||
    isStaticPath(unprefixedPath)
  ) {
    return null;
  }

  return candidate;
}

export function getProxyBranch(pathname: string): ProxyBranch {
  if (hasPathPrefix(pathname, "/api")) {
    return "api";
  }

  if (isStaticPath(pathname)) {
    return "static";
  }

  if (hasPathPrefix(pathname, "/dashboard")) {
    return "dashboard";
  }

  if (/^\/(?:login|register|forgot-password|reset-password|verify-email)\/?$/.test(pathname)) {
    return "auth";
  }

  if (getPrefixedPublicLocale(pathname)) {
    return "public-locale";
  }

  if (isLegacyPublicPath(pathname)) {
    return "legacy-public";
  }

  return "unknown";
}

function getRateLimitPolicy(
  method: string,
  pathname: string,
): RateLimitPolicy | null {
  const normalizedMethod = method.toUpperCase();
  const normalizedPathname =
    pathname.length > 1
      ? pathname.replace(/\/+$/, "")
      : pathname;

  if (normalizedMethod === "GET" && normalizedPathname === "/api/health/live") {
    return { name: "health-live", limit: 1_200, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (normalizedMethod === "GET" && normalizedPathname === "/api/health/ready") {
    return { name: "health-ready", limit: 120, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (normalizedMethod === "POST" && normalizedPathname === "/api/auth/forgot-password") {
    return { name: "password-recovery-forgot", limit: 5, windowMs: 15 * 60_000 };
  }

  if (normalizedMethod === "POST" && normalizedPathname === "/api/auth/reset-password") {
    return { name: "password-recovery-reset", limit: 10, windowMs: 15 * 60_000 };
  }

  if (normalizedMethod === "POST" && normalizedPathname === "/api/auth/resend-verification") {
    return { name: "email-verification-resend", limit: 5, windowMs: 15 * 60_000 };
  }

  if (
    normalizedMethod === "POST" &&
    (normalizedPathname === "/api/login" ||
      normalizedPathname === "/api/register")
  ) {
    return { name: "authentication", limit: 5, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (
    normalizedMethod === "POST" &&
    (normalizedPathname ===
      "/api/project-messages" ||
      /^\/api\/(?:tickets|cases)\/[^/]+\/messages$/.test(
        normalizedPathname,
      ))
  ) {
    return { name: "messaging", limit: 30, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (
    normalizedMethod === "POST" &&
    /\/(?:attachments|documents)(?:\/|$)/.test(
      normalizedPathname,
    )
  ) {
    return { name: "uploads", limit: 10, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(
      normalizedMethod,
    )
  ) {
    return { name: "mutation", limit: 60, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (
    normalizedMethod === "GET" ||
    normalizedMethod === "HEAD"
  ) {
    return { name: "read", limit: 300, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  return null;
}

function getClientIdentifier(
  request: NextRequest,
): string {
  return getTrustedClientIdentifier(request.headers);
}

function setRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): void {
  response.headers.set(
    "X-RateLimit-Limit",
    String(result.limit),
  );
  response.headers.set(
    "X-RateLimit-Remaining",
    String(result.remaining),
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1_000)),
  );

  if (!result.allowed) {
    response.headers.set(
      "Retry-After",
      String(result.retryAfterSeconds),
    );
  }
}

export async function proxy(
  request: NextRequest,
): Promise<NextResponse> {
  const branch = getProxyBranch(request.nextUrl.pathname);

  if (branch === "auth" && /^\/reset-password\/?$/.test(request.nextUrl.pathname)) {
    const rawToken = request.nextUrl.searchParams.get("token");
    if (rawToken !== null) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete("token");
      const response = NextResponse.redirect(cleanUrl, 303);
      response.headers.set("Cache-Control", "no-store");
      response.cookies.set("dasres_password_reset", /^[A-Za-z0-9_-]{43}$/.test(rawToken) ? rawToken : "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth/reset-password",
        maxAge: /^[A-Za-z0-9_-]{43}$/.test(rawToken) ? 30 * 60 : 0,
      });
      return response;
    }
  }

  if (branch === "public-locale") {
    if (!(await hasPublishedLocalizedArticle(request.nextUrl.pathname))) {
      return new NextResponse(null, { status: 404 });
    }
    return handleLocaleRouting(request);
  }

  if (branch === "legacy-public") {
    const redirectPath = await getLegacyRedirectPath(request);
    if (!redirectPath) return new NextResponse(null, { status: 404 });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectPath;
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (branch === "unknown") {
    return new NextResponse(null, { status: 404 });
  }

  if (branch !== "api") {
    return NextResponse.next();
  }

  const policy = getRateLimitPolicy(
    request.method,
    request.nextUrl.pathname,
  );
  const rateLimitResult = policy
    ? rateLimiter.consume({
        key: `${policy.name}:${getClientIdentifier(request)}`,
        limit: policy.limit,
        windowMs: policy.windowMs,
      })
    : null;

  if (rateLimitResult && !rateLimitResult.allowed) {
    const response = NextResponse.json(
      {
        message: "RATE_LIMIT_EXCEEDED",
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 },
    );

    setRateLimitHeaders(response, rateLimitResult);

    return response;
  }

  const validation = validateRequestOrigin(
    request,
    {
      development: isDevelopment,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  );

  if (!validation.allowed) {
    const response = NextResponse.json(
      {
        message: "FORBIDDEN_ORIGIN",
        code: "FORBIDDEN_ORIGIN",
      },
      { status: 403 },
    );

    if (rateLimitResult) {
      setRateLimitHeaders(
        response,
        rateLimitResult,
      );
    }

    return response;
  }

  const response = NextResponse.next();

  if (rateLimitResult) {
    setRateLimitHeaders(
      response,
      rateLimitResult,
    );
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
