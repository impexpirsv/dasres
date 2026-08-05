import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "../prisma";
import { SESSION_COOKIE_NAME } from "./constants";
import { hashSessionToken } from "./session-token";
import type {
  AuthenticatedSession,
  AuthenticatedUser,
} from "./types";

async function removeExpiredSession(
  sessionId: number,
): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  } catch {
    // Authentication must fail closed even when cleanup is unavailable.
  }
}

export const getCurrentSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const tokenHash = hashSessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!tokenHash) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await removeExpiredSession(session.id);
    return null;
  }

  return session;
});

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}
