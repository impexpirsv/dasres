import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireUser } from "../../lib/auth";
import {
  getCaseLimit,
  getProposalLimit,
} from "../../lib/plans";
import { getDashboardData } from "../../lib/dashboard-data/getDashboardData";

import DashboardAnalytics from "../components/dashboard/DashboardAnalytics";
import DashboardAttention from "../components/dashboard/DashboardAttention";
import DashboardLatestItems from "../components/dashboard/DashboardLatestItems";
import DashboardMyTasks from "../components/dashboard/DashboardMyTasks";
import DashboardOverdueTasks from "../components/dashboard/DashboardOverdueTasks";
import DashboardProfileCard from "../components/dashboard/DashboardProfileCard";
import DashboardQuickActions from "../components/dashboard/DashboardQuickActions";
import DashboardRecentActivity from "../components/dashboard/DashboardRecentActivity";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import DashboardSubscription from "../components/dashboard/DashboardSubscription";
import DashboardTopRated from "../components/dashboard/DashboardTopRated";

export default async function DashboardPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardPage",
  );

  const isAdmin = user.role === "admin";

  const currentCaseLimit = getCaseLimit(
    user.planType,
  );

  const currentProposalLimit =
    getProposalLimit(user.planType);

  const {
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

    activeCasesUsed,
    totalUserCases,
    completedUserCases,
    openCasesCount,
    inProgressCasesCount,
    completedCasesCount,
    successRate,

    proposalsUsed,
    myProposalsCount,
    acceptedProposalsCount,
    rejectedProposalsCount,
    proposalSuccessRate,

    topRatedExperts,
    topRatedCompanies,

    dashboardTasks,
    overdueTasks,

    latestExperts,
    latestCompanies,
    latestOpportunities,
    latestUsers,

    recentActivities,
  } = await getDashboardData(user);

  const savedTotal =
    savedCasesCount +
    savedCompaniesCount +
    savedExpertsCount;

  const pendingVerificationsCount =
    pendingCompaniesCount +
    pendingExpertsCount;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <DashboardProfileCard user={user} />

      <h1 className="mb-4 text-5xl font-bold">
        {t("title")}
      </h1>

      <p className="mb-12 text-slate-400">
        {t("description")}
      </p>

      <DashboardQuickActions />

      <DashboardAttention
        unreadNotificationsCount={
          unreadNotificationsCount
        }
        openTicketsCount={openTicketsCount}
        openCasesCount={openCasesCount}
        myProposalsCount={myProposalsCount}
      />

      <DashboardOverdueTasks
        tasks={overdueTasks}
      />

      <DashboardAnalytics
        openCasesCount={openCasesCount}
        inProgressCasesCount={
          inProgressCasesCount
        }
        completedCasesCount={
          completedCasesCount
        }
        proposalSuccessRate={
          proposalSuccessRate
        }
        acceptedProposalsCount={
          acceptedProposalsCount
        }
        rejectedProposalsCount={
          rejectedProposalsCount
        }
        unreadNotificationsCount={
          unreadNotificationsCount
        }
        openTicketsCount={openTicketsCount}
        totalReviewsCount={totalReviewsCount}
        savedTotal={savedTotal}
      />

      <DashboardSubscription
        planType={user.planType}
        currentCaseLimit={currentCaseLimit}
        currentProposalLimit={
          currentProposalLimit
        }
        activeCasesUsed={activeCasesUsed}
        proposalsUsed={proposalsUsed}
      />

      {isAdmin && (
        <section className="mb-12 rounded-3xl border border-blue-500 bg-slate-900 p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {t("admin.commandCenter")}
              </h2>

              <p className="mt-2 text-slate-400">
                {t("admin.description")}
              </p>
            </div>

            <Link
              href="/dashboard/verifications"
              className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
            >
              {t(
                "admin.reviewVerifications",
              )}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                {t(
                  "admin.pendingVerifications",
                )}
              </p>

              <p className="mt-2 text-4xl font-bold text-yellow-400">
                {pendingVerificationsCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                {t("admin.totalReviews")}
              </p>

              <p className="mt-2 text-4xl font-bold text-emerald-400">
                {totalReviewsCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                {t("admin.premiumUsers")}
              </p>

              <p className="mt-2 text-4xl font-bold text-purple-400">
                {premiumUsersCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                {t("admin.openTickets")}
              </p>

              <p className="mt-2 text-4xl font-bold text-blue-400">
                {openTicketsCount}
              </p>
            </div>
          </div>
        </section>
      )}

      <DashboardStatsGrid
        userRole={user.role}
        savedCasesCount={savedCasesCount}
        savedCompaniesCount={
          savedCompaniesCount
        }
        savedExpertsCount={savedExpertsCount}
        expertsCount={expertsCount}
        companiesCount={companiesCount}
        opportunitiesCount={
          opportunitiesCount
        }
        successRate={successRate}
        completedUserCases={
          completedUserCases
        }
        totalUserCases={totalUserCases}
        openCasesCount={openCasesCount}
        inProgressCasesCount={
          inProgressCasesCount
        }
        completedCasesCount={
          completedCasesCount
        }
        myProposalsCount={myProposalsCount}
        acceptedProposalsCount={
          acceptedProposalsCount
        }
        unreadNotificationsCount={
          unreadNotificationsCount
        }
        openTicketsCount={openTicketsCount}
      />

      <DashboardMyTasks
        tasks={dashboardTasks}
      />

      <DashboardTopRated
        topRatedExperts={topRatedExperts}
        topRatedCompanies={
          topRatedCompanies
        }
      />

      {isAdmin && (
        <section className="mt-12">
          <h2 className="mb-6 text-3xl font-bold">
            {t("admin.panel")}
          </h2>

          <div className="grid gap-6 md:grid-cols-4">
            <Link
              href="/dashboard/users"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-green-500"
            >
              <h3 className="text-lg font-semibold">
                {t("admin.users")}
              </h3>

              <div className="mt-3 text-4xl font-bold text-green-400">
                {usersCount}
              </div>
            </Link>

            <Link
              href="/dashboard/experts"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold">
                {t("admin.experts")}
              </h3>

              <div className="mt-3 text-4xl font-bold text-blue-400">
                {expertsCount}
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-yellow-500"
            >
              <h3 className="text-lg font-semibold">
                {t("admin.companies")}
              </h3>

              <div className="mt-3 text-4xl font-bold text-yellow-400">
                {companiesCount}
              </div>
            </Link>

            <Link
              href="/dashboard/opportunities"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-purple-500"
            >
              <h3 className="text-lg font-semibold">
                {t(
                  "admin.opportunities",
                )}
              </h3>

              <div className="mt-3 text-4xl font-bold text-purple-400">
                {opportunitiesCount}
              </div>
            </Link>
          </div>
        </section>
      )}

      <DashboardLatestItems
        latestExperts={latestExperts}
        latestCompanies={latestCompanies}
        latestOpportunities={
          latestOpportunities
        }
        userRole={user.role}
      />

      {isAdmin && (
        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              {t("admin.latestUsers")}
            </h2>

            <Link
              href="/dashboard/users"
              className="text-sm text-blue-400 hover:underline"
            >
              {t("admin.manageUsers")}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {latestUsers.map(
              (latestUser) => (
                <div
                  key={latestUser.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <p className="font-semibold">
                    {latestUser.name}
                  </p>

                  <p className="truncate text-sm text-slate-400">
                    {latestUser.email}
                  </p>

                  <span className="mt-3 inline-block rounded bg-slate-800 px-2 py-1 text-xs">
                    {latestUser.role ===
                    "admin"
                      ? t("roles.admin")
                      : t("roles.user")}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <DashboardRecentActivity
        recentActivities={recentActivities}
      />
    </div>
  );
}