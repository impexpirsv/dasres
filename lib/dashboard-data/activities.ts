import { ProposalStatus } from "@prisma/client";
import { prisma } from "../prisma";
import type { DashboardUser } from "./types";

export async function getDashboardActivities(
  user: DashboardUser,
) {
  const isAdmin = user.role === "admin";

  return prisma.caseActivity.findMany({
    where: isAdmin
      ? undefined
      : {
          tradeCase: {
            OR: [
              {
                customerId: user.id,
              },
              {
                proposals: {
                  some: {
                    status:
                      ProposalStatus.ACCEPTED,
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
                },
              },
            ],
          },
        },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      caseId: true,
      action: true,
      details: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
      tradeCase: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}