import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyProposalsPage() {
  const user = await requireUser();

  const proposals = await prisma.caseProposal.findMany({
    where: {
      company: {
        ownerId: user.id,
      },
    },
    include: {
      company: true,
      expert: true,
      tradeCase: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">My Proposals</h1>

        {proposals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No proposals yet.
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Proposal #{proposal.id}</h2>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      proposal.status === "ACCEPTED"
                        ? "bg-green-600 text-white"
                        : proposal.status === "REJECTED"
                          ? "bg-red-600 text-white"
                          : "bg-yellow-600 text-black"
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>

                <p className="mb-2">
                  <span className="text-slate-500">Case:</span>{" "}
                  {proposal.tradeCase.title}
                </p>

                <p className="mb-2">
                  <span className="text-slate-500">Company:</span>{" "}
                  {proposal.company?.name}
                </p>

                <p className="mb-2">
                  <span className="text-slate-500">Expert:</span>{" "}
                  {proposal.expert?.name || "Not assigned"}
                </p>

                <p className="mb-2">
                  <span className="text-slate-500">Price:</span>{" "}
                  {proposal.price || "N/A"}
                </p>
                <p className="mb-2">
                  <span className="text-slate-500">Submitted:</span>{" "}
                  {proposal.createdAt.toLocaleDateString()}
                </p>
                <p className="mb-2">
                  <span className="text-slate-500">Case Status:</span>{" "}
                  {proposal.tradeCase.status}
                </p>
                <Link
                  href={`/dashboard/cases/${proposal.caseId}`}
                  className="text-blue-400 hover:underline"
                >
                  View Case →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
