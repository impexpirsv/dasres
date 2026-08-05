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


  const currentCaseLimit =
    getCaseLimit(
      user.planType,
    );


  const currentProposalLimit =
    getProposalLimit(
      user.planType,
    );


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

  } = await getDashboardData(
    user,
  );


  const savedTotal =
    savedCasesCount +
    savedCompaniesCount +
    savedExpertsCount;


  const pendingVerificationsCount =
    pendingCompaniesCount +
    pendingExpertsCount;

  function getRoleLabel(role: string): string {
    const roleKey = `roles.${role}`;

    return t.has(roleKey)
      ? t(roleKey)
      : role.replaceAll("_", " ");
  }


  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-4
        py-10
        md:px-8
        md:py-14
      "
    >

      <DashboardProfileCard
        user={user}
      />



      <div className="mb-10">

        <div
          className="
            mb-4
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-blue-500/30
            bg-blue-500/10
            px-4
            py-2
            text-sm
            font-semibold
            text-blue-300
          "
        >
          <span
            className="
              h-2
              w-2
              rounded-full
              bg-emerald-400
            "
          />

          {t("badge")}

        </div>



        <h1
          className="
            mb-4
            bg-gradient-to-r
            from-blue-400
            via-cyan-300
            to-emerald-300
            bg-clip-text
            text-5xl
            font-black
            text-transparent
            md:text-6xl
          "
        >
          {t("title")}
        </h1>



        <p
          className="
            max-w-3xl
            text-lg
            leading-8
            text-slate-400
          "
        >
          {t("description")}
        </p>


      </div>



      <DashboardQuickActions />


      <DashboardStatsGrid

        userRole={user.role}

        savedCasesCount={
          savedCasesCount
        }

        savedCompaniesCount={
          savedCompaniesCount
        }

        savedExpertsCount={
          savedExpertsCount
        }

        expertsCount={
          expertsCount
        }

        companiesCount={
          companiesCount
        }

        opportunitiesCount={
          opportunitiesCount
        }

        successRate={
          successRate
        }

        completedUserCases={
          completedUserCases
        }

        totalUserCases={
          totalUserCases
        }

        openCasesCount={
          openCasesCount
        }

        inProgressCasesCount={
          inProgressCasesCount
        }

        completedCasesCount={
          completedCasesCount
        }

        myProposalsCount={
          myProposalsCount
        }

        acceptedProposalsCount={
          acceptedProposalsCount
        }

        unreadNotificationsCount={
          unreadNotificationsCount
        }

        openTicketsCount={
          openTicketsCount
        }

      />


      <DashboardAnalytics

        openCasesCount={
          openCasesCount
        }

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

        openTicketsCount={
          openTicketsCount
        }

        totalReviewsCount={
          totalReviewsCount
        }

        savedTotal={
          savedTotal
        }

      />
            <DashboardAttention
        unreadNotificationsCount={
          unreadNotificationsCount
        }

        openTicketsCount={
          openTicketsCount
        }

        openCasesCount={
          openCasesCount
        }

        myProposalsCount={
          myProposalsCount
        }
      />



      <DashboardOverdueTasks
        tasks={
          overdueTasks
        }
      />



      <DashboardSubscription

        planType={
          user.planType
        }

        currentCaseLimit={
          currentCaseLimit
        }

        currentProposalLimit={
          currentProposalLimit
        }

        activeCasesUsed={
          activeCasesUsed
        }

        proposalsUsed={
          proposalsUsed
        }

      />



      <DashboardMyTasks
        tasks={
          dashboardTasks
        }
      />



      <DashboardLatestItems

        latestExperts={
          latestExperts
        }

        latestCompanies={
          latestCompanies
        }

        latestOpportunities={
          latestOpportunities
        }

        userRole={
          user.role
        }

      />



      <DashboardTopRated

        topRatedExperts={
          topRatedExperts
        }

        topRatedCompanies={
          topRatedCompanies
        }

      />



      <DashboardRecentActivity

        recentActivities={
          recentActivities
        }

      />



      {isAdmin && (

        <>

          <section
            className="
              mt-12
              rounded-[2rem]
              border
              border-yellow-500/30
              bg-gradient-to-br
              from-yellow-950/30
              to-slate-950
              p-6
            "
          >

            <div
              className="
                mb-6
                flex
                items-center
                justify-between
              "
            >

              <h2
                className="
                  text-2xl
                  font-black
                  text-yellow-400
                "
              >
                {t("admin.title")}
              </h2>


              <span
                className="
                  rounded-full
                  bg-yellow-500/20
                  px-3
                  py-1
                  text-xs
                  font-bold
                  text-yellow-300
                "
              >
                {getRoleLabel(user.role)}
              </span>

            </div>



            <div
              className="
                grid
                gap-5
                md:grid-cols-4
              "
            >

              <Link
                href="/dashboard/verifications"
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                  transition
                  hover:border-yellow-500
                "
              >

                <p className="text-sm text-slate-400">
                  {t("admin.pendingVerifications")}
                </p>


                <p
                  className="
                    mt-3
                    text-4xl
                    font-black
                    text-yellow-400
                  "
                >
                  {pendingVerificationsCount}
                </p>

              </Link>



              <Link
                href="/dashboard/users"
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                  transition
                  hover:border-blue-500
                "
              >

                <p className="text-sm text-slate-400">
                  {t("admin.users")}
                </p>


                <p
                  className="
                    mt-3
                    text-4xl
                    font-black
                    text-blue-400
                  "
                >
                  {usersCount}
                </p>

              </Link>



              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >

                <p className="text-sm text-slate-400">
                  {t("admin.premiumUsers")}
                </p>


                <p
                  className="
                    mt-3
                    text-4xl
                    font-black
                    text-emerald-400
                  "
                >
                  {premiumUsersCount}
                </p>

              </div>



              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >

                <p className="text-sm text-slate-400">
                  {t("admin.reviews")}
                </p>


                <p
                  className="
                    mt-3
                    text-4xl
                    font-black
                    text-purple-400
                  "
                >
                  {totalReviewsCount}
                </p>

              </div>

            </div>

          </section>



          <section
            className="
              mt-12
              rounded-[2rem]
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <h2
              className="
                mb-6
                text-2xl
                font-black
              "
            >
              {t("admin.latestUsers")}
            </h2>


            <div className="space-y-3">
              {latestUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-500">
                  {t.has("admin.latestUsersEmpty")
                    ? t("admin.latestUsersEmpty")
                    : t("admin.latestUsers")}
                </div>
              ) : (
                latestUsers.map((item) => (
                  <Link
                    key={item.id}
                    href="/dashboard/users"
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-slate-800
                      bg-slate-950
                      p-4
                      transition
                      hover:border-blue-500
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {item.name}
                      </p>

                      <p className="truncate text-sm text-slate-400">
                        {item.email}
                      </p>
                    </div>

                    <span
                      className="
                        ms-4
                        shrink-0
                        rounded-full
                        bg-blue-500/20
                        px-3
                        py-1
                        text-xs
                        text-blue-300
                      "
                    >
                      {getRoleLabel(item.role)}
                    </span>
                  </Link>
                ))
              )}
            </div>

          </section>

        </>

      )}


    </div>
  );
}