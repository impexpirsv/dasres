import type { MetadataRoute } from "next";

import { contentRepository } from "../../lib/content";
import { locales } from "../../lib/locale";
import { prisma } from "../../lib/prisma";
import {
  getHomepageLanguageAlternates,
  getLocalizedHomepagePath,
} from "../../lib/seo/localized-homepage";
import {
  getLocalizedCompaniesAlternates,
  getLocalizedCompaniesPath,
} from "../../lib/seo/localized-companies";
import {
  createSitemapDescriptors,
  ENTITY_CLUSTERS_PER_SHARD,
  getShardOffset,
  parseSitemapId,
  SIMPLE_URLS_PER_SHARD,
  STATIC_PUBLIC_PATHS,
} from "../../lib/seo/sitemap-shards";
import { getAbsoluteUrl } from "../../lib/seo/urls";

export const revalidate = 300;

async function getPublishedContentRecords() {
  return [...await contentRepository.getAll({ status: "published" })]
    .sort((left, right) =>
      left.canonical < right.canonical
        ? -1
        : left.canonical > right.canonical
          ? 1
          : 0,
    );
}

export async function generateSitemaps() {
  const [companies, experts, opportunities, contentRecords] =
    await Promise.all([
      prisma.company.count({
        where: { verificationStatus: "VERIFIED" },
      }),
      prisma.expert.count({
        where: { verificationStatus: "VERIFIED" },
      }),
      prisma.opportunity.count(),
      getPublishedContentRecords(),
    ]);

  return createSitemapDescriptors({
    companies,
    experts,
    opportunities,
    content: contentRecords.length,
  });
}

function createStaticSitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getAbsoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedHomepagePath(locale)),
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: {
        languages: getHomepageLanguageAlternates(),
      },
    })),
    {
      url: getAbsoluteUrl("/companies"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedCompaniesPath(locale)),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: getLocalizedCompaniesAlternates(),
      },
    })),
    {
      url: getAbsoluteUrl("/experts"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/opportunities"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...STATIC_PUBLIC_PATHS.map((pathname) => ({
      url: getAbsoluteUrl(pathname),
      changeFrequency: "monthly" as const,
      priority: pathname === "/resources" ? 0.7 : 0.6,
    })),
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
    select: {
      id: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  return companies.flatMap((company) => {
    const lastModified = company.verifiedAt ?? company.createdAt;

    return [
      {
        url: getAbsoluteUrl(`/companies/${company.id}`),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      ...locales.map((locale) => ({
        url: getAbsoluteUrl(getLocalizedCompaniesPath(locale, company.id)),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: {
          languages: getLocalizedCompaniesAlternates({
            companyId: company.id,
          }),
        },
      })),
    ];
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
    select: {
      id: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  return experts.map((expert) => ({
    url: getAbsoluteUrl(`/experts/${expert.id}`),
    lastModified: expert.verifiedAt ?? expert.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

async function createOpportunitiesSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { id: "asc" },
    skip: getShardOffset(page, SIMPLE_URLS_PER_SHARD),
    take: SIMPLE_URLS_PER_SHARD,
    select: { id: true },
  });

  return opportunities.map((opportunity) => ({
    url: getAbsoluteUrl(`/opportunities/${opportunity.id}`),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

async function createContentSitemap(
  page: number,
): Promise<MetadataRoute.Sitemap> {
  const records = await getPublishedContentRecords();
  const offset = getShardOffset(page, SIMPLE_URLS_PER_SHARD);

  return records
    .slice(offset, offset + SIMPLE_URLS_PER_SHARD)
    .map((record) => ({
      url: getAbsoluteUrl(record.canonical),
      lastModified: new Date(record.updatedDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const parsedId = parseSitemapId(await id);

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
