import { getTranslations } from "next-intl/server";

import { getStaticPublicPageIdentity } from "../../../lib/seo/static-public-page";
import { LegalPage, LegalSection } from "./LegalPage";
import PublicPageJsonLd from "./PublicPageJsonLd";

type LegalPageName = "privacy" | "terms" | "cookies";

export default async function StaticLegalPage({ page, canonicalPath }: { page: LegalPageName; canonicalPath: `/${string}` }) {
  const [t, common, identity] = await Promise.all([
    getTranslations(`publicSite.pages.${page}`),
    getTranslations("publicSite.common"),
    getStaticPublicPageIdentity(page, canonicalPath),
  ]);

  return (
    <LegalPage
      homeLabel={common("home")}
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
