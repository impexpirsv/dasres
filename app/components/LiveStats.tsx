import { prisma } from "../../lib/prisma";
import { getTranslations } from "next-intl/server";
export default async function LiveStats() {
  const t = await getTranslations("liveStats");
  const [
    companiesCount,
    expertsCount,
    opportunitiesCount,
    tradeCasesCount,
    completedCasesCount,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.expert.count(),
    prisma.opportunity.count(),
    prisma.tradeCase.count(),
    prisma.tradeCase.count({
      where: {
        status: "COMPLETED",
      },
    }),
  ]);

  const successRate =
    tradeCasesCount > 0
      ? Math.round((completedCasesCount / tradeCasesCount) * 100)
      : 0;

  const stats = [
    {
      label: t("verifiedCompanies"),
      value: companiesCount,
      suffix: "+",
      color: "text-blue-400",
    },
    {
      label: t("trustedExperts"),
      value: expertsCount,
      suffix: "+",
      color: "text-cyan-400",
    },
    {
      label: t("tradeOpportunities"),
      value: opportunitiesCount,
      suffix: "+",
      color: "text-purple-400",
    },
    {
      label: t("tradeCases"),
      value: tradeCasesCount,
      suffix: "+",
      color: "text-emerald-400",
    },
    {
      label: t("caseSuccessRate"),
      value: successRate,
      suffix: "%",
      color: "text-yellow-400",
    },
  ];

  return (
    <section className="bg-slate-950 border-y border-slate-800 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="mb-2 font-semibold text-blue-400">{t("eyebrow")}</p>

          <h2 className="text-3xl font-bold">{t("title")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center"
            >
              <p dir="ltr" className={`text-4xl font-black ${stat.color}`}>
                {stat.value}
                {stat.suffix}
              </p>

              <p className="text-slate-400 text-sm mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
