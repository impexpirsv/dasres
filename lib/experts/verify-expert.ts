import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type VerifyExpertResult = {
  expert: {
    id: number;
    verificationStatus: string;
  };
  alreadyVerified: boolean;
};

function mapVerifyExpertError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "EXPERT_VERIFICATION_CONFLICT",
      409,
    );
  }

  throw error;
}

export async function verifyExpert({
  expertId,
  authenticatedAdminId,
}: {
  expertId: number;
  authenticatedAdminId: number;
}): Promise<VerifyExpertResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const admin =
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

        const expert =
          await transaction.expert.findUnique({
            where: {
              id: expertId,
            },
            select: {
              id: true,
              verificationStatus: true,
            },
          });

        if (!expert) {
          throw new AppError(
            "EXPERT_NOT_FOUND",
            404,
          );
        }

        if (
          expert.verificationStatus ===
          "VERIFIED"
        ) {
          return {
            expert,
            alreadyVerified: true,
          };
        }

        const updateResult =
          await transaction.expert.updateMany({
            where: {
              id: expert.id,
              verificationStatus: {
                not: "VERIFIED",
              },
            },
            data: {
              verificationStatus:
                "VERIFIED",
            },
          });

        if (updateResult.count !== 1) {
          const currentExpert =
            await transaction.expert.findUnique({
              where: {
                id: expert.id,
              },
              select: {
                id: true,
                verificationStatus: true,
              },
            });

          if (!currentExpert) {
            throw new AppError(
              "EXPERT_NOT_FOUND",
              404,
            );
          }

          if (
            currentExpert.verificationStatus ===
            "VERIFIED"
          ) {
            return {
              expert:
                currentExpert,
              alreadyVerified: true,
            };
          }

          throw new AppError(
            "EXPERT_VERIFICATION_CONFLICT",
            409,
          );
        }

        const updatedExpert =
          await transaction.expert.findUnique({
            where: {
              id: expert.id,
            },
            select: {
              id: true,
              verificationStatus: true,
            },
          });

        if (!updatedExpert) {
          throw new AppError(
            "UPDATED_EXPERT_NOT_FOUND",
            409,
          );
        }

        return {
          expert: updatedExpert,
          alreadyVerified: false,
        };
      },
    );
  } catch (error) {
    mapVerifyExpertError(error);
  }
}
