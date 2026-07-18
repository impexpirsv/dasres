import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { notifyTicketUpdated } from "../../../../../lib/notificationEvents";

export async function PATCH(
  _request: Request,
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

    if (ticket.status === "CLOSED") {
      return Response.json({
        code: "TICKET_ALREADY_CLOSED",
        ticket: {
          id: ticket.id,
          status: ticket.status,
        },
      });
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const updatedTicket =
            await transaction.ticket.update({
              where: {
                id: ticket.id,
              },
              data: {
                status: "CLOSED",
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
            updatedTicket,
            receiverIds,
          };
        },
      );

    if (result.receiverIds.length > 0) {
      try {
        await notifyTicketUpdated({
          userIds: result.receiverIds,
          title: "Ticket Closed",
          message: `Ticket closed: ${ticket.subject}`,
          ticketId: ticket.id,
        });
      } catch (notificationError) {
        console.error(
          "TICKET_CLOSED_NOTIFICATION_ERROR",
          {
            ticketId: ticket.id,
            receiverIds:
              result.receiverIds,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "TICKET_CLOSED",
      ticket: result.updatedTicket,
    });
  });
}