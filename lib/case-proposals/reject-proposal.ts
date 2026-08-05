import {
  CaseStatus,
  ProposalStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyProposalRejected } from "../notificationEvents";
import { runInTransaction } from "../transactions";

export type RejectProposalResult = {
  proposalId: number;
  caseId: number;
  companyOwnerId: number | null;
  alreadyRejected: boolean;
};

function ensureProposalRejectPermission({
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
      "PROPOSAL_REJECT_ACCESS_DENIED",
      403,
    );
  }
}

async function sendRejectionNotification({
  result,
}: {
  result: RejectProposalResult;
}): Promise<void> {
  if (
    result.alreadyRejected ||
    result.companyOwnerId === null
  ) {
    return;
  }

  try {
    await notifyProposalRejected({
      userId: result.companyOwnerId,
      caseId: result.caseId,
    });
  } catch (error) {
    logger.error(
      "Failed to send proposal rejection notification.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        proposalId: result.proposalId,
        caseId: result.caseId,
        userId: result.companyOwnerId,
      },
    );
  }
}

export async function rejectProposal({
  proposalId,
  authenticatedUserId,
}: {
  proposalId: number;
  authenticatedUserId: number;
}): Promise<RejectProposalResult> {
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

      const tradeCase =
        await transaction.tradeCase.findUnique({
          where: {
            id: proposal.caseId,
          },
          select: {
            id: true,
            customerId: true,
            status: true,
            acceptedProposalId: true,
          },
        });

      if (!tradeCase) {
        throw new AppError(
          "CASE_NOT_FOUND",
          404,
        );
      }

      ensureProposalRejectPermission({
        userId: authenticatedUser.id,
        userRole:
          authenticatedUser.role,
        customerId:
          tradeCase.customerId,
      });

      if (
        proposal.status ===
        ProposalStatus.REJECTED
      ) {
        return {
          proposalId: proposal.id,
          caseId: tradeCase.id,
          companyOwnerId:
            proposal.company.ownerId,
          alreadyRejected: true,
        } satisfies RejectProposalResult;
      }

      if (
        proposal.status !==
        ProposalStatus.PENDING
      ) {
        throw new AppError(
          "ONLY_PENDING_PROPOSALS_CAN_BE_REJECTED",
          400,
        );
      }

      if (
        tradeCase.status !==
          CaseStatus.OPEN ||
        tradeCase.acceptedProposalId !==
          null
      ) {
        throw new AppError(
          "CASE_NOT_OPEN_FOR_PROPOSAL_UPDATE",
          409,
        );
      }

      const rejectedProposal =
        await transaction.caseProposal.updateMany({
          where: {
            id: proposal.id,
            caseId: tradeCase.id,
            status:
              ProposalStatus.PENDING,
            tradeCase: {
              status: CaseStatus.OPEN,
              acceptedProposalId: null,
            },
          },
          data: {
            status:
              ProposalStatus.REJECTED,
          },
        });

      if (
        rejectedProposal.count !== 1
      ) {
        throw new AppError(
          "PROPOSAL_REJECTION_CONFLICT",
          409,
        );
      }

      const rejectedAt = new Date();

      await transaction.caseActivity.create({
        data: {
          caseId: tradeCase.id,
          userId:
            authenticatedUser.id,
          action:
            "PROPOSAL_REJECTED",
          details: JSON.stringify({
            proposalId: proposal.id,
            caseId: tradeCase.id,
            companyId:
              proposal.company.id,
            companyName:
              proposal.company.name,
            companyOwnerId:
              proposal.company.ownerId,
            previousProposalStatus:
              proposal.status,
            proposalStatus:
              ProposalStatus.REJECTED,
            caseStatus:
              tradeCase.status,
            rejectedById:
              authenticatedUser.id,
            rejectedAt,
          }),
        },
      });

      return {
        proposalId: proposal.id,
        caseId: tradeCase.id,
        companyOwnerId:
          proposal.company.ownerId,
        alreadyRejected: false,
      } satisfies RejectProposalResult;
    },
  );

  await sendRejectionNotification({
    result,
  });

  return result;
}
