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
        <h1 className="text-4xl font-bold">
          Case Not Found
        </h1>
      </div>
    );
  }

 const isAdmin = user.role === "admin";
const isCustomer = tradeCase.customerId === user.id;

const winningProposal = tradeCase.proposals.find(
  (proposal) =>
    proposal.id === tradeCase.acceptedProposalId
);

const acceptedProviderUserId =
  winningProposal?.company?.ownerId || null;

const isAcceptedProvider =
  acceptedProviderUserId === user.id;

const userMatchingCompanies =
  await prisma.company.findMany({
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
  (tradeCase.status === "OPEN" &&
    userMatchingCompanies.length > 0);

if (!canViewCase) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Access Denied
      </h1>
    </div>
  );
}

const hasReviewedProvider =
  acceptedProviderUserId
    ? tradeCase.reviews.some(
        (review) =>
          review.reviewerId === user.id &&
          review.reviewedUserId === acceptedProviderUserId
      )
    : true;

const hasReviewedCustomer =
  tradeCase.reviews.some(
    (review) =>
      review.reviewerId === user.id &&
      review.reviewedUserId === tradeCase.customerId
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

                <span className="bg-purple-600 px-4 py-2 rounded-full text-sm">
                  {tradeCase.category}
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

                      {isAdmin && !step.completed && (
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
              {tradeCase.status === "COMPLETED" && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Reviews
                  </h2>

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
                </div>
              )}
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
                    Category
                  </p>
                  <p className="text-slate-200">
                    {tradeCase.category}
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

                <div>
                  <p className="text-slate-500 text-sm">
                    Winning Proposal
                  </p>
                  <p className="text-slate-200">
                    {winningProposal
                      ? `#${winningProposal.id} - ${winningProposal.price || "No price"
                      }`
                      : "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Winning Company
                  </p>
                  <p className="text-slate-200">
                    {winningProposal?.company?.name ||
                      "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Winning Expert
                  </p>
                  <p className="text-slate-200">
                    {winningProposal?.expert?.name ||
                      "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Assigned At
                  </p>
                  <p className="text-slate-200">
                    {tradeCase.assignedAt
                      ? tradeCase.assignedAt.toLocaleDateString()
                      : "Not assigned"}
                  </p>
                  {(isAdmin || isCustomer) &&
                    tradeCase.status === "IN_PROGRESS" && (
                      <div className="pt-4 border-t border-slate-800">
                        <CompleteCaseButton caseId={tradeCase.id} />
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Documents
              </h2>

              {(isAdmin || isCustomer) && (
                <AddCaseDocumentForm caseId={tradeCase.id} />
              )}

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

              {(isAdmin || isCustomer) && (
                <AddCaseMessageForm caseId={tradeCase.id} />
              )}

              <div className="mt-6">
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
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Proposals
              </h2>

              {canSubmitProposal ? (
                <AddCaseProposalForm
                  caseId={tradeCase.id}
                  companies={companies}
                  experts={experts}
                />
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

                      <p className="text-sm text-blue-400">
                        Company:{" "}
                        {proposal.company?.name || "Unknown"}
                      </p>

                      <p className="text-sm text-emerald-400">
                        Expert:{" "}
                        {proposal.expert?.name ||
                          "Not assigned"}
                      </p>

                      <p className="text-sm text-slate-300">
                        {proposal.message}
                      </p>

                      <p className="text-xs text-slate-500 mt-2">
                        {proposal.status}
                      </p>

                      {isCustomer &&
                        proposal.status === "PENDING" && (
                          <ProposalActionButtons
                            proposalId={proposal.id}
                          />
                        )}
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