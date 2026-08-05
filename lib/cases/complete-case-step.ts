import {
  CaseStatus,
  Prisma,
  ProposalStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { runInTransaction } from "../transactions";

export type CompleteCaseStepResult = {
  step: {
    id: number;
    caseId: number;
    title: string;
    completed: boolean;
    completedAt: Date | null;
  };
  alreadyCompleted: boolean;
};

export function parseCaseStepId(
  value: string,
): number {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new AppError(
      "INVALID_CASE_STEP_ID",
      400,
    );
  }

  return parsedValue;
}

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
    authenticatedUserId === customerId;

  const isAcceptedCompanyOwner =
    authenticatedUserId === companyOwnerId;

  const isAcceptedExpertOwner =
    authenticatedUserId === expertOwnerId;

  if (
    !isAdmin &&
    !isCustomer &&
    !isAcceptedCompanyOwner &&
    !isAcceptedExpertOwner
  ) {
    throw new AppError(
      "CASE_STEP_COMPLETION_ACCESS_DENIED",
      403,
    );
  }
}

function mapCompleteCaseStepError(
  error: unknown,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "CASE_STEP_COMPLETION_CONFLICT",
      409,
    );
  }

  throw error;
}

export async function completeCaseStep({
  stepId,
  authenticatedUserId,
}: {
  stepId: number;
  authenticatedUserId: number;
}): Promise<CompleteCaseStepResult> {
  try {
    return await runInTransaction(
      async (transaction) => {
        const authenticatedUser =
          await transaction.user.findUnique({
            where: {
              id:
                authenticatedUserId,
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

        const step =
          await transaction.caseStep.findUnique({
            where: {
              id: stepId,
            },
            select: {
              id: true,
              caseId: true,
              title: true,
              completed: true,
              completedAt: true,
              tradeCase: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  customerId: true,
                  acceptedProposalId: true,
                },
              },
            },
          });

        if (!step) {
          throw new AppError(
            "CASE_STEP_NOT_FOUND",
            404,
          );
        }

        const tradeCase =
          step.tradeCase;

        if (
          tradeCase.acceptedProposalId ===
          null
        ) {
          throw new AppError(
            "CASE_ACCEPTED_PROPOSAL_REQUIRED",
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

        if (step.completed) {
          return {
            step: {
              id: step.id,
              caseId:
                step.caseId,
              title:
                step.title,
              completed: true,
              completedAt:
                step.completedAt,
            },
            alreadyCompleted: true,
          };
        }

        if (
          tradeCase.status !==
          CaseStatus.IN_PROGRESS
        ) {
          throw new AppError(
            "CASE_STEP_REQUIRES_IN_PROGRESS_CASE",
            409,
          );
        }

        const completedAt =
          new Date();

        const updateResult =
          await transaction.caseStep.updateMany({
            where: {
              id: step.id,
              caseId:
                tradeCase.id,
              completed: false,
              tradeCase: {
                status:
                  CaseStatus.IN_PROGRESS,
                acceptedProposalId:
                  acceptedProposal.id,
              },
            },
            data: {
              completed: true,
              completedAt,
            },
          });

        if (updateResult.count !== 1) {
          const currentStep =
            await transaction.caseStep.findUnique({
              where: {
                id: step.id,
              },
              select: {
                id: true,
                caseId: true,
                title: true,
                completed: true,
                completedAt: true,
              },
            });

          if (
            currentStep?.completed
          ) {
            return {
              step:
                currentStep,
              alreadyCompleted: true,
            };
          }

          throw new AppError(
            "CASE_STEP_COMPLETION_CONFLICT",
            409,
          );
        }

        await transaction.caseActivity.create({
          data: {
            caseId:
              tradeCase.id,
            userId:
              authenticatedUser.id,
            action:
              "CASE_STEP_COMPLETED",
            details:
              JSON.stringify({
                caseId:
                  tradeCase.id,
                caseTitle:
                  tradeCase.title,
                stepId:
                  step.id,
                stepTitle:
                  step.title,
                acceptedProposalId:
                  acceptedProposal.id,
                companyId:
                  acceptedProposal.companyId,
                expertId:
                  acceptedProposal.expertId,
                previousCompleted:
                  step.completed,
                completed: true,
                completedById:
                  authenticatedUser.id,
                completedAt,
              }),
          },
        });

        const completedStep =
          await transaction.caseStep.findUnique({
            where: {
              id: step.id,
            },
            select: {
              id: true,
              caseId: true,
              title: true,
              completed: true,
              completedAt: true,
            },
          });

        if (!completedStep) {
          throw new AppError(
            "COMPLETED_CASE_STEP_NOT_FOUND",
            409,
          );
        }

        return {
          step: completedStep,
          alreadyCompleted: false,
        };
      },
    );
  } catch (error) {
    mapCompleteCaseStepError(
      error,
    );
  }
}
