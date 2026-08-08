import { getLocale, getTranslations } from "next-intl/server";

import type { Locale } from "../../../lib/locale";
import { getStaticPublicPageIdentity } from "../../../lib/seo/static-public-page";
import { LegalPage, LegalSection } from "./LegalPage";
import PublicPageJsonLd from "./PublicPageJsonLd";

type LegalPageName = "privacy" | "terms" | "cookies";

export default async function StaticLegalPage({
  page,
  canonicalPath,
  routeLocale,
  localized = false,
}: {
  page: LegalPageName;
  canonicalPath: `/${string}`;
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
    <LegalPage
      homeLabel={common("home")}
      homeHref={localized && routeLocale ? `/${routeLocale}` : "/"}
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      reviewNotice={t("reviewNotice")}
    >
      <PublicPageJsonLd page={identity} />
      {(["scope", "data", "choices"] as const).map((section) => (
        <LegalSection key={section} title={t(`sections.${section}.title`)}>
          <p>{t(`sections.${section}.description`)}</p>
        </LegalSection>
      ))}
    </LegalPage>
  );
}
