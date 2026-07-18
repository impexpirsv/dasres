import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";
import { notifyProposalRejected } from "../../../../../../lib/notificationEvents";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const proposalId = Number(id);

    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      return Response.json(
        {
          code: "INVALID_PROPOSAL_ID",
        },
        { status: 400 },
      );
    }

    const proposal = await prisma.caseProposal.findUnique({
      where: {
        id: proposalId,
      },
      include: {
        company: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!proposal) {
      return Response.json(
        {
          code: "PROPOSAL_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: proposal.caseId,
      },
      select: {
        id: true,
        customerId: true,
        status: true,
      },
    });

    if (!tradeCase) {
      return Response.json(
        {
          code: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      user.role !== "admin" &&
      tradeCase.customerId !== user.id
    ) {
      return Response.json(
        {
          code: "PROPOSAL_REJECT_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    if (tradeCase.status !== "OPEN") {
      return Response.json(
        {
          code: "CASE_NOT_OPEN_FOR_PROPOSAL_UPDATE",
        },
        { status: 400 },
      );
    }

    if (proposal.status !== "PENDING") {
      return Response.json(
        {
          code: "ONLY_PENDING_PROPOSALS_CAN_BE_REJECTED",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.caseProposal.update({
        where: {
          id: proposalId,
        },
        data: {
          status: "REJECTED",
        },
      }),
      prisma.caseActivity.create({
        data: {
          caseId: proposal.caseId,
          userId: user.id,
          action: "PROPOSAL_REJECTED",
          details: `Proposal #${proposal.id} rejected.`,
        },
      }),
    ]);

    if (proposal.company?.ownerId) {
      await notifyProposalRejected({
        userId: proposal.company.ownerId,
        caseId: tradeCase.id,
      });
    }

    return Response.json({
      code: "PROPOSAL_REJECTED",
    });
  } catch {
    return Response.json(
      {
        code: "PROPOSAL_REJECT_FAILED",
      },
      { status: 500 },
    );
  }
}