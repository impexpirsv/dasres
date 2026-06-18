import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import Link from "next/link";
import CompleteCaseStepButton from "../../../components/CompleteCaseStepButton";
import AddCaseMessageForm from "../../../components/AddCaseMessageForm";
import AddCaseDocumentForm from "../../../components/AddCaseDocumentForm";
import AddCaseProposalForm from "../../../components/AddCaseProposalForm";
import ProposalActionButtons from "../../../components/ProposalActionButtons";
import CompleteCaseButton from "../../../components/CompleteCaseButton";
import AddReviewForm from "../../../components/AddReviewForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const caseId = Number(id);

  if (!caseId || Number.isNaN(caseId)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">Invalid Case ID</h1>
      </div>
    );
  }

  const tradeCase = await prisma.tradeCase.findUnique({
    where: {
      id: caseId,
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
  include: {
    uploader: true,
  },
},
      messages: {
        orderBy: {
          id: "asc",
        },
        include: {
          sender: true,
        },
      },
      proposals: {
        orderBy: {
          id: "desc",
        },
        include: {
          company: true,
          expert: true,
        },
      },
      reviews: true,
    },
  });

  if (!tradeCase) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">Case Not Found</h1>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isCustomer = tradeCase.customerId === user.id;

  const winningProposal = tradeCase.proposals.find(
    (proposal) => proposal.id === tradeCase.acceptedProposalId,
  );

  const acceptedProviderUserId = winningProposal?.company?.ownerId || null;

  const isAcceptedProvider = acceptedProviderUserId === user.id;

  const userMatchingCompanies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
      category: tradeCase.category,
    },
    orderBy: {
      name: "asc",
    },
  });

  const canViewCase =
    isAdmin ||
    isCustomer ||
    isAcceptedProvider ||
    (tradeCase.status === "OPEN" && userMatchingCompanies.length > 0);

  if (!canViewCase) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">Access Denied</h1>
      </div>
    );
  }

  const hasReviewedProvider = acceptedProviderUserId
    ? tradeCase.reviews.some(
        (review) =>
          review.reviewerId === user.id &&
          review.reviewedUserId === acceptedProviderUserId,
      )
    : true;

  const hasReviewedCustomer = tradeCase.reviews.some(
    (review) =>
      review.reviewerId === user.id &&
      review.reviewedUserId === tradeCase.customerId,
  );

  const companies = isAdmin
    ? await prisma.company.findMany({
        where: {
          category: tradeCase.category,
        },
        orderBy: {
          name: "asc",
        },
      })
    : userMatchingCompanies;

  const experts = await prisma.expert.findMany({
    where: {
      specialty: tradeCase.category,
      ...(isAdmin
        ? {}
        : {
            ownerId: user.id,
          }),
    },
    orderBy: {
      name: "asc",
    },
  });

  const canSubmitProposal =
    tradeCase.status === "OPEN" &&
    !tradeCase.acceptedProposalId &&
    !isCustomer &&
    companies.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Link
          href="/dashboard/cases"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Cases
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-6">
            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                  Case #{tradeCase.id}
                </span>

                <span className="bg-blue-600 px-4 py-2 rounded-full text-sm">
                  {tradeCase.status}
                </span>

                <span className="bg-purple-600 px-4 py-2 rounded-full text-sm">
                  {tradeCase.category}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{tradeCase.title}</h1>

              <p className="text-slate-300 leading-8">
                {tradeCase.description}
              </p>
            </section>

            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <h2 className="text-2xl font-bold mb-6">Case Timeline</h2>

              <div className="space-y-4">
                {tradeCase.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? "bg-emerald-600" : "bg-slate-700"
                      }`}
                    >
                      {step.completed ? "✓" : "•"}
                    </div>

                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="font-semibold">{step.title}</p>

                        <p className="text-sm text-slate-500">
                          {step.completed ? "Completed" : "Pending"}
                        </p>
                      </div>

                      {isAdmin && !step.completed && (
                        <CompleteCaseStepButton stepId={step.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <h2 className="text-2xl font-bold mb-6">Proposals</h2>

              {canSubmitProposal ? (
                <div className="mb-6">
                  <AddCaseProposalForm
                    caseId={tradeCase.id}
                    companies={companies}
                    experts={experts}
                  />
                </div>
              ) : tradeCase.acceptedProposalId ? (
                <p className="text-slate-500 mb-6">
                  A winning proposal has already been selected.
                </p>
              ) : tradeCase.status !== "OPEN" ? (
                <p className="text-slate-500 mb-6">
                  This case is already in progress. New proposals are closed.
                </p>
              ) : isCustomer ? (
                <p className="text-slate-500 mb-6">
                  You cannot submit a proposal for your own case.
                </p>
              ) : (
                <p className="text-slate-500 mb-6">
                  You do not have a matching company for this case category.
                </p>
              )}

              {tradeCase.proposals.length === 0 ? (
                <p className="text-slate-500">No proposals yet.</p>
              ) : (
                <div className="space-y-4">
                  {tradeCase.proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <p className="font-semibold text-lg">
                          {proposal.price || "No price"}
                        </p>

                        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                          {proposal.status}
                        </span>
                      </div>

                      <p className="text-sm text-blue-400">
                        Company: {proposal.company?.name || "Unknown"}
                      </p>

                      <p className="text-sm text-emerald-400 mt-1">
                        Expert: {proposal.expert?.name || "Not assigned"}
                      </p>

                      <p className="text-sm text-slate-300 mt-3">
                        {proposal.message}
                      </p>

                      {isCustomer && proposal.status === "PENDING" && (
                        <div className="mt-4">
                          <ProposalActionButtons proposalId={proposal.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-4">Messages</h2>

               {(isAdmin || isCustomer || isAcceptedProvider) &&
  tradeCase.status === "IN_PROGRESS" && (
    <AddCaseMessageForm caseId={tradeCase.id} />
)}

                <div className="mt-6">
                  {tradeCase.messages.length === 0 ? (
                    <p className="text-slate-500">No messages yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {tradeCase.messages.map((message) => {
  const isMine = message.senderId === user.id;

  return (
    <div
      key={message.id}
      className={`flex ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl p-4 ${
          isMine
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-200"
        }`}
      >
        <div className="flex justify-between items-center gap-4 mb-2">
          <p
            className={`text-sm font-semibold ${
              isMine ? "text-blue-100" : "text-blue-400"
            }`}
          >
            {message.sender.name}
          </p>

          <p
            className={`text-xs ${
              isMine ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {message.createdAt.toLocaleString()}
          </p>
        </div>

        <p>{message.content}</p>
      </div>
    </div>
  );
})}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-4">Documents</h2>

            {(isAdmin || isCustomer || isAcceptedProvider) &&
  tradeCase.status === "IN_PROGRESS" && (
    <AddCaseDocumentForm caseId={tradeCase.id} />
)}

                <div className="mt-6">
                  {tradeCase.documents.length === 0 ? (
                    <p className="text-slate-500">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {tradeCase.documents.map((document) => (
  <div
    key={document.id}
    className="bg-slate-800 rounded-xl p-4"
  >
    <div className="flex justify-between items-start gap-4">
      <div>
        <p className="font-semibold">
          {document.name}
        </p>

        <p className="text-sm text-blue-400 mt-1">
          Uploaded by {document.uploader.name}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          {document.createdAt.toLocaleString()}
        </p>
      </div>

      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
      >
        Download
      </a>
    </div>
  </div>
))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Case Information</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-sm">Status</p>
                  <p className="text-slate-200">{tradeCase.status}</p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Category</p>
                  <p className="text-slate-200">{tradeCase.category}</p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Created</p>
                  <p className="text-slate-200">
                    {tradeCase.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Last Updated</p>
                  <p className="text-slate-200">
                    {tradeCase.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Assigned Provider</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-sm">Winning Proposal</p>
                  <p className="text-slate-200">
                    {winningProposal
                      ? `#${winningProposal.id} - ${
                          winningProposal.price || "No price"
                        }`
                      : "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Winning Company</p>
                  <p className="text-slate-200">
                    {winningProposal?.company?.name || "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Winning Expert</p>
                  <p className="text-slate-200">
                    {winningProposal?.expert?.name || "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Assigned At</p>
                  <p className="text-slate-200">
                    {tradeCase.assignedAt
                      ? tradeCase.assignedAt.toLocaleDateString()
                      : "Not assigned"}
                  </p>
                </div>
              </div>

              {(isAdmin || isCustomer) &&
                tradeCase.status === "IN_PROGRESS" && (
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <CompleteCaseButton caseId={tradeCase.id} />
                  </div>
                )}
            </section>

            {tradeCase.status === "COMPLETED" && (
              <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>

                {isCustomer &&
                  acceptedProviderUserId &&
                  !hasReviewedProvider && (
                    <AddReviewForm
                      caseId={tradeCase.id}
                      reviewedUserId={acceptedProviderUserId}
                      label="Review accepted provider"
                    />
                  )}

                {!isCustomer &&
                  acceptedProviderUserId === user.id &&
                  !hasReviewedCustomer && (
                    <AddReviewForm
                      caseId={tradeCase.id}
                      reviewedUserId={tradeCase.customerId}
                      label="Review customer"
                    />
                  )}

                {((isCustomer && hasReviewedProvider) ||
                  (!isCustomer && hasReviewedCustomer)) && (
                  <p className="text-slate-500">
                    Your review has already been submitted.
                  </p>
                )}
                {!isCustomer && acceptedProviderUserId !== user.id && (
                  <p className="text-slate-500">
                    Only the customer and accepted provider can submit reviews
                    for this case.
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
