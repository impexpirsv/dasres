import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "../../../lib/auth";
import {
  getCaseLimit,
  getProposalLimit,
} from "../../../lib/plans";
import { prisma } from "../../../lib/prisma";

type PlanName =
  | "FREE"
  | "GOLD"
  | "DIAMOND"
  | "ENTERPRISE";

const PLAN_NAMES: PlanName[] = [
  "FREE",
  "GOLD",
  "DIAMOND",
  "ENTERPRISE",
];

function getPlanColorClasses(
  planType: string,
  isCurrentPlan: boolean,
) {
  if (!isCurrentPlan) {
    return "border-slate-800";
  }

  switch (planType) {
    case "GOLD":
      return "border-yellow-500 shadow-lg shadow-yellow-500/20";

    case "DIAMOND":
      return "border-cyan-500 shadow-lg shadow-cyan-500/20";

    case "ENTERPRISE":
      return "border-purple-500 shadow-lg shadow-purple-500/20";

    default:
      return "border-slate-500 shadow-lg shadow-slate-500/20";
  }
}

function getCurrentBadgeClass(planType: string) {
  switch (planType) {
    case "GOLD":
      return "bg-yellow-600 text-black";

    case "DIAMOND":
      return "bg-cyan-600 text-black";

    case "ENTERPRISE":
      return "bg-purple-600 text-white";

    default:
      return "bg-slate-400 text-black";
  }
}

function getCurrentPlanTextClass(
  planType: string,
) {
  switch (planType) {
    case "GOLD":
      return "text-yellow-400";

    case "DIAMOND":
      return "text-cyan-400";

    case "ENTERPRISE":
      return "text-purple-400";

    default:
      return "text-slate-200";
  }
}

