import { serializeJsonLd } from "../../../lib/seo/jsonld";
import { createPublicPageJsonLd } from "../../../lib/seo/structured-data";

type PageIdentity = Parameters<typeof createPublicPageJsonLd>[0];

export default function PublicPageJsonLd({ page }: { page: PageIdentity }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(createPublicPageJsonLd(page)),
      }}
    />
  );
}
