import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function parsePrice(price: string | null) {
  if (!price) {
    return 0;
  }

  const numericValue = Number(
    price.replace(/[^0-9.]/g, ""),
  );

  return Number.isNaN(numericValue)
    ? 0
    : numericValue;
}

function getProposalStatusClass(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-600 text-white";

    case "REJECTED":
      return "bg-red-600 text-white";

    default:
      return "bg-yellow-600 text-black";
  }
}

function getProposalCardClass(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "border-green-500 bg-green-950/20";

    case "REJECTED":
      return "border-red-500 bg-red-950/20";

    default:
      return "border-slate-800 bg-slate-900";
  }
}

export default async function MyProposalsPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardMyProposals",
  );

  const locale = await getLocale();

  const proposals =
    await prisma.caseProposal.findMany({
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
    (proposal) =>
      proposal.status === "PENDING",
  ).length;

  const acceptedProposals = proposals.filter(
    (proposal) =>
      proposal.status === "ACCEPTED",
  ).length;

  const rejectedProposals = proposals.filter(
    (proposal) =>
      proposal.status === "REJECTED",
  ).length;

  const resolvedProposals =
    acceptedProposals + rejectedProposals;

  const winRate =
    resolvedProposals > 0
      ? Math.round(
          (acceptedProposals /
            resolvedProposals) *
            100,
        )
      : 0;

  const totalProposalValue = proposals.reduce(
    (sum, proposal) =>
      sum + parsePrice(proposal.price),
    0,
  );

  const acceptedProposalValue = proposals
    .filter(
      (proposal) =>
        proposal.status === "ACCEPTED",
    )
    .reduce(
      (sum, proposal) =>
        sum + parsePrice(proposal.price),
      0,
    );

  function getProposalStatusLabel(
    status: string,
  ) {
    switch (status) {
      case "ACCEPTED":
        return t("statuses.accepted");

      case "REJECTED":
        return t("statuses.rejected");

      default:
        return t("statuses.pending");
    }
  }

  function getCaseStatusLabel(
    status: string,
  ) {
    switch (status) {
      case "OPEN":
        return t("caseStatuses.open");

      case "IN_PROGRESS":
        return t("caseStatuses.inProgress");

      case "COMPLETED":
        return t("caseStatuses.completed");

      case "CANCELLED":
        return t("caseStatuses.cancelled");

      default:
        return status;
    }
  }

  const valueFormatter = new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits: 2,
    },
  );

  const stats = [
    {
      key: "total",
      label: t("stats.totalProposals"),
      value: totalProposals,
      valueClass: "text-blue-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingProposals,
      valueClass: "text-yellow-400",
    },
    {
      key: "accepted",
      label: t("stats.accepted"),
      value: acceptedProposals,
      valueClass: "text-green-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedProposals,
      valueClass: "text-red-400",
    },
    {
      key: "winRate",
      label: t("stats.winRate"),
      value: `${winRate}%`,
      valueClass: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              {t("title")}
            </h1>

            <p className="mt-3 text-slate-400">
              {t("description")}
            </p>
          </div>

          <Link
            href="/dashboard/open-cases"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
          >
            {t("findOpenCases")}
          </Link>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-slate-400">
                {stat.label}
              </p>

              <div
                className={`mt-3 text-4xl font-bold ${stat.valueClass}`}
              >
                {stat.value}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.acceptedValue")}
            </p>

            <div className="mt-3 text-3xl font-bold text-cyan-400">
              $
              {valueFormatter.format(
                acceptedProposalValue,
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {t("stats.submittedValue", {
                value: valueFormatter.format(
                  totalProposalValue,
                ),
              })}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {t("filters.all", {
              count: totalProposals,
            })}
          </span>

          <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm font-semibold text-black">
            {t("filters.pending", {
              count: pendingProposals,
            })}
          </span>

          <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white">
            {t("filters.accepted", {
              count: acceptedProposals,
            })}
          </span>

          <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            {t("filters.rejected", {
              count: rejectedProposals,
            })}
          </span>
        </div>

        {proposals.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`rounded-2xl border p-6 ${getProposalCardClass(
                  proposal.status,
                )}`}
              >
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {t("proposalNumber", {
                        id: proposal.id,
                      })}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {t("submittedOn", {
                        date: proposal.createdAt.toLocaleDateString(
                          locale,
                        ),
                      })}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${getProposalStatusClass(
                      proposal.status,
                    )}`}
                  >
                    {getProposalStatusLabel(
                      proposal.status,
                    )}
                  </span>
                </div>

                <div className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.case")}
                    </p>

                    <p className="font-medium text-slate-200">
                      {proposal.tradeCase.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.company")}
                    </p>

                    <p className="font-medium text-slate-200">
                      {proposal.company?.name ||
                        t("notAvailable")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.expert")}
                    </p>

                    <p className="font-medium text-slate-200">
                      {proposal.expert?.name ||
                        t("notAssigned")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.price")}
                    </p>

                    <p className="font-medium text-slate-200">
                      {proposal.price ||
                        t("notAvailable")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {t("caseStatus", {
                      status: getCaseStatusLabel(
                        proposal.tradeCase.status,
                      ),
                    })}
                  </span>

                  <Link
                    href={`/dashboard/cases/${proposal.caseId}`}
                    className="text-blue-400 hover:underline"
                  >
                    {t("viewCase")}
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