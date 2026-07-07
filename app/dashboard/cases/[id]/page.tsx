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
import EmptyState from "../../../components/EmptyState";
import TradeWorkflowTimeline from "../../../components/trade/TradeWorkflowTimeline";
function getActivityDisplay(action: string) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return {
        title: "Proposal Submitted",
        icon: "📨",
        border: "border-yellow-500",
      };

    case "PROPOSAL_ACCEPTED":
      return {
        title: "Proposal Accepted",
        icon: "✅",
        border: "border-green-500",
      };

    case "PROPOSAL_REJECTED":
      return {
        title: "Proposal Rejected",
        icon: "❌",
        border: "border-red-500",
      };

    case "MESSAGE_SENT":
      return {
        title: "Message Sent",
        icon: "💬",
        border: "border-blue-500",
      };

    case "DOCUMENT_UPLOADED":
      return {
        title: "Document Uploaded",
        icon: "📄",
        border: "border-purple-500",
      };

    case "CASE_COMPLETED":
      return {
        title: "Case Completed",
        icon: "🏁",
        border: "border-emerald-500",
      };
    case "REVIEW_SUBMITTED":
      return {
        title: "Review Submitted",
        icon: "⭐",
        border: "border-yellow-500",
      };
    default:
      return {
        title: action.replaceAll("_", " "),
        icon: "•",
        border: "border-slate-600",
      };
  }
}
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
      activities: {
        orderBy: {
          id: "desc",
        },
        include: {
          user: true,
        },
      },
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
  const recommendedCompanies = await prisma.company.findMany({
    where: {
      category: tradeCase.category,
      verificationStatus: "VERIFIED",
    },
    include: {
      owner: {
        include: {
          reviewsReceived: true,
        },
      },
    },
    take: 5,
  });
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
  const completedStepsCount = tradeCase.steps.filter(
    (step) => step.completed,
  ).length;

  const totalStepsCount = tradeCase.steps.length;

  const progressPercent =
    totalStepsCount > 0
      ? Math.round((completedStepsCount / totalStepsCount) * 100)
      : 0;
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
           <TradeWorkflowTimeline
  currentStep={completedStepsCount}
