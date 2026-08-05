import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import {
  removeExpertImageFile,
  resolveExpertImageFilePath,
} from "../storage/expert-image-storage";
import { runInTransaction } from "../transactions";

function ensureExpertPermission({
  userId,
  userRole,
  ownerId,
}: {
  userId: number;
  userRole: string;
  ownerId: number | null;
}): void {
  if (
    userRole !== "admin" &&
    ownerId !== userId
  ) {
    throw new AppError(
      "EXPERT_DELETE_FORBIDDEN",
      403,
    );
  }
}

function mapDeleteExpertError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2025") {
      throw new AppError(
        "EXPERT_NOT_FOUND",
        404,
      );
    }

    if (
      error.code === "P2003" ||
      error.code === "P2034"
    ) {
      throw new AppError(
        "EXPERT_DELETE_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function deleteExpert({
  expertId,
  authenticatedUserId,
}: {
  expertId: number;
  authenticatedUserId: number;
}): Promise<void> {
  let imageUrl: string | null;

  try {
    const result =
      await runInTransaction(
        async (transaction) => {
          const currentUser =
            await transaction.user.findUnique({
              where: {
                id:
                  authenticatedUserId,
              },
              select: {
                id: true,
                role: true,
              },
            });

          if (!currentUser) {
            throw new AppError(
              "USER_NOT_FOUND",
              404,
            );
          }

          const expert =
            await transaction.expert.findUnique({
              where: {
                id: expertId,
              },
              select: {
                id: true,
                ownerId: true,
                imageUrl: true,
              },
            });

          if (!expert) {
            throw new AppError(
              "EXPERT_NOT_FOUND",
              404,
            );
          }

          ensureExpertPermission({
            userId:
              currentUser.id,
            userRole:
              currentUser.role,
            ownerId:
              expert.ownerId,
          });

          await transaction.expert.delete({
            where: {
              id: expert.id,
            },
          });

          return {
            imageUrl:
              expert.imageUrl,
          };
        },
      );

    imageUrl = result.imageUrl;
  } catch (error) {
    mapDeleteExpertError(
      error,
    );
  }

  await removeExpertImageFile(
    resolveExpertImageFilePath(
      imageUrl,
    ),
  );
}
