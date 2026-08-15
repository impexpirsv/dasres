import "server-only";

import { createCanonicalSecurityEmailUrl } from "./canonical-email-url";
import { sendEmailVerification } from "./transactional-email";

export function createEmailVerificationUrl(rawToken: string): URL {
  return createCanonicalSecurityEmailUrl("/api/auth/verify-email", { token: rawToken });
}

export function createEmailVerificationPageUrl(status: "success" | "invalid" | "already-verified"): URL {
  return createCanonicalSecurityEmailUrl("/verify-email", { status });
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
