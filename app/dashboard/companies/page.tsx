import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import CompaniesSearch from "../../components/CompaniesSearch";
import { calculateTrustScore } from "../../../lib/ranking";
import { requireUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardCompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const companyScope = user.role === "admin" ? {} : { ownerId: user.id };

  const t = await getTranslations(
    "dashboardCompanies",
  );

  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const totalCompanies =
    await prisma.company.count({ where: companyScope });

  const totalPages = Math.max(
    1,
    Math.ceil(totalCompanies / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const [
    verificationStats,
    premiumCompaniesCount,
    companies,
  ] = await Promise.all([
    prisma.company.groupBy({
      by: ["verificationStatus"],
      where: companyScope,
      _count: {
        _all: true,
      },
    }),

    prisma.company.count({
      where: {
        ...companyScope,
        planType: {
          in: [
            "GOLD",
            "DIAMOND",
            "ENTERPRISE",
          ],
        },
      },
    }),

    prisma.company.findMany({
      where: companyScope,
      skip: (currentPage - 1) * PAGE_SIZE,
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
        description: true,
        email: true,
        website: true,
        logoUrl: true,
        ownerId: true,
        verificationStatus: true,
        planType: true,
      },
    }),
  ]);

  const verificationCountMap = new Map(
    verificationStats.map((item) => [
      item.verificationStatus,
      item._count._all,
    ]),
  );

  const verifiedCompaniesCount =
    verificationCountMap.get("VERIFIED") ?? 0;

  const pendingCompaniesCount =
    verificationCountMap.get("PENDING") ?? 0;

  const rejectedCompaniesCount =
    verificationCountMap.get("REJECTED") ?? 0;

  const ownerIds = Array.from(
    new Set(
      companies
        .map((company) => company.ownerId)
        .filter(
          (ownerId): ownerId is number =>
            ownerId !== null,
        ),
    ),
  );

  const reviewStats =
    ownerIds.length > 0
      ? await prisma.review.groupBy({
          by: ["reviewedUserId"],
          where: {
            reviewedUserId: {
              in: ownerIds,
            },
          },
          _avg: {
            rating: true,
          },
          _count: {
            _all: true,
          },
        })
      : [];

  const reviewStatsMap = new Map(
    reviewStats.map((item) => [
      item.reviewedUserId,
      {
        averageRating:
          item._avg.rating ?? 0,
        reviewCount: item._count._all,
      },
    ]),
  );

  const companiesWithRatings = companies.map(
    (company) => {
      const ratingStats = company.ownerId
        ? reviewStatsMap.get(company.ownerId)
        : undefined;

      const averageRating =
        ratingStats?.averageRating ?? 0;

      const reviewCount =
        ratingStats?.reviewCount ?? 0;

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
        description: company.description,
        email: company.email,
        website: company.website,
        logoUrl: company.logoUrl,
        verificationStatus:
          company.verificationStatus,
        planType: company.planType,
        averageRating,
        reviewCount,
        trustScore,
      };
    },
  );

  const stats = [
    {
      key: "total",
      label: t("stats.total"),
      value: totalCompanies,
      borderClass: "border-blue-500",
      textClass: "text-blue-400",
    },
    {
      key: "verified",
      label: t("stats.verified"),
      value: verifiedCompaniesCount,
      borderClass: "border-emerald-500",
      textClass: "text-emerald-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingCompaniesCount,
      borderClass: "border-yellow-500",
      textClass: "text-yellow-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedCompaniesCount,
      borderClass: "border-red-500",
      textClass: "text-red-400",
    },
    {
      key: "premium",
      label: t("stats.premium"),
      value: premiumCompaniesCount,
      borderClass: "border-purple-500",
      textClass: "text-purple-400",
    },
  ];

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
          href="/dashboard/companies/new"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
        >
          {t("addCompany")}
        </Link>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`rounded-2xl border bg-slate-900 p-6 ${stat.borderClass}`}
          >
            <p className="text-sm text-slate-400">
              {stat.label}
            </p>

            <p
              className={`mt-2 text-4xl font-bold ${stat.textClass}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <CompaniesSearch
        companies={companiesWithRatings}
        profileBasePath="/dashboard/companies"
      />

      {totalCompanies > 0 && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`/dashboard/companies?page=${
                currentPage - 1
              }`}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
            >
              {t("pagination.previous")}
            </Link>
          )}

          <span className="px-4 py-2 text-slate-300">
            {t("pagination.page", {
              current: currentPage,
              total: totalPages,
            })}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/dashboard/companies?page=${
                currentPage + 1
              }`}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
            >
              {t("pagination.next")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
