import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Opportunities() {
  const opportunities =
    await prisma.opportunity.findMany({
      take: 3,
      orderBy: {
        id: "desc",
      },
    });

  return (
    <section className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-3">
              Trade Opportunities
            </h2>

            <p className="text-slate-400">
              Discover international business opportunities and partnerships.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="text-blue-400"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-blue-500/40 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                  {opportunity.country}
                </span>

                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                  {opportunity.status}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3">
                {opportunity.title}
              </h3>

              <p className="text-slate-400 line-clamp-3 mb-5">
                {opportunity.description}
              </p>

              <Link
                href={`/dashboard/opportunities/${opportunity.id}`}
                className="text-blue-400 hover:text-blue-300"
              >
                View Opportunity →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}