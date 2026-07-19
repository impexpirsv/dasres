import { prisma } from "../../lib/prisma";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";

const getLiveStats = unstable_cache(
  async () => {
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

    return {
      companiesCount,
      expertsCount,
      opportunitiesCount,
      tradeCasesCount,
      completedCasesCount,
    };
  },
  ["live-stats"],
  {
    revalidate: 300,
  },
);

export default async function LiveStats() {
  const t = await getTranslations("liveStats");

  const {
    companiesCount,
    expertsCount,
    opportunitiesCount,
    tradeCasesCount,
    completedCasesCount,
  } = await getLiveStats();

  const successRate =
    tradeCasesCount > 0
      ? Math.round(
          (completedCasesCount /
            tradeCasesCount) *
            100,
        )
      : 0;

  const stats = [
    {
      label: t("verifiedCompanies"),
      value: companiesCount,
      suffix: "+",
      color: "text-blue-400",
      glow: "hover:border-blue-500/60",
    },
    {
      label: t("trustedExperts"),
      value: expertsCount,
      suffix: "+",
      color: "text-cyan-400",
      glow: "hover:border-cyan-500/60",
    },
    {
      label: t("tradeOpportunities"),
      value: opportunitiesCount,
      suffix: "+",
      color: "text-purple-400",
      glow: "hover:border-purple-500/60",
    },
    {
      label: t("tradeCases"),
      value: tradeCasesCount,
      suffix: "+",
      color: "text-emerald-400",
      glow: "hover:border-emerald-500/60",
    },
    {
      label: t("caseSuccessRate"),
      value: successRate,
      suffix: "%",
      color: "text-yellow-400",
      glow: "hover:border-yellow-500/60",
    },
  ];

  return (
    <section className="border-y border-slate-800 bg-slate-950 py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            {t("eyebrow")}
          </p>

          <h2 className="text-3xl font-black text-white md:text-4xl">
            {t("title")}
          </h2>
        </div>


        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`
                group
                rounded-3xl
                border
                border-slate-800
                bg-slate-900/70
                p-7
                text-center
                shadow-lg
                shadow-black/20
                transition
                duration-300
                hover:-translate-y-1
                hover:bg-slate-900
                ${stat.glow}
              `}
            >
              <p
                dir="ltr"
                className={`
                  text-5xl
                  font-black
                  tracking-tight
                  transition
                  group-hover:scale-105
                  ${stat.color}
                `}
              >
                {stat.value}
                {stat.suffix}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}