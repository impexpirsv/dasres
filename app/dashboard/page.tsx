import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";
import { getCaseLimit, getProposalLimit } from "../../lib/plans";
import { ProposalStatus } from "@prisma/client";
function getActivityTitle(action: string) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return "📨 Proposal Submitted";

    case "PROPOSAL_ACCEPTED":
      return "✅ Proposal Accepted";

    case "PROPOSAL_REJECTED":
      return "❌ Proposal Rejected";

    case "CASE_COMPLETED":
      return "🏁 Case Completed";

    case "DOCUMENT_UPLOADED":
      return "📄 Document Uploaded";

    case "MESSAGE_SENT":
      return "💬 Message Sent";

    default:
      return action.replaceAll("_", " ");
  }
}
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

  const casesCount =
    user.role === "admin"
      ? await prisma.tradeCase.count()
      : await prisma.tradeCase.count({
          where: {
            customerId: user.id,
          },
        });
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

  const proposalUsagePercent =
    proposalLimit === Number.MAX_SAFE_INTEGER
      ? 0
      : Math.min(100, Math.round((myProposalsCount / proposalLimit) * 100));
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

  const latestExperts =
    user.role === "admin"
      ? await prisma.expert.findMany({
          orderBy: { id: "desc" },
          take: 5,
        })
      : await prisma.expert.findMany({
          where: {
            ownerId: user.id,
          },
          orderBy: { id: "desc" },
          take: 5,
        });

  const latestCompanies =
    user.role === "admin"
      ? await prisma.company.findMany({
          orderBy: { id: "desc" },
          take: 5,
        })
      : await prisma.company.findMany({
          where: {
            ownerId: user.id,
          },
          orderBy: { id: "desc" },
          take: 5,
        });

  const latestOpportunities = await prisma.opportunity.findMany({
    orderBy: { id: "desc" },
    take: 5,
  });

  const latestUsers =
    user.role === "admin"
      ? await prisma.user.findMany({
          orderBy: { id: "desc" },
          take: 5,
        })
      : [];

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
  const recentActivities =
    user.role === "admin"
      ? await prisma.caseActivity.findMany({
          orderBy: {
            id: "desc",
          },
          take: 8,
          include: {
            user: true,
            tradeCase: true,
          },
        })
      : await prisma.caseActivity.findMany({
          where: {
            tradeCase: {
              customerId: user.id,
            },
          },
          orderBy: {
            id: "desc",
          },
          take: 8,
          include: {
            user: true,
            tradeCase: true,
          },
        });
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
        <h2 className="text-2xl font-bold mb-4">User Profile</h2>

        <p>
          <strong>Name:</strong> {user.name}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Role:</strong> {user.role}
        </p>
      </div>

      <h1 className="text-5xl font-bold mb-4">Dashboard</h1>

      <p className="text-slate-400 mb-12">
        Manage your Dasres account, profiles and trade activities.
      </p>
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Quick Actions</h2>

          <p className="text-slate-400 text-sm">Frequently used shortcuts</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Link
            href="/dashboard/cases/new"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-blue-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
          >
            <div className="text-4xl mb-4">➕</div>

            <h3 className="text-xl font-bold">Create Case</h3>

            <p className="text-slate-400 mt-2">
              Start a new international trade project.
            </p>
          </Link>

          <Link
            href="/dashboard/open-cases"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
          >
            <div className="text-4xl mb-4">📂</div>

            <h3 className="text-xl font-bold">Open Cases</h3>

            <p className="text-slate-400 mt-2">
              Browse available trade requests.
            </p>
          </Link>

          <Link
            href="/dashboard/my-companies"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className="text-4xl mb-4">🏢</div>

            <h3 className="text-xl font-bold">My Companies</h3>

            <p className="text-slate-400 mt-2">Manage your company profiles.</p>
          </Link>

          <Link
            href="/dashboard/my-experts"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
          >
            <div className="text-4xl mb-4">👨‍💼</div>

            <h3 className="text-xl font-bold">My Experts</h3>

            <p className="text-slate-400 mt-2">Manage your expert profiles.</p>
          </Link>
        </div>
      </section>
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Needs Your Attention</h2>

          <p className="text-slate-400 text-sm">Important items to review</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Link
            href="/dashboard/notifications"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-blue-500 transition-all"
          >
            <p className="text-slate-500 text-sm">Unread Notifications</p>

            <p className="text-4xl font-bold text-blue-400 mt-3">
              {unreadNotificationsCount}
            </p>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500 transition-all"
          >
            <p className="text-slate-500 text-sm">Open Tickets</p>

            <p className="text-4xl font-bold text-purple-400 mt-3">
              {openTicketsCount}
            </p>
          </Link>

          <Link
            href="/dashboard/open-cases"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500 transition-all"
          >
            <p className="text-slate-500 text-sm">Open Cases</p>

            <p className="text-4xl font-bold text-emerald-400 mt-3">
              {openCasesCount}
            </p>
          </Link>

          <Link
            href="/dashboard/my-proposals"
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-yellow-500 transition-all"
          >
            <p className="text-slate-500 text-sm">My Proposals</p>

            <p className="text-4xl font-bold text-yellow-400 mt-3">
              {myProposalsCount}
            </p>
          </Link>
        </div>
      </section>
      <section className="mb-12">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">Analytics Overview</h2>

    <p className="text-slate-400 text-sm">
      Operational performance summary
    </p>
  </div>

  <div className="grid lg:grid-cols-3 gap-5">
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-slate-500 text-sm">Case Pipeline</p>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Open</span>
            <span className="text-emerald-400">{openCasesCount}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(openCasesCount * 10, 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>In Progress</span>
            <span className="text-orange-400">{inProgressCasesCount}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(inProgressCasesCount * 10, 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Completed</span>
            <span className="text-blue-400">{completedCasesCount}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(completedCasesCount * 10, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-slate-500 text-sm">Proposal Performance</p>

      <div className="mt-5">
        <p className="text-5xl font-bold text-cyan-400">
          {proposalSuccessRate}%
        </p>

        <p className="text-slate-400 mt-3">
          Acceptance rate based on accepted and rejected proposals.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <p className="text-slate-500 text-xs">Accepted</p>
            <p className="text-2xl font-bold text-emerald-400">
              {acceptedProposalsCount}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <p className="text-slate-500 text-xs">Rejected</p>
            <p className="text-2xl font-bold text-red-400">
              {rejectedProposalsCount}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-slate-500 text-sm">Platform Attention</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
          <p className="text-slate-500 text-xs">Notifications</p>
          <p className="text-3xl font-bold text-blue-400">
            {unreadNotificationsCount}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
          <p className="text-slate-500 text-xs">Tickets</p>
          <p className="text-3xl font-bold text-purple-400">
            {openTicketsCount}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
          <p className="text-slate-500 text-xs">Reviews</p>
          <p className="text-3xl font-bold text-yellow-400">
            {totalReviewsCount}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
          <p className="text-slate-500 text-xs">Saved</p>
          <p className="text-3xl font-bold text-emerald-400">
            {savedCasesCount + savedCompaniesCount + savedExpertsCount}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12 mb-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-slate-500 text-sm">Current Plan</p>

            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {user.planType}
            </h2>
          </div>

          <Link
            href="/subscription"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
          >
            Manage Plan
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Active Cases</span>

              <span>
                {currentCaseLimit === Number.MAX_SAFE_INTEGER
                  ? `${activeCasesUsed} / Unlimited`
                  : `${activeCasesUsed} / ${currentCaseLimit}`}
              </span>
            </div>

            {currentCaseLimit !== Number.MAX_SAFE_INTEGER && (
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (activeCasesUsed / currentCaseLimit) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Proposals</span>

              <span>
                {currentProposalLimit === Number.MAX_SAFE_INTEGER
                  ? `${proposalsUsed} / Unlimited`
                  : `${proposalsUsed} / ${currentProposalLimit}`}
              </span>
            </div>

            {currentProposalLimit !== Number.MAX_SAFE_INTEGER && (
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (proposalsUsed / currentProposalLimit) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
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
      <div className="grid md:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
        
        <Link
          href="/dashboard/saved-cases"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
        >
          <h2 className="text-xl font-semibold mb-3">Saved Cases</h2>

          <div className="text-5xl font-bold text-blue-400">
            {savedCasesCount}
          </div>

          <p className="text-slate-400 mt-3">Cases saved for later</p>
        </Link>

        <Link
          href="/dashboard/saved-companies"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500 transition"
        >
          <h2 className="text-xl font-semibold mb-3">Saved Companies</h2>

          <div className="text-5xl font-bold text-yellow-400">
            {savedCompaniesCount}
          </div>

          <p className="text-slate-400 mt-3">Companies in your network</p>
        </Link>

        <Link
          href="/dashboard/saved-experts"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500 transition"
        >
          <h2 className="text-xl font-semibold mb-3">Saved Experts</h2>

          <div className="text-5xl font-bold text-emerald-400">
            {savedExpertsCount}
          </div>

          <p className="text-slate-400 mt-3">Experts in your network</p>
        </Link>
        <Link
         href={user.role === "admin" ? "/dashboard/experts" : "/dashboard/my-experts"}
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-3">
            {user.role === "admin" ? "Experts" : "My Experts"}
          </h2>

          <div className="text-5xl font-bold text-blue-400">{expertsCount}</div>

          <p className="text-slate-400 mt-3">
            {user.role === "admin"
              ? "Verified experts available"
              : "Experts you own"}
          </p>
        </Link>

        <Link
          href={
            user.role === "admin" ? "/companies" : "/dashboard/my-companies"
          }
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-3">
            {user.role === "admin" ? "Companies" : "My Companies"}
          </h2>

          <div className="text-5xl font-bold text-blue-400">
            {companiesCount}
          </div>

          <p className="text-slate-400 mt-3">
            {user.role === "admin"
              ? "Registered companies"
              : "Companies you own"}
          </p>
        </Link>

        <Link
          href="/dashboard/opportunities"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-3">Opportunities</h2>

          <div className="text-5xl font-bold text-blue-400">
            {opportunitiesCount}
          </div>

          <p className="text-slate-400 mt-3">Active trade opportunities</p>
        </Link>
        <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500">
          <h2 className="text-xl font-semibold mb-3">Case Success Rate</h2>

          <div className="text-5xl font-bold text-emerald-400">
            {successRate}%
          </div>

          <p className="text-slate-400 mt-3">
            {completedUserCases} completed of {totalUserCases} cases
          </p>
        </div>
        <Link
          href="/dashboard/cases"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500"
        >
          <h2 className="text-xl font-semibold mb-3">
            {user.role === "admin" ? "Trade Cases" : "Trade Cases"}
          </h2>

          <div className="text-5xl font-bold text-cyan-400">
            {totalUserCases}
          </div>

          <p className="text-slate-400 mt-3">
            {user.role === "admin"
              ? "All trade projects"
              : "Submitted trade requests"}
          </p>
        </Link>

        <Link
          href="/dashboard/open-cases"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500"
        >
          <h2 className="text-xl font-semibold mb-3">Open Cases</h2>

          <div className="text-5xl font-bold text-emerald-400">
            {openCasesCount}
          </div>

          <p className="text-slate-400 mt-3">Available opportunities</p>
        </Link>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">In Progress</h2>

          <div className="text-5xl font-bold text-orange-400">
            {inProgressCasesCount}
          </div>

          <p className="text-slate-400 mt-3">Active trade projects</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">Completed</h2>

          <div className="text-5xl font-bold text-green-400">
            {completedCasesCount}
          </div>

          <p className="text-slate-400 mt-3">Finished projects</p>
        </div>

        <Link
          href="/dashboard/my-proposals"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500"
        >
          <h2 className="text-xl font-semibold mb-3">Proposals</h2>

          <div className="text-5xl font-bold text-yellow-400">
            {myProposalsCount}
          </div>
        </Link>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">Accepted</h2>

          <div className="text-5xl font-bold text-green-400">
            {acceptedProposalsCount}
          </div>
        </div>
        
        <Link
          href="/dashboard/notifications"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-3">Notifications</h2>

          <div className="text-5xl font-bold text-blue-400">
            {unreadNotificationsCount}
          </div>
        </Link>

        <Link
          href="/dashboard/tickets"
          className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500"
        >
          <h2 className="text-xl font-semibold mb-3">Open Tickets</h2>

          <div className="text-5xl font-bold text-purple-400">
            {openTicketsCount}
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-12">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🏆 Top Rated Experts</h2>

            <Link
              href="/dashboard/experts"
              className="text-blue-400 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {topRatedExperts.length === 0 ? (
              <p className="text-slate-500">No rated experts yet.</p>
            ) : (
              topRatedExperts.map((expert) => (
                <Link
                  key={expert.id}
                  href={`/dashboard/experts/${expert.id}`}
                  className="block bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{expert.name}</p>

                      <p className="text-sm text-slate-400">
                        {expert.country} · {expert.specialty}
                      </p>
                    </div>

                    <div className="text-yellow-400 font-semibold whitespace-nowrap">
                      ⭐ {expert.averageRating.toFixed(1)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Based on {expert.reviewCount} review
                    {expert.reviewCount > 1 ? "s" : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🏆 Top Rated Companies</h2>

            <Link
              href="/dashboard/companies"
              className="text-blue-400 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {topRatedCompanies.length === 0 ? (
              <p className="text-slate-500">No rated companies yet.</p>
            ) : (
              topRatedCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/dashboard/companies/${company.id}`}
                  className="block bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{company.name}</p>

                      <p className="text-sm text-slate-400">
                        {company.country} · {company.category}
                      </p>
                    </div>

                    <div className="text-yellow-400 font-semibold whitespace-nowrap">
                      ⭐ {company.averageRating.toFixed(1)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Based on {company.reviewCount} review
                    {company.reviewCount > 1 ? "s" : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
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

      <div className="grid lg:grid-cols-3 gap-6 mt-12">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {user.role === "admin" ? "Latest Experts" : "My Latest Experts"}
            </h2>

            <Link
              href={
                user.role === "admin" ? "/experts" : "/dashboard/my-experts"
              }
              className="text-blue-400 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {latestExperts.length === 0 ? (
              <p className="text-slate-500">No experts found.</p>
            ) : (
              latestExperts.map((expert) => (
                <Link
                  key={expert.id}
                  href={`/dashboard/experts/${expert.id}`}
                  className="block border-b border-slate-800 pb-3 last:border-0"
                >
                  <p className="font-semibold">{expert.name}</p>

                  <p className="text-sm text-slate-400">
                    {expert.country} · {expert.specialty}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {user.role === "admin"
                ? "Latest Companies"
                : "My Latest Companies"}
            </h2>

            <Link
              href={
                user.role === "admin" ? "/companies" : "/dashboard/my-companies"
              }
              className="text-blue-400 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {latestCompanies.length === 0 ? (
              <p className="text-slate-500">No companies found.</p>
            ) : (
              latestCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/dashboard/companies/${company.id}`}
                  className="block border-b border-slate-800 pb-3 last:border-0"
                >
                  <p className="font-semibold">{company.name}</p>

                  <p className="text-sm text-slate-400">
                    {company.country} · {company.category}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Latest Opportunities</h2>

            <Link
              href="/dashboard/opportunities"
              className="text-blue-400 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {latestOpportunities.length === 0 ? (
              <p className="text-slate-500">No opportunities found.</p>
            ) : (
              latestOpportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/dashboard/opportunities/${opportunity.id}`}
                  className="block border-b border-slate-800 pb-3 last:border-0"
                >
                  <p className="font-semibold">{opportunity.title}</p>

                  <p className="text-sm text-slate-400">
                    {opportunity.country} · {opportunity.status}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

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
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-slate-500">No activity found.</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const badgeColor = activity.action.includes("MESSAGE")
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : activity.action.includes("DOCUMENT")
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                  : activity.action.includes("PROPOSAL")
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : activity.action.includes("CASE")
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : "bg-slate-700 text-slate-300 border-slate-600";

              return (
                <div
                  key={activity.id}
                  className="border-b border-slate-800 pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {getActivityTitle(activity.action)}
                    </p>

                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor}`}
                    >
                      {activity.action.replaceAll("_", " ")}
                    </span>
                  </div>

                  {activity.details && (
                    <p className="text-slate-400 text-sm mt-1">
                      {activity.details}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {activity.user?.name || "System"} •{" "}
                    <Link
                      href={`/dashboard/cases/${activity.caseId}`}
                      className="text-blue-400 hover:underline"
                    >
                      {activity.tradeCase.title}
                    </Link>{" "}
                    • {activity.createdAt.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
