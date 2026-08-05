import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../lib/prisma";
import { serializeJsonLd } from "../../lib/seo/jsonld";
import {
  createPublicPageMetadata,
  getPaginationMetadataState,
} from "../../lib/seo/metadata";
import { createDirectoryPageJsonLd } from "../../lib/seo/structured-data";
import OpportunitiesSearch from "../components/OpportunitiesSearch";

const PAGE_SIZE = 10;

type OpportunitiesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const getOpportunitiesCount = unstable_cache(
  () => prisma.opportunity.count(),
  ["public-opportunities-count"],
  {
    revalidate: 300,
    tags: ["public-opportunities"],
  },
);

const getOpportunitiesPageData = unstable_cache(
  async (requestedPage: number) => {
    const [
      totalOpportunities,
      openOpportunitiesCount,
      opportunityCountries,
    ] = await Promise.all([
      getOpportunitiesCount(),

      prisma.opportunity.count({
        where: {
          status: "OPEN",
        },
      }),

      prisma.opportunity.findMany({
        distinct: ["country"],
        select: {
          country: true,
        },
      }),
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(
        totalOpportunities / PAGE_SIZE,
      ),
    );

    const currentPage = Math.min(
      Math.max(1, requestedPage),
      totalPages,
    );

    const opportunities =
      await prisma.opportunity.findMany({
        skip:
          (currentPage - 1) * PAGE_SIZE,
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

    return {
      totalOpportunities,
      openOpportunitiesCount,
      countriesCount:
        opportunityCountries.length,
      totalPages,
      currentPage,
      opportunities,
    };
  },
  ["public-opportunities-page"],
  {
    revalidate: 300,
    tags: ["public-opportunities"],
  },
);

export async function generateMetadata({
  searchParams,
}: OpportunitiesPageProps): Promise<Metadata> {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("publicOpportunities"),
  ]);
  const rawPage = params?.page;
  const totalOpportunities =
    await getOpportunitiesCount();
  const totalPages = Math.max(
    1,
    Math.ceil(totalOpportunities / PAGE_SIZE),
  );
  const pagination = getPaginationMetadataState({
    pathname: "/opportunities",
    rawPage,
    totalPages,
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    canonical: pagination.isValid
      ? pagination.canonical
      : undefined,
    robots: pagination.isValid
      ? undefined
      : {
          index: false,
          follow: true,
        },
  });
}

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const locale = await getLocale();

  const [t, navigation] = await Promise.all([
    getTranslations("publicOpportunities"),
    getTranslations("navbar"),
  ]);

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const {
    totalOpportunities,
    openOpportunitiesCount,
    countriesCount,
    totalPages,
    currentPage,
    opportunities,
  } = await getOpportunitiesPageData(
    requestedPage,
  );
  const pagination = getPaginationMetadataState({
    pathname: "/opportunities",
    rawPage: params?.page,
    totalPages,
  });
  const directoryJsonLd = pagination.isValid
    ? createDirectoryPageJsonLd({
        canonicalPath: pagination.canonical,
        name: t("title"),
        description: t("description"),
        language: locale,
        breadcrumbs: [
          {
            name: navigation("home"),
            pathname: "/",
          },
          {
            name: navigation("opportunities"),
            pathname: pagination.canonical,
          },
        ],
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {directoryJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(directoryJsonLd),
          }}
        />
      )}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <p className="mb-3 font-semibold text-blue-400">
            {t("eyebrow")}
          </p>

          <h1 className="mb-5 text-5xl font-black md:text-6xl">
            {t("title")}
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-slate-400">
            {t("description")}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-blue-400">
                {numberFormatter.format(
                  totalOpportunities,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.total")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-emerald-400">
                {numberFormatter.format(
                  openOpportunitiesCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.open")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-purple-400">
                {numberFormatter.format(
                  countriesCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.countries")}
              </p>
            </div>
          </div>
        </div>

        <OpportunitiesSearch
          opportunities={opportunities}
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`/opportunities?page=${
                currentPage - 1
              }`}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
            >
              {t("pagination.previous")}
            </Link>
          )}

          <span className="px-4 py-2 text-slate-300">
            {t("pagination.page", {
              current:
                numberFormatter.format(
                  currentPage,
                ),
              total:
                numberFormatter.format(
                  totalPages,
                ),
            })}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/opportunities?page=${
                currentPage + 1
              }`}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
            >
              {t("pagination.next")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
