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

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">
          {t("title")}
        </h2>

        <p className="text-slate-400 text-sm">
          {t("description")}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-500 text-sm">
            {t("casePipeline.title")}
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t("casePipeline.open")}</span>

                <span className="text-emerald-400">
                  {openCasesCount}
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(openCasesCount * 10, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t("casePipeline.inProgress")}</span>

                <span className="text-orange-400">
                  {inProgressCasesCount}
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(inProgressCasesCount * 10, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t("casePipeline.completed")}</span>

                <span className="text-blue-400">
                  {completedCasesCount}
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min(completedCasesCount * 10, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-500 text-sm">
            {t("proposalPerformance.title")}
          </p>

          <div className="mt-5">
            <p className="text-5xl font-bold text-cyan-400">
              {proposalSuccessRate}%
            </p>

            <p className="text-slate-400 mt-3">
              {t("proposalPerformance.description")}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-slate-500 text-xs">
                  {t("proposalPerformance.accepted")}
                </p>

                <p className="text-2xl font-bold text-emerald-400">
                  {acceptedProposalsCount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-slate-500 text-xs">
                  {t("proposalPerformance.rejected")}
                </p>

                <p className="text-2xl font-bold text-red-400">
                  {rejectedProposalsCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-500 text-sm">
            {t("platformAttention.title")}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-slate-500 text-xs">
                {t("platformAttention.notifications")}
              </p>

              <p className="text-3xl font-bold text-blue-400">
                {unreadNotificationsCount}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-slate-500 text-xs">
                {t("platformAttention.tickets")}
              </p>

              <p className="text-3xl font-bold text-purple-400">
                {openTicketsCount}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-slate-500 text-xs">
                {t("platformAttention.reviews")}
              </p>

              <p className="text-3xl font-bold text-yellow-400">
                {totalReviewsCount}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-slate-500 text-xs">
                {t("platformAttention.saved")}
              </p>

              <p className="text-3xl font-bold text-emerald-400">
                {savedTotal}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}