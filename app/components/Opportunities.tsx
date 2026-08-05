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
    tags: ["homepage-opportunities"],
  },
);

export default async function Opportunities() {
  const t = await getTranslations("opportunitiesSection");
  const tc = await getTranslations("common.countries");

  function translateCountry(country: string): string {
    const value = country.trim();

    if (tc.has(value)) {
      return tc(value);
    }

    const lower = value.toLowerCase();

    if (tc.has(lower)) {
      return tc(lower);
    }

    const normalized = lower.replaceAll(" ", "_");

    if (tc.has(normalized)) {
      return tc(normalized);
    }

    return value;
  }

  const opportunities = await getHomepageOpportunities();

  return (
    <section
      className="
        relative
        overflow-hidden
        border-y
        border-slate-800
        bg-slate-950
        py-28
      "
    >
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]
        "
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div
          className="
            mb-12
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <div
              className="
                mb-5
                inline-flex
                items-center
                gap-3
                rounded-full
                border
                border-blue-500/30
                bg-blue-500/10
                px-5
                py-2
                text-sm
                font-bold
                text-blue-300
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-blue-400
                "
              />

              {t("eyebrow")}
            </div>

            <h2
              className="
                mb-4
                text-4xl
                font-black
                md:text-6xl
              "
            >
              {t("title")}
            </h2>

            <p
              className="
                max-w-2xl
                text-lg
                leading-8
                text-slate-400
              "
            >
              {t("description")}
            </p>
          </div>

          <Link
            href="/opportunities"
            className="
              rounded-xl
              border
              border-blue-500/40
              bg-blue-500/10
              px-6
              py-3
              font-bold
              text-blue-300
              transition
              hover:bg-blue-600
              hover:text-white
            "
          >
            {t("viewAll")} <span aria-hidden="true">→</span>
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-10
              text-center
              text-slate-400
            "
          >
            {t("empty")}
          </div>
        ) : (
          <div
            className="
              grid
              gap-7
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-slate-800
                  bg-slate-900/80
                  p-7
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:border-blue-500/60
                  hover:shadow-2xl
                  hover:shadow-blue-500/10
                "
              >
                <div
                  className="
                    absolute
                    end-0
                    top-0
                    h-32
                    w-32
                    rounded-full
                    bg-blue-500/10
                    blur-3xl
                    transition
                    group-hover:bg-blue-500/20
                  "
                />

                <div className="relative">
                  <div
                    className="
                      mb-6
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <span
                      className="
                        rounded-full
                        border
                        border-blue-500/30
                        bg-blue-500/10
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-blue-300
                      "
                    >
                      {translateCountry(opportunity.country)}
                    </span>

                    <span
                      className="
                        rounded-full
                        border
                        border-emerald-500/30
                        bg-emerald-500/10
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-emerald-300
                      "
                    >
                      {t("statusOpen")}
                    </span>
                  </div>

                  <div
                    className="
                      mb-6
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-blue-600
                      via-cyan-500
                      to-emerald-500
                      text-3xl
                      shadow-lg
                      shadow-blue-500/20
                    "
                  >
                    🌍
                  </div>

                  <h3
                    className="
                      mb-4
                      line-clamp-2
                      text-2xl
                      font-black
                    "
                  >
                    {opportunity.title}
                  </h3>

                  <p
                    className="
                      line-clamp-3
                      leading-7
                      text-slate-400
                    "
                  >
                    {opportunity.description}
                  </p>

                  <div
                    className="
                      mt-7
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-800
                      pt-5
                    "
                  >
                    <span
                      className="
                        text-sm
                        font-bold
                        text-emerald-400
                      "
                    >
                      ● {t("openOpportunity")}
                    </span>

                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="
                        font-bold
                        text-blue-400
                        transition
                        hover:text-cyan-300
                      "
                    >
                      {t("viewDetails")} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
