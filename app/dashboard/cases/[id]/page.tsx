import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import Link from "next/link";
import CompleteCaseStepButton from "../../../components/CompleteCaseStepButton";
import AddCaseMessageForm from "../../../components/AddCaseMessageForm";
import AddCaseDocumentForm from "../../../components/AddCaseDocumentForm";
import AddCaseProposalForm from "../../../components/AddCaseProposalForm";
type Props = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({
  params,
}: Props) {
  const user = await requireUser();

  const { id } = await params;

  const tradeCase = await prisma.tradeCase.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      steps: {
        orderBy: {
          id: "asc",
        },
      },
      documents: {
        orderBy: {
          id: "desc",
        },
      },
      messages: {
        orderBy: {
          id: "asc",
        },
      },
      proposals: {
        orderBy: {
          id: "desc",
        },
      },
    },
  });

  if (!tradeCase) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Case Not Found
        </h1>
      </div>
    );
  }

  if (
    user.role !== "admin" &&
    tradeCase.customerId !== user.id
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Access Denied
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <Link
          href="/dashboard/cases"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Cases
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                  Case #{tradeCase.id}
                </span>

                <span className="bg-blue-600 px-4 py-2 rounded-full text-sm">
                  {tradeCase.status}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">
                {tradeCase.title}
              </h1>

              <p className="text-slate-300 leading-8">
                {tradeCase.description}
              </p>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <h2 className="text-2xl font-bold mb-6">
                Case Timeline
              </h2>

              <div className="space-y-4">
                {tradeCase.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed
                        ? "bg-emerald-600"
                        : "bg-slate-700"
                        }`}
                    >
                      {step.completed ? "✓" : "•"}
                    </div>

                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="font-semibold">
                          {step.title}
                        </p>

                        <p className="text-sm text-slate-500">
                          {step.completed
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>

                      {!step.completed && (
                        <CompleteCaseStepButton
                          stepId={step.id}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Case Information
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-sm">
                    Status
                  </p>
                  <p className="text-slate-200">
                    {tradeCase.status}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Created
                  </p>
                  <p className="text-slate-200">
                    {tradeCase.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Last Updated
                  </p>
                  <p className="text-slate-200">
                    {tradeCase.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Documents
              </h2>

              <AddCaseDocumentForm caseId={tradeCase.id} />

              <div className="mt-6">
                {tradeCase.documents.length === 0 ? (
                  <p className="text-slate-500">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tradeCase.documents.map((document) => (
                      <a
                        key={document.id}
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-800 rounded-xl p-3 hover:bg-slate-700"
                      >
                        {document.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Messages
              </h2>

              <AddCaseMessageForm caseId={tradeCase.id} />

              <div className="mt-6"></div>
              {tradeCase.messages.length === 0 ? (
                <p className="text-slate-500">
                  No messages yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {tradeCase.messages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-slate-800 rounded-xl p-3"
                    >
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Proposals
              </h2>
              <AddCaseProposalForm caseId={tradeCase.id} />
              {tradeCase.proposals.length === 0 ? (
                <p className="text-slate-500">
                  No proposals yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {tradeCase.proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-slate-800 rounded-xl p-4"
                    >
                      <p className="font-semibold mb-2">
                        {proposal.price || "No price"}
                      </p>

                      <p className="text-sm text-slate-300">
                        {proposal.message}
                      </p>

                      <p className="text-xs text-slate-500 mt-2">
                        {proposal.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}