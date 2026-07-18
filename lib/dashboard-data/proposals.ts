import { ProposalStatus } from "@prisma/client";
import { prisma } from "../prisma";
import type {
  DashboardProposalStats,
  DashboardUser,
} from "./types";

export async function getDashboardProposalStats(
  user: DashboardUser,
): Promise<DashboardProposalStats> {
  const isAdmin = user.role === "admin";

  const [
    proposalsUsed,
    myProposalsCount,
    acceptedProposalsCount,
    rejectedProposalsCount,
  ] = await Promise.all([
    prisma.caseProposal.count({
      where: {
        OR: [
          {
            company: {
              ownerId: user.id,
            },
          },
          {
            expert: {
              ownerId: user.id,
            },
          },
        ],
      },
    }),

    isAdmin
      ? prisma.caseProposal.count()
      : prisma.caseProposal.count({
          where: {
            company: {
              ownerId: user.id,
            },
          },
        }),

    isAdmin
      ? prisma.caseProposal.count({
          where: {
            status:
              ProposalStatus.ACCEPTED,
          },
        })
      : prisma.caseProposal.count({
          where: {
            status:
              ProposalStatus.ACCEPTED,
            company: {
              ownerId: user.id,
            },
          },
        }),

    isAdmin
      ? prisma.caseProposal.count({
          where: {
            status:
              ProposalStatus.REJECTED,
          },
        })
      : prisma.caseProposal.count({
          where: {
            status:
              ProposalStatus.REJECTED,
            company: {
              ownerId: user.id,
            },
          },
        }),
  ]);

  const resolvedProposalsCount =
    acceptedProposalsCount +
    rejectedProposalsCount;

  const proposalSuccessRate =
    resolvedProposalsCount === 0
      ? 0
      : Math.round(
          (acceptedProposalsCount /
            resolvedProposalsCount) *
            100,
        );

  return {
    proposalsUsed,
    myProposalsCount,
    acceptedProposalsCount,
    rejectedProposalsCount,
    proposalSuccessRate,
  };
}