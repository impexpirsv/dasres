import type { Metadata } from "next";

import { createPublicPageMetadata } from "../seo/metadata";
import { getAbsoluteUrl, getPublicAbsoluteUrl } from "../seo/urls";
import type { ContentBreadcrumb, ContentRecord } from "./types";

export function createContentBreadcrumbs(record: ContentRecord, labels: { home: string; resources: string; category: string }): readonly ContentBreadcrumb[] {
  return [
    { name: labels.home, pathname: "/" },
    { name: labels.resources, pathname: "/resources" },
    { name: labels.category, pathname: `/resources/${record.category === "country-guide" ? "countries" : record.category === "case-study" ? "case-studies" : record.category}` },
    { name: record.title, pathname: record.canonical },
  ];
}

export function createContentMetadata(record: ContentRecord): Metadata {
  const metadata = createPublicPageMetadata({
    title: record.seoTitle,
    description: record.seoDescription,
    canonical: record.canonical,
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

export function createContentStructuredData(record: ContentRecord) {
  const url = getAbsoluteUrl(record.canonical);
  const image = getPublicAbsoluteUrl(record.coverImage);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: record.title,
    description: record.summary,
    url,
    inLanguage: record.locale,
    datePublished: record.publishDate ?? undefined,
    dateModified: record.updatedDate,
    author: { "@type": "Person", name: record.author.name },
    ...(record.reviewer.length > 0 ? { reviewedBy: record.reviewer.map((person) => ({ "@type": "Person", name: person.name })) } : {}),
    ...(image ? { image } : {}),
    ...(record.jurisdiction.length > 0 ? { spatialCoverage: record.jurisdiction.map((name) => ({ "@type": "Place", name })) } : {}),
  };
}
