import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyTicketUpdated } from "../../../../../lib/notificationEvents";

const MAX_MESSAGE_LENGTH = 10_000;

const REPLYABLE_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "REOPEN",
];

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const ticketId = parseId(
      id,
      "ticket id",
    );

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "INVALID_JSON_BODY",
        400,
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
      );
    }

    const payload = body as Record<
      string,
      unknown
    >;

    const message = String(
      payload.message ?? "",
    ).trim();

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

    const ticket =
      await prisma.ticket.findUnique({
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

    const isAdmin =
      user.role === "admin";

    const isOwner =
      ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      throw new AppError(
        "TICKET_ACCESS_DENIED",
        403,
      );
    }

    if (
      !REPLYABLE_TICKET_STATUSES.includes(
        ticket.status,
      )
    ) {
      throw new AppError(
        "TICKET_REPLY_NOT_ALLOWED",
        400,
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const createdMessage =
            await transaction.ticketMessage.create(
              {
                data: {
                  ticketId: ticket.id,
                  senderId: user.id,
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
              },
            );

          let updatedStatus =
            ticket.status;

          if (
            isAdmin &&
            (ticket.status === "OPEN" ||
              ticket.status === "REOPEN")
          ) {
            const updatedTicket =
              await transaction.ticket.update({
                where: {
                  id: ticket.id,
                },
                data: {
                  status: "IN_PROGRESS",
                },
                select: {
                  status: true,
                },
              });

            updatedStatus =
              updatedTicket.status;
          }

          let receiverIds: number[] = [];

          if (isAdmin) {
            if (
              ticket.userId !== user.id
            ) {
              receiverIds = [
                ticket.userId,
              ];
            }
          } else {
            const admins =
              await transaction.user.findMany({
                where: {
                  role: "admin",
                  id: {
                    not: user.id,
                  },
                },
                select: {
                  id: true,
                },
              });

            receiverIds = admins.map(
              (admin) => admin.id,
            );
          }

          return {
            message: createdMessage,
            ticketStatus: updatedStatus,
            receiverIds,
          };
        },
      );

    if (result.receiverIds.length > 0) {
      try {
        await notifyTicketUpdated({
          userIds: result.receiverIds,
          title: "New ticket reply",
          message: `${
            user.name || user.email
          } replied to ticket: ${
            ticket.subject
          }`,
          ticketId: ticket.id,
        });
      } catch (notificationError) {
        console.error(
          "TICKET_REPLY_NOTIFICATION_ERROR",
          {
            ticketId: ticket.id,
            ticketMessageId:
              result.message.id,
            receiverIds:
              result.receiverIds,
            error: notificationError,
          },
        );
      }
    }

    return Response.json(
      {
        code: "TICKET_REPLY_CREATED",
        message: result.message,
        ticketStatus:
          result.ticketStatus,
      },
      {
        status: 201,
      },
    );
  });
}