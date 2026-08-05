import Link from "next/link";
import { getTranslations } from "next-intl/server";

type DashboardSubscriptionProps = {
  planType: string;
  currentCaseLimit: number;
  currentProposalLimit: number;
  activeCasesUsed: number;
  proposalsUsed: number;
};

function normalizeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function UsageBar({
  label,
  used,
  limit,
  color,
  unlimited,
  unlimitedText,
  limitedText,
}: {
  label: string;
  used: number;
  limit: number;
  color: string;
  unlimited: boolean;
  unlimitedText: string;
  limitedText: string;
}) {
  const normalizedUsed = normalizeNonNegative(used);
  const normalizedLimit = normalizeNonNegative(limit);
  const percentage =
    !unlimited && normalizedLimit > 0
      ? Math.min((normalizedUsed / normalizedLimit) * 100, 100)
      : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {unlimited ? unlimitedText : limitedText}
        </span>
      </div>

      {!unlimited && (
        <div
          className="h-3 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
        >
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function DashboardSubscription({
  planType,
  currentCaseLimit,
  currentProposalLimit,
  activeCasesUsed,
  proposalsUsed,
}: DashboardSubscriptionProps) {
  const t = await getTranslations("dashboardSubscription");

  const normalizedPlan = planType.trim().toUpperCase() || "FREE";
  const planKey = normalizedPlan.toLowerCase();
  const planLabel = t.has(`planLabels.${planKey}`)
    ? t(`planLabels.${planKey}`)
    : normalizedPlan;
  const isPremium = normalizedPlan !== "FREE";

  const unlimitedCases = currentCaseLimit === Number.MAX_SAFE_INTEGER;
  const unlimitedProposals = currentProposalLimit === Number.MAX_SAFE_INTEGER;
  const normalizedCasesUsed = normalizeNonNegative(activeCasesUsed);
  const normalizedProposalsUsed = normalizeNonNegative(proposalsUsed);
  const normalizedCaseLimit = normalizeNonNegative(currentCaseLimit);
  const normalizedProposalLimit = normalizeNonNegative(currentProposalLimit);

  return (
    <div className="mb-10 mt-12 rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl shadow-yellow-500/5">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-slate-500">{t("currentPlan")}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black text-yellow-400">{planLabel}</h2>

            {isPremium && (
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                {t("premiumBadge")}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/dashboard/subscription"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.03]"
        >
          {t("managePlan")}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <UsageBar
            label={t("activeCases")}
            used={normalizedCasesUsed}
            limit={normalizedCaseLimit}
            unlimited={unlimitedCases}
            color="bg-cyan-500"
            unlimitedText={t("usageUnlimited", { used: normalizedCasesUsed })}
            limitedText={t("usageLimited", {
              used: normalizedCasesUsed,
              limit: normalizedCaseLimit,
            })}
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <UsageBar
            label={t("proposals")}
            used={normalizedProposalsUsed}
            limit={normalizedProposalLimit}
            unlimited={unlimitedProposals}
            color="bg-emerald-500"
            unlimitedText={t("usageUnlimited", { used: normalizedProposalsUsed })}
            limitedText={t("usageLimited", {
              used: normalizedProposalsUsed,
              limit: normalizedProposalLimit,
            })}
          />
        </div>
      </div>
    </div>
  );
}
