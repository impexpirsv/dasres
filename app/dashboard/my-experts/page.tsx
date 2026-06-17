import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyExpertsPage() {
  const user = await requireUser();

  const experts = await prisma.expert.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            My Experts
          </h1>

          <Link
            href="/dashboard/experts/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            Add Expert
          </Link>
        </div>

        {experts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            You do not own any experts yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {experts.map((expert) => (
              <Link
                key={expert.id}
                href={`/experts/${expert.id}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500"
              >
                <h2 className="text-2xl font-bold mb-2">
                  {expert.name}
                </h2>

                <p className="text-blue-400 mb-2">
                  {expert.specialty}
                </p>

                <p className="text-slate-400">
                  {expert.country}
                </p>

                <div className="mt-4 flex gap-2">
                  <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                    {expert.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}