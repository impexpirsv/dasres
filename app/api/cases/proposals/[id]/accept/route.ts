import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;

    const proposal =
      await prisma.caseProposal.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!proposal) {
      return Response.json(
        { message: "Proposal not found" },
        { status: 404 }
      );
    }

    await prisma.caseProposal.updateMany({
      where: {
        caseId: proposal.caseId,
      },
      data: {
        status: "REJECTED",
      },
    });

    await prisma.caseProposal.update({
      where: {
        id: proposal.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    await prisma.tradeCase.update({
  where: {
    id: proposal.caseId,
  },
  data: {
    acceptedProposalId: proposal.id,
    assignedAt: new Date(),
    status: "IN_PROGRESS",
  },
});

    return Response.json({
      message: "Proposal accepted",
    });
  } catch {
    return Response.json(
      { message: "Failed to accept proposal" },
      { status: 500 }
    );
  }
}