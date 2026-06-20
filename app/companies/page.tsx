import Link from "next/link";
import { prisma } from "../../lib/prisma";
import CompaniesSearch from "../components/CompaniesSearch";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

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
        
const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

const sortedCompaniesWithRatings =
  companiesWithRatings.sort(
    (a, b) =>
      planPriority[b.planType] -
        planPriority[a.planType] ||
      b.id - a.id
  );
      const averageRating =
        reviews.length > 0
          ? reviews.reduce(
              (sum, review) => sum + review.rating,
              0
            ) / reviews.length
          : 0;

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
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">
          Companies Directory
        </h1>

        <p className="text-slate-400 mb-12">
          Manage and browse verified international trade companies.
        </p>

       <CompaniesSearch companies={sortedCompaniesWithRatings} />

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