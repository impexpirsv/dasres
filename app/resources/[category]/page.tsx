import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { contentRepository, getContentType, isKnowledgeCategory, knowledgeCategories } from "../../../lib/content";
import { createPublicPageMetadata } from "../../../lib/seo/metadata";
import { isLocale } from "../../../lib/locale";
import EmptyState from "../../components/EmptyState";
import { ContentArticleCard, ContentNavigation, EditorialPolicy } from "../../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../../components/public/PublicPage";
import PublicPageJsonLd from "../../components/public/PublicPageJsonLd";

type Props = { params: Promise<{ category: string }> };
export function generateStaticParams() { return knowledgeCategories.map((category) => ({ category })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { category } = await params; if (!isKnowledgeCategory(category)) return {}; const t = await getTranslations(`knowledgeHub.resources.categories.${category}`); return createPublicPageMetadata({ title: t("seoTitle"), description: t("seoDescription"), canonical: `/resources/${category}` }); }

export default async function KnowledgeCategoryPage({ params }: Props) {
  const { category } = await params; if (!isKnowledgeCategory(category)) notFound();
  const [t, common, locale] = await Promise.all([getTranslations("knowledgeHub"), getTranslations("publicSite.common"), getLocale()]);
  if (!isLocale(locale)) notFound();
  const path = `/resources/${category}`; const title = t(`resources.categories.${category}.title`); const description = t(`resources.categories.${category}.summary`);
  const articles = await contentRepository.getByCategory(getContentType(category), { locale, status: "published" });
  const nav = knowledgeCategories.map((item) => ({ href: `/resources/${item}`, label: t(`resources.categories.${item}.title`) }));
  const policy = ["changing", "dates", "sources", "education", "stale"].map((key) => t(`resources.policy.points.${key}`));
  return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: path, name: title, description, language: locale, breadcrumbs: [{ name: common("home"), pathname: "/" }, { name: t("resources.title"), pathname: "/resources" }, { name: title, pathname: path }] }} /><PublicPageHero eyebrow={t("resources.eyebrow")} title={title} description={description} breadcrumbs={[{ href: "/", label: common("home") }, { href: "/resources", label: t("resources.title") }, { label: title }]} /><PublicSection title={t("resources.browseTitle")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} current={path} /></PublicSection><PublicSection title={t(`resources.categories.${category}.purposeTitle`)} description={t(`resources.categories.${category}.purpose`)} />{articles.length > 0 ? <PublicSection title={title}><div className="grid gap-5 lg:grid-cols-2">{articles.map((article) => <ContentArticleCard key={article.id} article={article} category={category} />)}</div></PublicSection> : <div className="ui-container pb-16"><EmptyState title={t("resources.emptyTitle")} description={t("resources.emptyDescription")} icon={<span aria-hidden="true">◇</span>} /></div>}<div className="ui-container pb-16"><EditorialPolicy title={t("resources.policy.title")} points={policy} /></div></PublicPageShell>;
}
