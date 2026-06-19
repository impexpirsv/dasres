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

    const isAdmin = user.role === "admin";
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return Response.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        message,
      },
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