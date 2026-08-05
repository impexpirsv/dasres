import { getTranslations } from "next-intl/server";

import { createStaticPublicPageMetadata, getStaticPublicPageIdentity } from "../../lib/seo/static-public-page";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";
import PublicPageJsonLd from "../components/public/PublicPageJsonLd";

export const generateMetadata = () => createStaticPublicPageMetadata("pricing", "/pricing");

const plans = [
  { key: "free", cases: "3", proposals: "5" },
  { key: "gold", cases: "20", proposals: "20" },
  { key: "diamond", cases: null, proposals: null },
  { key: "enterprise", cases: null, proposals: null },
] as const;

export default async function PricingPage() {
  const [t, common, identity] = await Promise.all([
    getTranslations("publicSite.pages.pricing"),
    getTranslations("publicSite.common"),
    getStaticPublicPageIdentity("pricing", "/pricing"),
  ]);

  return (
    <PublicPageShell>
      <PublicPageJsonLd page={identity} />
      <PublicPageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} breadcrumbs={[{ href: "/", label: common("home") }, { label: t("title") }]} />
      <PublicSection title={t("sectionTitle")} description={t("sectionDescription")}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-2xl font-black text-white">{t(`plans.${plan.key}.name`)}</h2>
              <p className="mt-3 min-h-20 leading-7 text-slate-400">{t(`plans.${plan.key}.description`)}</p>
              <dl className="mt-6 space-y-4 border-t border-slate-800 pt-5">
                <div><dt className="text-sm text-slate-500">{t("activeCases")}</dt><dd className="mt-1 font-bold text-cyan-300">{plan.cases ?? t("unlimited")}</dd></div>
                <div><dt className="text-sm text-slate-500">{t("proposals")}</dt><dd className="mt-1 font-bold text-emerald-300">{plan.proposals ?? t("unlimited")}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 leading-7 text-amber-100">{t("availabilityNotice")}</p>
      </PublicSection>
    </PublicPageShell>
  );
}
