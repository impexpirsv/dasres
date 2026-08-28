import { NextResponse } from "next/server";

import {
  escapeSitemapXml,
  generateSitemapDescriptors,
} from "../../lib/seo/sitemap-generation";
import { getAbsoluteUrl } from "../../lib/seo/urls";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  const sitemaps = await generateSitemapDescriptors();
  const entries = sitemaps
    .map(({ id }) => `  <sitemap><loc>${escapeSitemapXml(getAbsoluteUrl(`/sitemaps/sitemap/${id}.xml`))}</loc></sitemap>`)
    .join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</sitemapindex>",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
