import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type MarkNotificationReadResult = {
  code:
    | "NOTIFICATION_ALREADY_READ"
    | "NOTIFICATION_MARKED_AS_READ";
};

function mapNotificationReadError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2025") {
      throw new AppError(
        "NOTIFICATION_NOT_FOUND",
        404,
      );
    }

    if (error.code === "P2034") {
      throw new AppError(
        "NOTIFICATION_MARK_READ_CONFLICT",
        409,
      );
    }
  }

  throw error;
}

export async function markNotificationAsRead({
  userId,
  notificationId,
}: {
  userId: number;
  notificationId: number;
}): Promise<MarkNotificationReadResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const currentUser =
          await transaction.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              id: true,
            },
          });

        if (!currentUser) {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        const notification =
          await transaction.notification.findUnique({
            where: {
              id: notificationId,
            },
            select: {
              id: true,
              userId: true,
              isRead: true,
            },
          });

        if (!notification) {
          throw new AppError(
            "NOTIFICATION_NOT_FOUND",
            404,
          );
        }

        if (
          notification.userId !==
          currentUser.id
        ) {
          throw new AppError(
            "NOTIFICATION_ACCESS_DENIED",
            403,
          );
        }

        if (notification.isRead) {
          return {
            code:
              "NOTIFICATION_ALREADY_READ",
          };
        }

        const updateResult =
          await transaction.notification.updateMany({
            where: {
              id: notification.id,
              userId: currentUser.id,
              isRead: false,
            },
            data: {
              isRead: true,
            },
          });

        if (updateResult.count !== 1) {
          const currentNotification =
            await transaction.notification.findUnique({
              where: {
                id: notification.id,
              },
              select: {
                userId: true,
                isRead: true,
              },
            });

          if (!currentNotification) {
            throw new AppError(
              "NOTIFICATION_NOT_FOUND",
              404,
            );
          }

          if (
            currentNotification.userId !==
            currentUser.id
          ) {
            throw new AppError(
              "NOTIFICATION_ACCESS_DENIED",
              403,
            );
          }

          if (currentNotification.isRead) {
            return {
              code:
                "NOTIFICATION_ALREADY_READ",
            };
          }

          throw new AppError(
            "NOTIFICATION_MARK_READ_CONFLICT",
            409,
          );
        }

        return {
          code:
            "NOTIFICATION_MARKED_AS_READ",
        };
      },
    );
  } catch (error) {
    mapNotificationReadError(error);
  }
}