export default async function SubscriptionPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardSubscription",
  );

  const currentCaseLimit = getCaseLimit(
    user.planType,
  );

  const currentProposalLimit =
    getProposalLimit(user.planType);

  const [activeCasesUsed, proposalsUsed] =
    await Promise.all([
      prisma.tradeCase.count({
        where: {
          customerId: user.id,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.caseProposal.count({
        where: {
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
      }),
    ]);

  function getPlanTitle(planName: PlanName) {
    switch (planName) {
      case "FREE":
        return t("plans.free.title");

      case "GOLD":
        return t("plans.gold.title");

      case "DIAMOND":
        return t("plans.diamond.title");

      case "ENTERPRISE":
        return t("plans.enterprise.title");
    }
  }

  function getPlanDescription(
    planName: PlanName,
  ) {
    switch (planName) {
      case "FREE":
        return t("plans.free.description");

      case "GOLD":
        return t("plans.gold.description");

      case "DIAMOND":
        return t(
          "plans.diamond.description",
        );

      case "ENTERPRISE":
        return t(
          "plans.enterprise.description",
        );
    }
  }

  function getPlanPrice(planName: PlanName) {
    switch (planName) {
      case "FREE":
        return t("plans.free.price");

      case "GOLD":
        return t("plans.gold.price");

      case "DIAMOND":
        return t("plans.diamond.price");

      case "ENTERPRISE":
        return t("plans.enterprise.price");
    }
  }

  function getPlanFeatures(
    planName: PlanName,
  ) {
    switch (planName) {
      case "FREE":
        return [
          t("plans.free.features.activeCases"),
          t("plans.free.features.proposals"),
          t(
            "plans.free.features.companyProfile",
          ),
          t(
            "plans.free.features.expertProfile",
          ),
        ];

      case "GOLD":
        return [
          t("plans.gold.features.activeCases"),
          t("plans.gold.features.proposals"),
          t("plans.gold.features.badge"),
          t(
            "plans.gold.features.priorityListing",
          ),
        ];

      case "DIAMOND":
        return [
          t(
            "plans.diamond.features.activeCases",
          ),
          t(
            "plans.diamond.features.proposals",
          ),
          t("plans.diamond.features.badge"),
          t(
            "plans.diamond.features.featuredListing",
          ),
        ];

      case "ENTERPRISE":
        return [
          t(
            "plans.enterprise.features.activeCases",
          ),
          t(
            "plans.enterprise.features.proposals",
          ),
          t(
            "plans.enterprise.features.badge",
          ),
          t(
            "plans.enterprise.features.visibility",
          ),
          t(
            "plans.enterprise.features.accountManager",
          ),
        ];
    }
  }

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "FREE":
        return t("planLabels.free");

      case "GOLD":
        return t("planLabels.gold");

      case "DIAMOND":
        return t("planLabels.diamond");

      case "ENTERPRISE":
        return t("planLabels.enterprise");

      default:
        return planType;
    }
  }

  function getUsageValue(
    used: number,
    limit: number,
  ) {
    if (limit === Number.MAX_SAFE_INTEGER) {
      return t("usage.unlimitedValue", {
        used,
      });
    }

    return t("usage.limitedValue", {
      used,
      limit,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-4 text-5xl font-bold">
            {t("title")}
          </h1>

          <p className="max-w-3xl text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">
                {t("usage.currentPlan")}
              </p>

              <div
                className={`mt-2 text-4xl font-bold ${getCurrentPlanTextClass(
                  user.planType,
                )}`}
              >
                {getPlanLabel(user.planType)}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("usage.activeCasesUsed")}
              </p>

              <div className="mt-2 text-4xl font-bold text-cyan-400">
                {getUsageValue(
                  activeCasesUsed,
                  currentCaseLimit,
                )}
              </div>

              {currentCaseLimit !==
                Number.MAX_SAFE_INTEGER && (
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width: `${Math.min(
                        (activeCasesUsed /
                          currentCaseLimit) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("usage.proposalsUsed")}
              </p>

              <div className="mt-2 text-4xl font-bold text-emerald-400">
                {getUsageValue(
                  proposalsUsed,
                  currentProposalLimit,
                )}
              </div>

              {currentProposalLimit !==
                Number.MAX_SAFE_INTEGER && (
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        (proposalsUsed /
                          currentProposalLimit) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_NAMES.map((planName) => {
            const isCurrentPlan =
              planName === user.planType;

            const features =
              getPlanFeatures(planName);

            return (
              <div
                key={planName}
                className={`rounded-3xl border bg-slate-900 p-6 ${getPlanColorClasses(
                  planName,
                  isCurrentPlan,
                )}`}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">
                    {getPlanTitle(planName)}
                  </h2>

                  {isCurrentPlan && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getCurrentBadgeClass(
                        planName,
                      )}`}
                    >
                      {t("currentBadge")}
                    </span>
                  )}
                </div>

                <p className="min-h-16 text-sm text-slate-400">
                  {getPlanDescription(planName)}
                </p>

                <div className="mt-6 text-3xl font-bold">
                  {getPlanPrice(planName)}
                </div>

                <ul className="mt-6 space-y-3">
                  {features.map(
                    (feature, index) => (
                      <li
                        key={`${planName}-${index}`}
                        className="text-sm text-slate-300"
                      >
                        ✓ {feature}
                      </li>
                    ),
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    type="button"
                    disabled
                    className="mt-8 w-full cursor-not-allowed rounded-xl bg-slate-800 px-5 py-3 font-semibold text-slate-500"
                  >
                    {t("actions.currentPlan")}
                  </button>
                ) : planName ===
                  "ENTERPRISE" ? (
                  <button
                    type="button"
                    className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {t("actions.contactSales")}
                  </button>
                ) : planName === "FREE" ? (
                  <button
                    type="button"
                    disabled
                    className="mt-8 w-full cursor-not-allowed rounded-xl bg-slate-800 px-5 py-3 font-semibold text-slate-500"
                  >
                    {t("actions.notAvailable")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-8 w-full cursor-not-allowed rounded-xl bg-blue-600/60 px-5 py-3 font-semibold text-white"
                  >
                    {t("actions.requestUpgrade")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="mb-3 text-2xl font-bold">
            {t("upgradeNotice.title")}
          </h2>

          <p className="mb-6 text-slate-400">
            {t("upgradeNotice.description")}
          </p>

          <Link
            href="/dashboard"
            className="inline-block rounded-xl bg-slate-800 px-5 py-3 transition hover:bg-slate-700"
          >
            {t("upgradeNotice.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}