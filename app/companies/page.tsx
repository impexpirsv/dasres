import Link from "next/link";
import { prisma } from "../../lib/prisma";
import CompaniesSearch from "../components/CompaniesSearch";
import { calculateTrustScore } from "../../lib/ranking";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalCompanies = await prisma.company.count();
  const totalPages = Math.ceil(totalCompanies / PAGE_SIZE);

  const companies = await prisma.company.findMany({
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
      verificationStatus: true,
      description: true,
      email: true,
      website: true,
      logoUrl: true,
      ownerId: true,
      planType: true,
    },
  });

  const companiesWithRatings = await Promise.all(
    companies.map(async (company) => {
      const reviews = company.ownerId
        ? await prisma.review.findMany({
            where: {
              reviewedUserId: company.ownerId,
            },
            select: {
              rating: true,
            },
          })
        : [];

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
        id: company.id,
        name: company.name,
        country: company.country,
        category: company.category,
        status: company.status,
        verificationStatus: company.verificationStatus,
        description: company.description,
        email: company.email,
        website: company.website,
        logoUrl: company.logoUrl,
        averageRating,
        reviewCount: reviews.length,
        planType: company.planType,
        trustScore,
      };
    })
  );

  const sortedCompaniesWithRatings = [...companiesWithRatings].sort(
    (a, b) =>
      planPriority[b.planType] - planPriority[a.planType] ||
      b.trustScore - a.trustScore ||
      b.averageRating - a.averageRating ||
      b.id - a.id
  );

  const verifiedCompaniesCount =
    sortedCompaniesWithRatings.filter(
      (company) =>
        company.verificationStatus === "VERIFIED"
    ).length;

  const ratedCompaniesCount =
    sortedCompaniesWithRatings.filter(
      (company) => company.averageRating > 0
    ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-blue-400 font-semibold mb-3">
            Verified Company Network
          </p>

          <h1 className="text-5xl md:text-6xl font-black mb-5">
            Discover trusted trade companies
          </h1>

          <p className="text-slate-400 text-lg max-w-3xl">
            Browse verified international companies across customs,
            shipping, inspection, sourcing, logistics and global trade
            services.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-blue-400">
                {totalCompanies}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Total Companies
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-emerald-400">
                {verifiedCompaniesCount}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Verified Companies
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-yellow-400">
                {ratedCompaniesCount}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Rated Companies
              </p>
            </div>
          </div>
        </div>

        <CompaniesSearch
          companies={sortedCompaniesWithRatings}
        />

        <div className="flex justify-center gap-4 mt-12">
          {currentPage > 1 && (
            <Link
              href={`/companies?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Previous
            </Link>
          )}

          <span className="px-4 py-2 text-slate-300">
            Page {currentPage} of {totalPages || 1}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/companies?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}