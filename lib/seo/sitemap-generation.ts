import type { MetadataRoute } from "next";

import { contentRepository, helpCategories } from "../content";
import { locales } from "../locale";
import { prisma } from "../prisma";
import {
  getLocalizedCompaniesAlternates,
  getLocalizedCompaniesPath,
} from "./localized-companies";
import {
  getLocalizedExpertsAlternates,
  getLocalizedExpertsPath,
} from "./localized-experts";
import {
  getLocalizedHelpAlternates,
  getLocalizedHelpPath,
} from "./localized-help";
import {
  getHomepageLanguageAlternates,
  getLocalizedHomepagePath,
} from "./localized-homepage";
import {
  getLocalizedOpportunitiesAlternates,
  getLocalizedOpportunitiesPath,
} from "./localized-opportunities";
import {
  getLocalizedArticleAlternates,
  getLocalizedResourcesAlternates,
  getLocalizedResourcesPath,
} from "./localized-resources";
import { getLocalizedStaticPublicPageAlternates } from "./localized-static-pages";
import {
  getLocalizedStaticPublicPagePath,
  indexableLocalizedStaticPublicPages,
} from "./localized-static-pages-routing";
import {
  createSitemapDescriptors,
  ENTITY_CLUSTERS_PER_SHARD,
  getShardOffset,
  parseSitemapId,
  STATIC_PUBLIC_PATHS,
} from "./sitemap-shards";
import { getAbsoluteUrl } from "./urls";

async function getPublishedContentRecords() {
  return [...(await contentRepository.getAll({ status: "published" }))].sort(
    (left, right) => left.canonical.localeCompare(right.canonical),
  );
}

function getContentClusters(
  records: Awaited<ReturnType<typeof getPublishedContentRecords>>,
) {
  const clusters = new Map<string, typeof records>();
  for (const record of records) {
    const category = record.canonical.split("/")[2];
    const key = `${category}/${record.slug}`;
    clusters.set(key, [...(clusters.get(key) ?? []), record]);
  }
  return [...clusters.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

export async function generateSitemapDescriptors() {
  const [companies, experts, opportunities, contentRecords] =
    await Promise.all([
      prisma.company.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.expert.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.opportunity.count(),
      getPublishedContentRecords(),
    ]);

  return createSitemapDescriptors({
    companies,
    experts,
    opportunities,
    content: getContentClusters(contentRecords).length,
  });
}

function createStaticSitemap(): MetadataRoute.Sitemap {
  return [
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedHomepagePath(locale)),
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: { languages: getHomepageLanguageAlternates() },
    })),
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedCompaniesPath(locale)),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: { languages: getLocalizedCompaniesAlternates() },
    })),
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedExpertsPath(locale)),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: { languages: getLocalizedExpertsAlternates() },
    })),
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedOpportunitiesPath(locale)),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: { languages: getLocalizedOpportunitiesAlternates() },
    })),
    ...indexableLocalizedStaticPublicPages.flatMap((page) =>
      locales.map((locale) => ({
        url: getAbsoluteUrl(getLocalizedStaticPublicPagePath(locale, page)),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: getLocalizedStaticPublicPageAlternates(page),
        },
      })),
    ),
    ...[undefined, ...helpCategories].flatMap((category) =>
      locales.map((locale) => ({
        url: getAbsoluteUrl(getLocalizedHelpPath(locale, category)),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: getLocalizedHelpAlternates(category) },
      })),
    ),
    ...[
      undefined,
      ...STATIC_PUBLIC_PATHS.filter((pathname) =>
        pathname.startsWith("/resources/"),
      ).map((pathname) => pathname.split("/")[2]),
    ].flatMap((category) =>
      locales.map((locale) => ({
        url: getAbsoluteUrl(getLocalizedResourcesPath(locale, category)),
        changeFrequency: "monthly" as const,
        priority: category === undefined ? 0.7 : 0.6,
        alternates: {
          languages: getLocalizedResourcesAlternates(category),
        },
      })),
    ),
  ];
}

