import assert from "node:assert/strict";

import { locales } from "../lib/locale";
import {
  createSitemapDescriptors,
  ENTITY_CLUSTERS_PER_SHARD,
  getShardOffset,
  getSitemapShardCount,
  LOCALIZED_ENTITY_URLS_PER_CLUSTER,
  parseSitemapId,
  SIMPLE_URLS_PER_SHARD,
  SITEMAP_PROTOCOL_URL_LIMIT,
  SITEMAP_TARGET_URL_LIMIT,
  STATIC_PUBLIC_PATHS,
} from "../lib/seo/sitemap-shards";

const maximumLocalizedEntityEntries =
  ENTITY_CLUSTERS_PER_SHARD * LOCALIZED_ENTITY_URLS_PER_CLUSTER;

assert.equal(locales.length, 12);
assert.equal(LOCALIZED_ENTITY_URLS_PER_CLUSTER, 1 + locales.length);
assert.equal(ENTITY_CLUSTERS_PER_SHARD, 3_076);
assert.equal(maximumLocalizedEntityEntries, 39_988);
assert.ok(maximumLocalizedEntityEntries <= SITEMAP_TARGET_URL_LIMIT);
assert.ok(SITEMAP_TARGET_URL_LIMIT < SITEMAP_PROTOCOL_URL_LIMIT);
assert.ok(
  (ENTITY_CLUSTERS_PER_SHARD + 1) *
    LOCALIZED_ENTITY_URLS_PER_CLUSTER >
    SITEMAP_TARGET_URL_LIMIT,
);
assert.equal(SIMPLE_URLS_PER_SHARD, SITEMAP_TARGET_URL_LIMIT);

assert.equal(getSitemapShardCount(0, ENTITY_CLUSTERS_PER_SHARD), 0);
assert.equal(getSitemapShardCount(1, ENTITY_CLUSTERS_PER_SHARD), 1);
assert.equal(
  getSitemapShardCount(
    ENTITY_CLUSTERS_PER_SHARD,
    ENTITY_CLUSTERS_PER_SHARD,
  ),
  1,
);
assert.equal(
  getSitemapShardCount(
    ENTITY_CLUSTERS_PER_SHARD + 1,
    ENTITY_CLUSTERS_PER_SHARD,
  ),
  2,
);
assert.equal(getShardOffset(2, ENTITY_CLUSTERS_PER_SHARD), 6_152);

const descriptors = createSitemapDescriptors({
  companies: ENTITY_CLUSTERS_PER_SHARD + 1,
  experts: 0,
  opportunities: SIMPLE_URLS_PER_SHARD + 1,
  content: 0,
});

assert.deepEqual(
  descriptors.map(({ id }) => id),
  [
    "static-0",
    "companies-0",
    "companies-1",
    "opportunities-0",
    "opportunities-1",
  ],
);
assert.ok(!descriptors.some(({ id }) => id.startsWith("experts-")));
assert.ok(!descriptors.some(({ id }) => id.startsWith("content-")));

const contentDescriptors = createSitemapDescriptors({
  companies: 0,
  experts: 0,
  opportunities: 0,
  content: SIMPLE_URLS_PER_SHARD + 1,
});
assert.deepEqual(
  contentDescriptors.map(({ id }) => id),
  ["static-0", "content-0", "content-1"],
);
assert.deepEqual(parseSitemapId("companies-12"), {
  family: "companies",
  page: 12,
});
assert.equal(parseSitemapId("companies-01"), null);
assert.equal(parseSitemapId("unknown-0"), null);

const maximumStaticEntries =
  1 + locales.length + 1 + locales.length + 2 + STATIC_PUBLIC_PATHS.length;
assert.ok(maximumStaticEntries <= SITEMAP_TARGET_URL_LIMIT);

console.log(
  `Sitemap shard assertions passed: ${ENTITY_CLUSTERS_PER_SHARD} localized entity clusters, ${maximumLocalizedEntityEntries} maximum localized entity URLs, ${SITEMAP_TARGET_URL_LIMIT} simple/static URL target.`,
);
