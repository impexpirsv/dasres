import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
) {
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

    const name = String(
      payload.name ?? "",
    ).trim();

    const email = String(
      payload.email ?? "",
    )
      .trim()
      .toLowerCase();

    const password = String(
      payload.password ?? "",
    );

    if (!name) {
      throw new AppError(
        "REGISTER_NAME_REQUIRED",
        400,
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new AppError(
        "REGISTER_NAME_TOO_LONG",
        400,
      );
    }

    if (!email) {
      throw new AppError(
        "REGISTER_EMAIL_REQUIRED",
        400,
      );
    }

    if (
      email.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(email)
    ) {
      throw new AppError(
        "REGISTER_EMAIL_INVALID",
        400,
      );
    }

    if (!password) {
      throw new AppError(
        "REGISTER_PASSWORD_REQUIRED",
        400,
      );
    }

    if (
      password.length <
      MIN_PASSWORD_LENGTH
    ) {
      throw new AppError(
        "REGISTER_PASSWORD_TOO_SHORT",
        400,
      );
    }

    if (
      password.length >
      MAX_PASSWORD_LENGTH
    ) {
      throw new AppError(
        "REGISTER_PASSWORD_TOO_LONG",
        400,
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new AppError(
        "REGISTER_EMAIL_ALREADY_EXISTS",
        409,
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    try {
      const user =
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "user",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

      return Response.json(
        {
          code: "USER_REGISTERED",
          user,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "REGISTER_EMAIL_ALREADY_EXISTS",
          409,
        );
      }

      console.error(
        "USER_REGISTRATION_ERROR",
        {
          email,
          error,
        },
      );

      throw error;
    }
  });
}