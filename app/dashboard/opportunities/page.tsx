import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../../lib/prisma";
import OpportunitiesSearch from "../../components/OpportunitiesSearch";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardOpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const requestedPage = Number(
    params?.page,
  );

  const currentPage =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const [t, locale] =
    await Promise.all([
      getTranslations(
        "opportunities.dashboard",
      ),
      getLocale(),
    ]);
const tc = await getTranslations(
  "common.countries",
);

  function translateCountry(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    return tc.has(normalized) ? tc(normalized) : tc.has(lower) ? tc(lower) : normalized;
  }

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const [
    totalOpportunities,
    activeOpportunities,
    closedOpportunities,
    countries,
    latestOpportunity,
  ] = await Promise.all([
    prisma.opportunity.count(),

    prisma.opportunity.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.opportunity.count({
      where: {
        status: "CLOSED",
      },
    }),

    prisma.opportunity.groupBy({
      by: ["country"],
    }),

    prisma.opportunity.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        title: true,
        country: true,
      },
    }),
  ]);

  const uniqueCountries =
    countries.length;

  const totalPages = Math.ceil(
    totalOpportunities / PAGE_SIZE,
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages,
        )
      : 1;

  const opportunities =
    await prisma.opportunity.findMany({
      skip:
        (safeCurrentPage - 1) *
        PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        title: true,
        country: true,
        status: true,
        description: true,
        imageUrl: true,
      },
    });

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-4 text-5xl font-bold">
            {t("title")}
          </h1>

          <p className="text-slate-400">
            {t("description")}
          </p>
        </div>

        <Link
          href="/dashboard/opportunities/new"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center hover:bg-blue-700"
        >
          {t("addOpportunity")}
        </Link>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("stats.total")}
          </p>

          <p className="mt-2 text-4xl font-bold text-blue-400">
            {numberFormatter.format(
              totalOpportunities,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("stats.active")}
          </p>

          <p className="mt-2 text-4xl font-bold text-emerald-400">
            {numberFormatter.format(
              activeOpportunities,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("stats.closed")}
          </p>

          <p className="mt-2 text-4xl font-bold text-red-400">
            {numberFormatter.format(
              closedOpportunities,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("stats.countries")}
          </p>

          <p className="mt-2 text-4xl font-bold text-cyan-400">
            {numberFormatter.format(
              uniqueCountries,
            )}
          </p>
        </div>
      </div>

      {latestOpportunity && (
        <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-2 text-sm text-slate-500">
            {t("latestOpportunity")}
          </p>

          <h2 className="text-2xl font-bold">
            {latestOpportunity.title}
          </h2>

         <p className="mt-2 text-slate-400">
  {translateCountry(latestOpportunity.country)}
</p>
        </div>
      )}

      <OpportunitiesSearch
        opportunities={opportunities}
      />

      <div className="mt-12 flex justify-center gap-4">
        {safeCurrentPage > 1 && (
          <Link
            href={`/dashboard/opportunities?page=${
              safeCurrentPage - 1
            }`}
            className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            {t("pagination.previous")}
          </Link>
        )}

        <span className="px-4 py-2 text-slate-300">
          {t("pagination.page", {
            current:
              numberFormatter.format(
                safeCurrentPage,
              ),
            total:
              numberFormatter.format(
                totalPages || 1,
              ),
          })}
        </span>

        {safeCurrentPage <
          totalPages && (
          <Link
            href={`/dashboard/opportunities?page=${
              safeCurrentPage + 1
            }`}
            className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            {t("pagination.next")}
          </Link>
        )}
      </div>
    </div>
  );
}
