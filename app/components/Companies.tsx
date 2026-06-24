import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Companies() {
  const companies = await prisma.company.findMany({
    take: 3,
    orderBy: {
      verifiedAt: "desc",
    },
  });

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-3">
              Featured Companies
            </h2>

            <p className="text-slate-400">
              Discover trusted companies across global markets.
            </p>
          </div>

          <Link href="/companies" className="text-blue-400">
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">
                  {company.name}
                </h3>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-blue-400 mt-3">
                {company.category}
              </p>

              <p className="text-slate-400 mt-3">
                {company.country}
              </p>

              <p className="text-slate-500 mt-4 line-clamp-2">
                {company.description}
              </p>

              <Link
                href={`/companies/${company.id}`}
                className="inline-block mt-5 text-blue-400 hover:text-blue-300"
              >
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}