import Link from "next/link";
import { requireUser } from "../../../lib/auth";
import { getCaseLimit, getProposalLimit } from "../../../lib/plans";

export default async function DashboardSettingsPage() {
  const user = await requireUser();

  const caseLimit = getCaseLimit(user.planType);
  const proposalLimit = getProposalLimit(user.planType);

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="text-blue-400 font-semibold mb-3">
          Account Settings
        </p>

        <h1 className="text-5xl font-bold mb-4">
          Settings
        </h1>

        <p className="text-slate-400">
          Manage your Dasres account, plan and profile information.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Profile Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Name</p>
                <p className="text-xl font-semibold mt-2">
                  {user.name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Email</p>
                <p className="text-xl font-semibold mt-2 break-all">
                  {user.email}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Role</p>
                <p className="text-xl font-semibold mt-2">
                  {user.role}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Plan</p>
                <p className="text-xl font-semibold text-yellow-400 mt-2">
                  {user.planType}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Plan Limits
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Case Limit</p>
                <p className="text-2xl font-bold text-cyan-400 mt-2">
                  {caseLimit === Number.MAX_SAFE_INTEGER
                    ? "Unlimited"
                    : caseLimit}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">
                <p className="text-slate-500 text-sm">Proposal Limit</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {proposalLimit === Number.MAX_SAFE_INTEGER
                    ? "Unlimited"
                    : proposalLimit}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              Quick Links
            </h2>

            <div className="space-y-3">
              <Link
                href="/dashboard/subscription"
                className="block bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
              >
                Manage Subscription
              </Link>

              <Link
                href="/dashboard/my-companies"
                className="block bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl text-center"
              >
                My Companies
              </Link>

              <Link
                href="/dashboard/my-experts"
                className="block bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl text-center"
              >
                My Experts
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              Security
            </h2>

            <p className="text-slate-400 leading-7">
              Password changes, two-factor authentication and login history will
              be added in the production security phase.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}