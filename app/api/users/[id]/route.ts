import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/auth";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";

const MAX_TRANSACTION_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 50;

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isRetryableTransactionError(
  error: unknown,
) {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function runSerializableTransaction<T>(
  operation: (
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_RETRIES;
    attempt++
  ) {
    try {
      return await prisma.$transaction(
        operation,
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        },
      );
    } catch (error) {
      const retry =
        isRetryableTransactionError(error) &&
        attempt < MAX_TRANSACTION_RETRIES;

      if (!retry) {
        if (
          isRetryableTransactionError(error)
        ) {
          throw new AppError(
            "USER_OPERATION_CONFLICT",
            409,
          );
        }

        throw error;
      }

      await sleep(
        BASE_RETRY_DELAY_MS *
          2 ** (attempt - 1),
      );
    }
  }

  throw new AppError(
    "USER_OPERATION_CONFLICT",
    409,
  );
}

export async function PUT(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const sessionAdmin =
      await requireAdmin();

    const { id } = await params;

    const targetUserId = parseId(
      id,
      "user id",
    );

    if (
      sessionAdmin.id === targetUserId
    ) {
      return Response.json({
        code: "USER_ALREADY_ADMIN",
        user: {
          id: sessionAdmin.id,
          role: sessionAdmin.role,
        },
      });
    }

    const result =
      await runSerializableTransaction(
        async (tx) => {
          const admin =
            await tx.user.findUnique({
              where: {
                id: sessionAdmin.id,
              },
              select: {
                id: true,
                role: true,
              },
            });

          if (!admin) {
            throw new AppError(
              "AUTHENTICATED_USER_NOT_FOUND",
              401,
            );
          }

          if (
            admin.role !== "admin"
          ) {
            throw new AppError(
              "ADMIN_ACCESS_REQUIRED",
              403,
            );
          }

          const user =
            await tx.user.findUnique({
              where: {
                id: targetUserId,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            });

          if (!user) {
            throw new AppError(
              "USER_NOT_FOUND",
              404,
            );
          }

          if (
            user.role === "admin"
          ) {
            return {
              alreadyAdmin: true,
              user,
            };
          }

          const updated =
            await tx.user.updateMany({
              where: {
                id: user.id,
                role: {
                  not: "admin",
                },
              },
              data: {
                role: "admin",
              },
            });

          if (
            updated.count !== 1
          ) {
            throw new AppError(
              "USER_OPERATION_CONFLICT",
              409,
            );
          }

          const updatedUser =
            await tx.user.findUnique({
              where: {
                id: user.id,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            });

          if (!updatedUser) {
            throw new AppError(
              "UPDATED_USER_NOT_FOUND",
              409,
            );
          }

          return {
            alreadyAdmin: false,
            user: updatedUser,
          };
        },
      );

    return Response.json({
      code: result.alreadyAdmin
        ? "USER_ALREADY_ADMIN"
        : "USER_PROMOTED_TO_ADMIN",
      user: result.user,
    });
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const sessionAdmin =
      await requireAdmin();

    const { id } = await params;

    const targetUserId = parseId(
      id,
      "user id",
    );

    if (
      sessionAdmin.id === targetUserId
    ) {
      throw new AppError(
        "ADMIN_SELF_DELETE_NOT_ALLOWED",
        400,
      );
    }

    await runSerializableTransaction(
      async (tx) => {
        const admin =
          await tx.user.findUnique({
            where: {
              id: sessionAdmin.id,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!admin) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        if (
          admin.role !== "admin"
        ) {
          throw new AppError(
            "ADMIN_ACCESS_REQUIRED",
            403,
          );
        }

        const target =
          await tx.user.findUnique({
            where: {
              id: targetUserId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!target) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (
          target.role === "admin"
        ) {
          throw new AppError(
            "ADMIN_DELETE_NOT_ALLOWED",
            403,
          );
        }

        try {
          const deleted =
            await tx.user.deleteMany({
              where: {
                id: target.id,
                role: {
                  not: "admin",
                },
              },
            });

          if (
            deleted.count !== 1
          ) {
            throw new AppError(
              "USER_OPERATION_CONFLICT",
              409,
            );
          }
        } catch (error) {
          if (
            error instanceof
              Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003"
          ) {
            throw new AppError(
              "USER_DELETE_BLOCKED_BY_RELATED_DATA",
              409,
            );
          }

          throw error;
        }
      },
    );

    return Response.json({
      code: "USER_DELETED",
      userId: targetUserId,
    });
  });
}