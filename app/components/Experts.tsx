import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function Experts() {
  const experts = await prisma.expert.findMany({
    take: 3,
    orderBy: {
      verifiedAt: "desc",
    },
  });
  return (
    <section className="bg-slate-950 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-3">Featured Experts</h2>

            <p className="text-slate-400">
              Connect with trusted international trade professionals.
            </p>
          </div>

          <Link href="/experts" className="text-blue-400">
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-blue-500/40 transition"
            >
              <div className="text-5xl mb-4">👨‍💼</div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold">{expert.name}</h3>

                {expert.verificationStatus === "VERIFIED" && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-blue-400">{expert.specialty}</p>

              <p className="text-slate-400 mt-2">{expert.country}</p>

              <Link
                href={`/experts/${expert.id}`}
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
