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

 // فقط بخش return را تغییر بده، بقیه فایل دست نزن

return (
  <div className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-7xl px-6 py-20">

      <div className="relative mb-14 overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/70 p-8 md:p-12">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.15),transparent_35%)]" />

        <div className="relative">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-blue-400">
            {t("eyebrow")}
          </p>

          <h1 className="mb-5 text-5xl font-black md:text-6xl">
            {t("title")}
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-slate-400">
            {t("description")}
          </p>


          <div className="mt-10 grid gap-5 sm:grid-cols-3">

            <div className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-blue-500/60">
              <p className="text-4xl font-black text-blue-400">
                {numberFormatter.format(totalCompanies)}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                {t("statistics.total")}
              </p>
            </div>


            <div className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-emerald-500/60">
              <p className="text-4xl font-black text-emerald-400">
                {numberFormatter.format(
                  verifiedCompaniesCount,
                )}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                {t("statistics.verified")}
              </p>
            </div>


            <div className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-yellow-500/60">
              <p className="text-4xl font-black text-yellow-400">
                {numberFormatter.format(
                  ratedCompaniesCount,
                )}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                {t("statistics.rated")}
              </p>
            </div>

          </div>

        </div>
      </div>


      <CompaniesSearch
        companies={sortedCompaniesWithRatings}
      />


      <div className="mt-14 flex flex-wrap items-center justify-center gap-4">

        {currentPage > 1 && (
          <Link
            href={`/companies?page=${currentPage - 1}`}
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            {t("pagination.previous")}
          </Link>
        )}


        <span className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-slate-300">
          {t("pagination.page", {
            current: numberFormatter.format(
              currentPage,
            ),
            total: numberFormatter.format(
              totalPages,
            ),
          })}
        </span>


        {currentPage < totalPages && (
          <Link
            href={`/companies?page=${currentPage + 1}`}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-semibold text-white transition hover:scale-[1.02]"
          >
            {t("pagination.next")}
          </Link>
        )}

      </div>

    </div>
  </div>
);
}