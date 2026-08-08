import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import type { Locale } from "../../lib/locale";

type Props = { routeLocale?: Locale; localized?: boolean };
export function createPrivacyMetadata({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/privacy` as const : "/privacy"; return createStaticPublicPageMetadata("privacy", canonical, { noindex: true, locale: routeLocale, localized }); }
export const generateMetadata = createPrivacyMetadata;
export default function PrivacyPage({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/privacy` as const : "/privacy"; return <StaticLegalPage page="privacy" canonicalPath={canonical} routeLocale={routeLocale} localized={localized} />; }
