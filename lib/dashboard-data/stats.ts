import { prisma } from "../prisma";
import type {
  DashboardStats,
  DashboardUser,
} from "./types";

export async function getDashboardStats(
  user: DashboardUser,
): Promise<DashboardStats> {
  const isAdmin = user.role === "admin";

  const [
    pendingCompaniesCount,
    pendingExpertsCount,
    totalReviewsCount,
    premiumUsersCount,
    usersCount,
    expertsCount,
    companiesCount,
    opportunitiesCount,
    savedCasesCount,
    savedCompaniesCount,
    savedExpertsCount,
    unreadNotificationsCount,
    openTicketsCount,
  ] = await Promise.all([
    isAdmin
      ? prisma.company.count({
          where: {
            verificationStatus: "PENDING",
          },
        })
      : Promise.resolve(0),

    isAdmin
      ? prisma.expert.count({
          where: {
            verificationStatus: "PENDING",
          },
        })
      : Promise.resolve(0),

    isAdmin
      ? prisma.review.count()
      : prisma.review.count({
          where: {
            reviewedUserId: user.id,
          },
        }),

    isAdmin
      ? prisma.user.count({
          where: {
            planType: {
              in: [
                "GOLD",
                "DIAMOND",
                "ENTERPRISE",
              ],
            },
          },
        })
      : Promise.resolve(0),

    isAdmin
      ? prisma.user.count()
      : Promise.resolve(0),

    isAdmin
      ? prisma.expert.count()
      : prisma.expert.count({
          where: {
            ownerId: user.id,
          },
        }),

    isAdmin
      ? prisma.company.count()
      : prisma.company.count({
          where: {
            ownerId: user.id,
          },
        }),

    prisma.opportunity.count(),

    prisma.savedCase.count({
      where: {
        userId: user.id,
      },
    }),

    prisma.savedCompany.count({
      where: {
        userId: user.id,
      },
    }),

    prisma.savedExpert.count({
      where: {
        userId: user.id,
      },
    }),

    prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    }),

    isAdmin
      ? prisma.ticket.count({
          where: {
            status: "OPEN",
          },
        })
      : prisma.ticket.count({
          where: {
            userId: user.id,
            status: "OPEN",
          },
        }),
  ]);

  return {
    pendingCompaniesCount,
    pendingExpertsCount,
    totalReviewsCount,
    premiumUsersCount,
    usersCount,
    expertsCount,
    companiesCount,
    opportunitiesCount,
    savedCasesCount,
    savedCompaniesCount,
    savedExpertsCount,
    unreadNotificationsCount,
    openTicketsCount,
  };
}