import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { contentRepository, createContentBreadcrumbs, createContentMetadata, createContentStructuredData, getContentType, isKnowledgeCategory } from "../../../../lib/content";
import { isLocale, type Locale } from "../../../../lib/locale";
import { serializeJsonLd } from "../../../../lib/seo/jsonld";
import { getAlternateOpenGraphLocales, openGraphLocaleMap } from "../../../../lib/seo/localized-homepage";
import { getLocalizedArticleAlternates, getLocalizedResourcesPath } from "../../../../lib/seo/localized-resources";
import ArticleBody from "../../../components/content/article/ArticleBody";
import ArticleFooter from "../../../components/content/article/ArticleFooter";
import ArticleHeader from "../../../components/content/article/ArticleHeader";
import ArticleSidebar from "../../../components/content/article/ArticleSidebar";
import { getArticleHeadings, parseArticleBody } from "../../../components/content/article/article-content";
import { PublicPageShell } from "../../../components/public/PublicPage";

type Props = { params: Promise<{ category: string; slug: string }>; routeLocale?: Locale; localized?: boolean };

export async function generateStaticParams() {
  const records = await contentRepository.getAll({ status: "published" });
  return records.map((record) => ({ category: record.canonical.split("/")[2], slug: record.slug }));
}

async function findArticle(category: string, slug: string, locale: Locale) {
  if (!isKnowledgeCategory(category)) return null;
  return contentRepository.getByPath(getContentType(category), slug, { locale, status: "published" });
}

async function getAvailableLocales(category: string, slug: string): Promise<Locale[]> {
  if (!isKnowledgeCategory(category)) return [];
  const type = getContentType(category);
  const records = await contentRepository.getAll({ status: "published" });
  return records.filter((record) => record.category === type && record.slug === slug).map((record) => record.locale);
}

export async function createResourcesArticleMetadata({ params, routeLocale, localized = false }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const requestedLocale = routeLocale ?? await getLocale();
  if (!isLocale(requestedLocale)) return { alternates: { canonical: null } };
  const article = await findArticle(category, slug, requestedLocale);
  if (!article) return { alternates: { canonical: null } };
  if (!localized) return createContentMetadata(article);
  const canonical = getLocalizedResourcesPath(requestedLocale, category, slug);
  const availableLocales = await getAvailableLocales(category, slug);
  const metadata = createContentMetadata(article, canonical);
  return {
    ...metadata,
    alternates: { canonical, languages: getLocalizedArticleAlternates(category, slug, availableLocales) },
    openGraph: { ...metadata.openGraph, url: canonical, locale: openGraphLocaleMap[requestedLocale], alternateLocale: getAlternateOpenGraphLocales(requestedLocale).filter((candidate) => availableLocales.some((locale) => openGraphLocaleMap[locale] === candidate)) },
  };
}

export const generateMetadata = createResourcesArticleMetadata;

export default async function KnowledgeArticlePage({ params, routeLocale, localized = false }: Props) {
  const { category, slug } = await params;
  if (!isKnowledgeCategory(category)) notFound();
  const requestedLocale = routeLocale ?? await getLocale();
  if (!isLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  const article = await findArticle(category, slug, locale);
  if (!article) notFound();
  const resourcesPath = localized ? `/${locale}/resources` : "/resources";
  const [t, common, related, print, updated, review] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeHub" }),
    getTranslations({ locale, namespace: "publicSite.common" }),
    contentRepository.getRelated(article.id, { locale, status: "published", limit: 4 }),
    getTranslations({ locale, namespace: "projectPrintButton" }),
    getTranslations({ locale, namespace: "casesPage" }),
    getTranslations({ locale, namespace: "topRatedShowcase" }),
  ]);
  const categoryTitle = t(`resources.categories.${category}.title`);
  const breadcrumbs = createContentBreadcrumbs(article, { home: common("home"), resources: t("resources.title"), category: categoryTitle }, resourcesPath);
  const canonical = localized ? getLocalizedResourcesPath(locale, category, slug) : article.canonical;
  const blocks = parseArticleBody(article.body);
  const headings = getArticleHeadings(blocks);

  return <PublicPageShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(createContentStructuredData(article, canonical, localized ? breadcrumbs : undefined)) }} /><ArticleHeader article={article} categoryTitle={categoryTitle} breadcrumbs={breadcrumbs} locale={locale} updatedLabel={updated("updated")} reviewLabel={review("reviewHistory")} /><main className="ui-container article-layout py-10 sm:py-14"><ArticleSidebar article={article} headings={headings} related={related} printLabel={print("button")} copyLabel={t("common.openLink")} resourcesPath={resourcesPath} /><div className="min-w-0"><ArticleBody blocks={blocks} /><ArticleFooter article={article} related={related} relatedTitle={t("common.relatedCategories")} sourcesTitle={t("resources.policy.points.sources")} locale={locale} resourcesPath={resourcesPath} /></div></main></PublicPageShell>;
}
