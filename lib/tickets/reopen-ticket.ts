import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyTicketUpdated } from "../notificationEvents";
import { runInTransaction } from "../transactions";

export type ReopenTicketResult = {
  ticket: {
    id: number;
    userId: number;
    subject: string;
    category: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  alreadyReopened: boolean;
  notificationUserId: number | null;
};

async function sendTicketReopenedNotification({
  result,
}: {
  result: ReopenTicketResult;
}): Promise<void> {
  if (
    result.alreadyReopened ||
    result.notificationUserId === null
  ) {
    return;
  }

  try {
    await notifyTicketUpdated({
      userIds: [
        result.notificationUserId,
      ],
      title: "Ticket Reopened",
      message:
        `Ticket reopened: ${result.ticket.subject}`,
      ticketId: result.ticket.id,
    });
  } catch (error) {
    logger.error(
      "Failed to send ticket reopened notification.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        ticketId: result.ticket.id,
        receiverId:
          result.notificationUserId,
      },
    );
  }
}

export async function reopenTicket({
  ticketId,
  authenticatedUserId,
}: {
  ticketId: number;
  authenticatedUserId: number;
}): Promise<ReopenTicketResult> {
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

      if (
        authenticatedUser.role !== "admin"
      ) {
        throw new AppError(
          "TICKET_REOPEN_ADMIN_REQUIRED",
          403,
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

      if (
        ticket.status === "OPEN" ||
        ticket.status === "REOPEN"
      ) {
        return {
          ticket,
          alreadyReopened: true,
          notificationUserId: null,
        } satisfies ReopenTicketResult;
      }

      if (ticket.status !== "CLOSED") {
        throw new AppError(
          "TICKET_REOPEN_NOT_ALLOWED",
          409,
        );
      }

      const updateResult =
        await transaction.ticket.updateMany({
          where: {
            id: ticket.id,
            status: "CLOSED",
          },
          data: {
            status: "REOPEN",
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
          currentTicket.status === "OPEN" ||
          currentTicket.status === "REOPEN"
        ) {
          return {
            ticket: currentTicket,
            alreadyReopened: true,
            notificationUserId: null,
          } satisfies ReopenTicketResult;
        }

        throw new AppError(
          "TICKET_REOPEN_CONFLICT",
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

      return {
        ticket: updatedTicket,
        alreadyReopened: false,
        notificationUserId:
          updatedTicket.userId ===
          authenticatedUser.id
            ? null
            : updatedTicket.userId,
      } satisfies ReopenTicketResult;
    },
  );

  await sendTicketReopenedNotification({
    result,
  });

  return result;
}
