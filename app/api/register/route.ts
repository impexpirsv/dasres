import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import { hashPassword, isValidEmail, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, normalizeEmail } from "../../../lib/auth/credentials";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

const MAX_NAME_LENGTH = 150;

const MAX_REQUEST_BODY_SIZE =
  16 * 1024;


type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

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
    !Number.isInteger(contentLength) ||
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

function getStringField(
  payload: Record<string, unknown>,
  fieldName: string,
): string {
  const value = payload[fieldName];

  if (typeof value !== "string") {
    return "";
  }

  return value;
}

function validateRegisterInput(
  payload: Record<string, unknown>,
): RegisterInput {
  const name = getStringField(
    payload,
    "name",
  ).trim();

  const email = normalizeEmail(getStringField(payload, "email"));

  const password = getStringField(
    payload,
    "password",
  );

  if (!name) {
    throw new AppError(
      "REGISTER_NAME_REQUIRED",
      400,
    );
  }

  if (
    name.length >
    MAX_NAME_LENGTH
  ) {
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
    !isValidEmail(email)
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

  return {
    name,
    email,
    password,
  };
}

async function ensureEmailAvailable(
  email: string,
): Promise<void> {
  try {
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
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientValidationError
    ) {
      throw new AppError(
        "REGISTER_EMAIL_INVALID",
        400,
      );
    }

    throw error;
  }
}

async function createUser({
  name,
  email,
  hashedPassword,
}: {
  name: string;
  email: string;
  hashedPassword: string;
}) {
  try {
    return await prisma.user.create({
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
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        throw new AppError(
          "REGISTER_EMAIL_ALREADY_EXISTS",
          409,
        );
      }

      if (error.code === "P2003") {
        throw new AppError(
          "REGISTER_RELATION_CONFLICT",
          409,
        );
      }
    }

    if (
      error instanceof
      Prisma.PrismaClientValidationError
    ) {
      throw new AppError(
        "INVALID_REGISTER_DATA",
        400,
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
}

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    const payload =
      await parseJsonBody(
        request,
      );

    const input =
      validateRegisterInput(
        payload,
      );

    await ensureEmailAvailable(
      input.email,
    );

    const hashedPassword =
      await hashPassword(
        input.password,
      );

    const user =
      await createUser({
        name: input.name,
        email: input.email,
        hashedPassword,
      });

    return Response.json(
      {
        code:
          "USER_REGISTERED",
        user,
      },
      {
        status: 201,
      },
    );
  });
}
