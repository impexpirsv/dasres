import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type SaveExpertResult = {
  code:
    | "EXPERT_SAVED"
    | "EXPERT_UNSAVED";
  saved: boolean;
};

function mapSaveExpertError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2003") {
      throw new AppError(
        "EXPERT_OR_USER_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2025") {
      throw new AppError(
        "EXPERT_SAVE_NOT_FOUND",
        404,
      );
    }

    if (
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      throw new AppError(
        "EXPERT_SAVE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function toggleSavedExpert({
  userId,
  expertId,
}: {
  userId: number;
  expertId: number;
}): Promise<SaveExpertResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const [user, expert] =
          await Promise.all([
            transaction.user.findUnique({
              where: {
                id: userId,
              },
              select: {
                id: true,
              },
            }),
            transaction.expert.findUnique({
              where: {
                id: expertId,
              },
              select: {
                id: true,
              },
            }),
          ]);

        if (!user) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (!expert) {
          throw new AppError(
            "EXPERT_NOT_FOUND",
            404,
          );
        }

        const existingSave =
          await transaction.savedExpert.findUnique({
            where: {
              userId_expertId: {
                userId,
                expertId,
              },
            },
            select: {
              userId: true,
              expertId: true,
            },
          });

        if (existingSave) {
          await transaction.savedExpert.delete({
            where: {
              userId_expertId: {
                userId,
                expertId,
              },
            },
          });

          return {
            code: "EXPERT_UNSAVED",
            saved: false,
          };
        }

        await transaction.savedExpert.create({
          data: {
            userId,
            expertId,
          },
        });

        return {
          code: "EXPERT_SAVED",
          saved: true,
        };
      },
    );
  } catch (error) {
    mapSaveExpertError(error);
  }
}
