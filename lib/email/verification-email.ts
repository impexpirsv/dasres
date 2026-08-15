import "server-only";

import { AppError } from "../errors";
import { sendEmailVerification } from "./transactional-email";

export function createEmailVerificationUrl(rawToken: string): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new AppError("SITE_URL_NOT_CONFIGURED", 503);

  let verificationUrl: URL;
  try {
    verificationUrl = new URL("/api/auth/verify-email", siteUrl);
  } catch {
    throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  }
  if (
    (verificationUrl.protocol !== "http:" && verificationUrl.protocol !== "https:") ||
    verificationUrl.username ||
    verificationUrl.password
  ) throw new AppError("SITE_URL_NOT_CONFIGURED", 503);

  verificationUrl.searchParams.set("token", rawToken);
  return verificationUrl;
}

export function createEmailVerificationPageUrl(status: "success" | "invalid" | "already-verified"): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  let pageUrl: URL;
  try {
    pageUrl = new URL("/verify-email", siteUrl);
  } catch {
    throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  }
  if ((pageUrl.protocol !== "http:" && pageUrl.protocol !== "https:") || pageUrl.username || pageUrl.password) {
    throw new AppError("SITE_URL_NOT_CONFIGURED", 503);
  }
  pageUrl.searchParams.set("status", status);
  return pageUrl;
}

export async function deliverEmailVerification({
  recipient,
  rawToken,
  expiresAt,
}: {
  recipient: string;
  rawToken: string;
  expiresAt: Date;
}): Promise<void> {
  await sendEmailVerification({
    recipient,
    verificationUrl: createEmailVerificationUrl(rawToken),
    expiresAt,
  });
}
