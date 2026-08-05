import { getTranslations } from "next-intl/server";

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
}: {
  page: StandardPage;
  canonicalPath: `/${string}`;
  cta?: { href: string };
}) {
  const [t, common, identity] = await Promise.all([
    getTranslations(`publicSite.pages.${page}`),
    getTranslations("publicSite.common"),
    getStaticPublicPageIdentity(page, canonicalPath),
  ]);

  return (
    <PublicPageShell>
      <PublicPageJsonLd page={identity} />
      <PublicPageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ href: "/", label: common("home") }, { label: t("title") }]}
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
