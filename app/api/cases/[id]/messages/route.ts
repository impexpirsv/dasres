import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!caseId || Number.isNaN(caseId)) {
      return Response.json({ message: "Invalid case id" }, { status: 400 });
    }

    const body = await request.json();

    const content = String(body.content || "").trim();

    if (!content) {
      return Response.json({ message: "Message is required" }, { status: 400 });
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
      return Response.json({ message: "Case not found" }, { status: 404 });
    }

    if (tradeCase.status === "COMPLETED") {
      return Response.json(
        {
          message: "Completed cases are read-only.",
        },
        { status: 400 },
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const acceptedProviderUserId = acceptedProposal?.company?.ownerId || null;

    const isAcceptedProvider = acceptedProviderUserId === user.id;

    if (!isAdmin && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        {
          message: "You are not allowed to message in this case.",
        },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.caseMessage.create({
        data: {
          caseId,
          senderId: user.id,
          content,
        },
      });

      const receiverIds = new Set<number>();

      if (tradeCase.customerId !== user.id) {
        receiverIds.add(tradeCase.customerId);
      }

      if (acceptedProviderUserId && acceptedProviderUserId !== user.id) {
        receiverIds.add(acceptedProviderUserId);
      }

      await Promise.all(
        Array.from(receiverIds).map((receiverId) =>
          tx.notification.create({
            data: {
              userId: receiverId,
              title: "New case message",
              message: `${user.name || user.email} sent a new message in case: ${tradeCase.title}`,
              type: "CASE_MESSAGE",
              link: `/dashboard/cases/${tradeCase.id}`,
            },
          }),
        ),
      );
    });

    return Response.json({
      message: "Message added",
    });
  } catch (error) {
    console.error(error);

    return Response.json({ message: "Failed to add message" }, { status: 500 });
  }
}
