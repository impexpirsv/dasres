"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { getLocalizedPublicPathLocale } from "../../lib/locale";
import LanguageSwitcher from "./LanguageSwitcher";

const groups = [
  { key: "platform", links: [["/companies", "companies"], ["/experts", "experts"], ["/opportunities", "opportunities"]] },
  { key: "solutions", links: [["/pricing", "pricing"], ["/dashboard", "dashboard"], ["/help", "help"]] },
  { key: "resources", links: [["/resources", "resourceHub"], ["/faq", "faq"]] },
  { key: "company", links: [["/about", "about"], ["/contact", "contact"]] },
  { key: "legal", links: [["/privacy", "privacy"], ["/terms", "terms"], ["/cookies", "cookies"]] },
] as const;

export default function Footer({ year }: { year: number }) {
  const t = useTranslations("publicSite.footer");
  const pathname = usePathname();
  const homepageLocale = getLocalizedPublicPathLocale(pathname);
  const homepageHref = homepageLocale ? `/${homepageLocale}` : "/";
  const resolvePublicHref = (href: string) =>
    homepageLocale && href === "/companies"
      ? `/${homepageLocale}/companies`
      : href;

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="ui-container py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Link href={homepageHref} className="inline-block rounded-sm bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-3xl font-black tracking-[0.14em] text-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">DASRES</Link>
            <p className="mt-5 max-w-md leading-7 text-slate-400">{t("trustStatement")}</p>
            <Link href="/contact" className="ui-button ui-button-outline mt-6 text-cyan-200">{t("supportEntry")}</Link>
          </div>

          <nav aria-label={t("navigationLabel")} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {groups.map((group) => (
              <div key={group.key} className="min-w-0">
                <h2 className="font-bold text-white">{t(`groups.${group.key}`)}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([href, key]) => (
                    <li key={href}><Link href={resolvePublicHref(href)} className="break-words text-sm leading-6 text-slate-400 transition hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">{t(`links.${key}`)}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-slate-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{t("copyright", { year })}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">{t("languageLabel")}</span>
            <LanguageSwitcher ariaLabel={t("languageLabel")} />
          </div>
        </div>
      </div>
    </footer>
  );
}
