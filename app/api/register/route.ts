import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../lib/api";
import { hashPassword, isValidEmail, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, normalizeEmail } from "../../../lib/auth/credentials";
import { createEmailVerificationToken, revokeEmailVerificationToken, runSerializableIdentityTransaction } from "../../../lib/auth/identity-token";
import { assertTransactionalEmailConfigured } from "../../../lib/email/transactional-email";
import { deliverEmailVerification } from "../../../lib/email/verification-email";
import { AppError } from "../../../lib/errors";
import { parseBoundedJsonObject } from "../../../lib/http/bounded-json";
import { logger } from "../../../lib/logger";
import { prisma } from "../../../lib/prisma";

const MAX_NAME_LENGTH = 150;

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

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

async function createRegistration({
  name,
  email,
  hashedPassword,
}: {
  name: string;
  email: string;
  hashedPassword: string;
}) {
  try {
    return await runSerializableIdentityTransaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { name, email, password: hashedPassword, role: "user", emailVerifiedAt: null },
        select: { id: true, name: true, email: true, role: true },
      });
      const verification = await createEmailVerificationToken(transaction, user.id, user.email);
      return { user, verification };
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

    logger.error("User registration failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    throw error;
  }
}

export async function POST(
  request: Request,
) {
  return apiHandler(async () => {
    const payload = await parseBoundedJsonObject(request);

    const input =
      validateRegisterInput(
        payload,
      );

    assertTransactionalEmailConfigured();

    await ensureEmailAvailable(
      input.email,
    );

    const hashedPassword =
      await hashPassword(
        input.password,
      );

    const registration =
      await createRegistration({
        name: input.name,
        email: input.email,
        hashedPassword,
      });

    try {
      await deliverEmailVerification({
        recipient: registration.user.email,
        rawToken: registration.verification.rawToken,
        expiresAt: registration.verification.expiresAt,
      });
    } catch {
      try {
        await revokeEmailVerificationToken(registration.verification.rawToken);
      } catch {
        logger.error("Registration verification token revocation failed.", { userId: registration.user.id });
      }
      logger.error("Registration verification delivery failed.", { userId: registration.user.id });
    }

    return Response.json(
      {
        code:
          "USER_REGISTERED_VERIFICATION_REQUIRED",
        verificationRequired: true,
        user: registration.user,
      },
      {
        status: 201,
      },
    );
  });
}
