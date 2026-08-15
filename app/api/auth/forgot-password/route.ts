import { apiHandler } from "../../../../lib/api";
import { isValidEmail, normalizeEmail } from "../../../../lib/auth/credentials";
import { issuePasswordResetToken, revokePasswordResetToken, type IssuedPasswordReset } from "../../../../lib/auth/identity-token";
import { enforceForgotAccountRateLimit } from "../../../../lib/auth/recovery-rate-limit";
import { waitForGenericAuthResponse } from "../../../../lib/auth/generic-response-timing";
import { createCanonicalSecurityEmailUrl } from "../../../../lib/email/canonical-email-url";
import { assertTransactionalEmailConfigured, sendPasswordResetEmail } from "../../../../lib/email/transactional-email";
import { AppError } from "../../../../lib/errors";
import { parseBoundedJsonObject } from "../../../../lib/http/bounded-json";
import { prisma } from "../../../../lib/prisma";
import { logger } from "../../../../lib/logger";

const ACCEPTED = { code: "PASSWORD_RESET_REQUEST_ACCEPTED" } as const;
function getResetPageUrl(): URL {
  return createCanonicalSecurityEmailUrl("/reset-password");
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const startedAt = Date.now();
    const payload = await parseBoundedJsonObject(request);
    const email = normalizeEmail(typeof payload.email === "string" ? payload.email : "");
    if (!email || !isValidEmail(email)) throw new AppError("FORGOT_PASSWORD_EMAIL_INVALID", 400);

    assertTransactionalEmailConfigured();
    const resetPageUrl = getResetPageUrl();
    enforceForgotAccountRateLimit(email);

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (user) {
      let issued: IssuedPasswordReset = null;
      try {
        issued = await issuePasswordResetToken(user.id);
      } catch {
        logger.error("Password reset token issuance failed.", { userId: user.id });
      }
      if (issued) {
        const resetUrl = new URL(resetPageUrl);
        resetUrl.searchParams.set("token", issued.rawToken);
        try {
          await sendPasswordResetEmail({ recipient: user.email, resetUrl, expiresAt: issued.expiresAt });
        } catch {
          try {
            await revokePasswordResetToken(issued.rawToken);
          } catch {
            logger.error("Password reset token revocation after delivery failure failed.", { userId: user.id });
          }
          logger.error("Password reset delivery failed.", { userId: user.id });
        }
      }
    }

    await waitForGenericAuthResponse(startedAt);
    return Response.json(ACCEPTED, { headers: { "Cache-Control": "no-store" } });
  });
}
