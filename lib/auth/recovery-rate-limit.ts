import "server-only";

import { enforceIdentityLimit, keyedIdentityIdentifier } from "./identity-rate-limit";

export function enforceForgotAccountRateLimit(normalizedEmail: string): void {
  enforceIdentityLimit(`forgot-account:${keyedIdentityIdentifier(normalizedEmail)}`, 3, 60 * 60 * 1000);
}

export function enforceResetTokenRateLimit(tokenHash: string): void {
  enforceIdentityLimit(`reset-token:${tokenHash}`, 5, 15 * 60 * 1000);
}

export function getRecoveryAccountBucketForVerification(normalizedEmail: string): string {
  return `forgot-account:${keyedIdentityIdentifier(normalizedEmail)}`;
}
