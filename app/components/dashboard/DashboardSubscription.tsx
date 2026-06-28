import Link from "next/link";

type DashboardSubscriptionProps = {
  planType: string;
  currentCaseLimit: number;
  currentProposalLimit: number;
  activeCasesUsed: number;
  proposalsUsed: number;
};

export default function DashboardSubscription({
  planType,
  currentCaseLimit,
  currentProposalLimit,
  activeCasesUsed,
  proposalsUsed,
}: DashboardSubscriptionProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12 mb-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-slate-500 text-sm">Current Plan</p>

          <h2 className="text-3xl font-bold text-yellow-400 mt-2">
            {planType}
          </h2>
        </div>

        <Link
          href="/dashboard/subscription"
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
  );
}