import {
  CaseStatus,
  ProjectStatus,
  ProposalStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type CompleteCaseResult = {
  tradeCase: {
    id: number;
    title: string;
    description: string;
    status: CaseStatus;
    customerId: number;
    assignedToId: number | null;
    acceptedProposalId: number | null;
    assignedAt: Date | null;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  };
  alreadyCompleted: boolean;
};

function ensureCompletionPermission({
  authenticatedUserId,
  authenticatedUserRole,
  customerId,
  companyOwnerId,
  expertOwnerId,
}: {
  authenticatedUserId: number;
  authenticatedUserRole: string;
  customerId: number;
  companyOwnerId: number | null;
  expertOwnerId: number | null;
}): void {
  const isAdmin =
    authenticatedUserRole === "admin";

  const isCustomer =
    customerId === authenticatedUserId;

  const isAcceptedCompanyOwner =
    companyOwnerId === authenticatedUserId;

  const isAcceptedExpertOwner =
    expertOwnerId === authenticatedUserId;

  if (
    !isAdmin &&
    !isCustomer &&
    !isAcceptedCompanyOwner &&
    !isAcceptedExpertOwner
  ) {
    throw new AppError(
      "CASE_COMPLETION_ACCESS_DENIED",
      403,
    );
  }
}

export async function completeCase({
  caseId,
  authenticatedUserId,
}: {
  caseId: number;
  authenticatedUserId: number;
}): Promise<CompleteCaseResult> {
  return runInTransaction(
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

      const tradeCase =
        await transaction.tradeCase.findUnique({
          where: {
            id: caseId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            customerId: true,
            assignedToId: true,
            acceptedProposalId: true,
            assignedAt: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            steps: {
              select: {
                id: true,
                completed: true,
              },
            },
          },
        });

      if (!tradeCase) {
        throw new AppError(
          "CASE_NOT_FOUND",
          404,
        );
      }

      if (
        tradeCase.status !==
          CaseStatus.IN_PROGRESS &&
        tradeCase.status !==
          CaseStatus.COMPLETED
      ) {
        throw new AppError(
          "ONLY_IN_PROGRESS_CASE_CAN_BE_COMPLETED",
          409,
        );
      }

      if (
        tradeCase.acceptedProposalId === null
      ) {
        throw new AppError(
          tradeCase.status ===
            CaseStatus.COMPLETED
            ? "ACCEPTED_PROPOSAL_NOT_FOUND"
            : "CASE_ACCEPTED_PROPOSAL_REQUIRED",
          409,
        );
      }

      const acceptedProposal =
        await transaction.caseProposal.findFirst({
          where: {
            id:
              tradeCase.acceptedProposalId,
            caseId:
              tradeCase.id,
            status:
              ProposalStatus.ACCEPTED,
          },
          select: {
            id: true,
            companyId: true,
            expertId: true,
            company: {
              select: {
                ownerId: true,
              },
            },
            expert: {
              select: {
                ownerId: true,
              },
            },
          },
        });

      if (!acceptedProposal) {
        throw new AppError(
          "ACCEPTED_PROPOSAL_NOT_FOUND",
          409,
        );
      }

      ensureCompletionPermission({
        authenticatedUserId:
          authenticatedUser.id,
        authenticatedUserRole:
          authenticatedUser.role,
        customerId:
          tradeCase.customerId,
        companyOwnerId:
          acceptedProposal.company.ownerId,
        expertOwnerId:
          acceptedProposal.expert?.ownerId ??
          null,
      });

      if (
        tradeCase.status ===
        CaseStatus.COMPLETED
      ) {
        return {
          tradeCase,
          alreadyCompleted: true,
        };
      }

      const incompleteStep =
        tradeCase.steps.find(
          (step) => !step.completed,
        );

      if (incompleteStep) {
        throw new AppError(
          "ALL_CASE_STEPS_MUST_BE_COMPLETED",
          400,
        );
      }

      const project =
        await transaction.project.findUnique({
          where: {
            tradeCaseId:
              tradeCase.id,
          },
          select: {
            id: true,
            status: true,
            progress: true,
            completedAt: true,
          },
        });

      if (!project) {
        throw new AppError(
          "CASE_PROJECT_NOT_FOUND",
          409,
        );
      }

      const completedAt = new Date();

      const completedCaseResult =
        await transaction.tradeCase.updateMany({
          where: {
            id: tradeCase.id,
            status:
              CaseStatus.IN_PROGRESS,
            acceptedProposalId:
              acceptedProposal.id,
            steps: {
              none: {
                completed: false,
              },
            },
          },
          data: {
            status:
              CaseStatus.COMPLETED,
          },
        });

      if (
        completedCaseResult.count !== 1
      ) {
        throw new AppError(
          "CASE_COMPLETION_CONFLICT",
          409,
        );
      }

      const completedProjectResult =
        await transaction.project.updateMany({
          where: {
            id: project.id,
            tradeCaseId:
              tradeCase.id,
          },
          data: {
            status:
              ProjectStatus.COMPLETED,
            progress: 100,
            completedAt,
          },
        });

      if (
        completedProjectResult.count !== 1
      ) {
        throw new AppError(
          "CASE_PROJECT_COMPLETION_CONFLICT",
          409,
        );
      }

      await transaction.caseActivity.create({
        data: {
          caseId: tradeCase.id,
          userId:
            authenticatedUser.id,
          action: "CASE_COMPLETED",
          details: JSON.stringify({
            caseId: tradeCase.id,
            caseTitle:
              tradeCase.title,
            acceptedProposalId:
              acceptedProposal.id,
            companyId:
              acceptedProposal.companyId,
            expertId:
              acceptedProposal.expertId,
            projectId:
              project.id,
            previousCaseStatus:
              tradeCase.status,
            caseStatus:
              CaseStatus.COMPLETED,
            previousProjectStatus:
              project.status,
            projectStatus:
              ProjectStatus.COMPLETED,
            previousProjectProgress:
              project.progress,
            projectProgress: 100,
            completedById:
              authenticatedUser.id,
            completedAt,
          }),
        },
      });

      const updatedCase =
        await transaction.tradeCase.findUnique({
          where: {
            id: tradeCase.id,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            customerId: true,
            assignedToId: true,
            acceptedProposalId: true,
            assignedAt: true,
            category: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      if (!updatedCase) {
        throw new AppError(
          "COMPLETED_CASE_NOT_FOUND",
          409,
        );
      }

      return {
        tradeCase: updatedCase,
        alreadyCompleted: false,
      };
    },
  );
}
