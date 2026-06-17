import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;

    const proposal =
      await prisma.caseProposal.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          company: {
            include: {
              owner: true,
            },
          },
        },
      });

    if (!proposal) {
      return Response.json(
        { message: "Proposal not found" },
        { status: 404 }
      );
    }

    const tradeCase =
      await prisma.tradeCase.findUnique({
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
      message: "You can only accept proposals for your own case.",
    },
    { status: 403 }
  );
}

if (tradeCase.acceptedProposalId) {
  return Response.json(
    {
      message:
        "A proposal has already been accepted for this case.",
    },
    { status: 400 }
  );
}

if (tradeCase.status !== "OPEN") {
  return Response.json(
    {
      message: "This case is not open for proposal acceptance.",
    },
    { status: 400 }
  );
}

    const rejectedProposals =
      await prisma.caseProposal.findMany({
        where: {
          caseId: proposal.caseId,
          id: {
            not: proposal.id,
          },
        },
        include: {
          company: {
            include: {
              owner: true,
            },
          },
        },
      });

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

    if (proposal.company?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: proposal.company.ownerId,
          title: "Proposal Accepted",
          message:
            "Your proposal has been accepted.",
          type: "PROPOSAL_ACCEPTED",
          link: `/dashboard/cases/${tradeCase.id}`,
        },
      });
    }

    for (const rejectedProposal of rejectedProposals) {
      if (rejectedProposal.company?.ownerId) {
        await prisma.notification.create({
          data: {
            userId: rejectedProposal.company.ownerId,
            title: "Proposal Rejected",
            message:
              "Your proposal was not selected.",
            type: "PROPOSAL_REJECTED",
            link: `/dashboard/cases/${tradeCase.id}`,
          },
        });
      }
    }

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