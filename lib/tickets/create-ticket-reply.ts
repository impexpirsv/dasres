import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyTicketUpdated } from "../notificationEvents";
import { runInTransaction } from "../transactions";

const MAX_MESSAGE_LENGTH = 10_000;

const REPLYABLE_TICKET_STATUSES =
  new Set([
    "OPEN",
    "IN_PROGRESS",
    "REOPEN",
  ]);

export type CreateTicketReplyInput = {
  message: string;
};

export type CreateTicketReplyResult = {
  message: {
    id: number;
    ticketId: number;
    senderId: number;
    message: string;
    createdAt: Date;
    sender: {
      id: number;
      name: string | null;
      email: string;
      role: string;
    };
  };
  ticket: {
    id: number;
    userId: number;
    subject: string;
    status: string;
  };
  ticketStatus: string;
  receiverIds: number[];
  actorDisplayName: string;
};

export function parseCreateTicketReplyInput(
  value: unknown,
): CreateTicketReplyInput {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  const body = value as Record<
    string,
    unknown
  >;

  if (
    typeof body.message !== "string"
  ) {
    throw new AppError(
      "TICKET_REPLY_MESSAGE_REQUIRED",
      400,
    );
  }

  const message =
    body.message.trim();

  if (!message) {
    throw new AppError(
      "TICKET_REPLY_MESSAGE_REQUIRED",
      400,
    );
  }

  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {
    throw new AppError(
      "TICKET_REPLY_MESSAGE_TOO_LONG",
      400,
    );
  }

  return {
    message,
  };
}

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
    authenticatedUserId ===
    ticketOwnerId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      "TICKET_ACCESS_DENIED",
      403,
    );
  }
}

function ensureTicketIsReplyable(
  status: string,
): void {
  if (
    !REPLYABLE_TICKET_STATUSES.has(
      status,
    )
  ) {
    throw new AppError(
      "TICKET_REPLY_NOT_ALLOWED",
      409,
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

async function sendTicketReplyNotification({
  result,
}: {
  result: CreateTicketReplyResult;
}): Promise<void> {
  if (
    result.receiverIds.length === 0
  ) {
    return;
  }

  try {
    await notifyTicketUpdated({
      userIds: result.receiverIds,
      title: "New ticket reply",
      message:
        `${result.actorDisplayName} replied to ticket: ${result.ticket.subject}`,
      ticketId: result.ticket.id,
    });
  } catch (error) {
    logger.error(
      "Failed to send ticket reply notification.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        ticketId: result.ticket.id,
        ticketMessageId:
          result.message.id,
        receiverIds:
          result.receiverIds,
      },
    );
  }
}

export async function createTicketReply({
  ticketId,
  authenticatedUserId,
  message,
}: {
  ticketId: number;
  authenticatedUserId: number;
  message: string;
}): Promise<CreateTicketReplyResult> {
  const result = await runInTransaction(
    async (transaction) => {
      const authenticatedUser =
        await transaction.user.findUnique({
          where: {
            id: authenticatedUserId,
          },
          select: {
            id: true,
            name: true,
            email: true,
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
            status: true,
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

      ensureTicketIsReplyable(
        ticket.status,
      );

      const isAdmin =
        authenticatedUser.role ===
        "admin";

      let ticketStatus =
        ticket.status;

      if (
        isAdmin &&
        (ticket.status === "OPEN" ||
          ticket.status === "REOPEN")
      ) {
        const statusUpdateResult =
          await transaction.ticket.updateMany({
            where: {
              id: ticket.id,
              status: ticket.status,
            },
            data: {
              status: "IN_PROGRESS",
            },
          });

        if (
          statusUpdateResult.count !== 1
        ) {
          const currentTicket =
            await transaction.ticket.findUnique({
              where: {
                id: ticket.id,
              },
              select: {
                status: true,
              },
            });

          if (!currentTicket) {
            throw new AppError(
              "TICKET_NOT_FOUND",
              404,
            );
          }

          ensureTicketIsReplyable(
            currentTicket.status,
          );

          throw new AppError(
            "TICKET_REPLY_CONFLICT",
            409,
          );
        }

        ticketStatus =
          "IN_PROGRESS";
      } else {
        const currentTicket =
          await transaction.ticket.findUnique({
            where: {
              id: ticket.id,
            },
            select: {
              status: true,
            },
          });

        if (!currentTicket) {
          throw new AppError(
            "TICKET_NOT_FOUND",
            404,
          );
        }

        ensureTicketIsReplyable(
          currentTicket.status,
        );

        ticketStatus =
          currentTicket.status;
      }

      const createdMessage =
        await transaction.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderId:
              authenticatedUser.id,
            message,
          },
          select: {
            id: true,
            ticketId: true,
            senderId: true,
            message: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

      const receiverIds =
        await getNotificationReceiverIds({
          transaction,
          authenticatedUserId:
            authenticatedUser.id,
          authenticatedUserRole:
            authenticatedUser.role,
          ticketOwnerId:
            ticket.userId,
        });

      return {
        message: createdMessage,
        ticket: {
          id: ticket.id,
          userId: ticket.userId,
          subject:
            ticket.subject,
          status:
            ticketStatus,
        },
        ticketStatus,
        receiverIds,
        actorDisplayName:
          authenticatedUser.name?.trim() ||
          authenticatedUser.email,
      } satisfies CreateTicketReplyResult;
    },
  );

  await sendTicketReplyNotification({
    result,
  });

  return result;
}
