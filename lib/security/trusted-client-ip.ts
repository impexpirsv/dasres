import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const TRUSTED_CLIENT_IP_HEADER = "x-dasres-client-ip";
export const TRUSTED_PROXY_SECRET_HEADER = "x-dasres-proxy-secret";
export const UNIDENTIFIED_CLIENT = "unidentified-client";

type TrustedProxyMode = "none" | "local";

export type TrustedProxyConfig = Readonly<{
  mode: TrustedProxyMode;
  secret?: string;
}>;

const MINIMUM_PROXY_SECRET_LENGTH = 32;
const MAXIMUM_PROXY_SECRET_LENGTH = 512;

function configurationError(): never {
  throw new Error("Invalid trusted proxy configuration.");
}

export function getTrustedProxyConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): TrustedProxyConfig {
  const configuredMode = environment.TRUSTED_PROXY_MODE?.trim();
  const mode = configuredMode || (environment.NODE_ENV === "production" ? "" : "none");

  if (mode === "none") {
    if (environment.NODE_ENV === "production") configurationError();
    return { mode };
  }

  if (mode !== "local") configurationError();

  const secret = environment.TRUSTED_PROXY_SECRET?.trim() ?? "";
  if (
    secret.length < MINIMUM_PROXY_SECRET_LENGTH ||
    secret.length > MAXIMUM_PROXY_SECRET_LENGTH ||
    /[^\x21-\x7e]/.test(secret)
  ) {
    configurationError();
  }

  return { mode, secret };
}

function secretsMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

export function normalizeClientIp(value: string): string | null {
  const candidate = value.trim();
  if (
    candidate.length === 0 ||
    candidate.length > 45 ||
    candidate.includes(",") ||
    /[\u0000-\u0020\u007f]/.test(candidate)
  ) {
    return null;
  }

  const mappedIpv4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(candidate)?.[1];
  const normalized = mappedIpv4 ?? candidate;
  const version = isIP(normalized);
  if (version === 4) return normalized.split(".").map((part) => String(Number(part))).join(".");
  if (version === 6) return normalized.toLowerCase();
  return null;
}

export function getTrustedClientIdentifier(
  headers: Headers,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const config = getTrustedProxyConfig(environment);
  if (config.mode === "none") return UNIDENTIFIED_CLIENT;

  const suppliedSecret = headers.get(TRUSTED_PROXY_SECRET_HEADER) ?? "";
  if (!config.secret || !secretsMatch(suppliedSecret, config.secret)) {
    return UNIDENTIFIED_CLIENT;
  }

  return normalizeClientIp(headers.get(TRUSTED_CLIENT_IP_HEADER) ?? "") ?? UNIDENTIFIED_CLIENT;
}
