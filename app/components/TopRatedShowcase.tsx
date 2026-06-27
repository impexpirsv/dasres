import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";

function getAverageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return 0;

  return (
    reviews.reduce((sum, review) => sum + review.rating, 0) /
    reviews.length
  );
}

function ratingText(value: number) {
  return value > 0 ? value.toFixed(1) : "No reviews";
}

export default async function TopRatedShowcase() {
  const companies = await prisma.company.findMany({
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
  });

  const experts = await prisma.expert.findMany({
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
  });

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

  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 border-b border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.12),_transparent_30%)]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-6">
              Trust Network
            </div>

            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Verified providers.
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Ranked by trust.
              </span>
            </h2>

            <p className="text-slate-400 text-lg leading-8 mb-8">
              Dasres highlights companies and experts using verification,
              ratings, reviews and trust scoring so trade teams can compare
              providers with confidence.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-3xl font-bold text-emerald-400">✓</p>
                <p className="text-slate-400 mt-2">Verified profiles</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-3xl font-bold text-yellow-400">★</p>
                <p className="text-slate-400 mt-2">Review history</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-3xl font-bold text-blue-400">100</p>
                <p className="text-slate-400 mt-2">Trust scoring</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {topCompany && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/85 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="flex items-start justify-between gap-4 mb-7">
                  <div>
                    <div className="text-5xl mb-5">🏆</div>

                    <p className="text-blue-400 font-semibold mb-2">
                      Top Company
                    </p>

                    <h3 className="text-3xl font-bold mb-2">
                      {topCompany.name}
                    </h3>

                    <p className="text-slate-400">{topCompany.category}</p>

                    <p className="text-slate-500 mt-1">
                      {topCompany.country}
                    </p>
                  </div>

                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-7">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-2xl font-bold text-emerald-400">
                      {topCompany.trustScore}
                    </p>
                    <p className="text-xs text-slate-500">Trust</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xl font-bold text-yellow-400">
                      {ratingText(topCompany.averageRating)}
                    </p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-2xl font-bold text-blue-400">
                      {topCompany.reviewCount}
                    </p>
                    <p className="text-xs text-slate-500">Reviews</p>
                  </div>
                </div>

                <Link
                  href={`/companies/${topCompany.id}`}
                  className="inline-flex w-full justify-center bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  View Company
                </Link>
              </div>
            )}

            {topExpert && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/85 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="flex items-start justify-between gap-4 mb-7">
                  <div>
                    <div className="text-5xl mb-5">⭐</div>

                    <p className="text-cyan-400 font-semibold mb-2">
                      Top Expert
                    </p>

                    <h3 className="text-3xl font-bold mb-2">
                      {topExpert.name}
                    </h3>

                    <p className="text-slate-400">{topExpert.specialty}</p>

                    <p className="text-slate-500 mt-1">
                      {topExpert.country}
                    </p>
                  </div>

                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-7">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-2xl font-bold text-emerald-400">
                      {topExpert.trustScore}
                    </p>
                    <p className="text-xs text-slate-500">Trust</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xl font-bold text-yellow-400">
                      {ratingText(topExpert.averageRating)}
                    </p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-2xl font-bold text-blue-400">
                      {topExpert.reviewCount}
                    </p>
                    <p className="text-xs text-slate-500">Reviews</p>
                  </div>
                </div>

                <Link
                  href={`/experts/${topExpert.id}`}
                  className="inline-flex w-full justify-center bg-cyan-600 hover:bg-cyan-700 px-5 py-3 rounded-xl font-semibold"
                >
                  View Expert
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}