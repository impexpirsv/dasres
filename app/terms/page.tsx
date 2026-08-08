import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import type { Locale } from "../../lib/locale";

type Props = { routeLocale?: Locale; localized?: boolean };
export function createTermsMetadata({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/terms` as const : "/terms"; return createStaticPublicPageMetadata("terms", canonical, { noindex: true, locale: routeLocale, localized }); }
export const generateMetadata = createTermsMetadata;
export default function TermsPage({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/terms` as const : "/terms"; return <StaticLegalPage page="terms" canonicalPath={canonical} routeLocale={routeLocale} localized={localized} />; }
