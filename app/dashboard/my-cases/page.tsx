import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function getStatusClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-600 text-white";

    case "IN_PROGRESS":
      return "bg-amber-500 text-slate-950";

    case "COMPLETED":
      return "bg-emerald-600 text-white";

    case "CANCELLED":
      return "bg-red-600 text-white";

    default:
      return "bg-slate-800 text-slate-300";
  }
}

export default async function MyCasesPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardMyCases",
  );

  const locale = await getLocale();

  const cases = await prisma.tradeCase.findMany({
    where: {
      proposals: {
        some: {
          status: "ACCEPTED",
          company: {
            ownerId: user.id,
          },
        },
      },
    },
    include: {
      proposals: {
        where: {
          status: "ACCEPTED",
          company: {
            ownerId: user.id,
          },
        },
        include: {
          company: true,
          expert: true,
        },
      },
      documents: true,
      messages: true,
      steps: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const inProgressCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "IN_PROGRESS",
  ).length;

  const completedCases = cases.filter(
    (tradeCase) =>
      tradeCase.status === "COMPLETED",
  ).length;

  const totalDocuments = cases.reduce(
    (sum, tradeCase) =>
      sum + tradeCase.documents.length,
    0,
  );

  const totalMessages = cases.reduce(
    (sum, tradeCase) =>
      sum + tradeCase.messages.length,
    0,
  );

  function getStatusLabel(status: string) {
    switch (status) {
      case "OPEN":
        return t("statuses.open");

      case "IN_PROGRESS":
        return t("statuses.inProgress");

      case "COMPLETED":
        return t("statuses.completed");

      case "CANCELLED":
        return t("statuses.cancelled");

      default:
        return status;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold">
            {t("title")}
          </h1>

          <p className="text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.assignedCases")}
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {cases.length}
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

          <div className="rounded-2xl border border-cyan-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.workload")}
            </p>

            <p className="mt-2 text-4xl font-bold text-cyan-400">
              {totalMessages + totalDocuments}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {t("stats.workloadDescription")}
            </p>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div
              aria-hidden="true"
              className="mb-4 text-6xl"
            >
              🧭
            </div>

            <h2 className="mb-3 text-2xl font-bold">
              {t("empty.title")}
            </h2>

            <p className="mx-auto max-w-md text-slate-400">
              {t("empty.description")}
            </p>

            <Link
              href="/dashboard/open-cases"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 transition hover:bg-blue-700"
            >
              {t("empty.browseOpenCases")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {cases.map((tradeCase) => {
              const acceptedProposal =
                tradeCase.proposals[0];

              const completedSteps =
                tradeCase.steps.filter(
                  (step) => step.completed,
                ).length;

              const totalSteps =
                tradeCase.steps.length;

              const progressPercent =
                totalSteps > 0
                  ? Math.round(
                      (completedSteps /
                        totalSteps) *
                        100,
                    )
                  : 0;

              return (
                <Link
                  key={tradeCase.id}
                  href={`/dashboard/cases/${tradeCase.id}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-sm text-slate-500">
                        {t("caseNumber", {
                          id: tradeCase.id,
                        })}
                      </p>

                      <h2 className="text-2xl font-bold transition group-hover:text-blue-400">
                        {tradeCase.title}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        tradeCase.status,
                      )}`}
                    >
                      {getStatusLabel(
                        tradeCase.status,
                      )}
                    </span>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-purple-800 bg-purple-600/20 px-3 py-1 text-xs text-purple-300">
                      {tradeCase.category}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {t("documentCount", {
                        count:
                          tradeCase.documents
                            .length,
                      })}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {t("messageCount", {
                        count:
                          tradeCase.messages
                            .length,
                      })}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">
                        {t(
                          "fields.acceptedCompany",
                        )}
                      </p>

                      <p className="font-medium text-slate-200">
                        {acceptedProposal
                          ?.company?.name ||
                          t("notAvailable")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t(
                          "fields.assignedExpert",
                        )}
                      </p>

                      <p className="font-medium text-slate-200">
                        {acceptedProposal
                          ?.expert?.name ||
                          t("notAssigned")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t(
                          "fields.proposalPrice",
                        )}
                      </p>

                      <p className="font-medium text-slate-200">
                        {acceptedProposal?.price ||
                          t("notAvailable")}
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-slate-500">
                          {t(
                            "fields.timelineProgress",
                          )}
                        </p>

                        <p className="font-medium text-slate-300">
                          {progressPercent}%
                        </p>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {t("stepsCompleted", {
                          completed:
                            completedSteps,
                          total: totalSteps,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                    <span className="text-xs text-slate-500">
                      {t("updated", {
                        date: tradeCase.updatedAt.toLocaleDateString(
                          locale,
                        ),
                      })}
                    </span>

                    <span className="text-sm text-blue-400 group-hover:underline">
                      {t("viewCase")}
                    </span>
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