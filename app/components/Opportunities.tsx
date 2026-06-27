import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Opportunities() {
  const opportunities = await prisma.opportunity.findMany({
    take: 6,
    orderBy: {
      id: "desc",
    },
  });

  return (
    <section className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-blue-400 font-semibold mb-3">
              Global Marketplace
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Latest Trade Opportunities
            </h2>

            <p className="text-slate-400 max-w-2xl">
              Browse international trade requests, discover new business
              opportunities and connect with verified providers around the
              world.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs px-3 py-1 rounded-full">
                  {opportunity.country}
                </span>

                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full">
                  {opportunity.status}
                </span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl mb-5">
                🌍
              </div>

              <h3 className="text-2xl font-bold mb-4 line-clamp-2">
                {opportunity.title}
              </h3>

              <p className="text-slate-400 leading-7 line-clamp-3">
                {opportunity.description}
              </p>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                <span className="text-emerald-400 text-sm">
                  ● Open Opportunity
                </span>

                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}