import { env } from "../env";

const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL);

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteUrl).toString();
}

export function getPublicAbsoluteUrl(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    const url = normalizedValue.startsWith("/")
      ? new URL(normalizedValue, siteUrl)
      : new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function getSiteOrigin(): string {
  return siteUrl.origin;
}
