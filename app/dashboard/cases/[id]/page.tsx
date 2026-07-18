import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import StatusBadge, { type Status } from "../../../components/StatusBadge";
import CompleteCaseStepButton from "../../../components/CompleteCaseStepButton";
import AddCaseMessageForm from "../../../components/AddCaseMessageForm";
import AddCaseDocumentForm from "../../../components/AddCaseDocumentForm";
import AddCaseProposalForm from "../../../components/AddCaseProposalForm";
import ProposalActionButtons from "../../../components/ProposalActionButtons";
import CompleteCaseButton from "../../../components/CompleteCaseButton";
import AddReviewForm from "../../../components/AddReviewForm";
import EmptyState from "../../../components/EmptyState";
import TradeWorkflowTimeline from "../../../components/trade/TradeWorkflowTimeline";

type ActivityTranslation = (key: string) => string;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getActivityDisplay(action: string, t: ActivityTranslation) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return {
        title: t("activity.actions.proposalSubmitted"),
        icon: "📨",
        border: "border-yellow-500",
      };

    case "PROPOSAL_ACCEPTED":
      return {
        title: t("activity.actions.proposalAccepted"),
        icon: "✅",
        border: "border-green-500",
      };

    case "PROPOSAL_REJECTED":
      return {
        title: t("activity.actions.proposalRejected"),
        icon: "❌",
        border: "border-red-500",
      };

    case "MESSAGE_SENT":
      return {
        title: t("activity.actions.messageSent"),
        icon: "💬",
        border: "border-blue-500",
      };

    case "DOCUMENT_UPLOADED":
      return {
        title: t("activity.actions.documentUploaded"),
        icon: "📄",
        border: "border-purple-500",
      };

    case "CASE_COMPLETED":
      return {
        title: t("activity.actions.caseCompleted"),
        icon: "🏁",
        border: "border-emerald-500",
      };

    case "REVIEW_SUBMITTED":
      return {
        title: t("activity.actions.reviewSubmitted"),
        icon: "⭐",
        border: "border-yellow-500",
      };

    default:
      return {
        title: action
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (character) => character.toUpperCase()),
        icon: "•",
        border: "border-slate-600",
      };
  }
}

