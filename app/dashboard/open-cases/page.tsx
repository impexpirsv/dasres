import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import SaveCaseButton from "../../components/SaveCaseButton";
import StopLinkClick from "../../components/StopLinkClick";
export default async function OpenCasesPage() {
  const user = await requireUser();

  const myCompanies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
      category: true,
      ownerId: true,
    },
  });

  const categories = [
    ...new Set(myCompanies.map((company) => company.category).filter(Boolean)),
  ];

  const openCases = await prisma.tradeCase.findMany({
    where: {
      status: "OPEN",
      category: {
        in: categories,
      },
      NOT: {
        customerId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      proposals: true,
      documents: true,
      messages: true,
      savedCases: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  const mySubmittedProposals = await prisma.caseProposal.count({
    where: {
      company: {
        ownerId: user.id,
      },
      tradeCase: {
        status: "OPEN",
      },
    },
  });

  const highCompetitionCases = openCases.filter(
    (tradeCase) => tradeCase.proposals.length >= 3,
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-4">Open Cases</h1>

            <p className="text-slate-400">
              Cases matched to your company categories.
            </p>
          </div>

          <Link
            href="/dashboard/my-proposals"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
          >
            My Proposals
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Matching Cases</p>

            <p className="text-4xl font-bold text-blue-400 mt-2">
              {openCases.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-purple-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Matching Categories</p>

            <p className="text-4xl font-bold text-purple-400 mt-2">
              {categories.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">High Competition</p>

            <p className="text-4xl font-bold text-yellow-400 mt-2">
              {highCompetitionCases}
            </p>
          </div>

          <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">My Open Proposals</p>

            <p className="text-4xl font-bold text-emerald-400 mt-2">
              {mySubmittedProposals}
            </p>
          </div>
        </div>

        {categories.length === 0 && (
          <div className="mb-10 bg-yellow-950/30 border border-yellow-600 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
              No company categories found
            </h2>

            <p className="text-slate-300">
              Add a company profile first so Dasres can match open cases to your
              service category.
            </p>

            <Link
              href="/dashboard/companies/new"
              className="inline-block mt-4 bg-yellow-600 hover:bg-yellow-700 text-black px-5 py-3 rounded-xl font-semibold"
            >
              Add Company
            </Link>
          </div>
        )}

        {openCases.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            No matching open cases found.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {openCases.map((tradeCase) => (
              <Link
                key={tradeCase.id}
                href={`/dashboard/cases/${tradeCase.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500 transition"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-purple-600/20 text-purple-300 border border-purple-800 px-3 py-1 rounded-full text-xs">
                    {tradeCase.category}
                  </span>

                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs">
                    {tradeCase.status}
                  </span>

                  {tradeCase.proposals.length >= 3 && (
                    <span className="bg-yellow-600 text-black px-3 py-1 rounded-full text-xs font-semibold">
                      High Competition
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition">
                  {tradeCase.title}
                </h2>

                <p className="text-slate-400 text-sm leading-6 mb-5 line-clamp-3">
                  {tradeCase.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs">Proposals</p>

                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {tradeCase.proposals.length}
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs">Documents</p>

                    <p className="text-2xl font-bold text-cyan-400 mt-1">
                      {tradeCase.documents.length}
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs">Messages</p>

                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {tradeCase.messages.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    Created: {tradeCase.createdAt.toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-3">
                    <StopLinkClick>
                      <SaveCaseButton
                        caseId={tradeCase.id}
                        initialSaved={tradeCase.savedCases.length > 0}
                      />
                    </StopLinkClick>
                    <span className="text-blue-400 text-sm group-hover:underline">
                      View Case →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
