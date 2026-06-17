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

export default async function CasesPage() {
  const user = await requireUser();

  const cases = await prisma.tradeCase.findMany({
    where:
      user.role === "admin"
        ? {}
        : {
            customerId: user.id,
          },
    include: {
      proposals: true,
      documents: true,
      messages: true,
      steps: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              {user.role === "admin"
                ? "All Trade Cases"
                : "My Cases"}
            </h1>

            <p className="text-slate-400">
              Track your submitted trade service requests.
            </p>
          </div>

          <Link
            href="/dashboard/cases/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            New Case
          </Link>
        </div>

        {cases.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            No cases found.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {cases.map((tradeCase) => {
              const completedSteps =
                tradeCase.steps.filter(
                  (step) => step.completed
                ).length;

              const totalSteps = tradeCase.steps.length;

              const acceptedProposal =
                tradeCase.proposals.find(
                  (proposal) =>
                    proposal.id ===
                    tradeCase.acceptedProposalId
                );

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
                        tradeCase.status
                      )}`}
                    >
                      {tradeCase.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm leading-6 mb-5 line-clamp-2">
                    {tradeCase.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="bg-purple-600/20 text-purple-300 border border-purple-800 px-3 py-1 rounded-full text-xs">
                      {tradeCase.category}
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                      {tradeCase.proposals.length} Proposals
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                      {tradeCase.documents.length} Documents
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                      {tradeCase.messages.length} Messages
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">
                        Timeline
                      </p>
                      <p className="text-slate-200 font-medium">
                        {completedSteps} / {totalSteps} steps
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Winning Proposal
                      </p>
                      <p className="text-slate-200 font-medium">
                        {acceptedProposal
                          ? `#${acceptedProposal.id}`
                          : "Not selected"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Created
                      </p>
                      <p className="text-slate-200 font-medium">
                        {tradeCase.createdAt.toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Updated
                      </p>
                      <p className="text-slate-200 font-medium">
                        {tradeCase.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-800 flex justify-end">
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