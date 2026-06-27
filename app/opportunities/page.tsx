import Link from "next/link";
import { prisma } from "../../lib/prisma";
import OpportunitiesSearch from "../components/OpportunitiesSearch";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalOpportunities = await prisma.opportunity.count();
  const totalPages = Math.ceil(totalOpportunities / PAGE_SIZE);

  const opportunities = await prisma.opportunity.findMany({
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      id: "desc",
    },
  });
  const featuredOpportunities = opportunities.filter(
    (o) => o.status === "OPEN",
  );
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-blue-400 font-semibold mb-3">
            Global Trade Marketplace
          </p>

          <h1 className="text-5xl md:text-6xl font-black mb-5">
            Discover international opportunities
          </h1>

          <p className="text-slate-400 text-lg max-w-3xl">
            Explore verified trade opportunities from companies around the
            world, connect with buyers and suppliers, and expand your
            international business.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-blue-400">
                {totalOpportunities}
              </p>

              <p className="text-slate-400 text-sm mt-1">Total Opportunities</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-emerald-400">
                {opportunities.filter((o) => o.status === "OPEN").length}
              </p>

              <p className="text-slate-400 text-sm mt-1">Open Opportunities</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-3xl font-bold text-purple-400">
                {new Set(opportunities.map((o) => o.country)).size}
              </p>

              <p className="text-slate-400 text-sm mt-1">Countries</p>
            </div>
          </div>
        </div>

        <OpportunitiesSearch opportunities={opportunities} />

        <div className="flex justify-center gap-4 mt-12">
          {currentPage > 1 && (
            <Link
              href={`/opportunities?page=${currentPage - 1}`}
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
              href={`/opportunities?page=${currentPage + 1}`}
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
