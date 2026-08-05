import type { ContentType } from "./types";

export const helpCategories = [
  "getting-started",
  "accounts-and-access",
  "cases-and-proposals",
  "projects-and-tasks",
  "companies-and-experts",
  "tickets-and-support",
] as const;

export type HelpCategory = (typeof helpCategories)[number];

export const helpEntries: Record<HelpCategory, readonly { key: string; href?: string }[]> = {
  "getting-started": [{ key: "register", href: "/register" }, { key: "signIn", href: "/login" }, { key: "language" }],
  "accounts-and-access": [{ key: "session", href: "/login" }, { key: "dashboard", href: "/dashboard" }, { key: "permissions" }],
  "cases-and-proposals": [{ key: "createCase", href: "/dashboard/cases/new" }, { key: "submitProposal", href: "/dashboard/open-cases" }, { key: "acceptProposal", href: "/dashboard/cases" }],
  "projects-and-tasks": [{ key: "projects", href: "/dashboard/projects" }, { key: "tasks", href: "/dashboard/my-tasks" }, { key: "documentsMessages", href: "/dashboard/projects" }],
  "companies-and-experts": [{ key: "profiles", href: "/companies" }, { key: "ownership", href: "/dashboard/my-companies" }, { key: "verification", href: "/dashboard/verifications" }],
  "tickets-and-support": [{ key: "createTicket", href: "/dashboard/tickets/new" }, { key: "reply", href: "/dashboard/tickets" }, { key: "closeReopen", href: "/dashboard/tickets" }],
};

export const knowledgeCategories = ["tutorials", "news", "customs", "countries", "glossary", "case-studies"] as const;
export type KnowledgeCategory = (typeof knowledgeCategories)[number];

export const knowledgeContentTypes: Record<KnowledgeCategory, ContentType> = {
  tutorials: "tutorial",
  news: "news",
  customs: "customs",
  countries: "country-guide",
  glossary: "glossary",
  "case-studies": "case-study",
};

export const contentTypeCategories: Record<ContentType, KnowledgeCategory> = {
  tutorial: "tutorials",
  news: "news",
  customs: "customs",
  "country-guide": "countries",
  glossary: "glossary",
  "case-study": "case-studies",
};

export function isHelpCategory(value: string): value is HelpCategory {
  return helpCategories.includes(value as HelpCategory);
}

export function isKnowledgeCategory(value: string): value is KnowledgeCategory {
  return knowledgeCategories.includes(value as KnowledgeCategory);
}

export function getContentType(category: KnowledgeCategory): ContentType {
  return knowledgeContentTypes[category];
}
