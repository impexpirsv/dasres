import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "../../lib/locale";
import { serializeJsonLd } from "../../lib/seo/jsonld";
import { createFaqPageJsonLd } from "../../lib/seo/structured-data";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import FaqList from "../components/content/FaqList";
import { PublicPageHero, PublicPageShell, PublicSection } from "../components/public/PublicPage";

type Props = { routeLocale?: Locale; localized?: boolean };
export function createFaqMetadata({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/faq` as const : "/faq"; return createStaticPublicPageMetadata("faq", canonical, { locale: routeLocale, localized }); }
export const generateMetadata = createFaqMetadata;
const faqKeys = ["verification", "plans", "cases", "proposals", "tickets", "language"] as const;
export default async function FaqPage({ routeLocale, localized = false }: Props = {}) { const locale = routeLocale ?? await getLocale(); const canonical = localized && routeLocale ? `/${routeLocale}/faq` as const : "/faq"; const [t, common] = await Promise.all([getTranslations({ locale, namespace: "knowledgeHub" }), getTranslations({ locale, namespace: "publicSite.common" })]); const items = faqKeys.map((key) => ({ question: t(`faq.items.${key}.question`), answer: t(`faq.items.${key}.answer`), category: t(`faq.items.${key}.category`) })); const homePath = localized && routeLocale ? `/${routeLocale}` : "/"; const page = { canonicalPath: canonical, name: t("faq.title"), description: t("faq.summary"), language: locale, breadcrumbs: [{ name: common("home"), pathname: homePath }, { name: t("faq.title"), pathname: canonical }] }; return <PublicPageShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(createFaqPageJsonLd(page, items)) }} /><PublicPageHero eyebrow={t("faq.eyebrow")} title={t("faq.title")} description={t("faq.summary")} breadcrumbs={[{ href: homePath, label: common("home") }, { label: t("faq.title") }]} /><PublicSection title={t("faq.sectionTitle")}><FaqList items={items} /></PublicSection></PublicPageShell>; }
