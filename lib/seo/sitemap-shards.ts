export const SITEMAP_PROTOCOL_URL_LIMIT = 50_000;
export const SITEMAP_TARGET_URL_LIMIT = 40_000;
export const LOCALIZED_ENTITY_URLS_PER_CLUSTER = 12;
export const ENTITY_CLUSTERS_PER_SHARD = Math.floor(
  SITEMAP_TARGET_URL_LIMIT / LOCALIZED_ENTITY_URLS_PER_CLUSTER,
);
export const SIMPLE_URLS_PER_SHARD = SITEMAP_TARGET_URL_LIMIT;

export const STATIC_PUBLIC_PATHS = [
  "/about",
  "/contact",
  "/pricing",
  "/help",
  "/faq",
  "/resources",
  "/help/getting-started",
  "/help/accounts-and-access",
  "/help/cases-and-proposals",
  "/help/projects-and-tasks",
  "/help/companies-and-experts",
  "/help/tickets-and-support",
  "/resources/tutorials",
  "/resources/news",
  "/resources/customs",
  "/resources/countries",
  "/resources/glossary",
  "/resources/case-studies",
] as const;

export type SitemapFamily =
  | "static"
  | "companies"
  | "experts"
  | "opportunities"
  | "content";

export type SitemapDescriptor = {
  id: string;
};

export type ParsedSitemapId = {
  family: SitemapFamily;
  page: number;
};

export function getSitemapShardCount(
  itemCount: number,
  itemsPerShard: number,
): number {
  if (!Number.isSafeInteger(itemCount) || itemCount < 0) {
    throw new RangeError("Sitemap item count must be a non-negative integer.");
  }

  if (!Number.isSafeInteger(itemsPerShard) || itemsPerShard <= 0) {
    throw new RangeError("Sitemap shard capacity must be a positive integer.");
  }

  return Math.ceil(itemCount / itemsPerShard);
}

function createFamilyDescriptors(
  family: Exclude<SitemapFamily, "static">,
  itemCount: number,
  itemsPerShard: number,
): SitemapDescriptor[] {
  return Array.from(
    { length: getSitemapShardCount(itemCount, itemsPerShard) },
    (_, page) => ({ id: `${family}-${page}` }),
  );
}

export function createSitemapDescriptors({
  companies,
  experts,
  opportunities,
  content,
}: {
  companies: number;
  experts: number;
  opportunities: number;
  content: number;
}): SitemapDescriptor[] {
  return [
    { id: "static-0" },
    ...createFamilyDescriptors(
      "companies",
      companies,
      ENTITY_CLUSTERS_PER_SHARD,
    ),
    ...createFamilyDescriptors(
      "experts",
      experts,
      ENTITY_CLUSTERS_PER_SHARD,
    ),
    ...createFamilyDescriptors(
      "opportunities",
      opportunities,
      ENTITY_CLUSTERS_PER_SHARD,
    ),
    ...createFamilyDescriptors(
      "content",
      content,
      ENTITY_CLUSTERS_PER_SHARD,
    ),
  ];
}

export function parseSitemapId(id: string): ParsedSitemapId | null {
  const match = /^(static|companies|experts|opportunities|content)-(0|[1-9]\d*)$/.exec(
    id,
  );

  if (!match) return null;

  const family = match[1] as SitemapFamily;
  const page = Number(match[2]);

  return Number.isSafeInteger(page) ? { family, page } : null;
}

export function getShardOffset(
  page: number,
  itemsPerShard: number,
): number {
  const offset = page * itemsPerShard;

  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError("Sitemap shard offset exceeds the safe integer range.");
  }

  return offset;
}
