import Link from "next/link";
import { requireUser } from "../../../lib/auth";
import { getCaseLimit, getProposalLimit } from "../../../lib/plans";
import { prisma } from "../../../lib/prisma";
const plans = [
  {
    name: "FREE",
    title: "Free",
    description: "For testing Dasres and starting basic trade activity.",
    price: "$0",
    features: [
      "3 active trade cases",
      "5 proposals",
      "Basic company profile",
      "Basic expert profile",
    ],
  },
  {
    name: "GOLD",
    title: "Gold",
    description: "For growing teams that need more visibility and capacity.",
    price: "$29/mo",
    features: [
      "20 active trade cases",
      "20 proposals",
      "Gold badge",
      "Priority listing",
    ],
  },
  {
    name: "DIAMOND",
    title: "Diamond",
    description: "For serious providers and frequent trade operators.",
    price: "$99/mo",
    features: [
      "Unlimited active trade cases",
      "Unlimited proposals",
      "Diamond badge",
      "Featured listing",
    ],
  },
  {
    name: "ENTERPRISE",
    title: "Enterprise",
    description: "For large trade companies, agencies and enterprise teams.",
    price: "Custom Pricing",
    features: [
      "Unlimited active trade cases",
      "Unlimited proposals",
      "Enterprise badge",
      "Highest visibility",
      "Future account manager access",
    ],
  },
];

function formatLimit(limit: number) {
  return limit === Number.MAX_SAFE_INTEGER ? "Unlimited" : String(limit);
}

function getPlanColor(planType: string) {
  switch (planType) {
    case "GOLD":
      return "yellow";

    case "DIAMOND":
      return "cyan";

    case "ENTERPRISE":
      return "purple";

    default:
      return "slate";
  }
}

export default async function SubscriptionPage() {
  const user = await requireUser();

  const currentCaseLimit = getCaseLimit(user.planType);
  const currentProposalLimit = getProposalLimit(user.planType);
  const activeCasesUsed = await prisma.tradeCase.count({
    where: {
      customerId: user.id,
      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });

  const proposalsUsed = await prisma.caseProposal.count({
    where: {
      company: {
        ownerId: user.id,
      },
    },
  });
  const currentPlanColor = getPlanColor(user.planType);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-4">Subscription</h1>

          <p className="text-slate-400 max-w-3xl">
            Manage your Dasres plan, usage limits and premium visibility.
            Payments are not enabled yet; plans are currently managed by admin.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-10">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-500 text-sm">Current Plan</p>

              <div
                className={`text-4xl font-bold mt-2 ${
                  user.planType === "FREE"
                    ? "text-slate-200"
                    : user.planType === "GOLD"
                      ? "text-yellow-400"
                      : user.planType === "DIAMOND"
                        ? "text-cyan-400"
                        : "text-purple-400"
                }`}
              >
                {user.planType}
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-sm">Active Cases Used</p>

              <div className="text-4xl font-bold text-cyan-400 mt-2">
                {currentCaseLimit === Number.MAX_SAFE_INTEGER
                  ? `${activeCasesUsed} / Unlimited`
                  : `${activeCasesUsed} / ${currentCaseLimit}`}
              </div>

              {currentCaseLimit !== Number.MAX_SAFE_INTEGER && (
                <div className="mt-4 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        (activeCasesUsed / currentCaseLimit) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-slate-500 text-sm">Proposals Used</p>

              <div className="text-4xl font-bold text-emerald-400 mt-2">
                {currentProposalLimit === Number.MAX_SAFE_INTEGER
                  ? `${proposalsUsed} / Unlimited`
                  : `${proposalsUsed} / ${currentProposalLimit}`}
              </div>

              {currentProposalLimit !== Number.MAX_SAFE_INTEGER && (
                <div className="mt-4 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        (proposalsUsed / currentProposalLimit) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === user.planType;

            return (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 bg-slate-900 ${
                  isCurrentPlan
                    ? currentPlanColor === "yellow"
                      ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
                      : currentPlanColor === "cyan"
                        ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                        : currentPlanColor === "purple"
                          ? "border-purple-500 shadow-lg shadow-purple-500/20"
                          : "border-slate-500 shadow-lg shadow-slate-500/20"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold">{plan.title}</h2>

                  {isCurrentPlan && (
                    <span
                      className={`text-black text-xs font-bold px-3 py-1 rounded-full ${
                        currentPlanColor === "yellow"
                          ? "bg-yellow-600"
                          : currentPlanColor === "cyan"
                            ? "bg-cyan-600"
                            : currentPlanColor === "purple"
                              ? "bg-purple-600"
                              : "bg-slate-400"
                      }`}
                    >
                      CURRENT
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-sm min-h-16">
                  {plan.description}
                </p>

                <div className="text-3xl font-bold mt-6">{plan.price}</div>

                <ul className="space-y-3 mt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-slate-300 text-sm">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full mt-8 px-5 py-3 rounded-xl font-semibold bg-slate-800 text-slate-500 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.name === "ENTERPRISE" ? (
                  <button className="w-full mt-8 px-5 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
                    Contact Sales
                  </button>
                ) : plan.name === "FREE" ? (
                  <button
                    disabled
                    className="w-full mt-8 px-5 py-3 rounded-xl font-semibold bg-slate-800 text-slate-500 cursor-not-allowed"
                  >
                    Not Available
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full mt-8 px-5 py-3 rounded-xl font-semibold bg-blue-600/60 text-white cursor-not-allowed"
                  >
                    Request Upgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-3">Need a higher plan?</h2>

          <p className="text-slate-400 mb-6">
            Payments are not active yet. For now, admins can manually upgrade
            user plans from the user management panel.
          </p>

          <Link
            href="/dashboard"
            className="inline-block bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
