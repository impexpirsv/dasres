import { prisma } from "../prisma";
import type { DashboardUser } from "./types";

export async function getDashboardLatestItems(
  user: DashboardUser,
) {
  const isAdmin = user.role === "admin";

  const [
    latestExperts,
    latestCompanies,
    latestOpportunities,
    latestUsers,
  ] = await Promise.all([
    prisma.expert.findMany({
      where: isAdmin
        ? undefined
        : {
            ownerId: user.id,
          },
      orderBy: {
        id: "desc",
      },
      take: 5,
    }),

    prisma.company.findMany({
      where: isAdmin
        ? undefined
        : {
            ownerId: user.id,
          },
      orderBy: {
        id: "desc",
      },
      take: 5,
    }),

    prisma.opportunity.findMany({
      orderBy: {
        id: "desc",
      },
      take: 5,
    }),

    isAdmin
      ? prisma.user.findMany({
          orderBy: {
            id: "desc",
          },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return {
    latestExperts,
    latestCompanies,
    latestOpportunities,
    latestUsers,
  };
}