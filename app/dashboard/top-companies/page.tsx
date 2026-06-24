import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { calculateTrustScore } from "../../../lib/ranking";

export default async function TopCompaniesPage() {
  await requireUser();

  const companies = await prisma.company.findMany({
    include: {
      owner: {
        include: {
          reviewsReceived: true,
        },
      },
    },
  });

  const rankedCompanies = companies
    .map((company) => {
      const reviews = company.owner?.reviewsReceived || [];

      const averageRating =
        reviews.length > 0
          ? reviews.reduce(
              (sum, review) => sum + review.rating,
              0
            ) / reviews.length
          : 0;

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
        b.reviewCount - a.reviewCount
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">
            Top Rated Companies
          </h1>

          <p className="text-slate-400">
            Ranked companies based on verification, trust score and reviews.
          </p>
        </div>

        {rankedCompanies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No companies found.
          </div>
        ) : (
          <div className="space-y-5">
            {rankedCompanies.map((company, index) => (
              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="block bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-3xl p-6 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-blue-400">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">
                          {company.name}
                        </h2>

                        {company.verificationStatus === "VERIFIED" && (
                          <span className="bg-emerald-600 px-3 py-1 rounded-full text-xs">
                            ✓ Verified
                          </span>
                        )}

                        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                          {company.planType}
                        </span>
                      </div>

                      <p className="text-blue-400">
                        {company.category}
                      </p>

                      <p className="text-slate-500 text-sm mt-1">
                        {company.country}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 min-w-full md:min-w-[420px]">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Trust
                      </p>

                      <p className="text-2xl font-bold text-emerald-400">
                        {company.trustScore}/100
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Rating
                      </p>

                      <p className="text-2xl font-bold text-yellow-400">
                        {company.averageRating > 0
                          ? company.averageRating.toFixed(1)
                          : "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Reviews
                      </p>

                      <p className="text-2xl font-bold text-blue-400">
                        {company.reviewCount}
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