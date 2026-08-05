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
      select: {
        id: true,
        name: true,
        country: true,
        specialty: true,
      },
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
      select: {
        id: true,
        name: true,
        country: true,
        category: true,
      },
    }),

    prisma.opportunity.findMany({
      orderBy: {
        id: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        country: true,
        status: true,
      },
    }),

    isAdmin
      ? prisma.user.findMany({
          orderBy: {
            id: "desc",
          },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
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
