import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "../../../lib/auth";
import {
  getCaseLimit,
  getProposalLimit,
} from "../../../lib/plans";

export default async function DashboardSettingsPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardSettings",
  );

  const caseLimit = getCaseLimit(
    user.planType,
  );

  const proposalLimit = getProposalLimit(
    user.planType,
  );

  function getRoleLabel(role: string) {
    switch (role.toLowerCase()) {
      case "admin":
        return t("roles.admin");

      case "user":
        return t("roles.user");

      default:
        return role;
    }
  }

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "FREE":
        return t("plans.free");

      case "GOLD":
        return t("plans.gold");

      case "DIAMOND":
        return t("plans.diamond");

      case "ENTERPRISE":
        return t("plans.enterprise");

      default:
        return planType;
    }
  }

  function getLimitLabel(limit: number) {
    if (
      limit === Number.MAX_SAFE_INTEGER
    ) {
      return t("unlimited");
    }

    return String(limit);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-10">
        <p className="mb-3 font-semibold text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-bold">
              {t(
                "profileInformation.title",
              )}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "profileInformation.fields.name",
                  )}
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {user.name ||
                    t(
                      "profileInformation.notProvided",
                    )}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "profileInformation.fields.email",
                  )}
                </p>

                <p className="mt-2 break-all text-xl font-semibold">
                  {user.email}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "profileInformation.fields.role",
                  )}
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {getRoleLabel(user.role)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "profileInformation.fields.plan",
                  )}
                </p>

                <p className="mt-2 text-xl font-semibold text-yellow-400">
                  {getPlanLabel(
                    user.planType,
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-bold">
              {t("planLimits.title")}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "planLimits.caseLimit",
                  )}
                </p>

                <p className="mt-2 text-2xl font-bold text-cyan-400">
                  {getLimitLabel(caseLimit)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-500">
                  {t(
                    "planLimits.proposalLimit",
                  )}
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {getLimitLabel(
                    proposalLimit,
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {t("quickLinks.title")}
            </h2>

            <div className="space-y-3">
              <Link
                href="/dashboard/subscription"
                className="block rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
              >
                {t(
                  "quickLinks.manageSubscription",
                )}
              </Link>

              <Link
                href="/dashboard/my-companies"
                className="block rounded-xl bg-slate-800 px-5 py-3 text-center transition hover:bg-slate-700"
              >
                {t(
                  "quickLinks.myCompanies",
                )}
              </Link>

              <Link
                href="/dashboard/my-experts"
                className="block rounded-xl bg-slate-800 px-5 py-3 text-center transition hover:bg-slate-700"
              >
                {t(
                  "quickLinks.myExperts",
                )}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {t("security.title")}
            </h2>

            <p className="leading-7 text-slate-400">
              {t("security.description")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}