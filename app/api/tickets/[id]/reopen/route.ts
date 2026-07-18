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

    if (user.role !== "admin") {
      throw new AppError(
        "TICKET_REOPEN_ADMIN_REQUIRED",
        403,
      );
    }

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

    if (
      ticket.status === "OPEN" ||
      ticket.status === "REOPEN"
    ) {
      return Response.json({
        code: "TICKET_ALREADY_REOPENED",
        ticket: {
          id: ticket.id,
          status: ticket.status,
        },
      });
    }

    const updatedTicket =
      await prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          status: "REOPEN",
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

    if (ticket.userId !== user.id) {
      try {
        await notifyTicketUpdated({
          userIds: [ticket.userId],
          title: "Ticket Reopened",
          message: `Ticket reopened: ${ticket.subject}`,
          ticketId: ticket.id,
        });
      } catch (notificationError) {
        console.error(
          "TICKET_REOPENED_NOTIFICATION_ERROR",
          {
            ticketId: ticket.id,
            receiverId: ticket.userId,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "TICKET_REOPENED",
      ticket: updatedTicket,
    });
  });
}