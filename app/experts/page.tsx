import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";
import { defaultLocale, isLocale, type Locale } from "../../lib/locale";
import { getAlternateOpenGraphLocales, openGraphLocaleMap } from "../../lib/seo/localized-homepage";
import { getLocalizedExpertsAlternates } from "../../lib/seo/localized-experts";
import { serializeJsonLd } from "../../lib/seo/jsonld";
import {
  createPublicPageMetadata,
  getPaginationMetadataState,
} from "../../lib/seo/metadata";
import { createDirectoryPageJsonLd } from "../../lib/seo/structured-data";
import ExpertsSearch from "../components/ExpertsSearch";

const PAGE_SIZE = 10;

const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

type ExpertsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
  routeLocale?: Locale;
  localized?: boolean;
};

const getExpertsCount = unstable_cache(
  () =>
    prisma.expert.count({
      where: { verificationStatus: "VERIFIED" },
    }),
  ["public-experts-count"],
  {
    revalidate: 300,
    tags: ["public-experts"],
  },
);

const getExpertsPageData = unstable_cache(
  async (requestedPage: number) => {
    const totalExperts = await getExpertsCount();

    const totalPages = Math.max(
      1,
      Math.ceil(totalExperts / PAGE_SIZE),
    );

    const currentPage = Math.min(
      Math.max(1, requestedPage),
      totalPages,
    );

    const experts =
      await prisma.expert.findMany({
        where: { verificationStatus: "VERIFIED" },
        skip:
          (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          name: true,
          country: true,
          specialty: true,
          status: true,
          experience: true,
          imageUrl: true,
          planType: true,
          owner: {
            select: {
              reviewsReceived: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      });

    return {
      totalExperts,
      totalPages,
      currentPage,
      experts,
    };
  },
  ["public-experts-page"],
  {
    revalidate: 300,
    tags: ["public-experts"],
  },
);

export async function createExpertsMetadata({
  searchParams,
  routeLocale,
  localized = false,
}: ExpertsPageProps): Promise<Metadata> {
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations({ locale, namespace: "publicExperts" }),
  ]);
  const rawPage = params?.page;
  const totalExperts = await getExpertsCount();
  const totalPages = Math.max(
    1,
    Math.ceil(totalExperts / PAGE_SIZE),
  );
  const pagination = getPaginationMetadataState({
    pathname: localized ? `/${locale}/experts` : "/experts",
    rawPage,
    totalPages,
  });

  const metadata = createPublicPageMetadata({
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

  if (!localized || !pagination.isValid) return metadata;

  return {
    ...metadata,
    alternates: {
      canonical: pagination.canonical,
      languages: getLocalizedExpertsAlternates({ page: pagination.page }),
    },
    openGraph: {
      ...metadata.openGraph,
      url: pagination.canonical,
      locale: openGraphLocaleMap[locale],
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
  };
}

export const generateMetadata = createExpertsMetadata;

export default async function ExpertsPage({
  searchParams,
  routeLocale,
  localized = false,
}: ExpertsPageProps) {
  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const expertsPath = localized ? `/${locale}/experts` : "/experts";

  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "publicExperts" }),
    getTranslations({ locale, namespace: "navbar" }),
  ]);

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const ratingFormatter =
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const {
    totalExperts,
    totalPages,
    currentPage,
    experts,
  } = await getExpertsPageData(
    requestedPage,
  );

  const expertsWithRatings = experts.map(
    (expert) => {
      const reviews =
        expert.owner?.reviewsReceived ?? [];

      const averageRating =
        reviews.length > 0
          ? reviews.reduce(
              (sum, review) =>
                sum + review.rating,
              0,
            ) / reviews.length
          : 0;

      const trustScore =
        calculateTrustScore({
          averageRating,
          completedCases: 0,
          verificationStatus: "VERIFIED",
          planType: expert.planType,
        });

      return {
        id: expert.id,
        name: expert.name,
        country: expert.country,
        specialty: expert.specialty,
        status: expert.status,
        verificationStatus: "VERIFIED",
        experience: expert.experience,
        imageUrl: expert.imageUrl,
        planType: expert.planType,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    },
  );

  const sortedExpertsWithRatings = [
    ...expertsWithRatings,
  ].sort(
    (first, second) =>
      planPriority[second.planType] -
        planPriority[first.planType] ||
      second.trustScore -
        first.trustScore ||
      second.averageRating -
        first.averageRating ||
      second.reviewCount -
        first.reviewCount ||
      second.id - first.id,
  );

  const featuredExpert =
    sortedExpertsWithRatings[0] ?? null;

  const verifiedExpertsCount = totalExperts;

  const ratedExpertsCount =
    sortedExpertsWithRatings.filter(
      (expert) =>
        expert.averageRating > 0,
    ).length;

  const pagination = getPaginationMetadataState({
    pathname: expertsPath,
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
            pathname: localized ? `/${locale}` : "/",
          },
          {
            name: navigation("experts"),
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
          <div className="mb-10 grid items-stretch gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <p className="mb-3 font-semibold text-blue-400">
                {t("eyebrow")}
              </p>

              <h1 className="mb-5 text-5xl font-black md:text-6xl">
                {t("title")}
              </h1>

              <p className="max-w-3xl text-lg leading-8 text-slate-400">
                {t("description")}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-sm text-blue-400">
                {t("featured.title")}
              </p>

              {featuredExpert ? (
                <>
                  <h2 className="mt-2 text-3xl font-bold">
                    {featuredExpert.name}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    {featuredExpert.specialty}
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-2xl font-bold text-emerald-400">
                        {numberFormatter.format(
                          featuredExpert.trustScore,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {t("metrics.trust")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-2xl font-bold text-yellow-400">
                        {featuredExpert.averageRating >
                        0
                          ? ratingFormatter.format(
                              featuredExpert.averageRating,
                            )
                          : t("notAvailable")}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {t("metrics.rating")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-2xl font-bold text-blue-400">
                        {numberFormatter.format(
                          featuredExpert.reviewCount,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {t("metrics.reviews")}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`${expertsPath}/${featuredExpert.id}`}
                    className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                  >
                    {t("featured.viewProfile")}
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-slate-500">
                  {t("featured.empty")}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-blue-400">
                {numberFormatter.format(
                  totalExperts,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.total")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-emerald-400">
                {numberFormatter.format(
                  verifiedExpertsCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.verified")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-yellow-400">
                {numberFormatter.format(
                  ratedExpertsCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.rated")}
              </p>
            </div>
          </div>
        </div>

        <ExpertsSearch
          experts={sortedExpertsWithRatings}
          profileBasePath={expertsPath}
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`${expertsPath}?page=${
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
              href={`${expertsPath}?page=${
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
