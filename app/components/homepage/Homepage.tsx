import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "../../../lib/auth";
import type { Locale } from "../../../lib/locale";
import { serializeJsonLd } from "../../../lib/seo/jsonld";
import { createLocalizedHomepageJsonLd } from "../../../lib/seo/localized-homepage";
import { createSiteIdentityJsonLd } from "../../../lib/seo/structured-data";
import Companies from "../Companies";
import Experts from "../Experts";
import Footer from "../Footer";
import Hero from "../Hero";
import LiveStats from "../LiveStats";
import Navbar from "../Navbar";
import Opportunities from "../Opportunities";
import Services from "../Services";
import TopRatedShowcase from "../TopRatedShowcase";
import ResourcePreview from "./ResourcePreview";
import TrustStrip from "./TrustStrip";

export default async function Homepage({
  locale,
  localized,
}: {
  locale: Locale;
  localized: boolean;
}) {
  const [metadata, user] = await Promise.all([
    getTranslations({ locale, namespace: "rootMetadata" }),
    getCurrentUser(),
  ]);
  const year = new Date().getFullYear();
  const siteIdentityJsonLd = localized
    ? createLocalizedHomepageJsonLd({
        locale,
        siteName: metadata("siteName"),
        description: metadata("description"),
      })
    : createSiteIdentityJsonLd({
        siteName: metadata("siteName"),
        description: metadata("description"),
        language: locale,
      });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(siteIdentityJsonLd),
        }}
      />
      <Navbar isAuthenticated={user !== null} />
      <Hero locale={locale} localized={localized} />
      <TrustStrip />
      <LiveStats />
      <Services />
      <TopRatedShowcase locale={locale} localized={localized} />
      <ResourcePreview locale={locale} localized={localized} />
      <Experts locale={locale} localized={localized} />
      <Companies localized={localized} locale={locale} />
      <Opportunities locale={locale} localized={localized} />
      <Footer year={year} />
    </main>
  );
}
