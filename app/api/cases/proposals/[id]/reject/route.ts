import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const proposalId = Number(id);

    if (Number.isNaN(proposalId)) {
      return Response.json(
        { message: "Invalid proposal id" },
        { status: 400 }
      );
    }

    const proposal = await prisma.caseProposal.findUnique({
      where: {
        id: proposalId,
      },
    });

    if (!proposal) {
      return Response.json(
        { message: "Proposal not found" },
        { status: 404 }
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: proposal.caseId,
      },
    });

    if (!tradeCase) {
      return Response.json(
        { message: "Case not found" },
        { status: 404 }
      );
    }

    if (
      user.role !== "admin" &&
      tradeCase.customerId !== user.id
    ) {
      return Response.json(
        {
          message:
            "You can only reject proposals for your own case.",
        },
        { status: 403 }
      );
    }

    if (tradeCase.status !== "OPEN") {
      return Response.json(
        {
          message:
            "This case is not open for proposal updates.",
        },
        { status: 400 }
      );
    }

    if (proposal.status !== "PENDING") {
      return Response.json(
        {
          message:
            "Only pending proposals can be rejected.",
        },
        { status: 400 }
      );
    }

    await prisma.caseProposal.update({
      where: {
        id: proposalId,
      },
      data: {
        status: "REJECTED",
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: proposal.caseId,
        userId: user.id,
        action: "PROPOSAL_REJECTED",
        details: `Proposal #${proposal.id} rejected.`,
      },
    });

    return Response.json({
      message: "Proposal rejected",
    });
  } catch {
    return Response.json(
      { message: "Failed to reject proposal" },
      { status: 500 }
    );
  }
}