import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type ToggleSavedCaseResult = {
  saved: boolean;
  savedCase: {
    id: number;
    userId: number;
    caseId: number;
    createdAt: Date;
  } | null;
};

function mapToggleSavedCaseError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      throw new AppError(
        "CASE_SAVE_TOGGLE_CONFLICT",
        409,
      );
    }

    if (error.code === "P2003") {
      throw new AppError(
        "CASE_OR_USER_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "CASE_SAVE_NOT_FOUND",
        404,
      );
    }
  }

  throw error;
}

export async function toggleSavedCase({
  caseId,
  authenticatedUserId,
}: {
  caseId: number;
  authenticatedUserId: number;
}): Promise<ToggleSavedCaseResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: {
              id:
                authenticatedUserId,
            },
            select: {
              id: true,
            },
          });

        if (!authenticatedUser) {
          throw new AppError(
            "AUTHENTICATED_USER_NOT_FOUND",
            401,
          );
        }

        const tradeCase =
          await transaction.tradeCase.findUnique({
            where: {
              id: caseId,
            },
            select: {
              id: true,
            },
          });

        if (!tradeCase) {
          throw new AppError(
            "CASE_NOT_FOUND",
            404,
          );
        }

        const existingSavedCase =
          await transaction.savedCase.findUnique({
            where: {
              userId_caseId: {
                userId:
                  authenticatedUser.id,
                caseId:
                  tradeCase.id,
              },
            },
            select: {
              id: true,
              userId: true,
              caseId: true,
              createdAt: true,
            },
          });

        if (existingSavedCase) {
          const deleteResult =
            await transaction.savedCase.deleteMany({
              where: {
                id:
                  existingSavedCase.id,
                userId:
                  authenticatedUser.id,
                caseId:
                  tradeCase.id,
              },
            });

          if (deleteResult.count !== 1) {
            const currentSavedCase =
              await transaction.savedCase.findUnique({
                where: {
                  userId_caseId: {
                    userId:
                      authenticatedUser.id,
                    caseId:
                      tradeCase.id,
                  },
                },
                select: {
                  id: true,
                },
              });

            if (!currentSavedCase) {
              return {
                saved: false,
                savedCase: null,
              };
            }

            throw new AppError(
              "CASE_SAVE_TOGGLE_CONFLICT",
              409,
            );
          }

          return {
            saved: false,
            savedCase: null,
          };
        }

        const savedCase =
          await transaction.savedCase.create({
            data: {
              userId:
                authenticatedUser.id,
              caseId:
                tradeCase.id,
            },
            select: {
              id: true,
              userId: true,
              caseId: true,
              createdAt: true,
            },
          });

        return {
          saved: true,
          savedCase,
        };
      },
    );
  } catch (error) {
    mapToggleSavedCaseError(
      error,
    );
  }
}
