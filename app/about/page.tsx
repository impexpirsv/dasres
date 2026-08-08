import StandardPublicPage from "../components/public/StandardPublicPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import type { Locale } from "../../lib/locale";

type Props = { routeLocale?: Locale; localized?: boolean };

export function createAboutMetadata({ routeLocale, localized = false }: Props = {}) {
  const canonical = localized && routeLocale ? `/${routeLocale}/about` as const : "/about";
  return createStaticPublicPageMetadata("about", canonical, {
    locale: routeLocale,
    localized,
  });
}

export const generateMetadata = createAboutMetadata;

export default function AboutPage({ routeLocale, localized = false }: Props = {}) {
  const canonical = localized && routeLocale ? `/${routeLocale}/about` as const : "/about";
  return <StandardPublicPage page="about" canonicalPath={canonical} routeLocale={routeLocale} localized={localized} cta={{ href: localized && routeLocale ? `/${routeLocale}/companies` : "/companies" }} />;
}
