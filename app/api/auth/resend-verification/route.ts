import { apiHandler } from "../../../../lib/api";
import { isValidEmail, normalizeEmail } from "../../../../lib/auth/credentials";
import { issueEmailVerificationToken, revokeEmailVerificationToken } from "../../../../lib/auth/identity-token";
import { enforceVerificationAccountRateLimit } from "../../../../lib/auth/verification-rate-limit";
import { waitForGenericAuthResponse } from "../../../../lib/auth/generic-response-timing";
import { assertTransactionalEmailConfigured } from "../../../../lib/email/transactional-email";
import { deliverEmailVerification } from "../../../../lib/email/verification-email";
import { AppError } from "../../../../lib/errors";
import { parseBoundedJsonObject } from "../../../../lib/http/bounded-json";
import { logger } from "../../../../lib/logger";

const ACCEPTED = { code: "EMAIL_VERIFICATION_RESEND_ACCEPTED" } as const;
export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const startedAt = Date.now();
    const payload = await parseBoundedJsonObject(request);
    const email = normalizeEmail(typeof payload.email === "string" ? payload.email : "");
    if (!email || !isValidEmail(email)) throw new AppError("VERIFICATION_EMAIL_INVALID", 400);

    assertTransactionalEmailConfigured();
    enforceVerificationAccountRateLimit(email);
    const issued = await issueEmailVerificationToken(email);
    if (issued) {
      try {
        await deliverEmailVerification({ recipient: email, rawToken: issued.rawToken, expiresAt: issued.expiresAt });
      } catch {
        try {
          await revokeEmailVerificationToken(issued.rawToken);
        } catch {
          logger.error("Verification token revocation after delivery failure failed.");
        }
        logger.error("Verification email delivery failed.");
      }
    }

    await waitForGenericAuthResponse(startedAt);
    return Response.json(ACCEPTED, { headers: { "Cache-Control": "no-store" } });
  });
}
