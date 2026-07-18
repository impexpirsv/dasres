import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";
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
};

const getExpertsPageData = unstable_cache(
  async (requestedPage: number) => {
    const totalExperts =
      await prisma.expert.count();

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
          verificationStatus: true,
          experience: true,
          email: true,
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

export default async function ExpertsPage({
  searchParams,
}: ExpertsPageProps) {
  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const locale = await getLocale();

  const t = await getTranslations(
    "publicExperts",
  );

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
          verificationStatus:
            expert.verificationStatus,
          planType: expert.planType,
        });

      return {
        id: expert.id,
        name: expert.name,
        country: expert.country,
        specialty: expert.specialty,
        status: expert.status,
        verificationStatus:
          expert.verificationStatus,
        experience: expert.experience,
        email: expert.email,
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

  const verifiedExpertsCount =
    sortedExpertsWithRatings.filter(
      (expert) =>
        expert.verificationStatus ===
        "VERIFIED",
    ).length;

  const ratedExpertsCount =
    sortedExpertsWithRatings.filter(
      (expert) =>
        expert.averageRating > 0,
    ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
                    href={`/experts/${featuredExpert.id}`}
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
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`/experts?page=${
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
              href={`/experts?page=${
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