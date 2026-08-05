import type { Locale } from "../locale";

export const contentStatuses = ["draft", "published", "archived", "superseded"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const contentTypes = ["tutorial", "news", "customs", "country-guide", "glossary", "case-study"] as const;
export type ContentType = (typeof contentTypes)[number];

export type ContentContributor = {
  id: string;
  name: string;
};

export type ContentSource = {
  title: string;
  url: string;
  publisher: string | null;
  accessedDate: string;
};

export type ContentRevisionEntry = {
  revision: number;
  status: ContentStatus;
  date: string;
  editor: ContentContributor;
  note: string;
};

export type ContentRevision = {
  current: number;
  history: readonly ContentRevisionEntry[];
};

export type ContentRecord = {
  id: string;
  slug: string;
  locale: Locale;
  category: ContentType;
  title: string;
  summary: string;
  body: string;
  excerpt: string;
  status: ContentStatus;
  publishDate: string | null;
  updatedDate: string;
  reviewDate: string | null;
  author: ContentContributor;
  reviewer: readonly ContentContributor[];
  jurisdiction: readonly string[];
  tags: readonly string[];
  coverImage: string | null;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  readingTime: number;
  relatedArticles: readonly string[];
  primarySources: readonly ContentSource[];
  references: readonly ContentSource[];
  revision: ContentRevision;
};

export type ContentQuery = {
  locale?: Locale;
  status?: ContentStatus;
};

export type ContentSearchQuery = ContentQuery & {
  query: string;
  category?: ContentType;
  limit?: number;
};

export type ContentBreadcrumb = {
  name: string;
  pathname: string;
};
