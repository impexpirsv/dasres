import { ProjectStatus } from "@prisma/client";
import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const proposalId = Number(id);

    if (Number.isNaN(proposalId)) {
      return Response.json(
        { message: "Invalid proposal id" },
        { status: 400 },
      );
    }

    const proposal = await prisma.caseProposal.findUnique({
      where: {
        id: proposalId,
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
      return Response.json({ message: "Proposal not found" }, { status: 404 });
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: proposal.caseId,
      },
    });

    if (!tradeCase) {
      return Response.json({ message: "Case not found" }, { status: 404 });
    }

    if (user.role !== "admin" && tradeCase.customerId !== user.id) {
      return Response.json(
        { message: "You can only accept proposals for your own case." },
        { status: 403 },
      );
    }

    if (tradeCase.acceptedProposalId) {
      return Response.json(
        { message: "A proposal has already been accepted for this case." },
        { status: 400 },
      );
    }

    if (tradeCase.status !== "OPEN") {
      return Response.json(
        { message: "This case is not open for proposal acceptance." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const rejectedProposals = await tx.caseProposal.findMany({
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

      await tx.caseProposal.updateMany({
        where: {
          caseId: proposal.caseId,
        },
        data: {
          status: "REJECTED",
        },
      });

      await tx.caseProposal.update({
        where: {
          id: proposal.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      await tx.tradeCase.update({
        where: {
          id: proposal.caseId,
        },
        data: {
          acceptedProposalId: proposal.id,
          assignedAt: new Date(),
          status: "IN_PROGRESS",
        },
      });

      await tx.project.upsert({
        where: {
          tradeCaseId: tradeCase.id,
        },
        update: {},
        create: {
          tradeCaseId: tradeCase.id,
          title: tradeCase.title,
          description: tradeCase.description,
          createdBy: tradeCase.customerId,
          assignedTo: proposal.company?.ownerId ?? null,
          status: ProjectStatus.ACTIVE,
          progress: 0,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: proposal.caseId,
          userId: user.id,
          action: "PROPOSAL_ACCEPTED",
          details: `Proposal #${proposal.id} accepted. Company: ${
            proposal.company?.name || "Unknown"
          }`,
        },
      });

      if (proposal.company?.ownerId) {
        await tx.notification.create({
          data: {
            userId: proposal.company.ownerId,
            title: "Proposal Accepted",
            message: "Your proposal has been accepted.",
            type: "PROPOSAL_ACCEPTED",
            link: `/dashboard/cases/${tradeCase.id}`,
          },
        });
      }

      for (const rejectedProposal of rejectedProposals) {
        if (rejectedProposal.company?.ownerId) {
          await tx.notification.create({
            data: {
              userId: rejectedProposal.company.ownerId,
              title: "Proposal Rejected",
              message: "Your proposal was not selected.",
              type: "PROPOSAL_REJECTED",
              link: `/dashboard/cases/${tradeCase.id}`,
            },
          });
        }
      }
    });

    return Response.json({
      message: "Proposal accepted",
    });
  } catch {
    return Response.json(
      { message: "Failed to accept proposal" },
      { status: 500 },
    );
  }
}