/>
            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-full text-sm text-slate-300">
                  Case #{tradeCase.id}
                </span>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    tradeCase.status === "OPEN"
                      ? "bg-blue-600"
                      : tradeCase.status === "IN_PROGRESS"
                        ? "bg-orange-600"
                        : tradeCase.status === "COMPLETED"
                          ? "bg-emerald-600"
                          : "bg-red-600"
                  }`}
                >
                  {tradeCase.status === "OPEN"
                    ? "🟢 OPEN"
                    : tradeCase.status === "IN_PROGRESS"
                      ? "🟡 IN PROGRESS"
                      : tradeCase.status === "COMPLETED"
                        ? "✅ COMPLETED"
                        : "🔴 CANCELLED"}
                </span>

                <span className="bg-purple-600/20 border border-purple-500/40 text-purple-300 px-4 py-2 rounded-full text-sm font-semibold">
                  🧭 {tradeCase.category}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{tradeCase.title}</h1>

              <p className="text-slate-300 leading-8">
                {tradeCase.description}
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Customer</p>

                  <p className="font-semibold text-slate-200 mt-1">
                    {isCustomer ? "You" : `User #${tradeCase.customerId}`}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Winning Company</p>

                  <p className="font-semibold text-slate-200 mt-1">
                    {winningProposal?.company?.name || "Not selected"}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Winning Expert</p>

                  <p className="font-semibold text-slate-200 mt-1">
                    {winningProposal?.expert?.name || "Not assigned"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Proposals</p>

                  <p className="text-3xl font-bold text-blue-400">
                    {tradeCase.proposals.length}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Messages</p>

                  <p className="text-3xl font-bold text-emerald-400">
                    {tradeCase.messages.length}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Documents</p>

                  <p className="text-3xl font-bold text-cyan-400">
                    {tradeCase.documents.length}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Activities</p>

                  <p className="text-3xl font-bold text-purple-400">
                    {tradeCase.activities.length}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Progress</p>

                  <p className="text-3xl font-bold text-emerald-400">
                    {progressPercent}%
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">Case Timeline</h2>

                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {progressPercent}% Complete
                </span>
              </div>

              <div className="mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Workflow Progress
                    </span>

                    <span className="text-sm font-semibold text-emerald-400">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {completedStepsCount} of {totalStepsCount} steps completed
                </p>
              </div>

              <div className="space-y-4">
                {tradeCase.steps.map((step) => {
                  const isFinalStep = step.title === "Completed";

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-4 rounded-2xl p-4 border ${
                        isFinalStep && step.completed
                          ? "bg-emerald-600/20 border-emerald-400"
                          : step.completed
                            ? "bg-emerald-950/30 border-emerald-600"
                            : "bg-slate-950 border-slate-800"
                      }`}
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

                          <p
                            className={`text-sm mt-1 ${
                              step.completed
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }`}
                          >
                            {step.completed
                              ? "✓ Step completed"
                              : "Waiting for completion"}
                          </p>
                        </div>

                        {isAdmin && !step.completed && (
                          <CompleteCaseStepButton stepId={step.id} />
                        )}
                      </div>
                    </div>
                  );
                })}
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
                <EmptyState
                  icon="🤝"
                  title="No proposals yet"
                  description="Matching companies can submit proposals while this case is open."
                />
              ) : (
                <div className="space-y-4">
                  {tradeCase.proposals.map((proposal) => {
                    const statusClass =
                      proposal.status === "ACCEPTED"
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        : proposal.status === "REJECTED"
                          ? "bg-red-500/20 border border-red-500/40 text-red-300"
                          : "bg-yellow-500/20 border border-yellow-500/40 text-yellow-300";

                    return (
                      <div
                        key={proposal.id}
                        className={`rounded-3xl p-6 border transition ${
                          proposal.id === tradeCase.acceptedProposalId
                            ? "bg-emerald-950/30 border-emerald-500"
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-2xl shrink-0">
                              🏢
                            </div>

                            <div>
                              <p className="text-slate-500 text-sm">
                                Provider Proposal
                              </p>

                              <h3 className="text-2xl font-bold mt-1">
                                {proposal.company?.name || "Unknown Company"}
                              </h3>

                              <p className="text-sm text-slate-400 mt-1">
                                {proposal.expert?.name
                                  ? `Expert: ${proposal.expert.name}`
                                  : "No expert assigned"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                          >
                            {proposal.status === "ACCEPTED"
                              ? "✓ Accepted"
                              : proposal.status === "REJECTED"
                                ? "Rejected"
                                : "Pending"}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 mb-5">
                          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                            <p className="text-slate-500 text-xs">Price</p>

                            <p className="text-xl font-bold text-emerald-400 mt-1">
                              {proposal.price || "No price"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                            <p className="text-slate-500 text-xs">Company</p>

                            {proposal.company?.id ? (
                              <Link
                                href={`/dashboard/companies/${proposal.company.id}`}
                                className="block text-blue-400 hover:underline font-semibold mt-1 truncate"
                              >
                                View Company →
                              </Link>
                            ) : (
                              <p className="text-slate-400 mt-1">Unknown</p>
                            )}
                          </div>

                          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                            <p className="text-slate-500 text-xs">Expert</p>

                            {proposal.expert?.id ? (
                              <Link
                                href={`/dashboard/experts/${proposal.expert.id}`}
                                className="block text-cyan-400 hover:underline font-semibold mt-1 truncate"
                              >
                                View Expert →
                              </Link>
                            ) : (
                              <p className="text-slate-400 mt-1">
                                Not assigned
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
                          <p className="text-slate-500 text-xs mb-2">
                            Proposal Message
                          </p>

                          <p className="text-sm text-slate-300 leading-7">
                            {proposal.message || "No message provided."}
                          </p>
                        </div>

                        {(isCustomer || isAdmin) &&
                          proposal.status === "PENDING" && (
                            <div className="mt-5">
                              <ProposalActionButtons proposalId={proposal.id} />
                            </div>
                          )}
                      </div>
                    );
                  })}
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
                    <EmptyState
                      icon="💬"
                      title="No messages yet"
                      description="Messages will appear here once the case is in progress."
                    />
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
                    <EmptyState
                      icon="📄"
                      title="No documents yet"
                      description="Uploaded trade documents will be stored here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {tradeCase.documents.map((document) => (
                        <div
                          key={document.id}
                          className="bg-slate-800 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="font-semibold">{document.name}</p>

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
              <h2 className="text-2xl font-bold mb-4">Recommended Companies</h2>

              <div className="space-y-3">
                {recommendedCompanies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.id}`}
                    className="block bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-blue-500 transition"
                  >
                    <p className="font-semibold">{company.name}</p>

                    <p className="text-sm text-slate-400">{company.country}</p>

                    <p className="text-xs text-emerald-400 mt-1">VERIFIED</p>
                  </Link>
                ))}
              </div>
            </section>
            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Assigned Provider</h2>
              {!winningProposal && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-5">
                  <div className="text-4xl mb-3">⏳</div>

                  <h3 className="text-lg font-bold mb-2">
                    No provider assigned yet
                  </h3>

                  <p className="text-slate-400 text-sm leading-6">
                    Once the customer accepts a proposal, the selected company
                    or expert will appear here as the assigned provider.
                  </p>
                </div>
              )}
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
                  {winningProposal?.company?.id && (
                    <Link
                      href={`/dashboard/companies/${winningProposal.company.id}`}
                      className="inline-block mt-2 text-blue-400 hover:underline"
                    >
                      View Company →
                    </Link>
                  )}
                  <p className="text-slate-200">
                    {winningProposal?.company?.name || "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Winning Expert</p>
                  {winningProposal?.expert?.id && (
                    <Link
                      href={`/dashboard/experts/${winningProposal.expert.id}`}
                      className="inline-block mt-2 text-blue-400 hover:underline"
                    >
                      View Expert →
                    </Link>
                  )}
                  <p className="text-slate-200">
                    {winningProposal?.expert?.name || "Not selected"}
                  </p>
                  {winningProposal && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-slate-500 text-sm">Proposal Value</p>

                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {winningProposal.price || "N/A"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm">Reviews</p>

                  <p className="text-3xl font-bold text-yellow-400">
                    {tradeCase.reviews.length}
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
            <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Case Activity ({tradeCase.activities.length})
              </h2>

              {tradeCase.activities.length === 0 ? (
                <EmptyState
                  icon="📌"
                  title="No activity yet"
                  description="Case events, proposals, messages and document actions will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {tradeCase.activities.map((activity) => {
                    const activityDisplay = getActivityDisplay(activity.action);

                    return (
                      <div
                        key={activity.id}
                        className={`border-l-2 ${activityDisplay.border} pl-4`}
                      >
                        <p className="font-semibold">
                          {activityDisplay.icon} {activityDisplay.title}
                        </p>

                        {activity.details && (
                          <p className="text-sm text-slate-400 mt-1">
                            {activity.details}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 mt-1">
                          {activity.user?.name ||
                            activity.user?.email ||
                            "System"}{" "}
                          · {activity.createdAt.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
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
