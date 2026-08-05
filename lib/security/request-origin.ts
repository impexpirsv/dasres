const MUTATION_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

const TRUSTED_FETCH_SITES = new Set([
  "same-origin",
  "same-site",
]);

export type HeaderReader = {
  get(name: string): string | null;
};

export type RequestOriginInput = {
  method: string;
  url: string;
  headers: HeaderReader;
};

export type RequestOriginOptions = {
  development: boolean;
  siteUrl?: string;
};

export type RequestOriginValidation =
  | { allowed: true }
  | { allowed: false };

function normalizeUrlOrigin(
  value: string,
): string | null {
  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" &&
        url.protocol !== "https:") ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function normalizeOriginHeader(
  value: string,
): string | null {
  const normalizedOrigin =
    normalizeUrlOrigin(value);

  if (normalizedOrigin === null) {
    return null;
  }

  const url = new URL(value);

  return url.pathname === "/" &&
    url.search === "" &&
    url.hash === ""
    ? normalizedOrigin
    : null;
}

function isDevelopmentOrigin(
  origin: string,
): boolean {
  const hostname = new URL(origin).hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function validateRequestOrigin(
  request: RequestOriginInput,
  options: RequestOriginOptions,
): RequestOriginValidation {
  if (
    !MUTATION_METHODS.has(
      request.method.toUpperCase(),
    )
  ) {
    return { allowed: true };
  }

  const originHeader =
    request.headers.get("origin");

  if (originHeader === null) {
    const fetchSite = request.headers
      .get("sec-fetch-site")
      ?.trim()
      .toLowerCase();

    return {
      allowed:
        fetchSite !== undefined &&
        TRUSTED_FETCH_SITES.has(fetchSite),
    };
  }

  const requestOrigin = normalizeOriginHeader(
    originHeader.trim(),
  );

  if (requestOrigin === null) {
    return { allowed: false };
  }

  const targetOrigin = normalizeUrlOrigin(
    request.url,
  );

  if (requestOrigin === targetOrigin) {
    return { allowed: true };
  }

  if (
    options.development &&
    isDevelopmentOrigin(requestOrigin)
  ) {
    return { allowed: true };
  }

  const configuredOrigin = options.siteUrl
    ? normalizeUrlOrigin(options.siteUrl.trim())
    : null;

  return {
    allowed:
      !options.development &&
      configuredOrigin !== null &&
      requestOrigin === configuredOrigin,
  };
}
