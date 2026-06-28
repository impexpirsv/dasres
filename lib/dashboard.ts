import { prisma } from "./prisma";

export async function getRecentActivities() {
  return prisma.caseActivity.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
        },
      },
      tradeCase: {
        select: {
          title: true,
        },
      },
    },
  });
}
export async function getLatestDashboardItems(user: {
  id: number;
  role: string;
}) {
  const [latestExperts, latestCompanies, latestOpportunities, latestUsers] =
    await Promise.all([
      user.role === "admin"
        ? prisma.expert.findMany({
            orderBy: { id: "desc" },
            take: 5,
          })
        : prisma.expert.findMany({
            where: { ownerId: user.id },
            orderBy: { id: "desc" },
            take: 5,
          }),

      user.role === "admin"
        ? prisma.company.findMany({
            orderBy: { id: "desc" },
            take: 5,
          })
        : prisma.company.findMany({
            where: { ownerId: user.id },
            orderBy: { id: "desc" },
            take: 5,
          }),

      prisma.opportunity.findMany({
        orderBy: { id: "desc" },
        take: 5,
      }),

      user.role === "admin"
        ? prisma.user.findMany({
            orderBy: { id: "desc" },
            take: 5,
          })
        : [],
    ]);

  return {
    latestExperts,
    latestCompanies,
    latestOpportunities,
    latestUsers,
  };
}