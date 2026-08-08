import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import {
  helpCategories,
  helpEntries,
  isHelpCategory,
} from "../../../lib/content";
import { defaultLocale, isLocale, type Locale } from "../../../lib/locale";
import {
  getAlternateOpenGraphLocales,
  openGraphLocaleMap,
} from "../../../lib/seo/localized-homepage";
import { getLocalizedHelpAlternates } from "../../../lib/seo/localized-help";
import { createPublicPageMetadata } from "../../../lib/seo/metadata";
import {
  ContentEntry,
  ContentNavigation,
} from "../../components/content/ContentDirectory";
import {
  PublicPageHero,
  PublicPageShell,
  PublicSection,
} from "../../components/public/PublicPage";
import PublicPageJsonLd from "../../components/public/PublicPageJsonLd";

type Props = {
  params: Promise<{ category: string }>;
  routeLocale?: Locale;
  localized?: boolean;
};

export function generateStaticParams() {
  return helpCategories.map((category) => ({ category }));
}

export async function createHelpCategoryMetadata({
  params,
  routeLocale,
  localized = false,
}: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isHelpCategory(category)) return {};
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const canonical = localized
    ? `/${locale}/help/${category}`
    : `/help/${category}`;
  const t = await getTranslations({
    locale,
    namespace: `knowledgeHub.help.categories.${category}`,
  });
  const metadata = createPublicPageMetadata({
    title: t("seoTitle"),
    description: t("seoDescription"),
    canonical,
  });

  if (!localized) return metadata;

  return {
    ...metadata,
    alternates: {
      canonical,
      languages: getLocalizedHelpAlternates(category),
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonical,
      locale: openGraphLocaleMap[locale],
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
  };
}

export const generateMetadata = createHelpCategoryMetadata;

export default async function HelpCategoryPage({
  params,
  routeLocale,
  localized = false,
}: Props) {
  const { category } = await params;
  if (!isHelpCategory(category)) notFound();
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const helpPath = localized ? `/${locale}/help` : "/help";
  const homePath = localized ? `/${locale}` : "/";
  const path = `${helpPath}/${category}`;
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeHub" }),
    getTranslations({ locale, namespace: "publicSite.common" }),
  ]);
  const title = t(`help.categories.${category}.title`);
  const description = t(`help.categories.${category}.summary`);
  const nav = helpCategories.map((item) => ({
    href: `${helpPath}/${item}`,
    label: t(`help.categories.${item}.title`),
  }));
  const getEntryHref = (href: string | undefined) =>
    localized && href === "/companies" ? `/${locale}/companies` : href;

  return (
    <PublicPageShell>
      <PublicPageJsonLd
        page={{
          canonicalPath: path,
          name: title,
          description,
          language: locale,
          breadcrumbs: [
            { name: common("home"), pathname: homePath },
            { name: t("help.title"), pathname: helpPath },
            { name: title, pathname: path },
          ],
        }}
      />
      <PublicPageHero
        eyebrow={t("help.eyebrow")}
        title={title}
        description={description}
        breadcrumbs={[
          { href: homePath, label: common("home") },
          { href: helpPath, label: t("help.title") },
          { label: title },
        ]}
      />
      <PublicSection title={t("help.browseTitle")}>
        <ContentNavigation
          ariaLabel={t("common.categoryNavigation")}
          items={nav}
          current={path}
        />
      </PublicSection>
      <PublicSection title={t("help.entriesTitle")}>
        <div className="grid gap-5 lg:grid-cols-2">
          {helpEntries[category].map((entry) => (
            <ContentEntry
              key={entry.key}
              title={t(`help.entries.${entry.key}.title`)}
              href={getEntryHref(entry.href)}
              linkLabel={t("common.openLink")}
            >
              <p>{t(`help.entries.${entry.key}.body`)}</p>
            </ContentEntry>
          ))}
        </div>
      </PublicSection>
      <PublicSection title={t("help.relatedTitle")}>
        <ContentNavigation
          ariaLabel={t("common.relatedCategories")}
          items={nav.filter((item) => item.href !== path)}
        />
      </PublicSection>
    </PublicPageShell>
  );
}
