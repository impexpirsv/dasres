import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";

function getAverageRating(
  reviews: { rating: number }[]
) {
  if (reviews.length === 0) {
    return 0;
  }

  return (
    reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    ) / reviews.length
  );
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
      const reviews =
        company.owner?.reviewsReceived || [];

      const averageRating =
        getAverageRating(reviews);

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus:
          company.verificationStatus,
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
        b.reviewCount - a.reviewCount
    )[0];

  const topExpert = experts
    .map((expert) => {
      const reviews =
        expert.owner?.reviewsReceived || [];

      const averageRating =
        getAverageRating(reviews);

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus:
          expert.verificationStatus,
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
        b.reviewCount - a.reviewCount
    )[0];

  if (!topCompany && !topExpert) {
    return null;
  }

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-blue-400 font-semibold mb-3">
            Trusted Network
          </p>

          <h2 className="text-5xl font-bold">
            Top Rated Members
          </h2>

          <p className="text-slate-400 mt-4">
            Discover the highest ranked companies and experts
            based on verification, trust score and reviews.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {topCompany && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/40 transition">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-4xl mb-4">🏆</div>

                  <p className="text-blue-400 mb-2">
                    Top Company
                  </p>

                  <h3 className="text-3xl font-bold mb-2">
                    {topCompany.name}
                  </h3>

                  <p className="text-slate-400">
                    {topCompany.category}
                  </p>

                  <p className="text-slate-500 mt-1">
                    {topCompany.country}
                  </p>
                </div>

                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-7">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-emerald-400">
                    {topCompany.trustScore}
                  </p>
                  <p className="text-xs text-slate-500">
                    Trust
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-yellow-400">
                    {topCompany.averageRating > 0
                      ? topCompany.averageRating.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Rating
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-blue-400">
                    {topCompany.reviewCount}
                  </p>
                  <p className="text-xs text-slate-500">
                    Reviews
                  </p>
                </div>
              </div>

              <Link
                href={`/companies/${topCompany.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
              >
                View Company
              </Link>
            </div>
          )}

          {topExpert && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 hover:border-cyan-500/40 transition">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-4xl mb-4">⭐</div>

                  <p className="text-cyan-400 mb-2">
                    Top Expert
                  </p>

                  <h3 className="text-3xl font-bold mb-2">
                    {topExpert.name}
                  </h3>

                  <p className="text-slate-400">
                    {topExpert.specialty}
                  </p>

                  <p className="text-slate-500 mt-1">
                    {topExpert.country}
                  </p>
                </div>

                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-7">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-emerald-400">
                    {topExpert.trustScore}
                  </p>
                  <p className="text-xs text-slate-500">
                    Trust
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-yellow-400">
                    {topExpert.averageRating > 0
                      ? topExpert.averageRating.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Rating
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-2xl font-bold text-blue-400">
                    {topExpert.reviewCount}
                  </p>
                  <p className="text-xs text-slate-500">
                    Reviews
                  </p>
                </div>
              </div>

              <Link
                href={`/experts/${topExpert.id}`}
                className="inline-block bg-cyan-600 hover:bg-cyan-700 px-5 py-3 rounded-xl"
              >
                View Expert
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}