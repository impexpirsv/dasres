import "server-only";

import { AppError } from "../errors";

export type PasswordResetEmail = {
  recipient: string;
  resetUrl: URL;
  expiresAt: Date;
};

export type EmailVerificationEmail = {
  recipient: string;
  verificationUrl: URL;
  expiresAt: Date;
};

export interface TransactionalEmailProvider {
  sendPasswordReset(message: PasswordResetEmail): Promise<void>;
  sendEmailVerification(message: EmailVerificationEmail): Promise<void>;
}

class DevelopmentEmailProvider implements TransactionalEmailProvider {
  async sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    // This intentionally provides an ephemeral local preview only. Never enable it in production.
    console.info(`[development email preview] Password reset for ${message.recipient}: ${message.resetUrl.toString()} (expires ${message.expiresAt.toISOString()})`);
  }

  async sendEmailVerification(message: EmailVerificationEmail): Promise<void> {
    console.info(`[development email preview] Verify ${message.recipient}: ${message.verificationUrl.toString()} (expires ${message.expiresAt.toISOString()})`);
  }
}

function getProvider(): TransactionalEmailProvider {
  if (process.env.NODE_ENV !== "production") return new DevelopmentEmailProvider();
  throw new AppError("TRANSACTIONAL_EMAIL_NOT_CONFIGURED", 503);
}

export function assertTransactionalEmailConfigured(): void {
  getProvider();
}

export async function sendPasswordResetEmail(message: PasswordResetEmail): Promise<void> {
  await getProvider().sendPasswordReset(message);
}

export async function sendEmailVerification(message: EmailVerificationEmail): Promise<void> {
  await getProvider().sendEmailVerification(message);
}
