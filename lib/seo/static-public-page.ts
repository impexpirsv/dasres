import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { createPublicPageMetadata } from "./metadata";

type StaticPublicPage =
  | "about"
  | "contact"
  | "pricing"
  | "help"
  | "faq"
  | "privacy"
  | "terms"
  | "cookies"
  | "resources";

export async function createStaticPublicPageMetadata(
  page: StaticPublicPage,
  canonical: `/${string}`,
  options?: { noindex?: boolean },
): Promise<Metadata> {
  const t = await getTranslations(`publicSite.pages.${page}`);

  return createPublicPageMetadata({
    title: t("metadata.title"),
    description: t("metadata.description"),
    canonical,
    robots: options?.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  });
}

export async function getStaticPublicPageIdentity(
  page: StaticPublicPage,
  canonicalPath: `/${string}`,
) {
  const [locale, common, pageTranslations] = await Promise.all([
    getLocale(),
    getTranslations("publicSite.common"),
    getTranslations(`publicSite.pages.${page}`),
  ]);

  return {
    canonicalPath,
    name: pageTranslations("title"),
    description: pageTranslations("metadata.description"),
    language: locale,
    breadcrumbs: [
      { name: common("home"), pathname: "/" },
      { name: pageTranslations("title"), pathname: canonicalPath },
    ],
  };
}
