import { getLocale, getTranslations } from "next-intl/server";
import { helpCategories } from "../../lib/content";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import { ContentNavigation } from "../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";
import PublicPageJsonLd from "../components/public/PublicPageJsonLd";

export const generateMetadata = () => createStaticPublicPageMetadata("help", "/help");
export default async function HelpPage() { const [t, common, locale] = await Promise.all([getTranslations("knowledgeHub"), getTranslations("publicSite.common"), getLocale()]); const nav = helpCategories.map((category) => ({ href: `/help/${category}`, label: t(`help.categories.${category}.title`) })); return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: "/help", name: t("help.title"), description: t("help.summary"), language: locale, breadcrumbs: [{ name: common("home"), pathname: "/" }, { name: t("help.title"), pathname: "/help" }] }} /><PublicPageHero eyebrow={t("help.eyebrow")} title={t("help.title")} description={t("help.summary")} breadcrumbs={[{ href: "/", label: common("home") }, { label: t("help.title") }]} /><PublicSection title={t("help.browseTitle")} description={t("help.browseDescription")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} /></PublicSection></PublicPageShell>; }
