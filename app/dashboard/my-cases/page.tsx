import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyCasesPage() {
  const user = await requireUser();

  const cases = await prisma.tradeCase.findMany({
    where: {
      proposals: {
        some: {
          status: "ACCEPTED",
          company: {
            ownerId: user.id,
          },
        },
      },
    },
    include: {
      proposals: {
        where: {
          status: "ACCEPTED",
          company: {
            ownerId: user.id,
          },
        },
        include: {
          company: true,
          expert: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          My Active Cases
        </h1>

        {cases.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No active cases yet.
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((tradeCase) => {
              const acceptedProposal =
                tradeCase.proposals[0];

              return (
                <div
                  key={tradeCase.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                      Case #{tradeCase.id}
                    </h2>

                    <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                      {tradeCase.status}
                    </span>
                  </div>

                  <p className="mb-2">
                    <span className="text-slate-500">
                      Title:
                    </span>{" "}
                    {tradeCase.title}
                  </p>

                  <p className="mb-2">
                    <span className="text-slate-500">
                      Company:
                    </span>{" "}
                    {acceptedProposal?.company?.name ||
                      "N/A"}
                  </p>

                  <p className="mb-2">
                    <span className="text-slate-500">
                      Expert:
                    </span>{" "}
                    {acceptedProposal?.expert?.name ||
                      "Not assigned"}
                  </p>

                  <p className="mb-4">
                    <span className="text-slate-500">
                      Price:
                    </span>{" "}
                    {acceptedProposal?.price || "N/A"}
                  </p>

                  <Link
                    href={`/dashboard/cases/${tradeCase.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    View Case →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}