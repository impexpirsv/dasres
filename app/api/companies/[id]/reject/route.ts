import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import { notifyCompanyVerification } from "../../../../../lib/notificationEvents";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";

const MAX_TRANSACTION_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 50;

type RejectCompanyResult = {
  company: {
    id: number;
    ownerId: number | null;
    verificationStatus: string;
    verifiedAt: Date | null;
  };
  alreadyRejected: boolean;
};

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
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_RETRIES;
    attempt += 1
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
      const shouldRetry =
        isRetryableTransactionError(error) &&
        attempt < MAX_TRANSACTION_RETRIES;

      if (!shouldRetry) {
        if (
          isRetryableTransactionError(error)
        ) {
          throw new AppError(
            "COMPANY_REJECTION_CONFLICT",
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
    "COMPANY_REJECTION_CONFLICT",
    409,
  );
}

async function rejectCompany({
  companyId,
  authenticatedAdminId,
}: {
  companyId: number;
  authenticatedAdminId: number;
}): Promise<RejectCompanyResult> {
  return runSerializableTransaction(
    async (transaction) => {
      const admin =
        await transaction.user.findUnique({
          where: {
            id: authenticatedAdminId,
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

      if (admin.role !== "admin") {
        throw new AppError(
          "ADMIN_ACCESS_REQUIRED",
          403,
        );
      }

      const company =
        await transaction.company.findUnique({
          where: {
            id: companyId,
          },
          select: {
            id: true,
            ownerId: true,
            verificationStatus: true,
            verifiedAt: true,
          },
        });

      if (!company) {
        throw new AppError(
          "COMPANY_NOT_FOUND",
          404,
        );
      }

      if (
        company.verificationStatus ===
          "REJECTED" &&
        company.verifiedAt === null
      ) {
        return {
          company,
          alreadyRejected: true,
        };
      }

      const updateResult =
        await transaction.company.updateMany({
          where: {
            id: company.id,
            OR: [
              {
                verificationStatus: {
                  not: "REJECTED",
                },
              },
              {
                verifiedAt: {
                  not: null,
                },
              },
            ],
          },
          data: {
            verificationStatus: "REJECTED",
            verifiedAt: null,
          },
        });

      if (updateResult.count !== 1) {
        const currentCompany =
          await transaction.company.findUnique({
            where: {
              id: company.id,
            },
            select: {
              id: true,
              ownerId: true,
              verificationStatus: true,
              verifiedAt: true,
            },
          });

        if (!currentCompany) {
          throw new AppError(
            "COMPANY_NOT_FOUND",
            404,
          );
        }

        if (
          currentCompany.verificationStatus ===
            "REJECTED" &&
          currentCompany.verifiedAt === null
        ) {
          return {
            company: currentCompany,
            alreadyRejected: true,
          };
        }

        throw new AppError(
          "COMPANY_REJECTION_CONFLICT",
          409,
        );
      }

      const rejectedCompany =
        await transaction.company.findUnique({
          where: {
            id: company.id,
          },
          select: {
            id: true,
            ownerId: true,
            verificationStatus: true,
            verifiedAt: true,
          },
        });

      if (!rejectedCompany) {
        throw new AppError(
          "UPDATED_COMPANY_NOT_FOUND",
          409,
        );
      }

      return {
        company: rejectedCompany,
        alreadyRejected: false,
      };
    },
  );
}

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  return apiHandler(async () => {
    const admin = await requireAdmin();

    const { id } = await params;

    const companyId = parseId(
      id,
      "company id",
    );

    const result = await rejectCompany({
      companyId,
      authenticatedAdminId: admin.id,
    });

    if (
      !result.alreadyRejected &&
      result.company.ownerId !== null
    ) {
      try {
        await notifyCompanyVerification({
          userId: result.company.ownerId,
          approved: false,
          companyId: result.company.id,
        });
      } catch (error) {
        console.error(
          "COMPANY_REJECTION_NOTIFICATION_ERROR",
          {
            companyId: result.company.id,
            ownerId: result.company.ownerId,
            error,
          },
        );
      }
    }

    return Response.json({
      code: result.alreadyRejected
        ? "COMPANY_ALREADY_REJECTED"
        : "COMPANY_REJECTED",
      company: result.company,
    });
  });
}