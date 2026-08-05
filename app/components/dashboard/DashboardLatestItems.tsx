import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type LatestCardProps = {
  title: string;
  viewHref: string;
  viewLabel: string;
  color: string;
  children: ReactNode;
};

function DashboardLatestCard({
  title,
  viewHref,
  viewLabel,
  color,
  children,
}: LatestCardProps) {
  return (
    <section className={`ui-card bg-gradient-to-br from-slate-900 to-slate-950 transition-all duration-300 hover:shadow-xl ${color}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <Link
          href={viewHref}
          className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
        >
          {viewLabel} →
        </Link>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type Props = {
  latestExperts: {
    id: number;
    name: string;
    country: string;
    specialty: string;
  }[];
  latestCompanies: {
    id: number;
    name: string;
    country: string;
    category: string;
  }[];
  latestOpportunities: {
    id: number;
    title: string;
    country: string;
    status: string;
  }[];
  userRole: string;
};

function normalizeTranslationKey(value: string): string[] {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  const underscored = lower.replace(/[\s-]+/g, "_");
  return [...new Set([trimmed, lower, underscored])];
}

export default async function DashboardLatestItems({
  latestExperts,
  latestCompanies,
  latestOpportunities,
  userRole,
}: Props) {
  const t = await getTranslations("dashboardLatestItems");
  const tc = await getTranslations("common.countries");
  const ts = await getTranslations("common.specialties");
  const tcat = await getTranslations("common.categories");

  function translateValue(
    value: string,
    translator: typeof tc,
  ): string {
    for (const key of normalizeTranslationKey(value)) {
      if (translator.has(key)) return translator(key);
    }
    return value;
  }

  function opportunityStatusLabel(status: string): string {
    const key = status.trim().toLowerCase();
    return t.has(`search.statuses.${key}`)
      ? t(`search.statuses.${key}`)
      : status.replaceAll("_", " ");
  }

  const isAdmin = userRole === "admin";

  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      <DashboardLatestCard
        title={isAdmin ? t("experts.adminTitle") : t("experts.userTitle")}
        viewHref={isAdmin ? "/dashboard/experts" : "/dashboard/my-experts"}
        viewLabel={t("viewAll")}
        color="hover:border-blue-500/50 hover:shadow-blue-500/10"
      >
        {latestExperts.length === 0 ? (
          <p className="text-slate-500">{t("experts.empty")}</p>
        ) : (
          latestExperts.map((expert) => (
            <Link
              key={expert.id}
              href={`/dashboard/experts/${expert.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-blue-500/40"
            >
              <p className="font-bold text-white">{expert.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {translateValue(expert.country, tc)} · {translateValue(expert.specialty, ts)}
              </p>
            </Link>
          ))
        )}
      </DashboardLatestCard>

      <DashboardLatestCard
        title={isAdmin ? t("companies.adminTitle") : t("companies.userTitle")}
        viewHref={isAdmin ? "/dashboard/companies" : "/dashboard/my-companies"}
        viewLabel={t("viewAll")}
        color="hover:border-emerald-500/50 hover:shadow-emerald-500/10"
      >
        {latestCompanies.length === 0 ? (
          <p className="text-slate-500">{t("companies.empty")}</p>
        ) : (
          latestCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/dashboard/companies/${company.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-500/40"
            >
              <p className="font-bold text-white">{company.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {translateValue(company.country, tc)} · {translateValue(company.category, tcat)}
              </p>
            </Link>
          ))
        )}
      </DashboardLatestCard>

      <DashboardLatestCard
        title={t("opportunities.title")}
        viewHref="/dashboard/opportunities"
        viewLabel={t("viewAll")}
        color="hover:border-purple-500/50 hover:shadow-purple-500/10"
      >
        {latestOpportunities.length === 0 ? (
          <p className="text-slate-500">{t("opportunities.empty")}</p>
        ) : (
          latestOpportunities.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/dashboard/opportunities/${opportunity.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-purple-500/40"
            >
              <p className="font-bold text-white">{opportunity.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {translateValue(opportunity.country, tc)} · {opportunityStatusLabel(opportunity.status)}
              </p>
            </Link>
          ))
        )}
      </DashboardLatestCard>
    </div>
  );
}
