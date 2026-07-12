import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { notifyTicketUpdated } from "../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const ticketId = Number(id);

    if (!ticketId || Number.isNaN(ticketId)) {
      return Response.json({ message: "Invalid ticket id" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return Response.json({ message: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = user.role === "admin";
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return Response.json({ message: "Access denied" }, { status: 403 });
    }

    if (ticket.status === "CLOSED") {
      return Response.json(
        { message: "Ticket is already closed" },
        { status: 400 },
      );
    }

    await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "CLOSED",
      },
    });
    const receiverIds = new Set<number>();

    if (isAdmin) {
      if (ticket.userId !== user.id) {
        receiverIds.add(ticket.userId);
      }
    } else {
      const admins = await prisma.user.findMany({
        where: {
          role: "admin",
        },
        select: {
          id: true,
        },
      });

      admins.forEach((admin) => {
        if (admin.id !== user.id) {
          receiverIds.add(admin.id);
        }
      });
    }

   await notifyTicketUpdated({
  userIds: Array.from(receiverIds),
  title: "Ticket Closed",
  message: `Ticket closed: ${ticket.subject}`,
  ticketId: ticket.id,
});
    return Response.json({
      message: "Ticket closed",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to close ticket" },
      { status: 500 },
    );
  }
}
