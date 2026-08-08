import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { knowledgeCategories } from "../../lib/content";
import { defaultLocale, isLocale, type Locale } from "../../lib/locale";
import { getAlternateOpenGraphLocales, openGraphLocaleMap } from "../../lib/seo/localized-homepage";
import { getLocalizedResourcesAlternates } from "../../lib/seo/localized-resources";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import { ContentNavigation, EditorialPolicy } from "../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";
import PublicPageJsonLd from "../components/public/PublicPageJsonLd";

type Props = { routeLocale?: Locale; localized?: boolean };

export async function createResourcesMetadata({ routeLocale, localized = false }: Props = {}): Promise<Metadata> {
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const canonical: `/${string}` = localized ? `/${locale}/resources` : "/resources";
  const metadata = await createStaticPublicPageMetadata("resources", canonical, { locale });
  if (!localized) return metadata;
  return {
    ...metadata,
    alternates: { canonical, languages: getLocalizedResourcesAlternates() },
    openGraph: { ...metadata.openGraph, url: canonical, locale: openGraphLocaleMap[locale], alternateLocale: getAlternateOpenGraphLocales(locale) },
  };
}

export const generateMetadata = () => createResourcesMetadata();

export default async function ResourcesPage({ routeLocale, localized = false }: Props = {}) {
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const resourcesPath = localized ? `/${locale}/resources` : "/resources";
  const homePath = localized ? `/${locale}` : "/";
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeHub" }),
    getTranslations({ locale, namespace: "publicSite.common" }),
  ]);
  const nav = knowledgeCategories.map((category) => ({ href: `${resourcesPath}/${category}`, label: t(`resources.categories.${category}.title`) }));
  const policy = ["changing", "dates", "sources", "education", "stale"].map((key) => t(`resources.policy.points.${key}`));
  return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: resourcesPath, name: t("resources.title"), description: t("resources.summary"), language: locale, breadcrumbs: [{ name: common("home"), pathname: homePath }, { name: t("resources.title"), pathname: resourcesPath }] }} /><PublicPageHero eyebrow={t("resources.eyebrow")} title={t("resources.title")} description={t("resources.summary")} breadcrumbs={[{ href: homePath, label: common("home") }, { label: t("resources.title") }]} /><PublicSection title={t("resources.browseTitle")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} /></PublicSection><div className="mx-auto max-w-7xl px-6 pb-16"><EditorialPolicy title={t("resources.policy.title")} points={policy} /></div></PublicPageShell>;
}
