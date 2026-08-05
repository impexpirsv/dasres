import {
  CaseStatus,
  Prisma,
  ProposalStatus,
} from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { notifyProposalSubmitted } from "../notificationEvents";
import { getProposalLimit } from "../plans";
import { runInTransaction } from "../transactions";

const MAX_MESSAGE_LENGTH = 5_000;
const MAX_PRICE_LENGTH = 100;

const CREATED_PROPOSAL_SELECT = {
  id: true,
  caseId: true,
  companyId: true,
  expertId: true,
  message: true,
  price: true,
  status: true,
  createdAt: true,
} satisfies Prisma.CaseProposalSelect;

export type CreatedProposal =
  Prisma.CaseProposalGetPayload<{
    select:
      typeof CREATED_PROPOSAL_SELECT;
  }>;

export type CreateProposalInput = {
  message: string;
  price: string | null;
  companyId: number;
  expertId: number | null;
};

export type CreateProposalResult = {
  proposal: CreatedProposal;
  proposalLimit: number;
  proposalCount: number;
};

type CreateProposalTransactionResult =
  CreateProposalResult & {
    caseCustomerId: number;
  };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseOptionalPositiveInteger(
  value: unknown,
  errorCode: string,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  return parsedValue;
}

function parseRequiredPositiveInteger(
  value: unknown,
  errorCode: string,
): number {
  const parsedValue =
    parseOptionalPositiveInteger(
      value,
      errorCode,
    );

  if (parsedValue === null) {
    throw new AppError(
      errorCode,
      400,
    );
  }

  return parsedValue;
}

export function parseCreateProposalInput(
  body: unknown,
): CreateProposalInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  if (typeof body.message !== "string") {
    throw new AppError(
      "PROPOSAL_MESSAGE_REQUIRED",
      400,
    );
  }

  const message = body.message.trim();

  if (!message) {
    throw new AppError(
      "PROPOSAL_MESSAGE_REQUIRED",
      400,
    );
  }

  if (
    message.length > MAX_MESSAGE_LENGTH
  ) {
    throw new AppError(
      "PROPOSAL_MESSAGE_TOO_LONG",
      400,
    );
  }

  let price: string | null = null;

  if (
    body.price !== undefined &&
    body.price !== null
  ) {
    if (typeof body.price !== "string") {
      throw new AppError(
        "INVALID_PROPOSAL_PRICE",
        400,
      );
    }

    const normalizedPrice =
      body.price.trim();

    if (
      normalizedPrice.length >
      MAX_PRICE_LENGTH
    ) {
      throw new AppError(
        "PROPOSAL_PRICE_TOO_LONG",
        400,
      );
    }

    price =
      normalizedPrice.length > 0
        ? normalizedPrice
        : null;
  }

  const companyId =
    parseRequiredPositiveInteger(
      body.companyId,
      "INVALID_COMPANY_ID",
    );

  const expertId =
    parseOptionalPositiveInteger(
      body.expertId,
      "INVALID_EXPERT_ID",
    );

  return {
    message,
    price,
    companyId,
    expertId,
  };
}

