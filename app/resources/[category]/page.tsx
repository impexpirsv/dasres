import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { contentRepository, getContentType, isKnowledgeCategory, knowledgeCategories } from "../../../lib/content";
import { defaultLocale, isLocale, type Locale } from "../../../lib/locale";
import { getAlternateOpenGraphLocales, openGraphLocaleMap } from "../../../lib/seo/localized-homepage";
import { getLocalizedResourcesAlternates } from "../../../lib/seo/localized-resources";
import { createPublicPageMetadata } from "../../../lib/seo/metadata";
import EmptyState from "../../components/EmptyState";
import { ContentArticleCard, ContentNavigation, EditorialPolicy } from "../../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../../components/public/PublicPage";
import PublicPageJsonLd from "../../components/public/PublicPageJsonLd";

type Props = { params: Promise<{ category: string }>; routeLocale?: Locale; localized?: boolean };
export function generateStaticParams() { return knowledgeCategories.map((category) => ({ category })); }

export async function createResourcesCategoryMetadata({ params, routeLocale, localized = false }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isKnowledgeCategory(category)) return { alternates: { canonical: null } };
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const canonical = localized ? `/${locale}/resources/${category}` : `/resources/${category}`;
  const t = await getTranslations({ locale, namespace: `knowledgeHub.resources.categories.${category}` });
  const metadata = createPublicPageMetadata({ title: t("seoTitle"), description: t("seoDescription"), canonical });
  if (!localized) return metadata;
  return {
    ...metadata,
    alternates: { canonical, languages: getLocalizedResourcesAlternates(category) },
    openGraph: { ...metadata.openGraph, url: canonical, locale: openGraphLocaleMap[locale], alternateLocale: getAlternateOpenGraphLocales(locale) },
  };
}

export const generateMetadata = createResourcesCategoryMetadata;

export default async function KnowledgeCategoryPage({ params, routeLocale, localized = false }: Props) {
  const { category } = await params;
  if (!isKnowledgeCategory(category)) notFound();
  const requestedLocale = routeLocale ?? await getLocale();
  if (!isLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  const resourcesPath = localized ? `/${locale}/resources` : "/resources";
  const homePath = localized ? `/${locale}` : "/";
  const path = `${resourcesPath}/${category}`;
  const [t, common, articles] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeHub" }),
    getTranslations({ locale, namespace: "publicSite.common" }),
    contentRepository.getByCategory(getContentType(category), { locale, status: "published" }),
  ]);
  const title = t(`resources.categories.${category}.title`);
  const description = t(`resources.categories.${category}.summary`);
  const nav = knowledgeCategories.map((item) => ({ href: `${resourcesPath}/${item}`, label: t(`resources.categories.${item}.title`) }));
  const policy = ["changing", "dates", "sources", "education", "stale"].map((key) => t(`resources.policy.points.${key}`));
  return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: path, name: title, description, language: locale, breadcrumbs: [{ name: common("home"), pathname: homePath }, { name: t("resources.title"), pathname: resourcesPath }, { name: title, pathname: path }] }} /><PublicPageHero eyebrow={t("resources.eyebrow")} title={title} description={description} breadcrumbs={[{ href: homePath, label: common("home") }, { href: resourcesPath, label: t("resources.title") }, { label: title }]} /><PublicSection title={t("resources.browseTitle")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} current={path} /></PublicSection><PublicSection title={t(`resources.categories.${category}.purposeTitle`)} description={t(`resources.categories.${category}.purpose`)} />{articles.length > 0 ? <PublicSection title={title}><div className="grid gap-5 lg:grid-cols-2">{articles.map((article) => <ContentArticleCard key={article.id} article={article} category={category} resourcesPath={resourcesPath} />)}</div></PublicSection> : <div className="ui-container pb-16"><EmptyState title={t("resources.emptyTitle")} description={t("resources.emptyDescription")} icon={<span aria-hidden="true">◇</span>} /></div>}<div className="ui-container pb-16"><EditorialPolicy title={t("resources.policy.title")} points={policy} /></div></PublicPageShell>;
}
