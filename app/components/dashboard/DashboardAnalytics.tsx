import { getTranslations } from "next-intl/server";

type DashboardAnalyticsProps = {
  openCasesCount: number;
  inProgressCasesCount: number;
  completedCasesCount: number;
  proposalSuccessRate: number;
  acceptedProposalsCount: number;
  rejectedProposalsCount: number;
  unreadNotificationsCount: number;
  openTicketsCount: number;
  totalReviewsCount: number;
  savedTotal: number;
};

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function ProgressItem({
  label,
  value,
  percent,
  color,
  barColor,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
  barColor: string;
}) {
  const normalizedPercent = clampPercent(percent);

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={color}>{value}</span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedPercent}
      >
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
    </div>
  );
}

export default async function DashboardAnalytics({
  openCasesCount,
  inProgressCasesCount,
  completedCasesCount,
  proposalSuccessRate,
  acceptedProposalsCount,
  rejectedProposalsCount,
  unreadNotificationsCount,
  openTicketsCount,
  totalReviewsCount,
  savedTotal,
}: DashboardAnalyticsProps) {
  const t = await getTranslations("dashboardAnalytics");

  const openCases = normalizeCount(openCasesCount);
  const inProgressCases = normalizeCount(inProgressCasesCount);
  const completedCases = normalizeCount(completedCasesCount);
  const totalCases = openCases + inProgressCases + completedCases;

  const getCasePercent = (count: number) =>
    totalCases === 0 ? 0 : (count / totalCases) * 100;

  const normalizedSuccessRate = clampPercent(proposalSuccessRate);

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="text-3xl font-black text-white">{t("title")}</h2>
        <p className="text-sm text-slate-400">{t("description")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <p className="text-sm text-slate-500">{t("casePipeline.title")}</p>

          <div className="mt-5 space-y-5">
            <ProgressItem
              label={t("casePipeline.open")}
              value={openCases}
              percent={getCasePercent(openCases)}
              color="text-emerald-400"
              barColor="bg-emerald-500"
            />
            <ProgressItem
              label={t("casePipeline.inProgress")}
              value={inProgressCases}
              percent={getCasePercent(inProgressCases)}
              color="text-orange-400"
              barColor="bg-orange-500"
            />
            <ProgressItem
              label={t("casePipeline.completed")}
              value={completedCases}
              percent={getCasePercent(completedCases)}
              color="text-blue-400"
              barColor="bg-blue-500"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <p className="text-sm text-slate-500">{t("proposalPerformance.title")}</p>
          <p className="mt-5 text-5xl font-black text-cyan-400">
            {normalizedSuccessRate}%
          </p>
          <p className="mt-3 text-slate-400">
            {t("proposalPerformance.description")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                {t("proposalPerformance.accepted")}
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-400">
                {normalizeCount(acceptedProposalsCount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                {t("proposalPerformance.rejected")}
              </p>
              <p className="mt-2 text-3xl font-black text-red-400">
                {normalizeCount(rejectedProposalsCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <p className="text-sm text-slate-500">{t("platformAttention.title")}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              [t("platformAttention.notifications"), normalizeCount(unreadNotificationsCount), "text-blue-400"],
              [t("platformAttention.tickets"), normalizeCount(openTicketsCount), "text-purple-400"],
              [t("platformAttention.reviews"), normalizeCount(totalReviewsCount), "text-yellow-400"],
              [t("platformAttention.saved"), normalizeCount(savedTotal), "text-emerald-400"],
            ].map(([label, value, className]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-black ${className}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
