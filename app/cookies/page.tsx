import StaticLegalPage from "../components/public/StaticLegalPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import type { Locale } from "../../lib/locale";

type Props = { routeLocale?: Locale; localized?: boolean };
export function createCookiesMetadata({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/cookies` as const : "/cookies"; return createStaticPublicPageMetadata("cookies", canonical, { noindex: true, locale: routeLocale, localized }); }
export const generateMetadata = createCookiesMetadata;
export default function CookiesPage({ routeLocale, localized = false }: Props = {}) { const canonical = localized && routeLocale ? `/${routeLocale}/cookies` as const : "/cookies"; return <StaticLegalPage page="cookies" canonicalPath={canonical} routeLocale={routeLocale} localized={localized} />; }
