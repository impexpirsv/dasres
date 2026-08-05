import { calculateReadingTime } from "../../lib/content/reading-time";
import type { ContentRecord, ContentSource, ContentType } from "../../lib/content/types";

const PUBLISHED_AT = "2026-08-03T12:00:00.000Z";
const REVIEW_AT = "2027-02-03T12:00:00.000Z";
const editor = { id: "dasres-editorial", name: "Dasres Editorial Team" } as const;
const reviewer = { id: "dasres-content-review", name: "Dasres Content Review" } as const;

type ContentInput = Pick<ContentRecord, "id" | "slug" | "category" | "title" | "summary" | "body" | "excerpt" | "tags" | "seoTitle" | "seoDescription" | "relatedArticles"> & {
  primarySources?: readonly ContentSource[];
};

function categoryPath(category: ContentType): string {
  if (category === "country-guide") return "countries";
  if (category === "case-study") return "case-studies";
  return category === "tutorial" ? "tutorials" : category;
}

export function createPublishedContent(input: ContentInput): ContentRecord {
  return {
    ...input,
    locale: "en",
    status: "published",
    publishDate: PUBLISHED_AT,
    updatedDate: PUBLISHED_AT,
    reviewDate: REVIEW_AT,
    author: editor,
    reviewer: [reviewer],
    jurisdiction: [],
    coverImage: null,
    canonical: `/resources/${categoryPath(input.category)}/${input.slug}`,
    readingTime: calculateReadingTime(input.body),
    primarySources: input.primarySources ?? [],
    references: [],
    revision: { current: 1, history: [{ revision: 1, status: "published", date: PUBLISHED_AT, editor, note: "Initial editorial publication." }] },
  };
}

export const ICC_INCOTERMS_SOURCE: ContentSource = {
  title: "Incoterms® 2020",
  url: "https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/",
  publisher: "International Chamber of Commerce",
  accessedDate: PUBLISHED_AT,
};

export const WCO_HS_SOURCE: ContentSource = {
  title: "What is the Harmonized System (HS)?",
  url: "https://www.wcoomd.org/en/topics/nomenclature/overview/what-is-the-harmonized-system.aspx?p=1",
  publisher: "World Customs Organization",
  accessedDate: PUBLISHED_AT,
};

export const UNECE_TRADE_DOCUMENTS_SOURCE: ContentSource = {
  title: "Trade Facilitation Recommendations",
  url: "https://unece.org/trade/uncefact/tf_recommendations",
  publisher: "United Nations Economic Commission for Europe",
  accessedDate: PUBLISHED_AT,
};
