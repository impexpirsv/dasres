import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Experts() {
  const experts = await prisma.expert.findMany({
    take: 6,
    orderBy: {
      verifiedAt: "desc",
    },
  });

  return (
    <section className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-blue-400 font-semibold mb-3">
              Expert Network
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Featured Experts
            </h2>

            <p className="text-slate-400 max-w-2xl">
              Connect with verified international trade professionals across
              customs, sourcing, logistics, inspection and trade consulting.
            </p>
          </div>

          <Link
            href="/experts"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-3xl mb-5">
                👨‍💼
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold">
                  {expert.name}
                </h3>

                {expert.verificationStatus === "VERIFIED" && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-blue-400">
                {expert.specialty}
              </p>

              <p className="text-slate-400 mt-2">
                {expert.country}
              </p>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                <span className="text-emerald-400 text-sm">
                  ● Available
                </span>

                <Link
                  href={`/experts/${expert.id}`}
                  className="text-blue-400 hover:text-blue-300 font-medium"
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