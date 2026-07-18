import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import ExpertsSearch from "../../components/ExpertsSearch";
import { calculateTrustScore } from "../../../lib/ranking";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardExpertsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const t = await getTranslations(
    "dashboardExperts",
  );

  const params = await searchParams;
  const requestedPage =
    Number(params?.page) || 1;

  const totalExperts =
    await prisma.expert.count();

  const totalPages = Math.max(
    1,
    Math.ceil(totalExperts / PAGE_SIZE),
  );

  const currentPage = Math.min(
    Math.max(requestedPage, 1),
    totalPages,
  );

  const [
    verifiedExpertsCount,
    pendingExpertsCount,
    rejectedExpertsCount,
    premiumExpertsCount,
    experts,
  ] = await Promise.all([
    prisma.expert.count({
      where: {
        verificationStatus: "VERIFIED",
      },
    }),
    prisma.expert.count({
      where: {
        verificationStatus: "PENDING",
      },
    }),
    prisma.expert.count({
      where: {
        verificationStatus: "REJECTED",
      },
    }),
    prisma.expert.count({
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
    prisma.expert.findMany({
      skip: (currentPage - 1) * PAGE_SIZE,
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
        email: true,
        imageUrl: true,
        ownerId: true,
        verificationStatus: true,
        planType: true,
      },
    }),
  ]);

  const expertsWithRatings =
    await Promise.all(
      experts.map(async (expert) => {
        const reviews = expert.ownerId
          ? await prisma.review.findMany({
              where: {
                reviewedUserId:
                  expert.ownerId,
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
              expert.verificationStatus,
            planType: expert.planType,
          });

        return {
          id: expert.id,
          name: expert.name,
          country: expert.country,
          specialty: expert.specialty,
          status: expert.status,
          experience: expert.experience,
          email: expert.email,
          imageUrl: expert.imageUrl,
          verificationStatus:
            expert.verificationStatus,
          planType: expert.planType,
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
      value: totalExperts,
      borderClass: "border-blue-500",
      textClass: "text-blue-400",
    },
    {
      key: "verified",
      label: t("stats.verified"),
      value: verifiedExpertsCount,
      borderClass: "border-emerald-500",
      textClass: "text-emerald-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingExpertsCount,
      borderClass: "border-yellow-500",
      textClass: "text-yellow-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedExpertsCount,
      borderClass: "border-red-500",
      textClass: "text-red-400",
    },
    {
      key: "premium",
      label: t("stats.premium"),
      value: premiumExpertsCount,
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
          href="/dashboard/experts/new"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
        >
          {t("addExpert")}
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

      <ExpertsSearch
        experts={expertsWithRatings}
        profileBasePath="/dashboard/experts"
      />

      {totalExperts > 0 && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {currentPage > 1 && (
            <Link
              href={`/dashboard/experts?page=${
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
              href={`/dashboard/experts?page=${
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