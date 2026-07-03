import Link from "next/link";

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

export default function DashboardStatsGrid({
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
  return (
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
        href={
          userRole === "admin"
            ? "/dashboard/experts"
            : "/dashboard/my-experts"
        }
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
      >
        <h2 className="text-xl font-semibold mb-3">
          {userRole === "admin" ? "Experts" : "My Experts"}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {expertsCount}
        </div>

        <p className="text-slate-400 mt-3">
          {userRole === "admin"
            ? "Verified experts available"
            : "Experts you own"}
        </p>
      </Link>

      <Link
        href={
          userRole === "admin"
            ? "/dashboard/companies"
            : "/dashboard/my-companies"
        }
        className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
      >
        <h2 className="text-xl font-semibold mb-3">
          {userRole === "admin" ? "Companies" : "My Companies"}
        </h2>

        <div className="text-5xl font-bold text-blue-400">
          {companiesCount}
        </div>

        <p className="text-slate-400 mt-3">
          {userRole === "admin"
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

        <p className="text-slate-400 mt-3">
          Active trade opportunities
        </p>
      </Link>

      <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500">
        <h2 className="text-xl font-semibold mb-3">
          Case Success Rate
        </h2>

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
          Trade Cases
        </h2>

        <div className="text-5xl font-bold text-cyan-400">
          {totalUserCases}
        </div>

        <p className="text-slate-400 mt-3">
          {userRole === "admin"
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
  );
}