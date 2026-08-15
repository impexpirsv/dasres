import "server-only";

import { enforceIdentityLimit, keyedIdentityIdentifier } from "./identity-rate-limit";

export function enforceVerificationAccountRateLimit(normalizedEmail: string): void {
  enforceIdentityLimit(`verification-account:${keyedIdentityIdentifier(normalizedEmail)}`, 3, 60 * 60 * 1000);
}

export function getVerificationAccountBucketForVerification(normalizedEmail: string): string {
  return `verification-account:${keyedIdentityIdentifier(normalizedEmail)}`;
}
