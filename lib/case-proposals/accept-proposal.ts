import {
  CaseStatus,
  ProjectStatus,
  ProposalStatus,
  TaskPriority,
} from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import {
  notifyProposalAccepted,
  notifyProposalRejected,
} from "../notificationEvents";
import { runInTransaction } from "../transactions";

const DEFAULT_PROJECT_TASKS = [
  {
    title: "Supplier Confirmation",
    description:
      "Confirm supplier details, availability and commercial terms.",
    priority: TaskPriority.HIGH,
    sortOrder: 0,
  },
  {
    title: "Proforma Invoice Review",
    description:
      "Review PI details, pricing, payment terms and product specifications.",
    priority: TaskPriority.HIGH,
    sortOrder: 1,
  },
  {
    title: "Payment Coordination",
    description:
      "Coordinate payment method, timing and confirmation documents.",
    priority: TaskPriority.URGENT,
    sortOrder: 2,
  },
  {
    title: "Shipping Booking",
    description:
      "Arrange shipping method, carrier, route and booking confirmation.",
    priority: TaskPriority.HIGH,
    sortOrder: 3,
  },
  {
    title: "Inspection Arrangement",
    description:
      "Coordinate inspection requirements, timing and inspection report.",
    priority: TaskPriority.MEDIUM,
    sortOrder: 4,
  },
  {
    title: "Customs Documentation",
    description:
      "Prepare invoice, packing list, certificates and customs documents.",
    priority: TaskPriority.HIGH,
    sortOrder: 5,
  },
  {
    title: "Clearance Follow-up",
    description:
      "Track customs clearance status and resolve documentation issues.",
    priority: TaskPriority.HIGH,
    sortOrder: 6,
  },
  {
    title: "Final Delivery",
    description:
      "Coordinate final delivery, handover and project completion confirmation.",
    priority: TaskPriority.MEDIUM,
    sortOrder: 7,
  },
] satisfies Array<{
  title: string;
  description: string;
  priority: TaskPriority;
  sortOrder: number;
}>;

export type AcceptProposalResult = {
  caseId: number;
  proposalId: number;
  acceptedCompanyOwnerId: number;
  rejectedOwnerIds: number[];
};

function ensureProposalAcceptancePermission({
  userId,
  userRole,
  customerId,
}: {
  userId: number;
  userRole: string;
  customerId: number;
}): void {
  const isAdmin = userRole === "admin";
  const isCaseCustomer =
    customerId === userId;

  if (!isAdmin && !isCaseCustomer) {
    throw new AppError(
      "PROPOSAL_ACCEPT_ACCESS_DENIED",
      403,
    );
  }
}

function getUniqueRejectedOwnerIds(
  proposals: Array<{
    company: {
      ownerId: number | null;
    };
  }>,
  acceptedOwnerId: number,
): number[] {
  const ownerIds = new Set<number>();

  for (const proposal of proposals) {
    const ownerId =
      proposal.company.ownerId;

    if (
      ownerId !== null &&
      ownerId !== acceptedOwnerId
    ) {
      ownerIds.add(ownerId);
    }
  }

  return Array.from(ownerIds);
}

async function sendProposalNotifications({
  result,
}: {
  result: AcceptProposalResult;
}): Promise<void> {
  const notifications: Array<{
    type: "accepted" | "rejected";
    userId: number;
    promise: Promise<unknown>;
  }> = [
    {
      type: "accepted",
      userId:
        result.acceptedCompanyOwnerId,
      promise: notifyProposalAccepted({
        userId:
          result.acceptedCompanyOwnerId,
        caseId: result.caseId,
      }),
    },
  ];

  for (
    const ownerId of result.rejectedOwnerIds
  ) {
    notifications.push({
      type: "rejected",
      userId: ownerId,
      promise: notifyProposalRejected({
        userId: ownerId,
        caseId: result.caseId,
      }),
    });
  }

  const settledResults =
    await Promise.allSettled(
      notifications.map(
        (notification) =>
          notification.promise,
      ),
    );

  settledResults.forEach(
    (notificationResult, index) => {
      if (
        notificationResult.status ===
        "rejected"
      ) {
        const notification =
          notifications[index];

        logger.error(
          "Failed to send proposal acceptance notification.",
          {
            error:
              notificationResult.reason instanceof
              Error
                ? notificationResult.reason
                : String(
                    notificationResult.reason,
                  ),
            caseId: result.caseId,
            proposalId:
              result.proposalId,
            notificationType:
              notification.type,
            userId:
              notification.userId,
          },
        );
      }
    },
  );
}

