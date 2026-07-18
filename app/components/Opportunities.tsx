import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../lib/prisma";

const getHomepageOpportunities = unstable_cache(
  async () => {
    return prisma.opportunity.findMany({
      where: {
        status: "OPEN",
      },
      take: 6,
      orderBy: {
        id: "desc",
      },
    });
  },
  ["homepage-opportunities"],
  {
    revalidate: 300,
  },
);

export default async function Opportunities() {
  const t = await getTranslations(
    "opportunitiesSection",
  );

  const opportunities =
    await getHomepageOpportunities();

  return (
    <section className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-semibold text-blue-400">
              {t("eyebrow")}
            </p>

            <h2 className="mb-3 text-4xl font-bold md:text-5xl">
              {t("title")}
            </h2>

            <p className="max-w-2xl text-slate-400">
              {t("description")}
            </p>
          </div>

          <Link
            href="/opportunities"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            {t("viewAll")}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs text-blue-300">
                  {opportunity.country}
                </span>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  {t("statusOpen")}
                </span>
              </div>

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-3xl">
                🌍
              </div>

              <h3 className="mb-4 line-clamp-2 text-2xl font-bold">
                {opportunity.title}
              </h3>

              <p className="line-clamp-3 leading-7 text-slate-400">
                {opportunity.description}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                <span className="text-sm text-emerald-400">
                  ● {t("openOpportunity")}
                </span>

                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  {t("viewDetails")}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}