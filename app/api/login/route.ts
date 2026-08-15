import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import {
  LEGACY_USER_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "../../../lib/auth/constants";
import {
  createLoginSession,
  SESSION_DURATION_SECONDS,
} from "../../../lib/auth/login-session";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

const MAX_REQUEST_BODY_SIZE = 16 * 1024;

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 200;

type LoginInput = {
  email: string;
  password: string;
};

type AuthenticatedUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function validateContentLength(
  request: Request,
): void {
  const contentLengthHeader =
    request.headers.get(
      "content-length",
    );

  if (!contentLengthHeader) {
    return;
  }

  const contentLength = Number(
    contentLengthHeader,
  );

  if (
    !Number.isFinite(contentLength) ||
    contentLength < 0
  ) {
    throw new AppError(
      "INVALID_CONTENT_LENGTH",
      400,
    );
  }

  if (
    contentLength >
    MAX_REQUEST_BODY_SIZE
  ) {
    throw new AppError(
      "REQUEST_BODY_TOO_LARGE",
      413,
    );
  }
}

async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  validateContentLength(request);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
      400,
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  return body as Record<
    string,
    unknown
  >;
}

function validateLoginInput(
  payload: Record<string, unknown>,
): LoginInput {
  const email =
    typeof payload.email === "string"
      ? payload.email
          .trim()
          .toLowerCase()
      : "";

  const password =
    typeof payload.password === "string"
      ? payload.password
      : "";

  if (!email || !password) {
    throw new AppError(
      "LOGIN_CREDENTIALS_REQUIRED",
      400,
    );
  }

  if (
    email.length >
      MAX_EMAIL_LENGTH ||
    !isValidEmail(email)
  ) {
    throw new AppError(
      "INVALID_EMAIL_FORMAT",
      400,
    );
  }

  if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    throw new AppError(
      "INVALID_LOGIN_CREDENTIALS",
      401,
    );
  }

  return {
    email,
    password,
  };
}

async function authenticateUser({
  email,
  password,
}: LoginInput): Promise<AuthenticatedUser> {
  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });

  if (!user) {
    throw new AppError(
      "INVALID_LOGIN_CREDENTIALS",
      401,
    );
  }

  let isValidPassword = false;

  try {
    isValidPassword =
      await bcrypt.compare(
        password,
        user.password,
      );
  } catch (error) {
    console.error(
      "LOGIN_PASSWORD_COMPARE_ERROR",
      {
        userId: user.id,
        error,
      },
    );

    throw new AppError(
      "LOGIN_FAILED",
      500,
    );
  }

  if (!isValidPassword) {
    throw new AppError(
      "INVALID_LOGIN_CREDENTIALS",
      401,
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function setSessionCookie({
  token,
}: {
  token: string;
}): Promise<void> {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        SESSION_DURATION_SECONDS,
    },
  );

  cookieStore.delete(
    LEGACY_USER_COOKIE_NAME,
  );
}

function mapLoginError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientValidationError
  ) {
    throw new AppError(
      "INVALID_LOGIN_DATA",
      400,
    );
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2003") {
      throw new AppError(
        "LOGIN_SESSION_USER_INVALID",
        409,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "USER_NOT_FOUND",
        404,
      );
    }
  }

  throw error;
}

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    try {
      const payload =
        await parseJsonBody(
          request,
        );

      const input =
        validateLoginInput(
          payload,
        );

      const user =
        await authenticateUser(
          input,
        );

      const session =
        await createLoginSession(user.id);

      await setSessionCookie({
        token: session.token,
      });

      return Response.json({
        code:
          "LOGIN_SUCCESSFUL",
        user,
      });
    } catch (error) {
      mapLoginError(error);
    }
  });
}
