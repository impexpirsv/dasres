import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyTicketUpdated } from "../notificationEvents";
import { runInTransaction } from "../transactions";

export type CloseTicketResult = {
  ticket: {
    id: number;
    userId: number;
    subject: string;
    category: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  receiverIds: number[];
  alreadyClosed: boolean;
};

function ensureTicketAccess({
  authenticatedUserId,
  authenticatedUserRole,
  ticketOwnerId,
}: {
  authenticatedUserId: number;
  authenticatedUserRole: string;
  ticketOwnerId: number;
}): void {
  const isAdmin =
    authenticatedUserRole === "admin";

  const isOwner =
    authenticatedUserId === ticketOwnerId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      "TICKET_ACCESS_DENIED",
      403,
    );
  }
}

async function getNotificationReceiverIds({
  transaction,
  authenticatedUserId,
  authenticatedUserRole,
  ticketOwnerId,
}: {
  transaction: Prisma.TransactionClient;
  authenticatedUserId: number;
  authenticatedUserRole: string;
  ticketOwnerId: number;
}): Promise<number[]> {
  const isAdmin =
    authenticatedUserRole === "admin";

  if (isAdmin) {
    return ticketOwnerId ===
      authenticatedUserId
      ? []
      : [ticketOwnerId];
  }

  const admins =
    await transaction.user.findMany({
      where: {
        role: "admin",
        id: {
          not: authenticatedUserId,
        },
      },
      select: {
        id: true,
      },
    });

  return admins.map(
    (admin) => admin.id,
  );
}

async function sendTicketClosedNotification({
  result,
}: {
  result: CloseTicketResult;
}): Promise<void> {
  if (
    result.alreadyClosed ||
    result.receiverIds.length === 0
  ) {
    return;
  }

  try {
    await notifyTicketUpdated({
      userIds: result.receiverIds,
      title: "Ticket Closed",
      message:
        `Ticket closed: ${result.ticket.subject}`,
      ticketId: result.ticket.id,
    });
  } catch (error) {
    logger.error(
      "Failed to send ticket closed notification.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        ticketId: result.ticket.id,
        receiverIds: result.receiverIds,
      },
    );
  }
}

export async function closeTicket({
  ticketId,
  authenticatedUserId,
}: {
  ticketId: number;
  authenticatedUserId: number;
}): Promise<CloseTicketResult> {
  const result = await runInTransaction(
    async (transaction) => {
      const authenticatedUser =
        await transaction.user.findUnique({
          where: {
            id: authenticatedUserId,
          },
          select: {
            id: true,
            role: true,
          },
        });

      if (!authenticatedUser) {
        throw new AppError(
          "AUTHENTICATED_USER_NOT_FOUND",
          401,
        );
      }

      const ticket =
        await transaction.ticket.findUnique({
          where: {
            id: ticketId,
          },
          select: {
            id: true,
            userId: true,
            subject: true,
            category: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      if (!ticket) {
        throw new AppError(
          "TICKET_NOT_FOUND",
          404,
        );
      }

      ensureTicketAccess({
        authenticatedUserId:
          authenticatedUser.id,
        authenticatedUserRole:
          authenticatedUser.role,
        ticketOwnerId:
          ticket.userId,
      });

      if (ticket.status === "CLOSED") {
        return {
          ticket,
          receiverIds: [],
          alreadyClosed: true,
        } satisfies CloseTicketResult;
      }

      const updateResult =
        await transaction.ticket.updateMany({
          where: {
            id: ticket.id,
            status: {
              not: "CLOSED",
            },
          },
          data: {
            status: "CLOSED",
          },
        });

      if (updateResult.count !== 1) {
        const currentTicket =
          await transaction.ticket.findUnique({
            where: {
              id: ticket.id,
            },
            select: {
              id: true,
              userId: true,
              subject: true,
              category: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });

        if (!currentTicket) {
          throw new AppError(
            "TICKET_NOT_FOUND",
            404,
          );
        }

        if (
          currentTicket.status ===
          "CLOSED"
        ) {
          return {
            ticket: currentTicket,
            receiverIds: [],
            alreadyClosed: true,
          } satisfies CloseTicketResult;
        }

        throw new AppError(
          "TICKET_CLOSE_CONFLICT",
          409,
        );
      }

      const updatedTicket =
        await transaction.ticket.findUnique({
          where: {
            id: ticket.id,
          },
          select: {
            id: true,
            userId: true,
            subject: true,
            category: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      if (!updatedTicket) {
        throw new AppError(
          "UPDATED_TICKET_NOT_FOUND",
          409,
        );
      }

      const receiverIds =
        await getNotificationReceiverIds({
          transaction,
          authenticatedUserId:
            authenticatedUser.id,
          authenticatedUserRole:
            authenticatedUser.role,
          ticketOwnerId:
            updatedTicket.userId,
        });

      return {
        ticket: updatedTicket,
        receiverIds,
        alreadyClosed: false,
      } satisfies CloseTicketResult;
    },
  );

  await sendTicketClosedNotification({
    result,
  });

  return result;
}
