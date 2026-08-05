import { getLocale, getTranslations } from "next-intl/server";
import { serializeJsonLd } from "../../lib/seo/jsonld";
import { createFaqPageJsonLd } from "../../lib/seo/structured-data";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import FaqList from "../components/content/FaqList";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";

export const generateMetadata = () => createStaticPublicPageMetadata("faq", "/faq");
const faqKeys = ["verification", "plans", "cases", "proposals", "tickets", "language"] as const;
export default async function FaqPage() { const [t, common, locale] = await Promise.all([getTranslations("knowledgeHub"), getTranslations("publicSite.common"), getLocale()]); const items = faqKeys.map((key) => ({ question: t(`faq.items.${key}.question`), answer: t(`faq.items.${key}.answer`), category: t(`faq.items.${key}.category`) })); const page = { canonicalPath: "/faq", name: t("faq.title"), description: t("faq.summary"), language: locale, breadcrumbs: [{ name: common("home"), pathname: "/" }, { name: t("faq.title"), pathname: "/faq" }] }; return <PublicPageShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(createFaqPageJsonLd(page, items)) }} /><PublicPageHero eyebrow={t("faq.eyebrow")} title={t("faq.title")} description={t("faq.summary")} breadcrumbs={[{ href: "/", label: common("home") }, { label: t("faq.title") }]} /><PublicSection title={t("faq.sectionTitle")}><FaqList items={items} /></PublicSection></PublicPageShell>; }
