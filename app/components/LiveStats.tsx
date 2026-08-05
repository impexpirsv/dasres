import { prisma } from "../../lib/prisma";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
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
      prisma.company.count({
        where: {
          verificationStatus: "VERIFIED",
        },
      }),
      prisma.expert.count({
        where: {
          verificationStatus: "VERIFIED",
        },
      }),
      prisma.opportunity.count({
        where: {
          status: "OPEN",
        },
      }),
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
    tags: ["live-stats"],
  },
);


export default async function LiveStats() {
  const t = await getTranslations("liveStats");

  const locale = await getLocale();

  const numberFormatter =
    new Intl.NumberFormat(locale);


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
      id: "companies",
      label: t("verifiedCompanies"),
      value: companiesCount,
      suffix: "",
      color: "text-blue-400",
      glow: "hover:border-blue-500/60",
    },

    {
      id: "experts",
      label: t("trustedExperts"),
      value: expertsCount,
      suffix: "",
      color: "text-cyan-400",
      glow: "hover:border-cyan-500/60",
    },

    {
      id: "opportunities",
      label: t("tradeOpportunities"),
      value: opportunitiesCount,
      suffix: "",
      color: "text-purple-400",
      glow: "hover:border-purple-500/60",
    },

    {
      id: "cases",
      label: t("tradeCases"),
      value: tradeCasesCount,
      suffix: "",
      color: "text-emerald-400",
      glow: "hover:border-emerald-500/60",
    },

    {
      id: "success",
      label: t("caseSuccessRate"),
      value: successRate,
      suffix: "%",
      color: "text-yellow-400",
      glow: "hover:border-yellow-500/60",
    },
  ];


  return (
    <section id="homepage-stats" className="relative border-b border-slate-800 bg-slate-950 py-[var(--ui-section-space)]">

      <div className="ui-container">


        <div className="mb-14 text-center">

          <p
            className="
              mb-3
              text-sm
              font-bold
              uppercase
              tracking-[0.2em]
              text-blue-400
            "
          >
            {t("eyebrow")}
          </p>


          <h2
            className="
              text-4xl
              font-black
              md:text-5xl
            "
          >
            {t("title")}
          </h2>

        </div>



        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-5
          "
        >

          {stats.map((stat) => (

            <div
              key={stat.id}
              className={`
                group
                ui-card
                ui-card-interactive
                bg-slate-900/70
                text-center
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
                  duration-300
                  group-hover:scale-110
                  ${stat.color}
                `}
              >

                {numberFormatter.format(
                  stat.value,
                )}

                {stat.suffix}

              </p>


              <p
                className="
                  mt-4
                  text-sm
                  text-slate-400
                "
              >
                {stat.label}
              </p>


            </div>

          ))}

        </div>


      </div>

    </section>
  );
}
