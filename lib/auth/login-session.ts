import "server-only";

import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import { generateSessionToken, hashSessionToken } from "./session-token";

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const MAX_TRANSACTION_RETRIES = 3;
const MAX_TOKEN_GENERATION_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 50;

function isKnownPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

async function runSerializable<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const retryable = isKnownPrismaError(error, "P2034");
      if (!retryable || attempt === MAX_TRANSACTION_RETRIES) {
        if (retryable) throw new AppError("LOGIN_SESSION_CONFLICT", 409);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)));
    }
  }
  throw new AppError("LOGIN_SESSION_CONFLICT", 409);
}

export async function createLoginSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  for (let attempt = 1; attempt <= MAX_TOKEN_GENERATION_ATTEMPTS; attempt += 1) {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    if (!tokenHash) throw new AppError("SESSION_TOKEN_GENERATION_FAILED", 500);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    try {
      return await runSerializable(async (transaction) => {
        const user = await transaction.user.findUnique({
          where: { id: userId },
          select: { id: true, emailVerifiedAt: true },
        });
        if (!user) throw new AppError("USER_NOT_FOUND", 404);
        if (!user.emailVerifiedAt) {
          throw new AppError("EMAIL_VERIFICATION_REQUIRED", 403, { code: "EMAIL_VERIFICATION_REQUIRED" });
        }
        await transaction.session.deleteMany({ where: { userId } });
        await transaction.session.create({ data: { tokenHash, userId, expiresAt }, select: { id: true } });
        return { token, expiresAt };
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002") && attempt < MAX_TOKEN_GENERATION_ATTEMPTS) continue;
      if (isKnownPrismaError(error, "P2002")) throw new AppError("SESSION_TOKEN_GENERATION_FAILED", 500);
      throw error;
    }
  }
  throw new AppError("SESSION_TOKEN_GENERATION_FAILED", 500);
}
