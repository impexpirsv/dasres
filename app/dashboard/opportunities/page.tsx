import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import OpportunitiesSearch from "../../components/OpportunitiesSearch";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardOpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalOpportunities =
    await prisma.opportunity.count();

  const totalPages = Math.ceil(
    totalOpportunities / PAGE_SIZE
  );

  const opportunities =
    await prisma.opportunity.findMany({
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <h1 className="text-5xl font-bold mb-4">
        Opportunities Directory
      </h1>

      <p className="text-slate-400 mb-12">
        Browse international trade opportunities.
      </p>

      <OpportunitiesSearch
        opportunities={opportunities}
      />

      <div className="flex justify-center gap-4 mt-12">
        {currentPage > 1 && (
          <Link
            href={`/dashboard/opportunities?page=${currentPage - 1}`}
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
            href={`/dashboard/opportunities?page=${currentPage + 1}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}