import Link from "next/link";
import { getTranslations } from "next-intl/server";

const resources = [
  { key: "tutorials", href: "/resources/tutorials", icon: "book" },
  { key: "customs", href: "/resources/customs", icon: "document" },
  { key: "news", href: "/resources/news", icon: "signal" },
  { key: "countries", href: "/resources/countries", icon: "globe" },
  { key: "glossary", href: "/resources/glossary", icon: "index" },
  { key: "cases", href: "/resources/case-studies", icon: "case" },
] as const;

function ResourceIcon({ name }: { name: (typeof resources)[number]["icon"] }) {
  const paths = {
    book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H12v14H7.5A2.5 2.5 0 0 0 5 19.5v-14Zm14 0A2.5 2.5 0 0 0 16.5 3H12v14h4.5a2.5 2.5 0 0 1 2.5 2.5v-14Z",
    document: "M7 3h7l4 4v14H7V3Zm7 0v5h5",
    signal: "M5 17h2v2H5v-2Zm0-6a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-20c3 3 4 6 4 10s-1 7-4 10m0-20C9 5 8 8 8 12s1 7 4 10M2 12h20",
    index: "M6 4h12M6 9h12M6 14h8M6 19h8M3 4h.01M3 9h.01M3 14h.01M3 19h.01",
    case: "M4 7h16v13H4V7Zm5 0V4h6v3m-5 5h4",
  } as const;
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default async function ResourcePreview() {
  const t = await getTranslations("publicSite.pages.resources");

  return (
    <section className="relative overflow-hidden border-y border-slate-800/80 bg-slate-900/30 ui-section">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_42%)]" />
      <div className="ui-container relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-cyan-300">{t("eyebrow")}</p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{t("title")}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">{t("sectionDescription")}</p>
          </div>
          <Link href="/resources" className="ui-button ui-button-outline shrink-0 self-start sm:self-auto">{t("title")} <span aria-hidden="true">→</span></Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Link key={resource.key} href={resource.href} className="ui-card ui-card-interactive group flex min-h-48 flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition group-hover:border-cyan-300/40 group-hover:bg-cyan-300/15" aria-hidden="true"><ResourceIcon name={resource.icon} /></span>
              <h3 className="mt-6 text-xl font-bold text-white">{t(`cards.${resource.key}.title`)}</h3>
              <p className="mt-3 line-clamp-3 leading-7 text-slate-400">{t(`cards.${resource.key}.description`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
