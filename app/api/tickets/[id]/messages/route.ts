import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const ticketId = Number(id);

    if (!ticketId || Number.isNaN(ticketId)) {
      return Response.json(
        { message: "Invalid ticket id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const message = String(
      body.message || ""
    ).trim();

    if (!message) {
      return Response.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return Response.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.status !== "OPEN") {
      return Response.json(
        { message: "Closed tickets cannot receive replies." },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "admin";
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return Response.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: user.id,
          message,
        },
      });

      const receiverIds = new Set<number>();

      if (isAdmin) {
        if (ticket.userId !== user.id) {
          receiverIds.add(ticket.userId);
        }
      } else {
        const admins = await tx.user.findMany({
          where: {
            role: "admin",
          },
        });

        admins.forEach((admin) => {
          if (admin.id !== user.id) {
            receiverIds.add(admin.id);
          }
        });
      }

      await Promise.all(
        Array.from(receiverIds).map((receiverId) =>
          tx.notification.create({
            data: {
              userId: receiverId,
              title: "New ticket reply",
              message: `${
                user.name || user.email
              } replied to ticket: ${ticket.subject}`,
              type: "TICKET_REPLY",
              link: `/dashboard/tickets/${ticket.id}`,
            },
          })
        )
      );
    });

    return Response.json({
      message: "Reply added",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to add reply" },
      { status: 500 }
    );
  }
}