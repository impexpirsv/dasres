import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import SaveCaseButton from "../../components/SaveCaseButton";

export default async function SavedCasesPage() {
  const user = await requireUser();

  const savedCases = await prisma.savedCase.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      id: "desc",
    },
    include: {
      tradeCase: {
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
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-4">
            Saved Cases
          </h1>

          <p className="text-slate-400">
            Trade cases you saved for later review.
          </p>
        </div>

        {savedCases.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            You have not saved any cases yet.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {savedCases.map((savedCase) => {
              const tradeCase = savedCase.tradeCase;

              return (
                <Link
                  key={savedCase.id}
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
                  </div>

                  <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition">
                    {tradeCase.title}
                  </h2>

                  <p className="text-slate-400 text-sm leading-6 mb-5 line-clamp-3">
                    {tradeCase.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Proposals
                      </p>

                      <p className="text-2xl font-bold text-blue-400 mt-1">
                        {tradeCase.proposals.length}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Documents
                      </p>

                      <p className="text-2xl font-bold text-cyan-400 mt-1">
                        {tradeCase.documents.length}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs">
                        Messages
                      </p>

                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {tradeCase.messages.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
                    <p className="text-xs text-slate-500">
                      Saved:{" "}
                      {savedCase.createdAt.toLocaleDateString()}
                    </p>

                    <div className="flex items-center gap-3">
                      <div
                        onClick={(event) =>
                          event.preventDefault()
                        }
                      >
                        <SaveCaseButton
                          caseId={tradeCase.id}
                         initialSaved={tradeCase.savedCases.length > 0}
                        />
                      </div>

                      <span className="text-blue-400 text-sm group-hover:underline">
                        View Case →
                      </span>
                    </div>
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