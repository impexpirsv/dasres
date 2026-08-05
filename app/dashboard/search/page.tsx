import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { getCaseSearchVisibilityScope } from "../../../lib/cases";

export const dynamic = "force-dynamic";

function normalizeStatus(status: string) {
  return status
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardSearch",
  );

  const [tc, tcat, ts] = await Promise.all([
    getTranslations("common.countries"),
    getTranslations("common.categories"),
    getTranslations("common.specialties"),
  ]);

  function translateCountry(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    return tc.has(normalized) ? tc(normalized) : tc.has(lower) ? tc(lower) : normalized;
  }

  function translateCategory(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return tcat.has(normalized) ? tcat(normalized) : tcat.has(lower) ? tcat(lower) : tcat.has(underscored) ? tcat(underscored) : normalized;
  }

  function translateSpecialty(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return ts.has(normalized) ? ts(normalized) : ts.has(lower) ? ts(lower) : ts.has(underscored) ? ts(underscored) : normalized;
  }

  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const [companies, experts, opportunities, cases] = q
    ? await Promise.all([
      prisma.company.findMany({
        where: {
          verificationStatus: "VERIFIED",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          country: true,
          category: true,
        },
        take: 5,
        orderBy: {
          id: "desc",
        },
      }),
      prisma.expert.findMany({
        where: {
          verificationStatus: "VERIFIED",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
            { experience: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          country: true,
          specialty: true,
        },
        take: 5,
        orderBy: {
          id: "desc",
        },
      }),
      prisma.opportunity.findMany({
        where: {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              country: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              status: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 5,
        orderBy: {
          id: "desc",
        },
      }),
      prisma.tradeCase.findMany({
        where: {
          AND: [
            getCaseSearchVisibilityScope({
              userId: user.id,
              userRole: user.role,
            }),
            {
              OR: [
                {
                  title: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  category: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
        },
        take: 5,
        orderBy: {
          id: "desc",
        },
      }),
    ])
    : [[], [], [], []];

  const totalResults =
    companies.length +
    experts.length +
    opportunities.length +
    cases.length;

  const sections = [
    {
      key: "companies",
      title: t("sections.companies.title"),
      count: companies.length,
      color: "text-blue-400",
    },
    {
      key: "experts",
      title: t("sections.experts.title"),
      count: experts.length,
      color: "text-cyan-400",
    },
    {
      key: "opportunities",
      title: t(
        "sections.opportunities.title",
      ),
      count: opportunities.length,
      color: "text-purple-400",
    },
    {
      key: "tradeCases",
      title: t("sections.tradeCases.title"),
      count: cases.length,
      color: "text-emerald-400",
    },
  ];

  function getStatusLabel(status: string) {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "open":
        return t("statuses.open");

      case "in_progress":
        return t("statuses.inProgress");

      case "completed":
        return t("statuses.completed");

      case "closed":
        return t("statuses.closed");

      case "pending":
        return t("statuses.pending");

      case "cancelled":
        return t("statuses.cancelled");

      default:
        return status;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <p className="mb-3 font-semibold text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("description")}
        </p>
      </div>

      <form className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <label
          htmlFor="dashboard-global-search"
          className="sr-only"
        >
          {t("searchLabel")}
        </label>

        <input
          id="dashboard-global-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="mt-4 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
        >
          {t("searchButton")}
        </button>
      </form>

      {!q ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
          {t("initialState")}
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-slate-400">
            {t("resultsSummary", {
              count: totalResults,
            })}{" "}
            <span className="font-semibold text-white">
              &quot;{q}&quot;
            </span>
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {sections.map((section) => (
              <div
                key={section.key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-500">
                  {section.title}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${section.color}`}
                >
                  {section.count}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {t("sections.companies.title")}
            </h2>

            {companies.length === 0 ? (
              <p className="text-slate-500">
                {t("sections.companies.empty")}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500"
                  >
                    <p className="text-lg font-bold">
                      {company.name}
                    </p>

                    <p className="mt-1 text-blue-400">
                      {translateCategory(company.category)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {translateCountry(company.country)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {t("sections.experts.title")}
            </h2>

            {experts.length === 0 ? (
              <p className="text-slate-500">
                {t("sections.experts.empty")}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {experts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/dashboard/experts/${expert.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500"
                  >
                    <p className="text-lg font-bold">
                      {expert.name}
                    </p>

                    <p className="mt-1 text-cyan-400">
                      {translateSpecialty(expert.specialty)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {translateCountry(expert.country)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {t(
                "sections.opportunities.title",
              )}
            </h2>

            {opportunities.length === 0 ? (
              <p className="text-slate-500">
                {t(
                  "sections.opportunities.empty",
                )}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map(
                  (opportunity) => (
                    <Link
                      key={opportunity.id}
                      href={`/dashboard/opportunities/${opportunity.id}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-purple-500"
                    >
                      <p className="text-lg font-bold">
                        {opportunity.title}
                      </p>

                      <p className="mt-1 text-purple-400">
                        {translateCountry(opportunity.country)}
                      </p>

                      <p className="mt-1 text-slate-400">
                        {getStatusLabel(
                          opportunity.status,
                        )}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {t("sections.tradeCases.title")}
            </h2>

            {cases.length === 0 ? (
              <p className="text-slate-500">
                {t("sections.tradeCases.empty")}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cases.map((tradeCase) => (
                  <Link
                    key={tradeCase.id}
                    href={
                      tradeCase.status === "OPEN" && user.role !== "admin"
                        ? "/dashboard/open-cases"
                        : `/dashboard/cases/${tradeCase.id}`
                    }
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500"
                  >
                    <p className="text-lg font-bold">
                      {tradeCase.title}
                    </p>

                    <p className="mt-1 text-emerald-400">
                      {translateCategory(tradeCase.category)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {getStatusLabel(
                        tradeCase.status,
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
