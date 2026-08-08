import StandardPublicPage from "../components/public/StandardPublicPage";
import { createStaticPublicPageMetadata } from "../../lib/seo/static-public-page";
import type { Locale } from "../../lib/locale";

type Props = { routeLocale?: Locale; localized?: boolean };

export function createContactMetadata({ routeLocale, localized = false }: Props = {}) {
  const canonical = localized && routeLocale ? `/${routeLocale}/contact` as const : "/contact";
  return createStaticPublicPageMetadata("contact", canonical, {
    locale: routeLocale,
    localized,
  });
}

export const generateMetadata = createContactMetadata;

export default function ContactPage({ routeLocale, localized = false }: Props = {}) {
  const canonical = localized && routeLocale ? `/${routeLocale}/contact` as const : "/contact";
  return <StandardPublicPage page="contact" canonicalPath={canonical} routeLocale={routeLocale} localized={localized} cta={{ href: "/dashboard/tickets" }} />;
}
