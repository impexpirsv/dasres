import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return Response.json(
        { message: "Only admins can reopen tickets" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const ticketId = Number(id);

    if (!ticketId || Number.isNaN(ticketId)) {
      return Response.json(
        { message: "Invalid ticket id" },
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

    if (ticket.status === "OPEN") {
      return Response.json(
        { message: "Ticket is already open" },
        { status: 400 }
      );
    }

    await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "OPEN",
      },
    });

    return Response.json({
      message: "Ticket reopened",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to reopen ticket" },
      { status: 500 }
    );
  }
}