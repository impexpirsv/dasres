import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    const subject = String(body.subject || "").trim();
    const category = String(body.category || "GENERAL").trim();
    const message = String(body.message || "").trim();

    if (!subject || !message) {
      return Response.json(
        { message: "Subject and message are required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.$transaction(
  async (tx) => {
    const createdTicket =
      await tx.ticket.create({
        data: {
          userId: user.id,
          subject,
          category,
          messages: {
            create: {
              senderId: user.id,
              message,
            },
          },
        },
      });

    const admins =
      await tx.user.findMany({
        where: {
          role: "admin",
        },
      });

    await Promise.all(
      admins.map((admin) =>
        tx.notification.create({
          data: {
            userId: admin.id,
            title: "New ticket created",
            message: `${
              user.name || user.email
            } created a new ticket: ${subject}`,
            type: "TICKET_CREATED",
            link: `/dashboard/tickets/${createdTicket.id}`,
          },
        })
      )
    );

    return createdTicket;
  }
);

    return Response.json({
      message: "Ticket created.",
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to create ticket." },
      { status: 500 }
    );
  }
}