import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";
import CompaniesSearch from "../components/CompaniesSearch";

const PAGE_SIZE = 10;

const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

type CompaniesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const getCompaniesPageData = unstable_cache(
  async (requestedPage: number) => {
    const totalCompanies =
      await prisma.company.count();

    const totalPages = Math.max(
      1,
      Math.ceil(totalCompanies / PAGE_SIZE),
    );

    const currentPage = Math.min(
      Math.max(1, requestedPage),
      totalPages,
    );

    const companies =
      await prisma.company.findMany({
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
          category: true,
          status: true,
          verificationStatus: true,
          description: true,
          email: true,
          website: true,
          logoUrl: true,
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
      totalCompanies,
      totalPages,
      currentPage,
      companies,
    };
  },
  ["public-companies-page"],
  {
    revalidate: 300,
    tags: ["public-companies"],
  },
);

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const locale = await getLocale();

  const t = await getTranslations(
    "publicCompanies",
  );

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const {
    totalCompanies,
    totalPages,
    currentPage,
    companies,
  } = await getCompaniesPageData(
    requestedPage,
  );

  const companiesWithRatings =
    companies.map((company) => {
      const reviews =
        company.owner?.reviewsReceived ??
        [];

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
            company.verificationStatus,
          planType: company.planType,
        });

      return {
        id: company.id,
        name: company.name,
        country: company.country,
        category: company.category,
        status: company.status,
        verificationStatus:
          company.verificationStatus,
        description: company.description,
        email: company.email,
        website: company.website,
        logoUrl: company.logoUrl,
        planType: company.planType,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    });

  const sortedCompaniesWithRatings = [
    ...companiesWithRatings,
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

  const verifiedCompaniesCount =
    sortedCompaniesWithRatings.filter(
      (company) =>
        company.verificationStatus ===
        "VERIFIED",
    ).length;

  const ratedCompaniesCount =
    sortedCompaniesWithRatings.filter(
      (company) =>
        company.averageRating > 0,
    ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
                  totalCompanies,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.total")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-emerald-400">
                {numberFormatter.format(
                  verifiedCompaniesCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.verified")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-yellow-400">
                {numberFormatter.format(
                  ratedCompaniesCount,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {t("statistics.rated")}
              </p>
            </div>
          </div>
        </div>

        <CompaniesSearch
          companies={
            sortedCompaniesWithRatings
          }
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`/companies?page=${
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
              href={`/companies?page=${
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