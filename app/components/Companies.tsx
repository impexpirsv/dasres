import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../lib/prisma";
import { unstable_cache } from "next/cache";
const getHomepageCompanies = unstable_cache(
  async () => {
    return prisma.company.findMany({
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
  ["homepage-companies"],
  {
    revalidate: 300,
  },
);
export default async function Companies() {
  const t = await getTranslations("companiesSection");

 const companies =
  await getHomepageCompanies();

  return (
    <section className="border-y border-slate-800 bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-semibold text-cyan-400">
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
            href="/companies"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            {t("viewAll")} <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-emerald-500 text-3xl">
                  🏢
                </div>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                    {t("verified")}
                  </span>
                )}
              </div>

              <h3 className="mb-3 text-2xl font-bold">
                {company.name}
              </h3>

              <p className="text-cyan-400">
                {company.category}
              </p>

              <p className="mt-2 text-slate-400">
                {company.country}
              </p>

              <p className="mt-4 line-clamp-2 leading-7 text-slate-500">
                {company.description}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                <span className="text-sm text-emerald-400">
                  ● {t("acceptingProjects")}
                </span>

                <Link
                  href={`/companies/${company.id}`}
                  className="font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {t("viewProfile")} <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}