export async function createProposal({
  caseId,
  authenticatedUserId,
  input,
}: {
  caseId: number;
  authenticatedUserId: number;
  input: CreateProposalInput;
}): Promise<CreateProposalResult> {
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
            planType: true,
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
            customerId: true,
            category: true,
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

      const isAdmin =
        authenticatedUser.role === "admin";

      if (
        !isAdmin &&
        tradeCase.customerId ===
          authenticatedUser.id
      ) {
        throw new AppError(
          "OWN_CASE_PROPOSAL_NOT_ALLOWED",
          403,
        );
      }

      if (
        tradeCase.status !== CaseStatus.OPEN ||
        tradeCase.acceptedProposalId !== null
      ) {
        throw new AppError(
          "CASE_NOT_ACCEPTING_PROPOSALS",
          409,
        );
      }

      const company =
        await transaction.company.findFirst({
          where: {
            id: input.companyId,
            category: tradeCase.category,
            ...(isAdmin
              ? {}
              : {
                  ownerId:
                    authenticatedUser.id,
                }),
          },
          select: {
            id: true,
            name: true,
            ownerId: true,
            category: true,
            verificationStatus: true,
          },
        });

      if (!company) {
        throw new AppError(
          "INVALID_PROPOSAL_COMPANY",
          403,
        );
      }

      const expert =
        input.expertId === null
          ? null
          : await transaction.expert.findFirst({
              where: {
                id: input.expertId,
                specialty:
                  tradeCase.category,
                ...(isAdmin
                  ? {}
                  : {
                      ownerId:
                        authenticatedUser.id,
                    }),
              },
              select: {
                id: true,
                name: true,
                ownerId: true,
                specialty: true,
                verificationStatus: true,
              },
            });

      if (
        input.expertId !== null &&
        !expert
      ) {
        throw new AppError(
          "INVALID_PROPOSAL_EXPERT",
          403,
        );
      }

      const existingActiveProposal =
        await transaction.caseProposal.findFirst({
          where: {
            caseId: tradeCase.id,
            companyId: company.id,
            status: {
              in: [
                ProposalStatus.PENDING,
                ProposalStatus.ACCEPTED,
              ],
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

      if (existingActiveProposal) {
        throw new AppError(
          "COMPANY_ACTIVE_PROPOSAL_ALREADY_EXISTS",
          409,
        );
      }

      const proposalLimit =
        getProposalLimit(
          authenticatedUser.planType,
        );

      const proposalCount =
        await transaction.caseProposal.count({
          where: {
            OR: [
              {
                company: {
                  ownerId:
                    authenticatedUser.id,
                },
              },
              {
                expert: {
                  ownerId:
                    authenticatedUser.id,
                },
              },
            ],
          },
        });

      if (
        proposalCount >= proposalLimit
      ) {
        throw new AppError(
          "PROPOSAL_PLAN_LIMIT_REACHED",
          403,
        );
      }

      const proposal =
        await transaction.caseProposal.create({
          data: {
            caseId: tradeCase.id,
            companyId: company.id,
            expertId: expert?.id ?? null,
            message: input.message,
            price: input.price,
            status:
              ProposalStatus.PENDING,
          },
          select:
            CREATED_PROPOSAL_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId: tradeCase.id,
          userId:
            authenticatedUser.id,
          action:
            "PROPOSAL_SUBMITTED",
          details: JSON.stringify({
            caseId:
              tradeCase.id,
            caseTitle:
              tradeCase.title,
            proposalId:
              proposal.id,
            companyId:
              company.id,
            companyName:
              company.name,
            companyOwnerId:
              company.ownerId,
            expertId:
              expert?.id ?? null,
            expertName:
              expert?.name ?? null,
            expertOwnerId:
              expert?.ownerId ?? null,
            price:
              proposal.price,
            status:
              proposal.status,
            submittedById:
              authenticatedUser.id,
            submittedByRole:
              authenticatedUser.role,
            submittedAt:
              proposal.createdAt,
          }),
        },
      });

      return {
        proposal,
        proposalLimit,
        proposalCount:
          proposalCount + 1,
        caseCustomerId:
          tradeCase.customerId,
      } satisfies CreateProposalTransactionResult;
    },
  );

  try {
    await notifyProposalSubmitted({
      userId: result.caseCustomerId,
      caseId,
    });
  } catch (error) {
    logger.error(
      "Failed to send proposal submission notification.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        caseId,
        proposalId:
          result.proposal.id,
        recipientUserId:
          result.caseCustomerId,
      },
    );
  }

  return {
    proposal: result.proposal,
    proposalLimit:
      result.proposalLimit,
    proposalCount:
      result.proposalCount,
  };
}
