import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyCompanyVerification } from "../notificationEvents";
import { runInTransaction } from "../transactions";

export type RejectCompanyResult = {
  company: {
    id: number;
    ownerId: number | null;
    verificationStatus: string;
    verifiedAt: Date | null;
  };
  alreadyRejected: boolean;
  notificationUserId: number | null;
};

function mapRejectCompanyError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "COMPANY_REJECTION_CONFLICT",
      409,
    );
  }

  throw error;
}

async function sendCompanyRejectionNotification({
  result,
}: {
  result: RejectCompanyResult;
}): Promise<void> {
  if (
    result.alreadyRejected ||
    result.notificationUserId === null
  ) {
    return;
  }

  try {
    await notifyCompanyVerification({
      userId:
        result.notificationUserId,
      approved: false,
      companyId:
        result.company.id,
    });
  } catch (error) {
    logger.error(
      "COMPANY_REJECTION_NOTIFICATION_FAILED",
      {
        companyId:
          result.company.id,
        receiverId:
          result.notificationUserId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

export async function rejectCompany({
  companyId,
  authenticatedAdminId,
}: {
  companyId: number;
  authenticatedAdminId: number;
}): Promise<RejectCompanyResult> {
  let result: RejectCompanyResult;

  try {
    result = await runInTransaction(
      async (transaction) => {
        const authenticatedAdmin =
          await transaction.user.findUnique({
            where: {
              id:
                authenticatedAdminId,
            },
            select: {
              id: true,
              role: true,
            },
          });

        if (!authenticatedAdmin) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        if (
          authenticatedAdmin.role !==
          "admin"
        ) {
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
          "REJECTED"
        ) {
          return {
            company,
            alreadyRejected: true,
            notificationUserId: null,
          };
        }

        const updateResult =
          await transaction.company.updateMany({
            where: {
              id: company.id,
              verificationStatus: {
                not: "REJECTED",
              },
            },
            data: {
              verificationStatus:
                "REJECTED",
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
            "REJECTED"
          ) {
            return {
              company:
                currentCompany,
              alreadyRejected: true,
              notificationUserId: null,
            };
          }

          throw new AppError(
            "COMPANY_REJECTION_CONFLICT",
            409,
          );
        }

        const updatedCompany =
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

        if (!updatedCompany) {
          throw new AppError(
            "UPDATED_COMPANY_NOT_FOUND",
            409,
          );
        }

        return {
          company: updatedCompany,
          alreadyRejected: false,
          notificationUserId:
            updatedCompany.ownerId,
        };
      },
    );
  } catch (error) {
    mapRejectCompanyError(error);
  }

  await sendCompanyRejectionNotification({
    result,
  });

  return result;
}