async function createCompaniesSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const companies = await prisma.company.findMany({
    where: { verificationStatus: "VERIFIED" },
    orderBy: { id: "asc" },
    skip: getShardOffset(page, ENTITY_CLUSTERS_PER_SHARD),
    take: ENTITY_CLUSTERS_PER_SHARD,
    select: { id: true, verifiedAt: true, createdAt: true },
  });

  return companies.flatMap((company) => {
    const lastModified = company.verifiedAt ?? company.createdAt;
    return locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedCompaniesPath(locale, company.id)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: getLocalizedCompaniesAlternates({ companyId: company.id }),
      },
    }));
  });
}

async function createExpertsSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const experts = await prisma.expert.findMany({
    where: { verificationStatus: "VERIFIED" },
    orderBy: { id: "asc" },
    skip: getShardOffset(page, ENTITY_CLUSTERS_PER_SHARD),
    take: ENTITY_CLUSTERS_PER_SHARD,
    select: { id: true, verifiedAt: true, createdAt: true },
  });

  return experts.flatMap((expert) => {
    const lastModified = expert.verifiedAt ?? expert.createdAt;
    return locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedExpertsPath(locale, expert.id)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: getLocalizedExpertsAlternates({ expertId: expert.id }),
      },
    }));
  });
}

async function createOpportunitiesSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { id: "asc" },
    skip: getShardOffset(page, ENTITY_CLUSTERS_PER_SHARD),
    take: ENTITY_CLUSTERS_PER_SHARD,
    select: { id: true },
  });

  return opportunities.flatMap((opportunity) =>
    locales.map((locale) => ({
      url: getAbsoluteUrl(
        getLocalizedOpportunitiesPath(locale, opportunity.id),
      ),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: getLocalizedOpportunitiesAlternates({
          opportunityId: opportunity.id,
        }),
      },
    })),
  );
}

async function createContentSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const records = await getPublishedContentRecords();
  const clusters = getContentClusters(records);
  const offset = getShardOffset(page, ENTITY_CLUSTERS_PER_SHARD);

  return clusters
    .slice(offset, offset + ENTITY_CLUSTERS_PER_SHARD)
    .flatMap(([key, translations]) => {
      const [category, slug] = key.split("/");
      const availableLocales = translations.map((record) => record.locale);
      return translations.map((record) => ({
        url: getAbsoluteUrl(
          getLocalizedResourcesPath(record.locale, category, slug),
        ),
        lastModified: new Date(record.updatedDate),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: getLocalizedArticleAlternates(
            category,
            slug,
            availableLocales,
          ),
        },
      }));
    });
}

export async function generateSitemap(
  id: string,
): Promise<MetadataRoute.Sitemap> {
  const parsedId = parseSitemapId(id);
  if (!parsedId) return [];

  switch (parsedId.family) {
    case "static":
      return parsedId.page === 0 ? createStaticSitemap() : [];
    case "companies":
      return createCompaniesSitemap(parsedId.page);
    case "experts":
      return createExpertsSitemap(parsedId.page);
    case "opportunities":
      return createOpportunitiesSitemap(parsedId.page);
    case "content":
      return createContentSitemap(parsedId.page);
  }
}

export function escapeSitemapXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function serializeSitemap(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) => {
    const alternates = Object.entries(
      entry.alternates?.languages ?? {},
    ).flatMap(([language, href]) =>
      href === undefined
        ? []
        : [
            `    <xhtml:link rel="alternate" hreflang="${escapeSitemapXml(language)}" href="${escapeSitemapXml(href)}" />`,
          ],
    );
    const lastModified = entry.lastModified
      ? `    <lastmod>${escapeSitemapXml(entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified)}</lastmod>`
      : null;
    const changeFrequency = entry.changeFrequency
      ? `    <changefreq>${entry.changeFrequency}</changefreq>`
      : null;
    const priority =
      entry.priority === undefined
        ? null
        : `    <priority>${entry.priority}</priority>`;

    return [
      "  <url>",
      `    <loc>${escapeSitemapXml(entry.url)}</loc>`,
      ...alternates,
      lastModified,
      changeFrequency,
      priority,
      "  </url>",
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
