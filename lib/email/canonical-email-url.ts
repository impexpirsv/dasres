import "server-only";

import { AppError } from "../errors";

type SecurityEmailPath = "/reset-password" | "/api/auth/verify-email" | "/verify-email";

function getCanonicalSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl) throw new AppError("SITE_URL_NOT_CONFIGURED", 503);

  let siteUrl: URL;
  try {
    siteUrl = new URL(configuredUrl);
  } catch {
    throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  }

  const isLocalHttp =
    siteUrl.protocol === "http:" &&
    (siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1");
  const protocolAllowed =
    siteUrl.protocol === "https:" ||
    (process.env.NODE_ENV !== "production" && isLocalHttp);

  if (
    !protocolAllowed ||
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  }

  return siteUrl;
}

export function createCanonicalSecurityEmailUrl(
  path: SecurityEmailPath,
  parameters?: Readonly<Record<string, string>>,
): URL {
  const result = new URL(path, getCanonicalSiteUrl());
  for (const [name, value] of Object.entries(parameters ?? {})) {
    result.searchParams.set(name, value);
  }
  return result;
}
