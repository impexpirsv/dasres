import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!caseId || Number.isNaN(caseId)) {
      return Response.json(
        { message: "Invalid case id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const content = String(body.content || "").trim();

    if (!content) {
      return Response.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      include: {
        proposals: {
          where: {
            status: "ACCEPTED",
          },
          include: {
            company: true,
          },
        },
      },
    });

    if (!tradeCase) {
      return Response.json(
        { message: "Case not found" },
        { status: 404 }
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const isAcceptedProvider =
      acceptedProposal?.company?.ownerId === user.id;

    if (!isAdmin && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        { message: "You are not allowed to message in this case." },
        { status: 403 }
      );
    }

    await prisma.caseMessage.create({
      data: {
        caseId,
        senderId: user.id,
        content,
      },
    });

    return Response.json({
      message: "Message added",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to add message" },
      { status: 500 }
    );
  }
}