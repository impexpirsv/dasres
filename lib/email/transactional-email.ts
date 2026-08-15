import "server-only";

import { AppError } from "../errors";

export type PasswordResetEmail = {
  recipient: string;
  resetUrl: URL;
  expiresAt: Date;
};

export interface TransactionalEmailProvider {
  sendPasswordReset(message: PasswordResetEmail): Promise<void>;
}

class DevelopmentEmailProvider implements TransactionalEmailProvider {
  async sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    // This intentionally provides an ephemeral local preview only. Never enable it in production.
    console.info(`[development email preview] Password reset for ${message.recipient}: ${message.resetUrl.toString()} (expires ${message.expiresAt.toISOString()})`);
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
