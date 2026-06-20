import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function getStatusClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-600 text-white";
    case "IN_PROGRESS":
      return "bg-amber-500 text-slate-950";
    case "COMPLETED":
      return "bg-emerald-600 text-white";
    case "CANCELLED":
      return "bg-red-600 text-white";
    default:
      return "bg-slate-800 text-slate-300";
  }
}

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
      documents: true,
      messages: true,
      steps: true,
    },
    orderBy: {
      id: "desc",
    },
  });
  const inProgressCases = cases.filter(
    (tradeCase) => tradeCase.status === "IN_PROGRESS",
  ).length;

  const completedCases = cases.filter(
    (tradeCase) => tradeCase.status === "COMPLETED",
  ).length;

  const totalDocuments = cases.reduce(
    (sum, tradeCase) => sum + tradeCase.documents.length,
    0,
  );

  const totalMessages = cases.reduce(
    (sum, tradeCase) => sum + tradeCase.messages.length,
    0,
  );
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">My Active Cases</h1>

          <p className="text-slate-400">
            Cases where your company proposal has been accepted.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Assigned Cases</p>

            <p className="text-4xl font-bold text-blue-400 mt-2">
              {cases.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-amber-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">In Progress</p>

            <p className="text-4xl font-bold text-amber-400 mt-2">
              {inProgressCases}
            </p>
          </div>

          <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Completed</p>

            <p className="text-4xl font-bold text-emerald-400 mt-2">
              {completedCases}
            </p>
          </div>

          <div className="bg-slate-900 border border-cyan-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Workload</p>

            <p className="text-4xl font-bold text-cyan-400 mt-2">
              {totalMessages + totalDocuments}
            </p>

            <p className="text-xs text-slate-500 mt-2">Messages + Documents</p>
          </div>
        </div>
        {cases.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No active cases yet.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {cases.map((tradeCase) => {
              const acceptedProposal = tradeCase.proposals[0];

              const completedSteps = tradeCase.steps.filter(
                (step) => step.completed,
              ).length;

              const totalSteps = tradeCase.steps.length;

              return (
                <Link
                  key={tradeCase.id}
                  href={`/dashboard/cases/${tradeCase.id}`}
                  className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500 transition"
                >
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">
                        Case #{tradeCase.id}
                      </p>

                      <h2 className="text-2xl font-bold group-hover:text-blue-400 transition">
                        {tradeCase.title}
                      </h2>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                        tradeCase.status,
                      )}`}
                    >
                      {tradeCase.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="bg-purple-600/20 text-purple-300 border border-purple-800 px-3 py-1 rounded-full text-xs">
                      {tradeCase.category}
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                      {tradeCase.documents.length} Documents
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                      {tradeCase.messages.length} Messages
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Accepted Company</p>
                      <p className="text-slate-200 font-medium">
                        {acceptedProposal?.company?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Assigned Expert</p>
                      <p className="text-slate-200 font-medium">
                        {acceptedProposal?.expert?.name || "Not assigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Proposal Price</p>
                      <p className="text-slate-200 font-medium">
                        {acceptedProposal?.price || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Timeline Progress</p>
                      <p className="text-slate-200 font-medium">
                        {completedSteps} / {totalSteps} steps completed
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Updated {tradeCase.updatedAt.toLocaleDateString()}
                    </span>

                    <span className="text-blue-400 text-sm group-hover:underline">
                      View Case →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
