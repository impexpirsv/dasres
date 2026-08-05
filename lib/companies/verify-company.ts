import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyCompanyVerification } from "../notificationEvents";
import { runInTransaction } from "../transactions";

export type VerifyCompanyResult = {
  company: {
    id: number;
    ownerId: number | null;
    verificationStatus: string;
    verifiedAt: Date | null;
  };
  alreadyVerified: boolean;
  notificationUserId: number | null;
};

function mapVerifyCompanyError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "COMPANY_VERIFICATION_CONFLICT",
      409,
    );
  }

  throw error;
}

async function sendCompanyVerificationNotification({
  result,
}: {
  result: VerifyCompanyResult;
}): Promise<void> {
  if (
    result.alreadyVerified ||
    result.notificationUserId === null
  ) {
    return;
  }

  try {
    await notifyCompanyVerification({
      userId:
        result.notificationUserId,
      approved: true,
      companyId:
        result.company.id,
    });
  } catch (error) {
    logger.error(
      "COMPANY_VERIFICATION_NOTIFICATION_FAILED",
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

export async function verifyCompany({
  companyId,
  authenticatedAdminId,
}: {
  companyId: number;
  authenticatedAdminId: number;
}): Promise<VerifyCompanyResult> {
  let result: VerifyCompanyResult;

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
          "VERIFIED"
        ) {
          return {
            company,
            alreadyVerified: true,
            notificationUserId: null,
          };
        }

        const verifiedAt = new Date();

        const updateResult =
          await transaction.company.updateMany({
            where: {
              id: company.id,
              verificationStatus: {
                not: "VERIFIED",
              },
            },
            data: {
              verificationStatus:
                "VERIFIED",
              verifiedAt,
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
            "VERIFIED"
          ) {
            return {
              company:
                currentCompany,
              alreadyVerified: true,
              notificationUserId: null,
            };
          }

          throw new AppError(
            "COMPANY_VERIFICATION_CONFLICT",
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
          alreadyVerified: false,
          notificationUserId:
            updatedCompany.ownerId,
        };
      },
    );
  } catch (error) {
    mapVerifyCompanyError(error);
  }

  await sendCompanyVerificationNotification({
    result,
  });

  return result;
}
