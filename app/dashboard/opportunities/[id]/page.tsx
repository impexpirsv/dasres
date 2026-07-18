import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../../lib/prisma";
import { formatCountry } from "../../../../lib/format";
import DeleteOpportunityButton from "../../../components/DeleteOpportunityButton";

type Props = {
  params: Promise<{ id: string }>;
};

type StatusBadgeProps = {
  status: string;
  labels: {
    open: string;
    inProgress: string;
    closed: string;
  };
};

function StatusBadge({
  status,
  labels,
}: StatusBadgeProps) {
  const normalizedValue = status.toUpperCase();

  if (normalizedValue === "OPEN") {
    return (
      <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm">
        {labels.open}
      </span>
    );
  }

  if (normalizedValue === "IN_PROGRESS") {
    return (
      <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm">
        {labels.inProgress}
      </span>
    );
  }

  if (normalizedValue === "CLOSED") {
    return (
      <span className="rounded-full bg-red-600 px-4 py-2 text-sm">
        {labels.closed}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-4 py-2 text-sm">
      {status}
    </span>
  );
}

export default async function DashboardOpportunityDetailPage({
  params,
}: Props) {
  const t = await getTranslations(
    "dashboardOpportunityDetail",
  );

  const { id } = await params;
  const opportunityId = Number(id);

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    notFound();
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
  });

  if (!opportunity) {
    notFound();
  }

  const statusLabels = {
    open: t("statuses.open"),
    inProgress: t("statuses.inProgress"),
    closed: t("statuses.closed"),
  };

  function getStatusLabel(status: string) {
    switch (status.toUpperCase()) {
      case "OPEN":
        return statusLabels.open;

      case "IN_PROGRESS":
        return statusLabels.inProgress;

      case "CLOSED":
        return statusLabels.closed;

      default:
        return status;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/dashboard/opportunities"
        className="mb-8 inline-block text-blue-400 hover:underline"
      >
        {t("backToDashboardOpportunities")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 lg:col-span-2">
          {opportunity.imageUrl ? (
            <div className="relative h-80 w-full">
              <Image
                src={opportunity.imageUrl}
                alt={opportunity.title}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center bg-slate-800 text-center">
              <div className="mb-4 text-7xl">🌍</div>

              <p className="text-slate-400">
                {t("tradeOpportunity")}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {t("globalMarketplace")}
              </p>
            </div>
          )}

          <div className="p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <StatusBadge
                status={opportunity.status}
                labels={statusLabels}
              />

              <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-400">
                {formatCountry(opportunity.country)}
              </span>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                {t("tradeOpportunity")}
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-black leading-tight">
              {opportunity.title}
            </h1>

            <div className="mb-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="mb-1 text-sm text-slate-500">
                  {t("status")}
                </p>

                <p className="text-2xl font-bold text-emerald-400">
                  {getStatusLabel(opportunity.status)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="mb-1 text-sm text-slate-500">
                  {t("country")}
                </p>

                <p className="text-2xl font-bold text-blue-400">
                  {formatCountry(opportunity.country)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="mb-1 text-sm text-slate-500">
                  {t("visibility")}
                </p>

                <p className="text-2xl font-bold text-yellow-400">
                  {t("dashboard")}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8">
              <h2 className="mb-4 text-2xl font-bold">
                {t("opportunityDescription")}
              </h2>

              <p className="whitespace-pre-line leading-8 text-slate-300">
                {opportunity.description}
              </p>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-8">
              <h2 className="mb-4 text-2xl font-bold">
                {t("adminActions")}
              </h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/opportunities/${opportunity.id}/edit`}
                  className="rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-700"
                >
                  {t("editOpportunity")}
                </Link>

                <DeleteOpportunityButton
                  id={opportunity.id}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-6 text-2xl font-bold">
              {t("opportunitySummary")}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">
                  {t("country")}
                </p>

                <p className="text-slate-200">
                  {formatCountry(opportunity.country)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  {t("status")}
                </p>

                <p className="text-slate-200">
                  {getStatusLabel(opportunity.status)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  {t("type")}
                </p>

                <p className="text-slate-200">
                  {t("tradeOpportunity")}
                </p>
              </div>
            </div>

            <Link
              href={`/opportunities/${opportunity.id}`}
              className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-center hover:bg-blue-700"
            >
              {t("viewPublicPage")}
            </Link>

            <Link
              href="/dashboard/opportunities"
              className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center hover:bg-slate-700"
            >
              {t("backToManagement")}
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {t("adminNote")}
            </h2>

            <p className="leading-7 text-slate-400">
              {t("adminNoteDescription")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}