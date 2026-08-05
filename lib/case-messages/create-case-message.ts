import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { runInTransaction } from "../transactions";

const MAX_MESSAGE_LENGTH = 5_000;

const CREATED_CASE_MESSAGE_SELECT = {
  id: true,
  caseId: true,
  senderId: true,
  content: true,
  createdAt: true,
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.CaseMessageSelect;

export type CreatedCaseMessage =
  Prisma.CaseMessageGetPayload<{
    select:
      typeof CREATED_CASE_MESSAGE_SELECT;
  }>;

export type CreateCaseMessageInput = {
  content: string;
};

type CreateCaseMessageTransactionResult = {
  message: CreatedCaseMessage;
  caseId: number;
  caseTitle: string;
  senderName: string;
  notificationRecipientIds: number[];
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

export function parseCreateCaseMessageInput(
  body: unknown,
): CreateCaseMessageInput {
  if (!isRecord(body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  if (typeof body.content !== "string") {
    throw new AppError(
      "MESSAGE_REQUIRED",
      400,
    );
  }

  const content = body.content.trim();

  if (!content) {
    throw new AppError(
      "MESSAGE_REQUIRED",
      400,
    );
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `MESSAGE_TOO_LONG:${MAX_MESSAGE_LENGTH}`,
      400,
    );
  }

  return {
    content,
  };
}

function getAcceptedProviderUserIds(
  proposals: {
    id: number;
    company: {
      ownerId: number | null;
    } | null;
    expert: {
      ownerId: number | null;
    } | null;
  }[],
  acceptedProposalId: number,
): Set<number> {
  const acceptedProposal = proposals.find(
    (proposal) =>
      proposal.id === acceptedProposalId,
  );

  if (!acceptedProposal) {
    throw new AppError(
      "CASE_ACCEPTED_PROPOSAL_NOT_FOUND",
      409,
    );
  }

  const providerUserIds = new Set<number>();

  const companyOwnerId =
    acceptedProposal.company?.ownerId;

  if (
    companyOwnerId !== null &&
    companyOwnerId !== undefined
  ) {
    providerUserIds.add(companyOwnerId);
  }

  const expertOwnerId =
    acceptedProposal.expert?.ownerId;

  if (
    expertOwnerId !== null &&
    expertOwnerId !== undefined
  ) {
    providerUserIds.add(expertOwnerId);
  }

  return providerUserIds;
}

function ensureMessageAccess({
  authenticatedUserId,
  authenticatedUserRole,
  customerId,
  providerUserIds,
}: {
  authenticatedUserId: number;
  authenticatedUserRole: string;
  customerId: number;
  providerUserIds: Set<number>;
}): void {
  const isAdmin =
    authenticatedUserRole === "admin";

  const isCustomer =
    customerId === authenticatedUserId;

  const isAcceptedProvider =
    providerUserIds.has(
      authenticatedUserId,
    );

  if (
    !isAdmin &&
    !isCustomer &&
    !isAcceptedProvider
  ) {
    throw new AppError(
      "CASE_MESSAGE_ACCESS_DENIED",
      403,
    );
  }
}

function getNotificationRecipientIds({
  senderId,
  customerId,
  providerUserIds,
}: {
  senderId: number;
  customerId: number;
  providerUserIds: Set<number>;
}): number[] {
  const recipientIds = new Set<number>();

  if (customerId !== senderId) {
    recipientIds.add(customerId);
  }

  for (const providerUserId of providerUserIds) {
    if (providerUserId !== senderId) {
      recipientIds.add(providerUserId);
    }
  }

  return Array.from(recipientIds);
}

async function createNotifications({
  caseId,
  caseTitle,
  senderName,
  recipientIds,
}: {
  caseId: number;
  caseTitle: string;
  senderName: string;
  recipientIds: number[];
}): Promise<void> {
  if (recipientIds.length === 0) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: recipientIds.map(
        (recipientId) => ({
          userId: recipientId,
          title: "New case message",
          message: `${senderName} sent a new message in case: ${caseTitle}`,
          type: "CASE_MESSAGE",
          link: `/dashboard/cases/${caseId}`,
        }),
      ),
    });
  } catch (error) {
    logger.error(
      "Failed to create case message notifications.",
      {
        error:
          error instanceof Error
            ? error
            : String(error),
        caseId,
        recipientIds,
      },
    );
  }
}

export async function createCaseMessage({
  caseId,
  authenticatedUserId,
  input,
}: {
  caseId: number;
  authenticatedUserId: number;
  input: CreateCaseMessageInput;
}): Promise<CreatedCaseMessage> {
  const result = await runInTransaction(
    async (transaction) => {
      const authenticatedUser =
        await transaction.user.findUnique({
          where: {
            id: authenticatedUserId,
          },
          select: {
            id: true,
            name: true,
            email: true,
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
            status: true,
            customerId: true,
            acceptedProposalId: true,
            proposals: {
              where: {
                status: "ACCEPTED",
              },
              select: {
                id: true,
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
        tradeCase.status !== "IN_PROGRESS"
      ) {
        throw new AppError(
          "CASE_NOT_IN_PROGRESS",
          409,
        );
      }

      if (
        tradeCase.acceptedProposalId === null
      ) {
        throw new AppError(
          "CASE_ACCEPTED_PROPOSAL_NOT_FOUND",
          409,
        );
      }

      const providerUserIds =
        getAcceptedProviderUserIds(
          tradeCase.proposals,
          tradeCase.acceptedProposalId,
        );

      ensureMessageAccess({
        authenticatedUserId:
          authenticatedUser.id,
        authenticatedUserRole:
          authenticatedUser.role,
        customerId: tradeCase.customerId,
        providerUserIds,
      });

      const message =
        await transaction.caseMessage.create({
          data: {
            caseId: tradeCase.id,
            senderId:
              authenticatedUser.id,
            content: input.content,
          },
          select:
            CREATED_CASE_MESSAGE_SELECT,
        });

      await transaction.caseActivity.create({
        data: {
          caseId: tradeCase.id,
          userId:
            authenticatedUser.id,
          action: "CASE_MESSAGE_SENT",
          details: JSON.stringify({
            messageId: message.id,
            senderId: message.senderId,
            messageLength:
              message.content.length,
            createdAt: message.createdAt,
          }),
        },
      });

      const senderName =
        authenticatedUser.name?.trim() ||
        authenticatedUser.email;

      return {
        message,
        caseId: tradeCase.id,
        caseTitle: tradeCase.title,
        senderName,
        notificationRecipientIds:
          getNotificationRecipientIds({
            senderId:
              authenticatedUser.id,
            customerId:
              tradeCase.customerId,
            providerUserIds,
          }),
      };
    },
  );

  await createNotifications({
    caseId: result.caseId,
    caseTitle: result.caseTitle,
    senderName: result.senderName,
    recipientIds:
      result.notificationRecipientIds,
  });

  return result.message;
}
