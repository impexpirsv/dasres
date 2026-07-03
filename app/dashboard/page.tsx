import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";
import { getCaseLimit, getProposalLimit } from "../../lib/plans";
import { ProposalStatus } from "@prisma/client";
import DashboardAnalytics from "../components/dashboard/DashboardAnalytics";
import DashboardQuickActions from "../components/dashboard/DashboardQuickActions";
import DashboardSubscription from "../components/dashboard/DashboardSubscription";
import DashboardRecentActivity from "../components/dashboard/DashboardRecentActivity";
import {
  getRecentActivities,
  getLatestDashboardItems,
} from "../../lib/dashboard";
import DashboardProfileCard from "../components/dashboard/DashboardProfileCard";
import DashboardAttention from "../components/dashboard/DashboardAttention";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import DashboardTopRated from "../components/dashboard/DashboardTopRated";
import DashboardLatestItems from "../components/dashboard/DashboardLatestItems";
import DashboardMyTasks from "../components/dashboard/DashboardMyTasks";
import DashboardOverdueTasks from "../components/dashboard/DashboardOverdueTasks";
export default async function DashboardPage() {
  const user = await requireUser();
  const pendingCompaniesCount =
    user.role === "admin"
      ? await prisma.company.count({
          where: {
            verificationStatus: "PENDING",
          },
        })
      : 0;

  const pendingExpertsCount =
    user.role === "admin"
      ? await prisma.expert.count({
          where: {
            verificationStatus: "PENDING",
          },
        })
      : 0;

  const totalReviewsCount =
    user.role === "admin"
      ? await prisma.review.count()
      : await prisma.review.count({
          where: {
            reviewedUserId: user.id,
          },
        });

  const premiumUsersCount =
    user.role === "admin"
      ? await prisma.user.count({
          where: {
            planType: {
              in: ["GOLD", "DIAMOND", "ENTERPRISE"],
            },
          },
        })
      : 0;
  const currentCaseLimit = getCaseLimit(user.planType);
  const currentProposalLimit = getProposalLimit(user.planType);

  const activeCasesUsed = await prisma.tradeCase.count({
    where: {
      customerId: user.id,
    },
  });
  const proposalsUsed = await prisma.caseProposal.count({
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
  });
  const userCaseWhere = {
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
            status: ProposalStatus.ACCEPTED,
          },
        },
      },
    ],
  };

  const totalUserCases = await prisma.tradeCase.count({
    where: userCaseWhere,
  });

  const completedUserCases = await prisma.tradeCase.count({
    where: {
      ...userCaseWhere,
      status: "COMPLETED",
    },
  });
  const successRate =
    totalUserCases === 0
      ? 0
      : Math.round((completedUserCases / totalUserCases) * 100);
  const usersCount = user.role === "admin" ? await prisma.user.count() : 0;

  const expertsCount =
    user.role === "admin"
      ? await prisma.expert.count()
      : await prisma.expert.count({
          where: {
            ownerId: user.id,
          },
        });

  const companiesCount =
    user.role === "admin"
      ? await prisma.company.count()
      : await prisma.company.count({
          where: {
            ownerId: user.id,
          },
        });

  const opportunitiesCount = await prisma.opportunity.count();

  const myProposalsCount =
    user.role === "admin"
      ? await prisma.caseProposal.count()
      : await prisma.caseProposal.count({
          where: {
            company: {
              ownerId: user.id,
            },
          },
        });
  const savedCasesCount = await prisma.savedCase.count({
    where: {
      userId: user.id,
    },
  });

  const savedCompaniesCount = await prisma.savedCompany.count({
    where: {
      userId: user.id,
    },
  });

  const savedExpertsCount = await prisma.savedExpert.count({
    where: {
      userId: user.id,
    },
  });
  const proposalLimit = getProposalLimit(user.planType);

  const acceptedProposalsCount =
    user.role === "admin"
      ? await prisma.caseProposal.count({
          where: {
            status: "ACCEPTED",
          },
        })
      : await prisma.caseProposal.count({
          where: {
            status: "ACCEPTED",
            company: {
              ownerId: user.id,
            },
          },
        });

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });

  const openTicketsCount =
    user.role === "admin"
      ? await prisma.ticket.count({
          where: {
            status: "OPEN",
          },
        })
      : await prisma.ticket.count({
          where: {
            userId: user.id,
            status: "OPEN",
          },
        });
  const myCompanies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    select: {
      category: true,
    },
  });

  const categories = myCompanies.map((company) => company.category);

  const openCasesCount =
    user.role === "admin"
      ? await prisma.tradeCase.count({
          where: {
            status: "OPEN",
          },
        })
      : await prisma.tradeCase.count({
          where: {
            status: "OPEN",
            category: {
              in: categories,
            },
            NOT: {
              customerId: user.id,
            },
          },
        });

  const { latestExperts, latestCompanies, latestOpportunities, latestUsers } =
    await getLatestDashboardItems(user);

  const allExperts = await prisma.expert.findMany();

  const topRatedExperts = (
    await Promise.all(
      allExperts.map(async (expert) => {
        const reviews = expert.ownerId
          ? await prisma.review.findMany({
              where: {
                reviewedUserId: expert.ownerId,
              },
              select: {
                rating: true,
              },
            })
          : [];

        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            : 0;

        return {
          ...expert,
          averageRating,
          reviewCount: reviews.length,
        };
      }),
    )
  )
    .filter((expert) => expert.reviewCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);

  const allCompanies = await prisma.company.findMany();

  const topRatedCompanies = (
    await Promise.all(
      allCompanies.map(async (company) => {
        const reviews = company.ownerId
          ? await prisma.review.findMany({
              where: {
                reviewedUserId: company.ownerId,
              },
              select: {
                rating: true,
              },
            })
          : [];

        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            : 0;

        return {
          ...company,
          averageRating,
          reviewCount: reviews.length,
        };
      }),
    )
  )
    .filter((company) => company.reviewCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);
  const inProgressCasesCount =
    user.role === "admin"
      ? await prisma.tradeCase.count({
          where: {
            status: "IN_PROGRESS",
          },
        })
      : await prisma.tradeCase.count({
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
                    status: "ACCEPTED",
                  },
                },
              },
            ],
          },
        });

  const completedCasesCount =
    user.role === "admin"
      ? await prisma.tradeCase.count({
          where: {
            status: "COMPLETED",
          },
        })
      : await prisma.tradeCase.count({
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
                    status: "ACCEPTED",
                  },
                },
              },
            ],
          },
        });
  const rejectedProposalsCount =
    user.role === "admin"
      ? await prisma.caseProposal.count({
          where: {
            status: "REJECTED",
          },
        })
      : await prisma.caseProposal.count({
          where: {
            status: "REJECTED",
            company: {
              ownerId: user.id,
            },
          },
        });

  const resolvedProposalsCount =
    acceptedProposalsCount + rejectedProposalsCount;
  const proposalSuccessRate =
    resolvedProposalsCount > 0
      ? Math.round((acceptedProposalsCount / resolvedProposalsCount) * 100)
      : 0;
  const recentActivities = await getRecentActivities();
  const dashboardTasks = await prisma.projectTask.findMany({
    where: {
      assignedToId: user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      {
        dueDate: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 5,
  });
  const overdueTasks = await prisma.projectTask.findMany({
    where: {
      assignedToId: user.id,
      status: {
        not: "COMPLETED",
      },
      dueDate: {
        lt: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <DashboardProfileCard user={user} />

      <h1 className="text-5xl font-bold mb-4">Dashboard</h1>

      <p className="text-slate-400 mb-12">
        Manage your Dasres account, profiles and trade activities.
      </p>
      <DashboardQuickActions />
      <DashboardAttention
        unreadNotificationsCount={unreadNotificationsCount}
        openTicketsCount={openTicketsCount}
        openCasesCount={openCasesCount}
        myProposalsCount={myProposalsCount}
      />
      <DashboardOverdueTasks tasks={overdueTasks} />
      <DashboardAnalytics
        openCasesCount={openCasesCount}
        inProgressCasesCount={inProgressCasesCount}
        completedCasesCount={completedCasesCount}
        proposalSuccessRate={proposalSuccessRate}
        acceptedProposalsCount={acceptedProposalsCount}
        rejectedProposalsCount={rejectedProposalsCount}
        unreadNotificationsCount={unreadNotificationsCount}
        openTicketsCount={openTicketsCount}
        totalReviewsCount={totalReviewsCount}
        savedTotal={savedCasesCount + savedCompaniesCount + savedExpertsCount}
      />
      <DashboardSubscription
        planType={user.planType}
        currentCaseLimit={currentCaseLimit}
        currentProposalLimit={currentProposalLimit}
        activeCasesUsed={activeCasesUsed}
        proposalsUsed={proposalsUsed}
      />
      {user.role === "admin" && (
        <div className="mb-12 bg-slate-900 border border-blue-500 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold">Admin Command Center</h2>

              <p className="text-slate-400 mt-2">
                High-level operational overview of Dasres.
              </p>
            </div>

            <Link
              href="/dashboard/verifications"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
            >
              Review Verifications
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mt-8">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-500 text-sm">Pending Verifications</p>

              <p className="text-4xl font-bold text-yellow-400 mt-2">
                {pendingCompaniesCount + pendingExpertsCount}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-500 text-sm">Total Reviews</p>

              <p className="text-4xl font-bold text-emerald-400 mt-2">
                {totalReviewsCount}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-500 text-sm">Premium Users</p>

              <p className="text-4xl font-bold text-purple-400 mt-2">
                {premiumUsersCount}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-500 text-sm">Open Tickets</p>

              <p className="text-4xl font-bold text-blue-400 mt-2">
                {openTicketsCount}
              </p>
            </div>
          </div>
        </div>
      )}

      <DashboardStatsGrid
        userRole={user.role}
        savedCasesCount={savedCasesCount}
        savedCompaniesCount={savedCompaniesCount}
        savedExpertsCount={savedExpertsCount}
        expertsCount={expertsCount}
        companiesCount={companiesCount}
        opportunitiesCount={opportunitiesCount}
        successRate={successRate}
        completedUserCases={completedUserCases}
        totalUserCases={totalUserCases}
        openCasesCount={openCasesCount}
        inProgressCasesCount={inProgressCasesCount}
        completedCasesCount={completedCasesCount}
        myProposalsCount={myProposalsCount}
        acceptedProposalsCount={acceptedProposalsCount}
        unreadNotificationsCount={unreadNotificationsCount}
        openTicketsCount={openTicketsCount}
      />
      <DashboardMyTasks tasks={dashboardTasks} />
      <DashboardTopRated
        topRatedExperts={topRatedExperts}
        topRatedCompanies={topRatedCompanies}
      />
      {user.role === "admin" && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <Link
              href="/dashboard/users"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-green-500"
            >
              <h3 className="text-lg font-semibold">Users</h3>

              <div className="text-4xl font-bold text-green-400 mt-3">
                {usersCount}
              </div>
            </Link>

            <Link
              href="/dashboard/experts"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold">Experts</h3>

              <div className="text-4xl font-bold text-blue-400 mt-3">
                {expertsCount}
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500"
            >
              <h3 className="text-lg font-semibold">Companies</h3>

              <div className="text-4xl font-bold text-yellow-400 mt-3">
                {companiesCount}
              </div>
            </Link>

            <Link
              href="/dashboard/opportunities"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500"
            >
              <h3 className="text-lg font-semibold">Opportunities</h3>

              <div className="text-4xl font-bold text-purple-400 mt-3">
                {opportunitiesCount}
              </div>
            </Link>
          </div>
        </div>
      )}

      <DashboardLatestItems
        latestExperts={latestExperts}
        latestCompanies={latestCompanies}
        latestOpportunities={latestOpportunities}
        userRole={user.role}
      />

      {user.role === "admin" && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Latest Users</h2>

            <Link
              href="/dashboard/users"
              className="text-blue-400 text-sm hover:underline"
            >
              Manage users
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {latestUsers.map((latestUser) => (
              <div
                key={latestUser.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4"
              >
                <p className="font-semibold">{latestUser.name}</p>

                <p className="text-sm text-slate-400 truncate">
                  {latestUser.email}
                </p>

                <span className="inline-block mt-3 text-xs bg-slate-800 px-2 py-1 rounded">
                  {latestUser.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <DashboardRecentActivity recentActivities={recentActivities} />
    </div>
  );
}
