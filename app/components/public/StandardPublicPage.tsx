import { getLocale, getTranslations } from "next-intl/server";

import type { Locale } from "../../../lib/locale";
import { getStaticPublicPageIdentity } from "../../../lib/seo/static-public-page";
import PublicPageJsonLd from "./PublicPageJsonLd";
import {
  PublicCta,
  PublicPageHero,
  PublicPageShell,
  PublicSection,
} from "./PublicPage";

type StandardPage = "about" | "contact" | "help" | "faq";

export default async function StandardPublicPage({
  page,
  canonicalPath,
  cta,
  routeLocale,
  localized = false,
}: {
  page: StandardPage;
  canonicalPath: `/${string}`;
  cta?: { href: string };
  routeLocale?: Locale;
  localized?: boolean;
}) {
  const locale = routeLocale ?? await getLocale();
  const [t, common, identity] = await Promise.all([
    getTranslations({ locale, namespace: `publicSite.pages.${page}` }),
    getTranslations({ locale, namespace: "publicSite.common" }),
    getStaticPublicPageIdentity(page, canonicalPath, {
      locale: routeLocale,
      localized,
    }),
  ]);

  return (
    <PublicPageShell>
      <PublicPageJsonLd page={identity} />
      <PublicPageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          {
            href: localized && routeLocale ? `/${routeLocale}` : "/",
            label: common("home"),
          },
          { label: t("title") },
        ]}
      />
      <PublicSection title={t("sectionTitle")} description={t("sectionDescription")} />
      {cta && (
        <PublicCta
          title={t("cta.title")}
          description={t("cta.description")}
          href={cta.href}
          label={t("cta.label")}
        />
      )}
    </PublicPageShell>
  );
}
