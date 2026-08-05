import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import {
  LEGACY_USER_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "../../../lib/auth/constants";
import { hashSessionToken } from "../../../lib/auth/session-token";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

async function deleteSession(
  sessionTokenHash: string,
): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        tokenHash: sessionTokenHash,
      },
    });
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientValidationError
    ) {
      throw new AppError(
        "INVALID_SESSION_TOKEN",
        400,
      );
    }

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2003") {
        throw new AppError(
          "SESSION_DELETE_CONFLICT",
          409,
        );
      }
    }

    throw error;
  }
}

function clearAuthenticationCookies(
  cookieStore: Awaited<
    ReturnType<typeof cookies>
  >,
): void {
  const cookieOptions = {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  cookieStore.set(
    SESSION_COOKIE_NAME,
    "",
    cookieOptions,
  );

  cookieStore.set(
    LEGACY_USER_COOKIE_NAME,
    "",
    cookieOptions,
  );
}

export async function POST() {
  return apiHandler(async () => {
    const cookieStore =
      await cookies();

    const sessionTokenHash =
      hashSessionToken(
        cookieStore.get(
          SESSION_COOKIE_NAME,
        )?.value,
      );

    try {
      if (sessionTokenHash) {
        await deleteSession(
          sessionTokenHash,
        );
      }
    } finally {
      clearAuthenticationCookies(
        cookieStore,
      );
    }

    return Response.json({
      code: "LOGOUT_SUCCESSFUL",
    });
  });
}
