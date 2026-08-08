import { getLocale, getTranslations } from "next-intl/server";

import { helpCategories } from "../../lib/content";
import { defaultLocale, isLocale, type Locale } from "../../lib/locale";
import {
  getAlternateOpenGraphLocales,
  openGraphLocaleMap,
} from "../../lib/seo/localized-homepage";
import { getLocalizedHelpAlternates } from "../../lib/seo/localized-help";
import { createPublicPageMetadata } from "../../lib/seo/metadata";
import { ContentNavigation } from "../components/content/ContentDirectory";
import {
  PublicPageHero,
  PublicPageShell,
  PublicSection,
} from "../components/public/PublicPage";
import PublicPageJsonLd from "../components/public/PublicPageJsonLd";

type Props = { routeLocale?: Locale; localized?: boolean };

export async function createHelpMetadata({
  routeLocale,
  localized = false,
}: Props = {}) {
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const canonical = localized ? `/${locale}/help` : "/help";
  const t = await getTranslations({
    locale,
    namespace: "publicSite.pages.help",
  });
  const metadata = createPublicPageMetadata({
    title: t("metadata.title"),
    description: t("metadata.description"),
    canonical,
    robots: { index: true, follow: true },
  });

  if (!localized) return metadata;

  return {
    ...metadata,
    alternates: {
      canonical,
      languages: getLocalizedHelpAlternates(),
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonical,
      locale: openGraphLocaleMap[locale],
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
  };
}

export const generateMetadata = createHelpMetadata;

export default async function HelpPage({
  routeLocale,
  localized = false,
}: Props = {}) {
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const helpPath = localized ? `/${locale}/help` : "/help";
  const homePath = localized ? `/${locale}` : "/";
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeHub" }),
    getTranslations({ locale, namespace: "publicSite.common" }),
  ]);
  const nav = helpCategories.map((category) => ({
    href: `${helpPath}/${category}`,
    label: t(`help.categories.${category}.title`),
  }));

  return (
    <PublicPageShell>
      <PublicPageJsonLd
        page={{
          canonicalPath: helpPath,
          name: t("help.title"),
          description: t("help.summary"),
          language: locale,
          breadcrumbs: [
            { name: common("home"), pathname: homePath },
            { name: t("help.title"), pathname: helpPath },
          ],
        }}
      />
      <PublicPageHero
        eyebrow={t("help.eyebrow")}
        title={t("help.title")}
        description={t("help.summary")}
        breadcrumbs={[
          { href: homePath, label: common("home") },
          { label: t("help.title") },
        ]}
      />
      <PublicSection
        title={t("help.browseTitle")}
        description={t("help.browseDescription")}
      >
        <ContentNavigation
          ariaLabel={t("common.categoryNavigation")}
          items={nav}
        />
      </PublicSection>
    </PublicPageShell>
  );
}
