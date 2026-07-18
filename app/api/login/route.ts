import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { apiHandler } from "../../../lib/api";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 200;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

export async function POST(request: Request) {
  return apiHandler(async () => {
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

    const payload = body as Record<
      string,
      unknown
    >;

    const email =
      typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
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
      email.length > MAX_EMAIL_LENGTH ||
      !isValidEmail(email)
    ) {
      throw new AppError(
        "INVALID_EMAIL_FORMAT",
        400,
      );
    }

    if (
      password.length > MAX_PASSWORD_LENGTH
    ) {
      throw new AppError(
        "INVALID_LOGIN_CREDENTIALS",
        401,
      );
    }

    const user = await prisma.user.findUnique({
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

    const isValidPassword =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isValidPassword) {
      throw new AppError(
        "INVALID_LOGIN_CREDENTIALS",
        401,
      );
    }

    const token = randomUUID();
    const sessionDurationSeconds =
      60 * 60 * 24 * 7;

    const expiresAt = new Date(
      Date.now() +
        sessionDurationSeconds * 1000,
    );

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
      select: {
        id: true,
      },
    });

    const cookieStore = await cookies();

    cookieStore.set(
      "dasres_session_token",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: sessionDurationSeconds,
      },
    );

    cookieStore.delete("dasres_user_id");

    return Response.json({
      code: "LOGIN_SUCCESSFUL",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
}