export async function acceptProposal({
  proposalId,
  authenticatedUserId,
}: {
  proposalId: number;
  authenticatedUserId: number;
}): Promise<AcceptProposalResult> {
  const result = await runInTransaction(
    async (transaction) => {
      const authenticatedUser =
        await transaction.user.findUnique({
          where: {
            id: authenticatedUserId,
          },
          select: {
            id: true,
            role: true,
          },
        });

      if (!authenticatedUser) {
        throw new AppError(
          "AUTHENTICATED_USER_NOT_FOUND",
          401,
        );
      }

      const proposal =
        await transaction.caseProposal.findUnique({
          where: {
            id: proposalId,
          },
          select: {
            id: true,
            caseId: true,
            status: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
        });

      if (!proposal) {
        throw new AppError(
          "PROPOSAL_NOT_FOUND",
          404,
        );
      }

      if (
        proposal.status !==
        ProposalStatus.PENDING
      ) {
        throw new AppError(
          "PROPOSAL_NOT_PENDING",
          400,
        );
      }

      const tradeCase =
        await transaction.tradeCase.findUnique({
          where: {
            id: proposal.caseId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            customerId: true,
            assignedToId: true,
            acceptedProposalId: true,
          },
        });

      if (!tradeCase) {
        throw new AppError(
          "CASE_NOT_FOUND",
          404,
        );
      }

      ensureProposalAcceptancePermission({
        userId: authenticatedUser.id,
        userRole:
          authenticatedUser.role,
        customerId:
          tradeCase.customerId,
      });

      if (
        tradeCase.acceptedProposalId !==
        null
      ) {
        throw new AppError(
          "CASE_ALREADY_HAS_ACCEPTED_PROPOSAL",
          409,
        );
      }

      if (
        tradeCase.status !==
        CaseStatus.OPEN
      ) {
        throw new AppError(
          "CASE_NOT_OPEN_FOR_PROPOSAL_ACCEPTANCE",
          400,
        );
      }

      const companyOwnerId =
        proposal.company.ownerId;

      if (companyOwnerId === null) {
        throw new AppError(
          "PROPOSAL_COMPANY_OWNER_REQUIRED",
          409,
        );
      }

      const pendingRejectedProposals =
        await transaction.caseProposal.findMany({
          where: {
            caseId: tradeCase.id,
            id: {
              not: proposal.id,
            },
            status:
              ProposalStatus.PENDING,
          },
          select: {
            id: true,
            company: {
              select: {
                ownerId: true,
              },
            },
          },
        });

      const claimedCase =
        await transaction.tradeCase.updateMany({
          where: {
            id: tradeCase.id,
            status: CaseStatus.OPEN,
            acceptedProposalId: null,
          },
          data: {
            acceptedProposalId:
              proposal.id,
            assignedToId:
              companyOwnerId,
            assignedAt: new Date(),
            status:
              CaseStatus.IN_PROGRESS,
          },
        });

      if (claimedCase.count !== 1) {
        throw new AppError(
          "CASE_ALREADY_HAS_ACCEPTED_PROPOSAL",
          409,
        );
      }

      const acceptedProposal =
        await transaction.caseProposal.updateMany({
          where: {
            id: proposal.id,
            caseId: tradeCase.id,
            status:
              ProposalStatus.PENDING,
          },
          data: {
            status:
              ProposalStatus.ACCEPTED,
          },
        });

      if (
        acceptedProposal.count !== 1
      ) {
        throw new AppError(
          "CASE_ACCEPTANCE_CONFLICT",
          409,
        );
      }

      await transaction.caseProposal.updateMany({
        where: {
          caseId: tradeCase.id,
          id: {
            not: proposal.id,
          },
          status:
            ProposalStatus.PENDING,
        },
        data: {
          status:
            ProposalStatus.REJECTED,
        },
      });

      const project =
        await transaction.project.upsert({
          where: {
            tradeCaseId:
              tradeCase.id,
          },
          update: {
            title: tradeCase.title,
            description:
              tradeCase.description,
            createdBy:
              tradeCase.customerId,
            assignedTo:
              companyOwnerId,
            status:
              ProjectStatus.ACTIVE,
            progress: 0,
            completedAt: null,
          },
          create: {
            tradeCaseId:
              tradeCase.id,
            title: tradeCase.title,
            description:
              tradeCase.description,
            createdBy:
              tradeCase.customerId,
            assignedTo:
              companyOwnerId,
            status:
              ProjectStatus.ACTIVE,
            progress: 0,
          },
          select: {
            id: true,
          },
        });

      const existingTasksCount =
        await transaction.projectTask.count({
          where: {
            projectId: project.id,
          },
        });

      if (existingTasksCount === 0) {
        await transaction.projectTask.createMany({
          data:
            DEFAULT_PROJECT_TASKS.map(
              (task) => ({
                projectId: project.id,
                title: task.title,
                description:
                  task.description,
                priority:
                  task.priority,
                sortOrder:
                  task.sortOrder,
              }),
            ),
        });
      }

      const rejectedOwnerIds =
        getUniqueRejectedOwnerIds(
          pendingRejectedProposals,
          companyOwnerId,
        );

      const acceptedAt = new Date();

      await transaction.caseActivity.create({
        data: {
          caseId: tradeCase.id,
          userId:
            authenticatedUser.id,
          action:
            "PROPOSAL_ACCEPTED",
          details: JSON.stringify({
            proposalId:
              proposal.id,
            caseId:
              tradeCase.id,
            companyId:
              proposal.company.id,
            companyName:
              proposal.company.name,
            companyOwnerId,
            projectId:
              project.id,
            previousCaseStatus:
              tradeCase.status,
            caseStatus:
              CaseStatus.IN_PROGRESS,
            rejectedProposalIds:
              pendingRejectedProposals.map(
                (
                  rejectedProposal,
                ) =>
                  rejectedProposal.id,
              ),
            acceptedById:
              authenticatedUser.id,
            acceptedAt,
          }),
        },
      });

      return {
        caseId: tradeCase.id,
        proposalId:
          proposal.id,
        acceptedCompanyOwnerId:
          companyOwnerId,
        rejectedOwnerIds,
      } satisfies AcceptProposalResult;
    },
  );

  await sendProposalNotifications({
    result,
  });

  return result;
}
