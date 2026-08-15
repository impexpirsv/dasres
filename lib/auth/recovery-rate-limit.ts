import "server-only";

import { createHmac } from "node:crypto";

import { AppError } from "../errors";
import { InMemoryRateLimiter } from "../security/rate-limit";

const limiter = new InMemoryRateLimiter(10_000);
const DEVELOPMENT_SECRET = "dasres-local-recovery-rate-limit";
const DOCUMENTED_EXAMPLE_SECRET = "replace-with-a-random-secret-of-at-least-32-characters";

function getSecret(): string {
  const configured = process.env.ACCOUNT_RATE_LIMIT_SECRET;
  if (configured && configured.length >= 32 && configured !== DOCUMENTED_EXAMPLE_SECRET) return configured;
  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_SECRET;
  throw new AppError("PASSWORD_RECOVERY_NOT_CONFIGURED", 503);
}

function keyedIdentifier(value: string): string {
  return createHmac("sha256", getSecret()).update(value, "utf8").digest("hex");
}

function enforce(key: string, limit: number, windowMs: number): void {
  const result = limiter.consume({ key, limit, windowMs });
  if (!result.allowed) throw new AppError("RATE_LIMIT_EXCEEDED", 429);
}

export function enforceForgotAccountRateLimit(normalizedEmail: string): void {
  enforce(`forgot-account:${keyedIdentifier(normalizedEmail)}`, 3, 60 * 60 * 1000);
}

export function enforceResetTokenRateLimit(tokenHash: string): void {
  enforce(`reset-token:${tokenHash}`, 5, 15 * 60 * 1000);
}

export function getRecoveryAccountBucketForVerification(normalizedEmail: string): string {
  return `forgot-account:${keyedIdentifier(normalizedEmail)}`;
}
