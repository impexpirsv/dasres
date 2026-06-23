import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function SavedExpertsPage() {
  const user = await requireUser();

  const savedExperts = await prisma.savedExpert.findMany({
    where: {
      userId: user.id,
    },
    include: {
      expert: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-10">
          Saved Experts
        </h1>

        {savedExperts.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl p-8 text-slate-400">
            No saved experts yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedExperts.map((saved) => (
              <div
                key={saved.id}
                className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
              >
                <h2 className="text-2xl font-semibold mb-2">
                  {saved.expert.name}
                </h2>

                <p className="text-slate-400">
                  {saved.expert.specialty}
                </p>

                <p className="text-slate-500 mt-2">
                  {saved.expert.country}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/dashboard/experts/${saved.expert.id}`}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl inline-block"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}