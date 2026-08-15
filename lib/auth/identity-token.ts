import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";

export const PASSWORD_RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;
export const PASSWORD_RESET_ISSUANCE_COOLDOWN_MS = 15 * 60 * 1000;
export const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const EMAIL_VERIFICATION_ISSUANCE_COOLDOWN_MS = 15 * 60 * 1000;
export const RESET_COOKIE_NAME = "dasres_password_reset";
export const RESET_COOKIE_MAX_AGE_SECONDS = 30 * 60;
export const RESET_COOKIE_PATH = "/api/auth/reset-password";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_TRANSACTION_RETRIES = 3;

export function generateIdentityToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidIdentityTokenSyntax(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function hashIdentityToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function runSerializableIdentityTransaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === MAX_TRANSACTION_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** (attempt - 1)));
    }
  }
  throw new AppError("IDENTITY_TOKEN_TRANSACTION_FAILED", 409);
}

export type IssuedPasswordReset = { rawToken: string; expiresAt: Date } | null;

export async function issuePasswordResetToken(userId: number): Promise<IssuedPasswordReset> {
  return runSerializableIdentityTransaction(async (transaction) => {
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - PASSWORD_RESET_ISSUANCE_COOLDOWN_MS);
    const recent = await transaction.identityToken.findFirst({
      where: { userId, purpose: "PASSWORD_RESET", createdAt: { gte: cooldownStart } },
      select: { id: true },
    });
    if (recent) return null;

    await transaction.identityToken.updateMany({
      where: { userId, purpose: "PASSWORD_RESET", consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });

    const rawToken = generateIdentityToken();
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_LIFETIME_MS);
    await transaction.identityToken.create({
      data: { userId, purpose: "PASSWORD_RESET", tokenHash: hashIdentityToken(rawToken), expiresAt },
      select: { id: true },
    });
    return { rawToken, expiresAt };
  });
}

export async function revokePasswordResetToken(rawToken: string): Promise<void> {
  if (!isValidIdentityTokenSyntax(rawToken)) return;
  await prisma.identityToken.updateMany({
    where: { tokenHash: hashIdentityToken(rawToken), purpose: "PASSWORD_RESET", consumedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function resetPasswordWithToken(token: string, passwordHash: string): Promise<boolean> {
  if (!isValidIdentityTokenSyntax(token)) return false;
  const tokenHash = hashIdentityToken(token);

  return runSerializableIdentityTransaction(async (transaction) => {
    const now = new Date();
    const record = await transaction.identityToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, purpose: true, expiresAt: true, consumedAt: true, revokedAt: true },
    });
    if (!record || record.purpose !== "PASSWORD_RESET" || record.expiresAt <= now || record.consumedAt || record.revokedAt) return false;

    const claimed = await transaction.identityToken.updateMany({
      where: { id: record.id, purpose: "PASSWORD_RESET", consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) return false;

    await transaction.user.update({ where: { id: record.userId }, data: { password: passwordHash }, select: { id: true } });
    await transaction.identityToken.updateMany({
      where: { userId: record.userId, purpose: "PASSWORD_RESET", id: { not: record.id }, consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    await transaction.session.deleteMany({ where: { userId: record.userId } });
    return true;
  });
}

export type IssuedEmailVerification = { rawToken: string; expiresAt: Date };
export type EmailVerificationClaimResult = "verified" | "already-verified" | "invalid";

export async function createEmailVerificationToken(
  transaction: Prisma.TransactionClient,
  userId: number,
  normalizedEmail: string,
): Promise<IssuedEmailVerification> {
  const now = new Date();
  await transaction.identityToken.updateMany({
    where: { userId, purpose: "EMAIL_VERIFICATION", consumedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  const rawToken = generateIdentityToken();
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_LIFETIME_MS);
  await transaction.identityToken.create({
    data: {
      userId,
      purpose: "EMAIL_VERIFICATION",
      tokenHash: hashIdentityToken(rawToken),
      targetEmail: normalizedEmail,
      expiresAt,
    },
    select: { id: true },
  });
  return { rawToken, expiresAt };
}

export async function issueEmailVerificationToken(normalizedEmail: string): Promise<IssuedEmailVerification | null> {
  return runSerializableIdentityTransaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt) return null;

    const cooldownStart = new Date(Date.now() - EMAIL_VERIFICATION_ISSUANCE_COOLDOWN_MS);
    const recent = await transaction.identityToken.findFirst({
      where: { userId: user.id, purpose: "EMAIL_VERIFICATION", createdAt: { gte: cooldownStart } },
      select: { id: true },
    });
    if (recent) return null;

    return createEmailVerificationToken(transaction, user.id, user.email);
  });
}

export async function revokeEmailVerificationToken(rawToken: string): Promise<void> {
  if (!isValidIdentityTokenSyntax(rawToken)) return;
  await prisma.identityToken.updateMany({
    where: { tokenHash: hashIdentityToken(rawToken), purpose: "EMAIL_VERIFICATION", consumedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmailWithToken(rawToken: string): Promise<EmailVerificationClaimResult> {
  if (!isValidIdentityTokenSyntax(rawToken)) return "invalid";
  const tokenHash = hashIdentityToken(rawToken);

  return runSerializableIdentityTransaction(async (transaction) => {
    const now = new Date();
    const record = await transaction.identityToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        purpose: true,
        targetEmail: true,
        expiresAt: true,
        consumedAt: true,
        revokedAt: true,
        user: { select: { email: true, emailVerifiedAt: true } },
      },
    });
    if (!record || record.purpose !== "EMAIL_VERIFICATION" || !record.targetEmail) return "invalid";
    if (record.user.emailVerifiedAt) return "already-verified";
    if (
      record.targetEmail !== record.user.email ||
      record.expiresAt <= now ||
      record.consumedAt ||
      record.revokedAt
    ) return "invalid";

    const claimed = await transaction.identityToken.updateMany({
      where: {
        id: record.id,
        purpose: "EMAIL_VERIFICATION",
        targetEmail: record.user.email,
        expiresAt: { gt: now },
        consumedAt: null,
        revokedAt: null,
      },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) return "invalid";

    const verified = await transaction.user.updateMany({
      where: { id: record.userId, email: record.targetEmail, emailVerifiedAt: null },
      data: { emailVerifiedAt: now },
    });
    if (verified.count !== 1) return "already-verified";

    await transaction.identityToken.updateMany({
      where: {
        userId: record.userId,
        purpose: "EMAIL_VERIFICATION",
        id: { not: record.id },
        consumedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    return "verified";
  });
}
