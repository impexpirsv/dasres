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

    const ticket = await prisma.ticket.create({
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