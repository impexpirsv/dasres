import {
  Prisma,
  ProposalStatus,
} from "@prisma/client";
import { prisma } from "../prisma";
import type {
  DashboardCaseStats,
  DashboardUser,
} from "./types";

export async function getDashboardCaseStats(
  user: DashboardUser,
): Promise<DashboardCaseStats> {
  const isAdmin = user.role === "admin";

  const ownedCompanies =
    await prisma.company.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        category: true,
      },
    });

  const categories = Array.from(
    new Set(
      ownedCompanies
        .map((company) => company.category)
        .filter(Boolean),
    ),
  );

  const userCaseWhere: Prisma.TradeCaseWhereInput =
    {
      OR: [
        {
          customerId: user.id,
        },
        {
          proposals: {
            some: {
              company: {
                ownerId: user.id,
              },
              status:
                ProposalStatus.ACCEPTED,
            },
          },
        },
      ],
    };

  const [
    activeCasesUsed,
    totalUserCases,
    completedUserCases,
    openCasesCount,
    inProgressCasesCount,
    completedCasesCount,
  ] = await Promise.all([
    prisma.tradeCase.count({
      where: {
        customerId: user.id,
      },
    }),

    prisma.tradeCase.count({
      where: userCaseWhere,
    }),

    prisma.tradeCase.count({
      where: {
        AND: [
          userCaseWhere,
          {
            status: "COMPLETED",
          },
        ],
      },
    }),

    isAdmin
      ? prisma.tradeCase.count({
          where: {
            status: "OPEN",
          },
        })
      : categories.length > 0
        ? prisma.tradeCase.count({
            where: {
              status: "OPEN",
              category: {
                in: categories,
              },
              NOT: {
                customerId: user.id,
              },
            },
          })
        : Promise.resolve(0),

    isAdmin
      ? prisma.tradeCase.count({
          where: {
            status: "IN_PROGRESS",
          },
        })
      : prisma.tradeCase.count({
          where: {
            status: "IN_PROGRESS",
            OR: [
              {
                customerId: user.id,
              },
              {
                proposals: {
                  some: {
                    company: {
                      ownerId: user.id,
                    },
                    status:
                      ProposalStatus.ACCEPTED,
                  },
                },
              },
            ],
          },
        }),

    isAdmin
      ? prisma.tradeCase.count({
          where: {
            status: "COMPLETED",
          },
        })
      : prisma.tradeCase.count({
          where: {
            status: "COMPLETED",
            OR: [
              {
                customerId: user.id,
              },
              {
                proposals: {
                  some: {
                    company: {
                      ownerId: user.id,
                    },
                    status:
                      ProposalStatus.ACCEPTED,
                  },
                },
              },
            ],
          },
        }),
  ]);

  const successRate =
    totalUserCases === 0
      ? 0
      : Math.round(
          (completedUserCases /
            totalUserCases) *
            100,
        );

  return {
    activeCasesUsed,
    totalUserCases,
    completedUserCases,
    openCasesCount,
    inProgressCasesCount,
    completedCasesCount,
    successRate,
  };
}