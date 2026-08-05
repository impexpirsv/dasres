import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { isLocale, type Locale } from "./lib/locale";
import {
  InMemoryRateLimiter,
  type RateLimitResult,
} from "./lib/security/rate-limit";
import { validateRequestOrigin } from "./lib/security/request-origin";

const isDevelopment =
  process.env.NODE_ENV === "development";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAXIMUM_BUCKET_COUNT = 10_000;
const FALLBACK_CLIENT_IDENTIFIER =
  "unidentified-client";

type RateLimitPolicy = {
  name: string;
  limit: number;
};

const rateLimiter = new InMemoryRateLimiter(
  MAXIMUM_BUCKET_COUNT,
);

const handleLocaleRouting = createMiddleware(routing);

export type ProxyBranch =
  | "api"
  | "public-locale"
  | "root"
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
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon.") ||
    pathname === "/apple-icon" ||
    pathname.startsWith("/apple-icon.") ||
    STATIC_FILE_PATTERN.test(pathname)
  );
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

  if (pathname === "/") {
    return "root";
  }

  if (getPrefixedPublicLocale(pathname)) {
    return "public-locale";
  }

  if (hasPathPrefix(pathname, "/dashboard")) {
    return "dashboard";
  }

  if (pathname === "/login" || pathname === "/login/") {
    return "auth";
  }

  if (pathname === "/register" || pathname === "/register/") {
    return "auth";
  }

  if (isStaticPath(pathname)) {
    return "static";
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

  if (
    normalizedMethod === "POST" &&
    (normalizedPathname === "/api/login" ||
      normalizedPathname === "/api/register")
  ) {
    return { name: "authentication", limit: 5 };
  }

  if (
    normalizedMethod === "POST" &&
    (normalizedPathname ===
      "/api/project-messages" ||
      /^\/api\/(?:tickets|cases)\/[^/]+\/messages$/.test(
        normalizedPathname,
      ))
  ) {
    return { name: "messaging", limit: 30 };
  }

  if (
    normalizedMethod === "POST" &&
    /\/(?:attachments|documents)(?:\/|$)/.test(
      normalizedPathname,
    )
  ) {
    return { name: "uploads", limit: 10 };
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(
      normalizedMethod,
    )
  ) {
    return { name: "mutation", limit: 60 };
  }

  if (
    normalizedMethod === "GET" ||
    normalizedMethod === "HEAD"
  ) {
    return { name: "read", limit: 300 };
  }

  return null;
}

function isUsableIpAddress(
  value: string,
): boolean {
  if (
    value.length === 0 ||
    value.length > 45
  ) {
    return false;
  }

  const ipv4Parts = value.split(".");

  if (ipv4Parts.length === 4) {
    return ipv4Parts.every(
      (part) =>
        /^\d{1,3}$/.test(part) &&
        Number(part) <= 255,
    );
  }

  return (
    value.includes(":") &&
    /^[0-9a-f:.]+$/i.test(value)
  );
}

function getClientIdentifier(
  request: NextRequest,
): string {
  if (process.env.VERCEL !== "1") {
    return FALLBACK_CLIENT_IDENTIFIER;
  }

  const platformIp = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();

  return platformIp && isUsableIpAddress(platformIp)
    ? platformIp
    : FALLBACK_CLIENT_IDENTIFIER;
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

export function proxy(
  request: NextRequest,
): NextResponse {
  const branch = getProxyBranch(request.nextUrl.pathname);

  if (branch === "public-locale") {
    return handleLocaleRouting(request);
  }

  if (branch === "root") {
    handleLocaleRouting(request);
    return NextResponse.next();
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
        windowMs: RATE_LIMIT_WINDOW_MS,
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
