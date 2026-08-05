import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import SaveCaseButton from "../../components/SaveCaseButton";
import StopLinkClick from "../../components/StopLinkClick";
import StatusBadge from "../../components/StatusBadge";

type SortOption = "newest" | "oldest";

function isSortOption(value?: string): value is SortOption {
  return value === "newest" || value === "oldest";
}
function getCategoryTranslationKey(
  category: string,
) {
  switch (category) {
    case "General":
      return "general";

    case "Customs Clearance":
      return "customsClearance";

    case "Shipping":
      return "shipping";

    case "Inspection":
      return "inspection";

    case "Insurance":
      return "insurance";

    case "Sourcing":
      return "sourcing";

    case "Documentation":
      return "documentation";

    case "Payment":
      return "payment";

    default:
      return null;
  }
}
function buildOpenCasesUrl({
  category,
  sort,
}: {
  category?: string;
  sort: SortOption;
}) {
  const params = new URLSearchParams();

  if (category && category !== "ALL") {
    params.set("category", category);
  }

  params.set("sort", sort);

  return `/dashboard/open-cases?${params.toString()}`;
}

export default async function OpenCasesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string;
    sort?: string;
  }>;
}) {
  const user = await requireUser();

  const [params, t, locale] = await Promise.all([
    searchParams,
    getTranslations("openCasesPage"),
    getLocale(),
  ]);

  const selectedSort: SortOption = isSortOption(params?.sort)
    ? params.sort
    : "newest";

  const isAdmin = user.role === "admin";

  const myCompanies = await prisma.company.findMany({
    where: isAdmin
      ? undefined
      : {
          ownerId: user.id,
        },
    select: {
      id: true,
      category: true,
    },
    orderBy: {
      category: "asc",
    },
  });

  const categories = [
    ...new Set(
      myCompanies
        .map((company) => company.category)
        .filter(
          (category): category is string =>
            typeof category === "string" &&
            category.trim().length > 0,
        ),
    ),
  ];

  const requestedCategory = params?.category;

  const selectedCategory =
    requestedCategory &&
    categories.includes(requestedCategory)
      ? requestedCategory
      : "ALL";

  const matchingCategories =
    selectedCategory === "ALL"
      ? categories
      : [selectedCategory];

  const openCases = await prisma.tradeCase.findMany({
    where: isAdmin
      ? {
          status: "OPEN",
          ...(selectedCategory !== "ALL"
            ? {
                category: selectedCategory,
              }
            : {}),
        }
      : {
          status: "OPEN",
          category: {
            in: matchingCategories,
          },
          NOT: {
            customerId: user.id,
          },
        },
    orderBy: {
      createdAt:
        selectedSort === "oldest" ? "asc" : "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      createdAt: true,
      proposals: {
        where: {
          OR: [
            { company: { ownerId: user.id } },
            { expert: { ownerId: user.id } },
          ],
        },
        select: { id: true },
      },
      _count: {
        select: {
          proposals: true,
          documents: true,
          messages: true,
        },
      },
      savedCases: {
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const mySubmittedProposals =
    await prisma.caseProposal.count({
      where: {
        tradeCase: {
          status: "OPEN",
        },
        OR: [
          {
            company: {
              ownerId: user.id,
            },
          },
          {
            expert: {
              ownerId: user.id,
            },
          },
        ],
      },
    });

  const highCompetitionCases = openCases.filter(
    (tradeCase) => tradeCase._count.proposals >= 3,
  ).length;

  const savedMatchingCases = openCases.filter(
    (tradeCase) => tradeCase.savedCases.length > 0,
  ).length;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function formatDate(value: Date | string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  const isRtl =
    locale.startsWith("fa") ||
    locale.startsWith("ar");
function getCategoryLabel(category: string) {
  const key = getCategoryTranslationKey(category);

  return key
    ? t(`categories.${key}`)
    : category;
}
  const hasMatchingCategories =
    isAdmin || categories.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-4 text-5xl font-bold">
              {t("title")}
            </h1>

            <p className="text-slate-400">
              {isAdmin
                ? t("adminDescription")
                : t("userDescription")}
            </p>
          </div>

          <Link
            href="/dashboard/my-proposals"
            className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            {t("myProposals")}
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-400">
            {t("sort.label")}
          </span>

          <Link
            href={buildOpenCasesUrl({
              category: selectedCategory,
              sort: "newest",
            })}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedSort === "newest"
                ? "bg-blue-600 text-white"
                : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-500"
            }`}
          >
            {t("sort.newest")}
          </Link>

          <Link
            href={buildOpenCasesUrl({
              category: selectedCategory,
              sort: "oldest",
            })}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedSort === "oldest"
                ? "bg-blue-600 text-white"
                : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-500"
            }`}
          >
            {t("sort.oldest")}
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">
              {t("categoryLabel")}
            </span>

            <Link
              href={buildOpenCasesUrl({
                sort: selectedSort,
              })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === "ALL"
                  ? "bg-purple-600 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500"
              }`}
            >
              {t("allCategories")}
            </Link>

            {categories.map((category) => (
              <Link
                key={category}
                href={buildOpenCasesUrl({
                  category,
                  sort: selectedSort,
                })}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500"
                }`}
              >
              {getCategoryLabel(category)}
              </Link>
            ))}
          </div>
        )}

        <div className="mb-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.matchingCases")}
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {openCases.length}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.matchingCategories")}
            </p>

            <p className="mt-2 text-4xl font-bold text-purple-400">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.highCompetition")}
            </p>

            <p className="mt-2 text-4xl font-bold text-yellow-400">
              {highCompetitionCases}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.myOpenProposals")}
            </p>

            <p className="mt-2 text-4xl font-bold text-emerald-400">
              {mySubmittedProposals}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.savedMatching")}
            </p>

            <p className="mt-2 text-4xl font-bold text-pink-400">
              {savedMatchingCases}
            </p>
          </div>
        </div>

        {!isAdmin && categories.length === 0 && (
          <div className="mb-10 rounded-2xl border border-yellow-600 bg-yellow-950/30 p-6">
            <h2 className="mb-2 text-xl font-bold text-yellow-400">
              {t("noCategories.title")}
            </h2>

            <p className="text-slate-300">
              {t("noCategories.description")}
            </p>

            <Link
              href="/dashboard/companies/new"
              className="mt-4 inline-block rounded-xl bg-yellow-600 px-5 py-3 font-semibold text-black transition hover:bg-yellow-700"
            >
              {t("noCategories.addCompany")}
            </Link>
          </div>
        )}

        {!hasMatchingCategories ? null : openCases.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div
              aria-hidden="true"
              className="mb-4 text-6xl"
            >
              📭
            </div>

            <h2 className="mb-3 text-2xl font-bold">
              {t("emptyState.title")}
            </h2>

            <p className="mx-auto max-w-md text-slate-400">
              {isAdmin
                ? t("emptyState.adminDescription")
                : t("emptyState.userDescription")}
            </p>

            {!isAdmin && (
              <Link
                href="/dashboard/my-companies"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                {t("emptyState.manageCompanies")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {openCases.map((tradeCase) => {
              const hasApplied =
                tradeCase.proposals.length > 0;

              return (
                <Link
                  key={tradeCase.id}
                  href={`/dashboard/cases/${tradeCase.id}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-purple-800 bg-purple-600/20 px-3 py-1 text-xs text-purple-300">
                    {getCategoryLabel(
  tradeCase.category,
)}
                    </span>

                    <StatusBadge
                      status="OPEN"
                      small
                    />

                    {tradeCase.savedCases.length > 0 && (
                      <span className="rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-black">
                        {t("badges.saved")}
                      </span>
                    )}

                    {hasApplied && (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        {t("badges.applied")}
                      </span>
                    )}

                    {tradeCase._count.proposals >= 3 && (
                      <span className="rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-black">
                        {t("badges.highCompetition")}
                      </span>
                    )}
                  </div>

                  <h2 className="mb-3 break-words text-2xl font-bold transition group-hover:text-blue-400">
                    {tradeCase.title}
                  </h2>

                  <p className="mb-4 text-sm text-slate-500">
                    {t("requestedBy")}{" "}
                    <span className="text-slate-300">
                      {tradeCase.customer.name}
                    </span>
                  </p>

                  <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-400">
                    {tradeCase.description}
                  </p>

                  <div className="mb-5 grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.proposals")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-400">
                        {tradeCase._count.proposals}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.documents")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-cyan-400">
                        {tradeCase._count.documents}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        {t("metrics.messages")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-emerald-400">
                        {tradeCase._count.messages}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
                    <p className="text-xs text-slate-500">
                      {t("created", {
                        date: formatDate(
                          tradeCase.createdAt,
                        ),
                      })}
                    </p>

                    <div className="flex items-center gap-3">
                      <StopLinkClick>
                        <SaveCaseButton
                          caseId={tradeCase.id}
                          initialSaved={
                            tradeCase.savedCases.length >
                            0
                          }
                        />
                      </StopLinkClick>

                      <span className="text-sm text-blue-400 group-hover:underline">
                        {t("viewCase")}{" "}
                        <span aria-hidden="true">
                          {isRtl ? "←" : "→"}
                        </span>
                      </span>
                    </div>
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
