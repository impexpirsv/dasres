import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";

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
      return "bg-slate-700 text-slate-200";
  }
}

export default async function SavedCasesPage() {
  const user = await requireUser();

  const [t, tcat] = await Promise.all([
    getTranslations("dashboardSavedCases"),
    getTranslations("common.categories"),
  ]);

  const locale = await getLocale();


  function translateCategory(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return tcat.has(normalized) ? tcat(normalized) : tcat.has(lower) ? tcat(lower) : tcat.has(underscored) ? tcat(underscored) : normalized;
  }

  const savedCases =
    await prisma.savedCase.findMany({
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
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-4 text-5xl font-bold">
            {t("title")}
          </h1>

          <p className="text-slate-400">
            {t("description")}
          </p>
        </div>

        {savedCases.length === 0 ? (
          <EmptyState
            icon="⭐"
            title={t("empty.title")}
            description={t("empty.description")}
            buttonText={t("empty.button")}
            buttonHref="/dashboard/open-cases"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {savedCases.map((savedCase) => {
              const tradeCase =
                savedCase.tradeCase;

              return (
                <Link
                  key={savedCase.id}
                  href={`/dashboard/cases/${tradeCase.id}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-purple-800 bg-purple-600/20 px-3 py-1 text-xs text-purple-300">
                      {translateCategory(tradeCase.category)}
                    </span>

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

                  <h2 className="mb-3 text-2xl font-bold transition group-hover:text-blue-400">
                    {tradeCase.title}
                  </h2>

                  <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-400">
                    {tradeCase.description}
                  </p>

                  <div className="mb-5 grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.proposals")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-400">
                        {tradeCase.proposals.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.documents")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-cyan-400">
                        {tradeCase.documents.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.messages")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-emerald-400">
                        {tradeCase.messages.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
                    <p className="text-xs text-slate-500">
                      {t("savedOn", {
                        date: savedCase.createdAt.toLocaleDateString(
                          locale,
                        ),
                      })}
                    </p>

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