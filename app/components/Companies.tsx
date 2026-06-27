import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Companies() {
  const companies = await prisma.company.findMany({
    take: 6,
    orderBy: {
      verifiedAt: "desc",
    },
  });

  return (
    <section className="bg-slate-900 py-24 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-cyan-400 font-semibold mb-3">
              Company Network
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Featured Companies
            </h2>

            <p className="text-slate-400 max-w-2xl">
              Discover verified trade companies across customs clearance,
              shipping, sourcing, inspection and international logistics.
            </p>
          </div>

          <Link
            href="/companies"
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-slate-950/80 rounded-3xl p-6 border border-slate-800 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-emerald-500 flex items-center justify-center text-3xl shrink-0">
                  🏢
                </div>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-3">
                {company.name}
              </h3>

              <p className="text-cyan-400">
                {company.category}
              </p>

              <p className="text-slate-400 mt-2">
                {company.country}
              </p>

              <p className="text-slate-500 mt-4 line-clamp-2 leading-7">
                {company.description}
              </p>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                <span className="text-emerald-400 text-sm">
                  ● Accepting Projects
                </span>

                <Link
                  href={`/companies/${company.id}`}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}