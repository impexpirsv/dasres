import { NextResponse } from "next/server";

import {
  generateSitemap,
  serializeSitemap,
} from "../../../../lib/seo/sitemap-generation";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<unknown> },
): Promise<NextResponse> {
  const routeParams = await params;
  const id =
    typeof routeParams === "object" &&
    routeParams !== null &&
    "id" in routeParams &&
    typeof routeParams.id === "string"
      ? routeParams.id
      : "";
  const xml = serializeSitemap(await generateSitemap(id));

  return new NextResponse(xml, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
