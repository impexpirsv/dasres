import { getLocale, getTranslations } from "next-intl/server";
import { knowledgeCategories } from "../../lib/content";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import { ContentNavigation, EditorialPolicy } from "../components/content/ContentDirectory";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";
import PublicPageJsonLd from "../components/public/PublicPageJsonLd";

export const generateMetadata = () => createStaticPublicPageMetadata("resources", "/resources");
export default async function ResourcesPage() { const [t, common, locale] = await Promise.all([getTranslations("knowledgeHub"), getTranslations("publicSite.common"), getLocale()]); const nav = knowledgeCategories.map((category) => ({ href: `/resources/${category}`, label: t(`resources.categories.${category}.title`) })); const policy = ["changing", "dates", "sources", "education", "stale"].map((key) => t(`resources.policy.points.${key}`)); return <PublicPageShell><PublicPageJsonLd page={{ canonicalPath: "/resources", name: t("resources.title"), description: t("resources.summary"), language: locale, breadcrumbs: [{ name: common("home"), pathname: "/" }, { name: t("resources.title"), pathname: "/resources" }] }} /><PublicPageHero eyebrow={t("resources.eyebrow")} title={t("resources.title")} description={t("resources.summary")} breadcrumbs={[{ href: "/", label: common("home") }, { label: t("resources.title") }]} /><PublicSection title={t("resources.browseTitle")}><ContentNavigation ariaLabel={t("common.categoryNavigation")} items={nav} /></PublicSection><div className="mx-auto max-w-7xl px-6 pb-16"><EditorialPolicy title={t("resources.policy.title")} points={policy} /></div></PublicPageShell>; }
