import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  userRole: string;
  savedCasesCount: number;
  savedCompaniesCount: number;
  savedExpertsCount: number;
  expertsCount: number;
  companiesCount: number;
  opportunitiesCount: number;
  successRate: number;
  completedUserCases: number;
  totalUserCases: number;
  openCasesCount: number;
  inProgressCasesCount: number;
  completedCasesCount: number;
  myProposalsCount: number;
  acceptedProposalsCount: number;
  unreadNotificationsCount: number;
  openTicketsCount: number;
};

export default async function DashboardStatsGrid({
  userRole,
  savedCasesCount,
  savedCompaniesCount,
  savedExpertsCount,
  expertsCount,
  companiesCount,
  opportunitiesCount,
  successRate,
  completedUserCases,
  totalUserCases,
  openCasesCount,
  inProgressCasesCount,
  completedCasesCount,
  myProposalsCount,
  acceptedProposalsCount,
  unreadNotificationsCount,
  openTicketsCount,
}: Props) {
  const t = await getTranslations("dashboardStatsGrid");

  const isAdmin = userRole === "admin";

  return (
    <div className="grid md:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
      <Link
        href="/dashboard/saved-cases"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("savedCases.title")}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {savedCasesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("savedCases.description")}
        </p>
      </Link>

      <Link
        href="/dashboard/saved-companies"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("savedCompanies.title")}
        </h2>

        <div className="text-5xl font-bold text-yellow-400">
          {savedCompaniesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("savedCompanies.description")}
        </p>
      </Link>

      <Link
        href="/dashboard/saved-experts"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("savedExperts.title")}
        </h2>

        <div className="text-5xl font-bold text-emerald-400">
          {savedExpertsCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("savedExperts.description")}
        </p>
      </Link>

      <Link
        href={
          isAdmin
            ? "/dashboard/experts"
            : "/dashboard/my-experts"
        }
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {isAdmin
            ? t("experts.adminTitle")
            : t("experts.userTitle")}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {expertsCount}
        </div>

        <p className="text-slate-400 mt-3">
          {isAdmin
            ? t("experts.adminDescription")
            : t("experts.userDescription")}
        </p>
      </Link>

      <Link
        href={
          isAdmin
            ? "/dashboard/companies"
            : "/dashboard/my-companies"
        }
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {isAdmin
            ? t("companies.adminTitle")
            : t("companies.userTitle")}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {companiesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {isAdmin
            ? t("companies.adminDescription")
            : t("companies.userDescription")}
        </p>
      </Link>

      <Link
        href="/dashboard/opportunities"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("opportunities.title")}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {opportunitiesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("opportunities.description")}
        </p>
      </Link>

      <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500">
        <h2 className="text-xl font-semibold mb-3">
          {t("successRate.title")}
        </h2>

        <div className="text-5xl font-bold text-emerald-400">
          {successRate}%
        </div>

        <p className="text-slate-400 mt-3">
          {t("successRate.description", {
            completed: completedUserCases,
            total: totalUserCases,
          })}
        </p>
      </div>

      <Link
        href="/dashboard/cases"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("tradeCases.title")}
        </h2>

        <div className="text-5xl font-bold text-cyan-400">
          {totalUserCases}
        </div>

        <p className="text-slate-400 mt-3">
          {isAdmin
            ? t("tradeCases.adminDescription")
            : t("tradeCases.userDescription")}
        </p>
      </Link>

      <Link
        href="/dashboard/open-cases"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("openCases.title")}
        </h2>

        <div className="text-5xl font-bold text-emerald-400">
          {openCasesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("openCases.description")}
        </p>
      </Link>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-3">
          {t("inProgress.title")}
        </h2>

        <div className="text-5xl font-bold text-orange-400">
          {inProgressCasesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("inProgress.description")}
        </p>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-3">
          {t("completed.title")}
        </h2>

        <div className="text-5xl font-bold text-green-400">
          {completedCasesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {t("completed.description")}
        </p>
      </div>

      <Link
        href="/dashboard/my-proposals"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("proposals")}
        </h2>

        <div className="text-5xl font-bold text-yellow-400">
          {myProposalsCount}
        </div>
      </Link>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-3">
          {t("accepted")}
        </h2>

        <div className="text-5xl font-bold text-green-400">
          {acceptedProposalsCount}
        </div>
      </div>

      <Link
        href="/dashboard/notifications"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("notifications")}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {unreadNotificationsCount}
        </div>
      </Link>

      <Link
        href="/dashboard/tickets"
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500 transition"
      >
        <h2 className="text-xl font-semibold mb-3">
          {t("openTickets")}
        </h2>

        <div className="text-5xl font-bold text-purple-400">
          {openTicketsCount}
        </div>
      </Link>
    </div>
  );
}