import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import ExpertsSearch from "../../components/ExpertsSearch";
import { calculateTrustScore } from "../../../lib/ranking";
import { requireUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardExpertsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const expertScope = user.role === "admin" ? {} : { ownerId: user.id };

  const t = await getTranslations(
    "dashboardExperts",
  );

  const params = await searchParams;

  const parsedPage = Number(params?.page);

  const requestedPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const totalExperts =
    await prisma.expert.count({ where: expertScope });

  const totalPages = Math.max(
    1,
    Math.ceil(totalExperts / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const [
    verificationStats,
    premiumExpertsCount,
    experts,
  ] = await Promise.all([
    prisma.expert.groupBy({
      by: ["verificationStatus"],
      where: expertScope,
      _count: {
        _all: true,
      },
    }),

    prisma.expert.count({
      where: {
        ...expertScope,
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
      where: expertScope,
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

  const verificationCountMap = new Map(
    verificationStats.map((item) => [
      item.verificationStatus,
      item._count._all,
    ]),
  );

  const verifiedExpertsCount =
    verificationCountMap.get("VERIFIED") ?? 0;

  const pendingExpertsCount =
    verificationCountMap.get("PENDING") ?? 0;

  const rejectedExpertsCount =
    verificationCountMap.get("REJECTED") ?? 0;

  const ownerIds = Array.from(
    new Set(
      experts
        .map((expert) => expert.ownerId)
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

  const expertsWithRatings = experts.map(
    (expert) => {
      const ratingStats = expert.ownerId
        ? reviewStatsMap.get(expert.ownerId)
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
        reviewCount,
        trustScore,
      };
    },
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
