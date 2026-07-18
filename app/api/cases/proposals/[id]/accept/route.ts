import { ProjectStatus } from "@prisma/client";
import { prisma } from "../../../../../../lib/prisma";
import { requireUser } from "../../../../../../lib/auth";
import {
  notifyProposalAccepted,
  notifyProposalRejected,
} from "../../../../../../lib/notificationEvents";

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
          include: {
            owner: true,
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
          code: "PROPOSAL_ACCEPT_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    if (tradeCase.acceptedProposalId) {
      return Response.json(
        {
          code: "CASE_ALREADY_HAS_ACCEPTED_PROPOSAL",
        },
        { status: 400 },
      );
    }

    if (tradeCase.status !== "OPEN") {
      return Response.json(
        {
          code: "CASE_NOT_OPEN_FOR_PROPOSAL_ACCEPTANCE",
        },
        { status: 400 },
      );
    }

    const rejectedOwnerIds =
      await prisma.$transaction(async (tx) => {
        const rejectedProposals =
          await tx.caseProposal.findMany({
            where: {
              caseId: proposal.caseId,
              id: {
                not: proposal.id,
              },
            },
            select: {
              company: {
                select: {
                  ownerId: true,
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

        const project = await tx.project.upsert({
          where: {
            tradeCaseId: tradeCase.id,
          },
          update: {},
          create: {
            tradeCaseId: tradeCase.id,
            title: tradeCase.title,
            description: tradeCase.description,
            createdBy: tradeCase.customerId,
            assignedTo:
              proposal.company?.ownerId ?? null,
            status: ProjectStatus.ACTIVE,
            progress: 0,
          },
        });

        const existingTasksCount =
          await tx.projectTask.count({
            where: {
              projectId: project.id,
            },
          });

        if (existingTasksCount === 0) {
          await tx.projectTask.createMany({
            data: [
              {
                projectId: project.id,
                title: "Supplier Confirmation",
                description:
                  "Confirm supplier details, availability and commercial terms.",
                priority: "HIGH",
              },
              {
                projectId: project.id,
                title: "Proforma Invoice Review",
                description:
                  "Review PI details, pricing, payment terms and product specifications.",
                priority: "HIGH",
              },
              {
                projectId: project.id,
                title: "Payment Coordination",
                description:
                  "Coordinate payment method, timing and confirmation documents.",
                priority: "URGENT",
              },
              {
                projectId: project.id,
                title: "Shipping Booking",
                description:
                  "Arrange shipping method, carrier, route and booking confirmation.",
                priority: "HIGH",
              },
              {
                projectId: project.id,
                title: "Inspection Arrangement",
                description:
                  "Coordinate inspection requirements, timing and inspection report.",
                priority: "MEDIUM",
              },
              {
                projectId: project.id,
                title: "Customs Documentation",
                description:
                  "Prepare invoice, packing list, certificates and customs documents.",
                priority: "HIGH",
              },
              {
                projectId: project.id,
                title: "Clearance Follow-up",
                description:
                  "Track customs clearance status and resolve documentation issues.",
                priority: "HIGH",
              },
              {
                projectId: project.id,
                title: "Final Delivery",
                description:
                  "Coordinate final delivery, handover and project completion confirmation.",
                priority: "MEDIUM",
              },
            ],
          });
        }

        await tx.caseActivity.create({
          data: {
            caseId: proposal.caseId,
            userId: user.id,
            action: "PROPOSAL_ACCEPTED",
            details: `Proposal #${proposal.id} accepted. Company: ${
              proposal.company?.name ?? "Unknown"
            }`,
          },
        });

        return [
          ...new Set(
            rejectedProposals
              .map(
                (rejectedProposal) =>
                  rejectedProposal.company?.ownerId,
              )
              .filter(
                (ownerId): ownerId is number =>
                  ownerId !== null &&
                  ownerId !== undefined,
              ),
          ),
        ];
      });

    if (proposal.company?.ownerId) {
      await notifyProposalAccepted({
        userId: proposal.company.ownerId,
        caseId: tradeCase.id,
      });
    }

    for (const ownerId of rejectedOwnerIds) {
      await notifyProposalRejected({
        userId: ownerId,
        caseId: tradeCase.id,
      });
    }

    return Response.json({
      code: "PROPOSAL_ACCEPTED",
    });
  } catch {
    return Response.json(
      {
        code: "PROPOSAL_ACCEPT_FAILED",
      },
      { status: 500 },
    );
  }
}