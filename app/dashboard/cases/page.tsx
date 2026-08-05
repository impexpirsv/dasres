import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import StatusBadge, {
  type Status,
} from "../../components/StatusBadge";

type TradeCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

function isSupportedStatus(
  status: string,
): status is TradeCaseStatus {
  return [
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ].includes(status);
}

export default async function CasesPage() {
  const user = await requireUser();

  const [t, locale] = await Promise.all([
    getTranslations("casesPage"),
    getLocale(),
  ]);
const tc = await getTranslations("common.categories");
  const cases = await prisma.tradeCase.findMany({
    where:
      user.role === "admin"
        ? {}
        : {
            customerId: user.id,
          },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      category: true,
      acceptedProposalId: true,
      createdAt: true,
      updatedAt: true,
      steps: {
        select: {
          completed: true,
        },
      },
      _count: {
        select: {
          proposals: true,
          documents: true,
          messages: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const acceptedProposalIds = cases
    .map(
      (tradeCase) =>
        tradeCase.acceptedProposalId,
    )
    .filter(
      (proposalId): proposalId is number =>
        proposalId !== null,
    );

  const acceptedProposals =
    acceptedProposalIds.length > 0
      ? await prisma.caseProposal.findMany({
          where: {
            id: {
              in: acceptedProposalIds,
            },
          },
          select: {
            id: true,
            caseId: true,
          },
        })
      : [];

  const acceptedProposalById =
    new Map(
      acceptedProposals.map(
        (proposal) => [
          proposal.id,
          proposal,
        ],
      ),
    );

  const openCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "OPEN",
  ).length;

  const inProgressCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "IN_PROGRESS",
  ).length;

  const completedCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "COMPLETED",
  ).length;

  const cancelledCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "CANCELLED",
  ).length;

  const dateFormatter =
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  function formatDate(
    value: Date | string,
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  const isRtl =
    locale.startsWith("fa") ||
    locale.startsWith("ar");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-3 text-4xl font-bold">
              {user.role === "admin"
                ? t("adminTitle")
                : t("userTitle")}
            </h1>

            <p className="text-slate-400">
              {t("description")}
            </p>
          </div>

          <Link
            href="/dashboard/cases/new"
            className="w-fit rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            {t("newCase")}
          </Link>
        </div>

        <div className="mb-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.total")}
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {cases.length}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.open")}
            </p>

            <p className="mt-2 text-4xl font-bold text-cyan-400">
              {openCases}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.inProgress")}
            </p>

            <p className="mt-2 text-4xl font-bold text-amber-400">
              {inProgressCases}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.completed")}
            </p>

            <p className="mt-2 text-4xl font-bold text-emerald-400">
              {completedCases}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.cancelled")}
            </p>

            <p className="mt-2 text-4xl font-bold text-red-400">
              {cancelledCases}
            </p>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
            {t("emptyState")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {cases.map((tradeCase) => {
              const completedSteps =
                tradeCase.steps.filter(
                  (step) => step.completed,
                ).length;

              const totalSteps =
                tradeCase.steps.length;

              const acceptedProposal =
                tradeCase.acceptedProposalId
                  ? acceptedProposalById.get(
                      tradeCase.acceptedProposalId,
                    )
                  : undefined;

              const validAcceptedProposal =
                acceptedProposal?.caseId ===
                tradeCase.id
                  ? acceptedProposal
                  : undefined;

              const status: Status =
                isSupportedStatus(
                  tradeCase.status,
                )
                  ? tradeCase.status
                  : "PENDING";

              return (
                <Link
                  key={tradeCase.id}
                  href={`/dashboard/cases/${tradeCase.id}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="mb-1 text-sm text-slate-500">
                        {t("caseNumber", {
                          id: tradeCase.id,
                        })}
                      </p>

                      <h2 className="break-words text-2xl font-bold transition group-hover:text-blue-400">
                        {tradeCase.title}
                      </h2>
                    </div>

                    <StatusBadge
                      status={status}
                      small
                    />
                  </div>

                  <p className="mb-5 line-clamp-2 text-sm leading-6 text-slate-400">
                    {tradeCase.description}
                  </p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-purple-800 bg-purple-600/20 px-3 py-1 text-xs text-purple-300">
                    {tc(tradeCase.category)}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {t("counts.proposals", {
                        count:
                          tradeCase._count
                            .proposals,
                      })}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {t("counts.documents", {
                        count:
                          tradeCase._count
                            .documents,
                      })}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {t("counts.messages", {
                        count:
                          tradeCase._count
                            .messages,
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">
                        {t("timeline")}
                      </p>

                      <p className="font-medium text-slate-200">
                        {t("steps", {
                          completed:
                            completedSteps,
                          total: totalSteps,
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t("winningProposal")}
                      </p>

                      <p className="font-medium text-slate-200">
                        {validAcceptedProposal
                          ? t(
                              "proposalNumber",
                              {
                                id: validAcceptedProposal.id,
                              },
                            )
                          : t("notSelected")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t("created")}
                      </p>

                      <p className="font-medium text-slate-200">
                        {formatDate(
                          tradeCase.createdAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t("updated")}
                      </p>

                      <p className="font-medium text-slate-200">
                        {formatDate(
                          tradeCase.updatedAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end border-t border-slate-800 pt-5">
                    <span className="text-sm text-blue-400 group-hover:underline">
                      {t("viewCase")}{" "}
                      <span aria-hidden="true">
                        {isRtl ? "←" : "→"}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
