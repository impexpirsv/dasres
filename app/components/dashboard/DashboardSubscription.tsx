import Link from "next/link";
import { getTranslations } from "next-intl/server";

type DashboardSubscriptionProps = {
  planType: string;
  currentCaseLimit: number;
  currentProposalLimit: number;
  activeCasesUsed: number;
  proposalsUsed: number;
};

export default async function DashboardSubscription({
  planType,
  currentCaseLimit,
  currentProposalLimit,
  activeCasesUsed,
  proposalsUsed,
}: DashboardSubscriptionProps) {
  const t = await getTranslations("dashboardSubscription");

  const unlimitedCases =
    currentCaseLimit === Number.MAX_SAFE_INTEGER;

  const unlimitedProposals =
    currentProposalLimit === Number.MAX_SAFE_INTEGER;

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12 mb-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-slate-500 text-sm">
            {t("currentPlan")}
          </p>

          <h2 className="text-3xl font-bold text-yellow-400 mt-2">
            {planType}
          </h2>
        </div>

        <Link
          href="/dashboard/subscription"
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
        >
          {t("managePlan")}
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between gap-4 text-sm text-slate-400 mb-2">
            <span>{t("activeCases")}</span>

            <span>
              {unlimitedCases
                ? t("usageUnlimited", {
                    used: activeCasesUsed,
                  })
                : t("usageLimited", {
                    used: activeCasesUsed,
                    limit: currentCaseLimit,
                  })}
            </span>
          </div>

          {!unlimitedCases && (
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{
                  width: `${Math.min(
                    currentCaseLimit > 0
                      ? (activeCasesUsed / currentCaseLimit) * 100
                      : 0,
                    100,
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between gap-4 text-sm text-slate-400 mb-2">
            <span>{t("proposals")}</span>

            <span>
              {unlimitedProposals
                ? t("usageUnlimited", {
                    used: proposalsUsed,
                  })
                : t("usageLimited", {
                    used: proposalsUsed,
                    limit: currentProposalLimit,
                  })}
            </span>
          </div>

          {!unlimitedProposals && (
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(
                    currentProposalLimit > 0
                      ? (proposalsUsed / currentProposalLimit) * 100
                      : 0,
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