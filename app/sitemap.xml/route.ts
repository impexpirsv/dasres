import { NextResponse } from "next/server";

import { getAbsoluteUrl } from "../../lib/seo/urls";
import { generateSitemaps } from "../sitemaps/sitemap";

export const revalidate = 300;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<NextResponse> {
  const sitemaps = await generateSitemaps();
  const entries = sitemaps
    .map(({ id }) => `  <sitemap><loc>${escapeXml(getAbsoluteUrl(`/sitemaps/sitemap/${id}.xml`))}</loc></sitemap>`)
    .join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</sitemapindex>",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