export default async function CaseDetailPage({ params }: Props) {
  const user = await requireUser();

  const [t, locale] = await Promise.all([
    getTranslations("caseDetailPage"),
    getLocale(),
  ]);

  const { id } = await params;
  const caseId = Number(id);

  if (!Number.isInteger(caseId) || caseId <= 0) {
    notFound();
  }

  const tradeCase = await prisma.tradeCase.findUnique({
    where: {
      id: caseId,
    },
    select: {
      id: true,
      customerId: true,
      acceptedProposalId: true,
      status: true,
      category: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      assignedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      steps: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          title: true,
          completed: true,
        },
      },
      documents: {
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          name: true,
          fileUrl: true,
          createdAt: true,
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          senderId: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      proposals: {
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          status: true,
          price: true,
          message: true,
          company: {
            select: {
              id: true,
              ownerId: true,
              name: true,
            },
          },
          expert: {
            select: {
              id: true,
              ownerId: true,
              name: true,
            },
          },
        },
      },
      reviews: {
        select: {
          reviewerId: true,
          reviewedUserId: true,
        },
      },
      activities: {
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!tradeCase) {
    notFound();
  }

  const isAdmin = user.role === "admin";
  const isCustomer = tradeCase.customerId === user.id;

  const winningProposal = tradeCase.proposals.find(
    (proposal) => proposal.id === tradeCase.acceptedProposalId,
  );

  const acceptedProviderUserId =
    winningProposal?.company?.ownerId ??
    winningProposal?.expert?.ownerId ??
    null;

  const isAcceptedProvider = acceptedProviderUserId === user.id;

  const hasReviewedProvider =
    acceptedProviderUserId !== null &&
    tradeCase.reviews.some(
      (review) =>
        review.reviewerId === tradeCase.customerId &&
        review.reviewedUserId === acceptedProviderUserId,
    );

  const hasReviewedCustomer =
    acceptedProviderUserId !== null &&
    tradeCase.reviews.some(
      (review) =>
        review.reviewerId === acceptedProviderUserId &&
        review.reviewedUserId === tradeCase.customerId,
    );

  const [userMatchingCompanies, recommendedCompanies, adminCompanies, experts] =
    await Promise.all([
      prisma.company.findMany({
        where: {
          ownerId: user.id,
          category: tradeCase.category,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.company.findMany({
        where: {
          category: tradeCase.category,
          verificationStatus: "VERIFIED",
        },
        orderBy: {
          name: "asc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          country: true,
        },
      }),

      isAdmin
        ? prisma.company.findMany({
            where: {
              category: tradeCase.category,
            },
            orderBy: {
              name: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          })
        : Promise.resolve([]),

      prisma.expert.findMany({
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
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const companies = isAdmin ? adminCompanies : userMatchingCompanies;
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

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function formatDate(value: Date | string | null) {
    if (!value) {
      return t("notAssigned");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  function formatDateTime(value: Date | string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateTimeFormatter.format(date);
  }

  const isRtl = locale.startsWith("fa") || locale.startsWith("ar");

  const customerName =
    tradeCase.customer.name || tradeCase.customer.email || t("unknownUser");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Link
          href="/dashboard/cases"
          className="mb-8 inline-flex items-center gap-2 text-blue-400 hover:underline"
        >
          <span aria-hidden="true">{isRtl ? "→" : "←"}</span>

          <span>{t("backToCases")}</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TradeWorkflowTimeline currentStep={completedStepsCount} />

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-300">
                  {t("caseNumber", {
                    id: tradeCase.id,
                  })}
                </span>

                <StatusBadge status={tradeCase.status as Status} />

                <span className="rounded-full border border-purple-500/40 bg-purple-600/20 px-4 py-2 text-sm font-semibold text-purple-300">
                  <span aria-hidden="true">🧭</span> {tradeCase.category}
                </span>
              </div>

              <h1 className="mb-4 break-words text-4xl font-bold">
                {tradeCase.title}
              </h1>

              <p className="whitespace-pre-wrap break-words leading-8 text-slate-300">
                {tradeCase.description}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">{t("customer")}</p>

                  <p className="mt-1 break-words font-semibold text-slate-200">
                    {isCustomer ? t("you") : customerName}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">
                    {t("winningCompany")}
                  </p>

                  <p className="mt-1 break-words font-semibold text-slate-200">
                    {winningProposal?.company?.name ?? t("notSelected")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">{t("winningExpert")}</p>

                  <p className="mt-1 break-words font-semibold text-slate-200">
                    {winningProposal?.expert?.name ?? t("notAssigned")}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">
                    {t("metrics.proposals")}
                  </p>

                  <p className="text-3xl font-bold text-blue-400">
                    {tradeCase.proposals.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">
                    {t("metrics.messages")}
                  </p>

                  <p className="text-3xl font-bold text-emerald-400">
                    {tradeCase.messages.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">
                    {t("metrics.documents")}
                  </p>

                  <p className="text-3xl font-bold text-cyan-400">
                    {tradeCase.documents.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">
                    {t("metrics.activities")}
                  </p>

                  <p className="text-3xl font-bold text-purple-400">
                    {tradeCase.activities.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">{t("progress")}</p>

                  <p className="text-3xl font-bold text-emerald-400">
                    {progressPercent}%
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">{t("timeline")}</h2>

                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {t("percentComplete", {
                    percent: progressPercent,
                  })}
                </span>
              </div>

              <div className="mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      {t("workflowProgress")}
                    </span>

                    <span className="text-sm font-semibold text-emerald-400">
                      {progressPercent}%
                    </span>
                  </div>

                  <div
                    className="h-3 w-full overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-label={t("workflowProgress")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPercent}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {t("stepsSummary", {
                    completed: completedStepsCount,
                    total: totalStepsCount,
                  })}
                </p>
              </div>

              {tradeCase.steps.length === 0 ? (
                <EmptyState
                  icon="🧭"
                  title={t("timelineEmpty.title")}
                  description={t("timelineEmpty.description")}
                />
              ) : (
                <div className="space-y-4">
                  {tradeCase.steps.map((step) => {
                    const isFinalStep = step.title === "Completed";

                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-4 rounded-2xl border p-4 ${
                          isFinalStep && step.completed
                            ? "border-emerald-400 bg-emerald-600/20"
                            : step.completed
                              ? "border-emerald-600 bg-emerald-950/30"
                              : "border-slate-800 bg-slate-950"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            step.completed ? "bg-emerald-600" : "bg-slate-700"
                          }`}
                        >
                          {step.completed ? "✓" : "•"}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words font-semibold">
                              {step.title}
                            </p>

                            <p
                              className={`mt-1 text-sm ${
                                step.completed
                                  ? "text-emerald-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {step.completed
                                ? t("timelineStep.completed")
                                : t("timelineStep.pending")}
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
              )}
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h2 className="mb-6 text-2xl font-bold">
                {t("proposals.title")}
              </h2>

              {canSubmitProposal ? (
                <div className="mb-6">
                  <AddCaseProposalForm
                    caseId={tradeCase.id}
                    companies={companies}
                    experts={experts}
                  />
                </div>
              ) : tradeCase.acceptedProposalId ? (
                <p className="mb-6 text-slate-500">
                  {t("proposals.winnerSelected")}
                </p>
              ) : tradeCase.status !== "OPEN" ? (
                <p className="mb-6 text-slate-500">{t("proposals.closed")}</p>
              ) : isCustomer ? (
                <p className="mb-6 text-slate-500">{t("proposals.ownCase")}</p>
              ) : (
                <p className="mb-6 text-slate-500">
                  {t("proposals.noMatchingCompany")}
                </p>
              )}

              {tradeCase.proposals.length === 0 ? (
                <EmptyState
                  icon="🤝"
                  title={t("proposals.empty.title")}
                  description={t("proposals.empty.description")}
                />
              ) : (
                <div className="space-y-4">
                  {tradeCase.proposals.map((proposal) => {
                    const statusClass =
                      proposal.status === "ACCEPTED"
                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        : proposal.status === "REJECTED"
                          ? "border border-red-500/40 bg-red-500/20 text-red-300"
                          : "border border-yellow-500/40 bg-yellow-500/20 text-yellow-300";

                    const proposalStatus =
                      proposal.status === "ACCEPTED"
                        ? t("proposals.status.accepted")
                        : proposal.status === "REJECTED"
                          ? t("proposals.status.rejected")
                          : t("proposals.status.pending");

                    return (
                      <article
                        key={proposal.id}
                        className={`rounded-3xl border p-6 transition ${
                          proposal.id === tradeCase.acceptedProposalId
                            ? "border-emerald-500 bg-emerald-950/30"
                            : "border-slate-800 bg-slate-950"
                        }`}
                      >
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              aria-hidden="true"
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-2xl"
                            >
                              🏢
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm text-slate-500">
                                {t("proposals.providerProposal")}
                              </p>

                              <h3 className="mt-1 break-words text-2xl font-bold">
                                {proposal.company?.name ??
                                  t("proposals.unknownCompany")}
                              </h3>

                              <p className="mt-1 break-words text-sm text-slate-400">
                                {proposal.expert?.name
                                  ? t("proposals.expertName", {
                                      name: proposal.expert.name,
                                    })
                                  : t("proposals.noExpert")}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {proposalStatus}
                          </span>
                        </div>

                        <div className="mb-5 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs text-slate-500">
                              {t("proposals.price")}
                            </p>

                            <p className="mt-1 break-words text-xl font-bold text-emerald-400">
                              {proposal.price || t("proposals.noPrice")}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs text-slate-500">
                              {t("proposals.company")}
                            </p>

                            {proposal.company?.id ? (
                              <Link
                                href={`/dashboard/companies/${proposal.company.id}`}
                                className="mt-1 block truncate font-semibold text-blue-400 hover:underline"
                              >
                                {t("viewCompany")}{" "}
                                <span aria-hidden="true">
                                  {isRtl ? "←" : "→"}
                                </span>
                              </Link>
                            ) : (
                              <p className="mt-1 text-slate-400">
                                {t("unknown")}
                              </p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs text-slate-500">
                              {t("proposals.expert")}
                            </p>

                            {proposal.expert?.id ? (
                              <Link
                                href={`/dashboard/experts/${proposal.expert.id}`}
                                className="mt-1 block truncate font-semibold text-cyan-400 hover:underline"
                              >
                                {t("viewExpert")}{" "}
                                <span aria-hidden="true">
                                  {isRtl ? "←" : "→"}
                                </span>
                              </Link>
                            ) : (
                              <p className="mt-1 text-slate-400">
                                {t("notAssigned")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                          <p className="mb-2 text-xs text-slate-500">
                            {t("proposals.message")}
                          </p>

                          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                            {proposal.message || t("proposals.noMessage")}
                          </p>
                        </div>

                        {(isCustomer || isAdmin) &&
                          proposal.status === "PENDING" && (
                            <div className="mt-5">
                              <ProposalActionButtons proposalId={proposal.id} />
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("messages.title")}
                </h2>

                {(isAdmin || isCustomer || isAcceptedProvider) &&
                  tradeCase.status === "IN_PROGRESS" && (
                    <AddCaseMessageForm caseId={tradeCase.id} />
                  )}

                <div className="mt-6">
                  {tradeCase.messages.length === 0 ? (
                    <EmptyState
                      icon="💬"
                      title={t("messages.empty.title")}
                      description={t("messages.empty.description")}
                    />
                  ) : (
                    <div className="space-y-3">
                      {tradeCase.messages.map((message) => {
                        const isMine = message.senderId === user.id;

                        const senderName =
                          message.sender.name ||
                          message.sender.email ||
                          t("unknownUser");

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[90%] rounded-2xl p-4 sm:max-w-[80%] ${
                                isMine
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-200"
                              }`}
                            >
                              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                <p
                                  className={`break-words text-sm font-semibold ${
                                    isMine ? "text-blue-100" : "text-blue-400"
                                  }`}
                                >
                                  {isMine ? t("you") : senderName}
                                </p>

                                <time
                                  dateTime={new Date(
                                    message.createdAt,
                                  ).toISOString()}
                                  className={`shrink-0 text-xs ${
                                    isMine ? "text-blue-100" : "text-slate-500"
                                  }`}
                                >
                                  {formatDateTime(message.createdAt)}
                                </time>
                              </div>

                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("documents.title")}
                </h2>

                {(isAdmin || isCustomer || isAcceptedProvider) &&
                  tradeCase.status === "IN_PROGRESS" && (
                    <AddCaseDocumentForm caseId={tradeCase.id} />
                  )}

                <div className="mt-6">
                  {tradeCase.documents.length === 0 ? (
                    <EmptyState
                      icon="📄"
                      title={t("documents.empty.title")}
                      description={t("documents.empty.description")}
                    />
                  ) : (
                    <div className="space-y-3">
                      {tradeCase.documents.map((document) => {
                        const uploader =
                          document.uploader.name ||
                          document.uploader.email ||
                          t("unknownUser");

                        return (
                          <div
                            key={document.id}
                            className="rounded-xl bg-slate-800 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="break-all font-semibold">
                                  {document.name}
                                </p>

                                <p className="mt-1 text-sm text-blue-400">
                                  {t("documents.uploadedBy", {
                                    name: uploader,
                                  })}
                                </p>

                                <time
                                  dateTime={new Date(
                                    document.createdAt,
                                  ).toISOString()}
                                  className="mt-1 block text-xs text-slate-500"
                                >
                                  {formatDateTime(document.createdAt)}
                                </time>
                              </div>

                              <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-fit shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                {t("documents.download")}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t("caseInformation")}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">{t("status")}</p>

                  <div className="mt-2">
                    <StatusBadge status={tradeCase.status as Status} small />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">{t("category")}</p>

                  <p className="break-words text-slate-200">
                    {tradeCase.category}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">{t("created")}</p>

                  <p className="text-slate-200">
                    {formatDate(tradeCase.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">{t("updated")}</p>

                  <p className="text-slate-200">
                    {formatDate(tradeCase.updatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t("recommendedCompanies.title")}
              </h2>

              {recommendedCompanies.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t("recommendedCompanies.empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/dashboard/companies/${company.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500"
                    >
                      <p className="break-words font-semibold">
                        {company.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {company.country || t("unknownCountry")}
                      </p>

                      <p className="mt-1 text-xs text-emerald-400">
                        {t("verified")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t("assignedProvider.title")}
              </h2>

              {!winningProposal && (
                <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div aria-hidden="true" className="mb-3 text-4xl">
                    ⏳
                  </div>

                  <h3 className="mb-2 text-lg font-bold">
                    {t("assignedProvider.empty.title")}
                  </h3>

                  <p className="text-sm leading-6 text-slate-400">
                    {t("assignedProvider.empty.description")}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {t("assignedProvider.winningProposal")}
                  </p>

                  <p className="break-words text-slate-200">
                    {winningProposal
                      ? t("assignedProvider.proposalSummary", {
                          id: winningProposal.id,
                          price:
                            winningProposal.price || t("proposals.noPrice"),
                        })
                      : t("notSelected")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("winningCompany")}
                  </p>

                  {winningProposal?.company?.id && (
                    <Link
                      href={`/dashboard/companies/${winningProposal.company.id}`}
                      className="mt-2 inline-block text-blue-400 hover:underline"
                    >
                      {t("viewCompany")}{" "}
                      <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                    </Link>
                  )}

                  <p className="break-words text-slate-200">
                    {winningProposal?.company?.name ?? t("notSelected")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">{t("winningExpert")}</p>

                  {winningProposal?.expert?.id && (
                    <Link
                      href={`/dashboard/experts/${winningProposal.expert.id}`}
                      className="mt-2 inline-block text-blue-400 hover:underline"
                    >
                      {t("viewExpert")}{" "}
                      <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                    </Link>
                  )}

                  <p className="break-words text-slate-200">
                    {winningProposal?.expert?.name ?? t("notSelected")}
                  </p>
                </div>

                {winningProposal && (
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-sm text-slate-500">
                      {t("assignedProvider.proposalValue")}
                    </p>

                    <p className="mt-1 break-words text-2xl font-bold text-emerald-400">
                      {winningProposal.price || t("notAvailable")}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">{t("reviews.title")}</p>

                  <p className="text-3xl font-bold text-yellow-400">
                    {tradeCase.reviews.length}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("assignedProvider.assignedAt")}
                  </p>

                  <p className="text-slate-200">
                    {formatDate(tradeCase.assignedAt)}
                  </p>
                </div>
              </div>

              {(isAdmin || isCustomer) &&
                tradeCase.status === "IN_PROGRESS" && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <CompleteCaseButton caseId={tradeCase.id} />
                  </div>
                )}
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t("activity.title", {
                  count: tradeCase.activities.length,
                })}
              </h2>

              {tradeCase.activities.length === 0 ? (
                <EmptyState
                  icon="📌"
                  title={t("activity.empty.title")}
                  description={t("activity.empty.description")}
                />
              ) : (
                <div className="space-y-4">
                  {tradeCase.activities.map((activity) => {
                    const activityDisplay = getActivityDisplay(
                      activity.action,
                      t,
                    );

                    const actor =
                      activity.user?.name ||
                      activity.user?.email ||
                      t("system");

                    return (
                      <div
                        key={activity.id}
                        className={`border-s-2 ps-4 ${activityDisplay.border}`}
                      >
                        <p className="font-semibold">
                          <span aria-hidden="true">{activityDisplay.icon}</span>{" "}
                          {activityDisplay.title}
                        </p>

                        {activity.details && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">
                            {activity.details}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {t("activity.meta", {
                            actor,
                            date: formatDateTime(activity.createdAt),
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {tradeCase.status === "COMPLETED" && (
              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("reviews.title")}
                </h2>

                {isCustomer &&
                  acceptedProviderUserId &&
                  !hasReviewedProvider && (
                    <AddReviewForm
                      caseId={tradeCase.id}
                      reviewedUserId={acceptedProviderUserId}
                      label={t("reviews.reviewProvider")}
                    />
                  )}

                {!isCustomer &&
                  acceptedProviderUserId === user.id &&
                  !hasReviewedCustomer && (
                    <AddReviewForm
                      caseId={tradeCase.id}
                      reviewedUserId={tradeCase.customerId}
                      label={t("reviews.reviewCustomer")}
                    />
                  )}

                {((isCustomer && hasReviewedProvider) ||
                  (!isCustomer && hasReviewedCustomer)) && (
                  <p className="text-slate-500">
                    {t("reviews.alreadySubmitted")}
                  </p>
                )}

                {!isCustomer && acceptedProviderUserId !== user.id && (
                  <p className="text-slate-500">{t("reviews.permission")}</p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}