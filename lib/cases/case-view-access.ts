import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

export type CaseViewAccessInput = {
  userId: number;
  userRole: string;
  customerId: number;
  acceptedProposalId: number | null;
  acceptedProviders: readonly {
    id: number;
    company: { ownerId: number | null } | null;
    expert: { ownerId: number | null } | null;
  }[];
};

export function canViewPrivateCase({
  userId,
  userRole,
  customerId,
  acceptedProposalId,
  acceptedProviders,
}: CaseViewAccessInput): boolean {
  if (userRole === "admin" || customerId === userId) {
    return true;
  }

  if (acceptedProposalId === null) {
    return false;
  }

  const acceptedProvider = acceptedProviders.find(
    (proposal) => proposal.id === acceptedProposalId,
  );

  return (
    acceptedProvider?.company?.ownerId === userId ||
    acceptedProvider?.expert?.ownerId === userId
  );
}

export async function getAuthorizedCaseViewScope({
  caseId,
  userId,
  userRole,
}: {
  caseId: number;
  userId: number;
  userRole: string;
}): Promise<Prisma.TradeCaseWhereInput | null> {
  const accessRecord = await prisma.tradeCase.findUnique({
    where: { id: caseId },
    select: {
      customerId: true,
      acceptedProposalId: true,
      proposals: {
        where: { status: "ACCEPTED" },
        select: {
          id: true,
          company: { select: { ownerId: true } },
          expert: { select: { ownerId: true } },
        },
      },
    },
  });

  if (
    !accessRecord ||
    !canViewPrivateCase({
      userId,
      userRole,
      customerId: accessRecord.customerId,
      acceptedProposalId: accessRecord.acceptedProposalId,
      acceptedProviders: accessRecord.proposals,
    })
  ) {
    return null;
  }

  if (userRole === "admin") {
    return { id: caseId };
  }

  if (accessRecord.customerId === userId) {
    return { id: caseId, customerId: userId };
  }

  const acceptedProposalId = accessRecord.acceptedProposalId;

  if (acceptedProposalId === null) {
    return null;
  }

  return {
    id: caseId,
    acceptedProposalId,
    proposals: {
      some: {
        id: acceptedProposalId,
        status: "ACCEPTED",
        OR: [
          { company: { ownerId: userId } },
          { expert: { ownerId: userId } },
        ],
      },
    },
  };
}

export function getCaseSearchVisibilityScope({
  userId,
  userRole,
}: {
  userId: number;
  userRole: string;
}): Prisma.TradeCaseWhereInput {
  if (userRole === "admin") {
    return {};
  }

  return {
    OR: [
      { status: "OPEN" },
      { customerId: userId },
      {
        acceptedProposalId: { not: null },
        proposals: {
          some: {
            status: "ACCEPTED",
            OR: [
              { company: { ownerId: userId } },
              { expert: { ownerId: userId } },
            ],
          },
        },
      },
    ],
  };
}
