import Link from "next/link";
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
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalCompanies = await prisma.company.count();

  const verifiedCompaniesCount = await prisma.company.count({
    where: {
      verificationStatus: "VERIFIED",
    },
  });

  const pendingCompaniesCount = await prisma.company.count({
    where: {
      verificationStatus: "PENDING",
    },
  });

  const rejectedCompaniesCount = await prisma.company.count({
    where: {
      verificationStatus: "REJECTED",
    },
  });

  const premiumCompaniesCount = await prisma.company.count({
    where: {
      planType: {
        in: ["GOLD", "DIAMOND", "ENTERPRISE"],
      },
    },
  });

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
      description: true,
      email: true,
      website: true,
      logoUrl: true,
      ownerId: true,
      verificationStatus: true,
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
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
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
        description: company.description,
        email: company.email,
        website: company.website,
        logoUrl: company.logoUrl,
        verificationStatus: company.verificationStatus,
        planType: company.planType,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    }),
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-4">Companies Management</h1>

          <p className="text-slate-400">
            Manage and browse international trade companies.
          </p>
        </div>

        <Link
          href="/dashboard/companies/new"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
        >
          Add Company
        </Link>
      </div>

      <div className="grid md:grid-cols-5 gap-6 mb-10">
        <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Total</p>

          <p className="text-4xl font-bold text-blue-400 mt-2">
            {totalCompanies}
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Verified</p>

          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {verifiedCompaniesCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Pending</p>

          <p className="text-4xl font-bold text-yellow-400 mt-2">
            {pendingCompaniesCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Rejected</p>

          <p className="text-4xl font-bold text-red-400 mt-2">
            {rejectedCompaniesCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-purple-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Premium</p>

          <p className="text-4xl font-bold text-purple-400 mt-2">
            {premiumCompaniesCount}
          </p>
        </div>
      </div>

      <CompaniesSearch
  companies={companiesWithRatings}
  profileBasePath="/dashboard/companies"
/>

      <div className="flex justify-center gap-4 mt-12">
        {currentPage > 1 && (
          <Link
            href={`/dashboard/companies?page=${currentPage - 1}`}
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
            href={`/dashboard/companies?page=${currentPage + 1}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
