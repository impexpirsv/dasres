import Link from "next/link";

export default function DashboardQuickActions() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Quick Actions</h2>

        <p className="text-slate-400 text-sm">
          Frequently used shortcuts
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Link
          href="/dashboard/cases/new"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-blue-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
        >
          <div className="text-4xl mb-4">➕</div>

          <h3 className="text-xl font-bold">
            Create Case
          </h3>

          <p className="text-slate-400 mt-2">
            Start a new international trade project.
          </p>
        </Link>

        <Link
          href="/dashboard/open-cases"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
        >
          <div className="text-4xl mb-4">📂</div>

          <h3 className="text-xl font-bold">
            Open Cases
          </h3>

          <p className="text-slate-400 mt-2">
            Browse available trade requests.
          </p>
        </Link>

        <Link
          href="/dashboard/my-companies"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
        >
          <div className="text-4xl mb-4">🏢</div>

          <h3 className="text-xl font-bold">
            My Companies
          </h3>

          <p className="text-slate-400 mt-2">
            Manage your company profiles.
          </p>
        </Link>

        <Link
          href="/dashboard/my-experts"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
        >
          <div className="text-4xl mb-4">👨‍💼</div>

          <h3 className="text-xl font-bold">
            My Experts
          </h3>

          <p className="text-slate-400 mt-2">
            Manage your expert profiles.
          </p>
        </Link>
      </div>
    </section>
  );
}