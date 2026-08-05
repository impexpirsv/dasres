import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeOpportunityImageFile,
  resolveOpportunityImageFilePath,
} from "../storage/opportunity-image-storage";
import { runInTransaction } from "../transactions";

async function assertAdminInsideTransaction({
  transaction,
  adminId,
}: {
  transaction:
    Prisma.TransactionClient;
  adminId: number;
}): Promise<void> {
  const admin =
    await transaction.user.findUnique({
      where: {
        id: adminId,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (!admin) {
    throw new AppError(
      "ADMIN_NOT_FOUND",
      404,
    );
  }

  if (admin.role !== "admin") {
    throw new AppError(
      "ADMIN_ACCESS_REQUIRED",
      403,
    );
  }
}

function mapOpportunityDeleteError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2003") {
      throw new AppError(
        "OPPORTUNITY_RELATION_CONFLICT",
        409,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "OPPORTUNITY_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "OPPORTUNITY_DELETE_CONFLICT",
        409,
      );
    }
  }

  if (
    error instanceof
    Prisma.PrismaClientValidationError
  ) {
    throw new AppError(
      "INVALID_OPPORTUNITY_DATA",
      400,
    );
  }

  throw error;
}

export async function deleteOpportunity({
  opportunityId,
  authenticatedAdminId,
}: {
  opportunityId: number;
  authenticatedAdminId: number;
}): Promise<void> {
  let imageUrl: string | null;

  try {
    const result =
      await runInTransaction(
        async (transaction) => {
          await assertAdminInsideTransaction({
            transaction,
            adminId:
              authenticatedAdminId,
          });

          const opportunity =
            await transaction.opportunity.findUnique({
              where: {
                id: opportunityId,
              },
              select: {
                id: true,
                imageUrl: true,
              },
            });

          if (!opportunity) {
            throw new AppError(
              "OPPORTUNITY_NOT_FOUND",
              404,
            );
          }

          await transaction.opportunity.delete({
            where: {
              id: opportunity.id,
            },
            select: {
              id: true,
            },
          });

          return {
            imageUrl:
              opportunity.imageUrl,
          };
        },
      );

    imageUrl = result.imageUrl;
  } catch (error) {
    mapOpportunityDeleteError(
      error,
    );
  }

  await removeOpportunityImageFile(
    resolveOpportunityImageFilePath(
      imageUrl,
    ),
  );
}
