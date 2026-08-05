import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { contentRepository, createContentBreadcrumbs, createContentMetadata, createContentStructuredData, getContentType, isKnowledgeCategory } from "../../../../lib/content";
import { serializeJsonLd } from "../../../../lib/seo/jsonld";
import { isLocale, type Locale } from "../../../../lib/locale";
import ArticleBody from "../../../components/content/article/ArticleBody";
import ArticleFooter from "../../../components/content/article/ArticleFooter";
import ArticleHeader from "../../../components/content/article/ArticleHeader";
import ArticleSidebar from "../../../components/content/article/ArticleSidebar";
import { getArticleHeadings, parseArticleBody } from "../../../components/content/article/article-content";
import { PublicPageShell } from "../../../components/public/PublicPage";

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  const records = await contentRepository.getAll({ status: "published" });
  return records.map((record) => ({ category: record.canonical.split("/")[2], slug: record.slug }));
}

async function findArticle(category: string, slug: string, locale: Locale) {
  if (!isKnowledgeCategory(category)) return null;
  const record = await contentRepository.getBySlug(slug, { locale, status: "published" });
  return record?.category === getContentType(category) ? record : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ category, slug }, locale] = await Promise.all([params, getLocale()]);
  if (!isLocale(locale)) return {};
  const article = await findArticle(category, slug, locale);
  return article ? createContentMetadata(article) : {};
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const [{ category, slug }, locale, t, common] = await Promise.all([params, getLocale(), getTranslations("knowledgeHub"), getTranslations("publicSite.common")]);
  if (!isKnowledgeCategory(category)) notFound();
  if (!isLocale(locale)) notFound();
  const article = await findArticle(category, slug, locale);
  if (!article) notFound();
  const categoryTitle = t(`resources.categories.${category}.title`);
  const breadcrumbs = createContentBreadcrumbs(article, { home: common("home"), resources: t("resources.title"), category: categoryTitle });
  const [related, print, updated, review] = await Promise.all([
    contentRepository.getRelated(article.id, { locale, status: "published", limit: 4 }),
    getTranslations("projectPrintButton"),
    getTranslations("casesPage"),
    getTranslations("topRatedShowcase"),
  ]);
  const blocks = parseArticleBody(article.body);
  const headings = getArticleHeadings(blocks);

  return <PublicPageShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(createContentStructuredData(article)) }} /><ArticleHeader article={article} categoryTitle={categoryTitle} breadcrumbs={breadcrumbs} locale={locale} updatedLabel={updated("updated")} reviewLabel={review("reviewHistory")} /><main className="ui-container article-layout py-10 sm:py-14"><ArticleSidebar article={article} headings={headings} related={related} printLabel={print("button")} copyLabel={t("common.openLink")} /><div className="min-w-0"><ArticleBody blocks={blocks} /><ArticleFooter article={article} related={related} relatedTitle={t("common.relatedCategories")} sourcesTitle={t("resources.policy.points.sources")} locale={locale} /></div></main></PublicPageShell>;
}
