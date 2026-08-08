import type { Metadata } from "next";

import { createPublicPageMetadata } from "../seo/metadata";
import { getAbsoluteUrl, getPublicAbsoluteUrl, getSiteOrigin } from "../seo/urls";
import { contentTypeCategories } from "./catalog";
import type { ContentBreadcrumb, ContentRecord } from "./types";

export function createContentBreadcrumbs(record: ContentRecord, labels: { home: string; resources: string; category: string }, resourcesPath = "/resources"): readonly ContentBreadcrumb[] {
  const category = contentTypeCategories[record.category];
  return [
    { name: labels.home, pathname: resourcesPath === "/resources" ? "/" : resourcesPath.split("/resources")[0] || "/" },
    { name: labels.resources, pathname: resourcesPath },
    { name: labels.category, pathname: `${resourcesPath}/${category}` },
    { name: record.title, pathname: `${resourcesPath}/${category}/${record.slug}` },
  ];
}

export function createContentMetadata(record: ContentRecord, canonical = record.canonical): Metadata {
  const metadata = createPublicPageMetadata({
    title: record.seoTitle,
    description: record.seoDescription,
    canonical,
    ...(record.status !== "published" ? { robots: { index: false, follow: false } } : {}),
  });
  const image = getPublicAbsoluteUrl(record.coverImage);

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: record.publishDate ?? undefined,
      modifiedTime: record.updatedDate,
      authors: [record.author.name],
      tags: [...record.tags],
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function createContentStructuredData(record: ContentRecord, canonical = record.canonical, breadcrumbs?: readonly ContentBreadcrumb[]) {
  const url = getAbsoluteUrl(canonical);
  const image = getPublicAbsoluteUrl(record.coverImage);

  if (breadcrumbs) {
    const articleId = `${url}#article`;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: record.title,
          description: record.summary,
          inLanguage: record.locale,
          isPartOf: { "@id": `${new URL(url).origin}/#website` },
          breadcrumb: { "@id": `${url}#breadcrumb` },
          mainEntity: { "@id": articleId },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: getAbsoluteUrl(item.pathname),
          })),
        },
        createArticleJsonLd(record, url, image),
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    ...createArticleJsonLd(record, url, image),
  };
}

function createArticleJsonLd(record: ContentRecord, url: string, image: string | null) {
  const citations = [...record.primarySources, ...record.references].map(
    (source) => ({
      "@type": "CreativeWork",
      name: source.title,
      url: source.url,
      ...(source.publisher
        ? {
            publisher: {
              "@type": "Organization",
              name: source.publisher,
            },
          }
        : {}),
    }),
  );

  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: record.title,
    description: record.summary,
    url,
    inLanguage: record.locale,
    datePublished: record.publishDate ?? undefined,
    dateModified: record.updatedDate,
    author: { "@type": "Person", name: record.author.name },
    publisher: { "@id": `${getSiteOrigin()}/#organization` },
    ...(record.reviewer.length > 0 ? { reviewedBy: record.reviewer.map((person) => ({ "@type": "Person", name: person.name })) } : {}),
    ...(citations.length > 0 ? { citation: citations } : {}),
    ...(image ? { image } : {}),
    ...(record.jurisdiction.length > 0 ? { spatialCoverage: record.jurisdiction.map((name) => ({ "@type": "Place", name })) } : {}),
  };
}
