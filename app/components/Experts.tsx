import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../lib/prisma";

const getHomepageExperts = unstable_cache(
  async () => {
    return prisma.expert.findMany({
      take: 6,
      where: {
        verificationStatus: "VERIFIED",
      },
      orderBy: [
        {
          verifiedAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });
  },
  ["homepage-experts"],
  {
    revalidate: 300,
  },
);

export default async function Experts() {
  const t = await getTranslations(
    "expertsSection",
  );

  const experts = await getHomepageExperts();

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
            href="/experts"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            {t("viewAll")}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl">
                👨‍💼
              </div>

              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {expert.name}
                </h3>

                <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                  {t("verified")}
                </span>
              </div>

              <p className="text-blue-400">
                {expert.specialty}
              </p>

              <p className="mt-2 text-slate-400">
                {expert.country}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                <span className="text-sm text-emerald-400">
                  ● {t("available")}
                </span>

                <Link
                  href={`/experts/${expert.id}`}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  {t("viewProfile")}{" "}
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