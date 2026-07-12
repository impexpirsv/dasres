import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";

function getAverageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return 0;

  return (
    reviews.reduce((sum, review) => sum + review.rating, 0) /
    reviews.length
  );
}

export default async function TopRatedShowcase() {
  const t = await getTranslations("topRatedShowcase");

  const [companies, experts] = await Promise.all([
    prisma.company.findMany({
      where: {
        verificationStatus: "VERIFIED",
      },
      include: {
        owner: {
          include: {
            reviewsReceived: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    }),

    prisma.expert.findMany({
      where: {
        verificationStatus: "VERIFIED",
      },
      include: {
        owner: {
          include: {
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

  const topCompany = companies
    .map((company) => {
      const reviews = company.owner?.reviewsReceived || [];
      const averageRating = getAverageRating(reviews);

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus: company.verificationStatus,
        planType: company.planType,
      });

      return {
        ...company,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    })
    .sort(
      (a, b) =>
        b.trustScore - a.trustScore ||
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount,
    )[0];

  const topExpert = experts
    .map((expert) => {
      const reviews = expert.owner?.reviewsReceived || [];
      const averageRating = getAverageRating(reviews);

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus: expert.verificationStatus,
        planType: expert.planType,
      });

      return {
        ...expert,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    })
    .sort(
      (a, b) =>
        b.trustScore - a.trustScore ||
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount,
    )[0];

  if (!topCompany && !topExpert) {
    return null;
  }

  function ratingText(value: number) {
    return value > 0 ? value.toFixed(1) : t("noReviews");
  }

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.12),_transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {t("eyebrow")}
            </div>

            <h2 className="mb-6 text-4xl font-black leading-tight md:text-6xl">
              {t("titleLine1")}

              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {t("titleLine2")}
              </span>
            </h2>

            <p className="mb-8 text-lg leading-8 text-slate-400">
              {t("description")}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-3xl font-bold text-emerald-400">✓</p>
                <p className="mt-2 text-slate-400">
                  {t("verifiedProfiles")}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-3xl font-bold text-yellow-400">★</p>
                <p className="mt-2 text-slate-400">
                  {t("reviewHistory")}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p dir="ltr" className="text-3xl font-bold text-blue-400">
                  100
                </p>
                <p className="mt-2 text-slate-400">
                  {t("trustScoring")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {topCompany && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/85 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-5 text-5xl">🏆</div>

                    <p className="mb-2 font-semibold text-blue-400">
                      {t("topCompany")}
                    </p>

                    <h3 className="mb-2 text-3xl font-bold">
                      {topCompany.name}
                    </h3>

                    <p className="text-slate-400">
                      {topCompany.category}
                    </p>

                    <p className="mt-1 text-slate-500">
                      {topCompany.country}
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                    ✓ {t("verified")}
                  </span>
                </div>

                <div className="mb-7 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-2xl font-bold text-emerald-400"
                    >
                      {topCompany.trustScore}
                    </p>
                    <p className="text-xs text-slate-500">{t("trust")}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-xl font-bold text-yellow-400"
                    >
                      {ratingText(topCompany.averageRating)}
                    </p>
                    <p className="text-xs text-slate-500">{t("rating")}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-2xl font-bold text-blue-400"
                    >
                      {topCompany.reviewCount}
                    </p>
                    <p className="text-xs text-slate-500">{t("reviews")}</p>
                  </div>
                </div>

                <Link
                  href={`/companies/${topCompany.id}`}
                  className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
                >
                  {t("viewCompany")}
                </Link>
              </div>
            )}

            {topExpert && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/85 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-5 text-5xl">⭐</div>

                    <p className="mb-2 font-semibold text-cyan-400">
                      {t("topExpert")}
                    </p>

                    <h3 className="mb-2 text-3xl font-bold">
                      {topExpert.name}
                    </h3>

                    <p className="text-slate-400">
                      {topExpert.specialty}
                    </p>

                    <p className="mt-1 text-slate-500">
                      {topExpert.country}
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                    ✓ {t("verified")}
                  </span>
                </div>

                <div className="mb-7 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-2xl font-bold text-emerald-400"
                    >
                      {topExpert.trustScore}
                    </p>
                    <p className="text-xs text-slate-500">{t("trust")}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-xl font-bold text-yellow-400"
                    >
                      {ratingText(topExpert.averageRating)}
                    </p>
                    <p className="text-xs text-slate-500">{t("rating")}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p
                      dir="ltr"
                      className="text-2xl font-bold text-blue-400"
                    >
                      {topExpert.reviewCount}
                    </p>
                    <p className="text-xs text-slate-500">{t("reviews")}</p>
                  </div>
                </div>

                <Link
                  href={`/experts/${topExpert.id}`}
                  className="inline-flex w-full justify-center rounded-xl bg-cyan-600 px-5 py-3 font-semibold hover:bg-cyan-700"
                >
                  {t("viewExpert")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}