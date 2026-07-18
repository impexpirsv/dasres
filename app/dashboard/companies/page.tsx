import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import CompaniesSearch from "../../components/CompaniesSearch";
import { calculateTrustScore } from "../../../lib/ranking";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardCompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const t = await getTranslations(
    "dashboardCompanies",
  );

  const params = await searchParams;
  const requestedPage =
    Number(params?.page) || 1;

  const totalCompanies =
    await prisma.company.count();

  const totalPages = Math.max(
    1,
    Math.ceil(totalCompanies / PAGE_SIZE),
  );

  const currentPage = Math.min(
    Math.max(requestedPage, 1),
    totalPages,
  );

  const [
    verifiedCompaniesCount,
    pendingCompaniesCount,
    rejectedCompaniesCount,
    premiumCompaniesCount,
    companies,
  ] = await Promise.all([
    prisma.company.count({
      where: {
        verificationStatus: "VERIFIED",
      },
    }),
    prisma.company.count({
      where: {
        verificationStatus: "PENDING",
      },
    }),
    prisma.company.count({
      where: {
        verificationStatus: "REJECTED",
      },
    }),
    prisma.company.count({
      where: {
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

  const companiesWithRatings =
    await Promise.all(
      companies.map(async (company) => {
        const reviews = company.ownerId
          ? await prisma.review.findMany({
              where: {
                reviewedUserId:
                  company.ownerId,
              },
              select: {
                rating: true,
              },
            })
          : [];

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
          description:
            company.description,
          email: company.email,
          website: company.website,
          logoUrl: company.logoUrl,
          verificationStatus:
            company.verificationStatus,
          planType: company.planType,
          averageRating,
          reviewCount: reviews.length,
          trustScore,
        };
      }),
    );

  const stats = [
    {
      key: "total",
      label: t("stats.total"),
      value: totalCompanies,
      className:
        "border-blue-500 text-blue-400",
    },
    {
      key: "verified",
      label: t("stats.verified"),
      value: verifiedCompaniesCount,
      className:
        "border-emerald-500 text-emerald-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingCompaniesCount,
      className:
        "border-yellow-500 text-yellow-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedCompaniesCount,
      className:
        "border-red-500 text-red-400",
    },
    {
      key: "premium",
      label: t("stats.premium"),
      value: premiumCompaniesCount,
      className:
        "border-purple-500 text-purple-400",
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
            className={`rounded-2xl border bg-slate-900 p-6 ${stat.className}`}
          >
            <p className="text-sm text-slate-400">
              {stat.label}
            </p>

            <p
              className={`mt-2 text-4xl font-bold ${stat.className
                .split(" ")
                .find((value) =>
                  value.startsWith("text-"),
                )}`}
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