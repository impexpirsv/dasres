import { getTranslations } from "next-intl/server";

const trustItems = [
  { namespace: "liveStats", key: "verifiedCompanies" },
  { namespace: "liveStats", key: "trustedExperts" },
  { namespace: "services", key: "caseVisibility" },
  { namespace: "hero", key: "titleLine2" },
  { namespace: "services", key: "unifiedWorkflow" },
] as const;

export default async function TrustStrip() {
  const [stats, services, hero] = await Promise.all([
    getTranslations("liveStats"),
    getTranslations("services"),
    getTranslations("hero"),
  ]);
  const translations = { liveStats: stats, services, hero };

  return (
    <section className="relative border-b border-slate-800/80 bg-slate-950" aria-label={services("eyebrow")}>
      <div className="ui-container py-5 sm:py-6">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {trustItems.map((item) => (
            <li key={`${item.namespace}-${item.key}`} className="flex min-w-0 items-center gap-3 text-sm font-semibold leading-5 text-slate-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-300" aria-hidden="true">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none"><path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="break-words">{translations[item.namespace](item.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
