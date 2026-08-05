import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { helpCategories, helpEntries, isHelpCategory } from "../../../lib/content";
import { createPublicPageMetadata } from "../../../lib/seo/metadata";
import { ContentEntry, ContentNavigation } from "../../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../../components/public/PublicPage";
import PublicPageJsonLd from "../../components/public/PublicPageJsonLd";

type Props = { params: Promise<{ category: string }> };
export function generateStaticParams() { return helpCategories.map((category) => ({ category })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isHelpCategory(category)) return {};
  const t = await getTranslations(`knowledgeHub.help.categories.${category}`);
  return createPublicPageMetadata({ title: t("seoTitle"), description: t("seoDescription"), canonical: `/help/${category}` });
}

export default async function HelpCategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isHelpCategory(category)) notFound();
  const [t, common, locale] = await Promise.all([getTranslations("knowledgeHub"), getTranslations("publicSite.common"), getLocale()]);
  const path = `/help/${category}`;
  const title = t(`help.categories.${category}.title`);
  const description = t(`help.categories.${category}.summary`);
  const nav = helpCategories.map((item) => ({ href: `/help/${item}`, label: t(`help.categories.${item}.title`) }));
  return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: path, name: title, description, language: locale, breadcrumbs: [{ name: common("home"), pathname: "/" }, { name: t("help.title"), pathname: "/help" }, { name: title, pathname: path }] }} /><PublicPageHero eyebrow={t("help.eyebrow")} title={title} description={description} breadcrumbs={[{ href: "/", label: common("home") }, { href: "/help", label: t("help.title") }, { label: title }]} /><PublicSection title={t("help.browseTitle")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} current={path} /></PublicSection><PublicSection title={t("help.entriesTitle")}><div className="grid gap-5 lg:grid-cols-2">{helpEntries[category].map((entry) => <ContentEntry key={entry.key} title={t(`help.entries.${entry.key}.title`)} href={entry.href} linkLabel={t("common.openLink")}><p>{t(`help.entries.${entry.key}.body`)}</p></ContentEntry>)}</div></PublicSection><PublicSection title={t("help.relatedTitle")}><ContentNavigation ariaLabel={t("common.relatedCategories")} items={nav.filter((item) => item.href !== path)} /></PublicSection></PublicPageShell>;
}
