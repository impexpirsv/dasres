import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { calculateTrustScore } from "../../../lib/ranking";

export default async function TopCompaniesPage() {
  await requireUser();

  const [t, locale, companies] = await Promise.all([
    getTranslations("dashboardTopCompanies"),
    getLocale(),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        country: true,
        verificationStatus: true,
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
    }),
  ]);

  const numberFormatter = new Intl.NumberFormat(locale);

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const rankedCompanies = companies
    .map((company) => {
      const reviews = company.owner?.reviewsReceived ?? [];
      const reviewCount = reviews.length;

      const averageRating =
        reviewCount > 0
          ? reviews.reduce(
              (sum, review) => sum + review.rating,
              0,
            ) / reviewCount
          : 0;

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus: company.verificationStatus,
        planType: company.planType,
      });

      return {
        id: company.id,
        name: company.name,
        category: company.category,
        country: company.country,
        verificationStatus: company.verificationStatus,
        planType: company.planType,
        averageRating,
        reviewCount,
        trustScore,
      };
    })
    .sort(
      (a, b) =>
        b.trustScore - a.trustScore ||
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount,
    );

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "GOLD":
        return t("plans.gold");

      case "DIAMOND":
        return t("plans.diamond");

      case "ENTERPRISE":
        return t("plans.enterprise");

      default:
        return t("plans.free");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold">
            {t("title")}
          </h1>

          <p className="text-slate-400">
            {t("description")}
          </p>
        </div>

        {rankedCompanies.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-5">
            {rankedCompanies.map((company, index) => (
              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="block rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-2xl font-bold text-blue-400">
                      #{numberFormatter.format(index + 1)}
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          {company.name}
                        </h2>

                        {company.verificationStatus === "VERIFIED" && (
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs">
                            ✓ {t("verified")}
                          </span>
                        )}

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {getPlanLabel(company.planType)}
                        </span>
                      </div>

                      <p className="text-blue-400">
                        {company.category}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {company.country}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-full grid-cols-1 gap-4 sm:grid-cols-3 md:min-w-[420px]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.trust")}
                      </p>

                      <p className="text-2xl font-bold text-emerald-400">
                        {numberFormatter.format(company.trustScore)}/
                        {numberFormatter.format(100)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.rating")}
                      </p>

                      <p className="text-2xl font-bold text-yellow-400">
                        {company.averageRating > 0
                          ? ratingFormatter.format(company.averageRating)
                          : t("notAvailable")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.reviews")}
                      </p>

                      <p className="text-2xl font-bold text-blue-400">
                        {numberFormatter.format(company.reviewCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}