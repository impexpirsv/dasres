import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function parsePrice(price: string | null) {
  if (!price) {
    return 0;
  }

  const numericValue = Number(price.replace(/[^0-9.]/g, ""));

  return Number.isNaN(numericValue) ? 0 : numericValue;
}

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

  const totalProposals = proposals.length;

  const pendingProposals = proposals.filter(
    (proposal) => proposal.status === "PENDING",
  ).length;

  const acceptedProposals = proposals.filter(
    (proposal) => proposal.status === "ACCEPTED",
  ).length;

  const rejectedProposals = proposals.filter(
    (proposal) => proposal.status === "REJECTED",
  ).length;

  const resolvedProposals = acceptedProposals + rejectedProposals;

  const winRate =
    resolvedProposals > 0
      ? Math.round((acceptedProposals / resolvedProposals) * 100)
      : 0;

  const totalProposalValue = proposals.reduce(
    (sum, proposal) => sum + parsePrice(proposal.price),
    0,
  );

  const acceptedProposalValue = proposals
    .filter((proposal) => proposal.status === "ACCEPTED")
    .reduce((sum, proposal) => sum + parsePrice(proposal.price), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold">My Proposals</h1>

            <p className="text-slate-400 mt-3">
              Track proposal performance, win rate and submitted value.
            </p>
          </div>

          <Link
            href="/dashboard/open-cases"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
          >
            Find Open Cases
          </Link>
        </div>

        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Total Proposals</p>

            <div className="text-4xl font-bold text-blue-400 mt-3">
              {totalProposals}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Pending</p>

            <div className="text-4xl font-bold text-yellow-400 mt-3">
              {pendingProposals}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Accepted</p>

            <div className="text-4xl font-bold text-green-400 mt-3">
              {acceptedProposals}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Rejected</p>

            <div className="text-4xl font-bold text-red-400 mt-3">
              {rejectedProposals}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Win Rate</p>

            <div className="text-4xl font-bold text-emerald-400 mt-3">
              {winRate}%
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Accepted Value</p>

            <div className="text-3xl font-bold text-cyan-400 mt-3">
              ${acceptedProposalValue.toLocaleString()}
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Submitted: ${totalProposalValue.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            All: {totalProposals}
          </span>

          <span className="bg-yellow-600 text-black px-4 py-2 rounded-full text-sm font-semibold">
            Pending: {pendingProposals}
          </span>

          <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Accepted: {acceptedProposals}
          </span>

          <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Rejected: {rejectedProposals}
          </span>
        </div>
        {proposals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No proposals yet.
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`rounded-2xl p-6 border ${
                  proposal.status === "ACCEPTED"
                    ? "bg-green-950/20 border-green-500"
                    : proposal.status === "REJECTED"
                      ? "bg-red-950/20 border-red-500"
                      : "bg-slate-900 border-slate-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Proposal #{proposal.id}
                    </h2>

                    <p className="text-slate-400 text-sm mt-1">
                      Submitted on {proposal.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div>
                    <p className="text-slate-500 text-sm">Case</p>

                    <p className="text-slate-200 font-medium">
                      {proposal.tradeCase.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Company</p>

                    <p className="text-slate-200 font-medium">
                      {proposal.company?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Expert</p>

                    <p className="text-slate-200 font-medium">
                      {proposal.expert?.name || "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Price</p>

                    <p className="text-slate-200 font-medium">
                      {proposal.price || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm text-slate-400">
                    Case Status: {proposal.tradeCase.status}
                  </span>

                  <Link
                    href={`/dashboard/cases/${proposal.caseId}`}
                    className="text-blue-400 hover:underline"
                  >
                    View Case →
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
