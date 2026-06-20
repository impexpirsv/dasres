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

  const activeOpportunities =
    await prisma.opportunity.count({
      where: {
        status: "ACTIVE",
      },
    });

  const closedOpportunities =
    await prisma.opportunity.count({
      where: {
        status: "CLOSED",
      },
    });

  const countries = await prisma.opportunity.findMany({
    select: {
      country: true,
    },
  });

  const uniqueCountries = new Set(
    countries.map((o) => o.country)
  ).size;

  const latestOpportunity =
    await prisma.opportunity.findFirst({
      orderBy: {
        id: "desc",
      },
    });

  const totalPages = Math.ceil(
    totalOpportunities / PAGE_SIZE
  );

  const opportunities =
    await prisma.opportunity.findMany({
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: {
        id: "desc",
      },
    });

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Opportunities Management
          </h1>

          <p className="text-slate-400">
            Browse and manage international trade opportunities.
          </p>
        </div>

        <Link
          href="/dashboard/opportunities/new"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
        >
          Add Opportunity
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Total
          </p>

          <p className="text-4xl font-bold text-blue-400 mt-2">
            {totalOpportunities}
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Active
          </p>

          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {activeOpportunities}
          </p>
        </div>

        <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Closed
          </p>

          <p className="text-4xl font-bold text-red-400 mt-2">
            {closedOpportunities}
          </p>
        </div>

        <div className="bg-slate-900 border border-cyan-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Countries
          </p>

          <p className="text-4xl font-bold text-cyan-400 mt-2">
            {uniqueCountries}
          </p>
        </div>
      </div>

      {latestOpportunity && (
        <div className="mb-10 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <p className="text-slate-500 text-sm mb-2">
            Latest Opportunity
          </p>

          <h2 className="text-2xl font-bold">
            {latestOpportunity.title}
          </h2>

          <p className="text-slate-400 mt-2">
            {latestOpportunity.country}
          </p>
        </div>
      )}

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