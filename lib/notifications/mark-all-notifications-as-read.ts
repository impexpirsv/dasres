import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type MarkAllNotificationsReadResult = {
  code: "NOTIFICATIONS_MARKED_AS_READ";
  updatedCount: number;
};

function isTransactionConflict(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function markAllNotificationsAsRead({
  userId,
}: {
  userId: number;
}): Promise<MarkAllNotificationsReadResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const user =
          await transaction.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              id: true,
            },
          });

        if (!user) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        const result =
          await transaction.notification.updateMany({
            where: {
              userId: user.id,
              isRead: false,
            },
            data: {
              isRead: true,
            },
          });

        return {
          code:
            "NOTIFICATIONS_MARKED_AS_READ",
          updatedCount:
            result.count,
        };
      },
    );
  } catch (error) {
    if (
      isTransactionConflict(error)
    ) {
      throw new AppError(
        "NOTIFICATIONS_READ_ALL_CONFLICT",
        409,
      );
    }

    throw error;
  }
}
