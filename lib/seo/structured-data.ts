import { getAbsoluteUrl, getPublicAbsoluteUrl, getSiteOrigin } from "./urls";

type BreadcrumbItem = {
  name: string;
  pathname: string;
};

type PageIdentity = {
  canonicalPath: string;
  name: string;
  description: string;
  language: string;
  breadcrumbs: BreadcrumbItem[];
};

function createBreadcrumbList(
  canonicalUrl: string,
  items: BreadcrumbItem[],
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.pathname),
    })),
  };
}

function createWebPage(
  page: PageIdentity,
  type: "CollectionPage" | "ProfilePage" | "WebPage",
  mainEntityId?: string,
) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);

  return {
    "@type": type,
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.name,
    description: page.description,
    inLanguage: page.language,
    isPartOf: {
      "@id": `${getSiteOrigin()}/#website`,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
    ...(mainEntityId
      ? {
          mainEntity: {
            "@id": mainEntityId,
          },
        }
      : {}),
  };
}

export function createSiteIdentityJsonLd({
  siteName,
  description,
  language,
}: {
  siteName: string;
  description: string;
  language: string;
}) {
  const origin = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: siteName,
        url: `${origin}/`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: `${origin}/`,
        name: siteName,
        description,
        inLanguage: language,
        publisher: {
          "@id": `${origin}/#organization`,
        },
      },
    ],
  };
}

export function createDirectoryPageJsonLd(page: PageIdentity) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      createWebPage(page, "CollectionPage"),
      createBreadcrumbList(canonicalUrl, page.breadcrumbs),
    ],
  };
}

export function createPublicPageJsonLd(page: PageIdentity) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      createWebPage(page, "WebPage"),
      createBreadcrumbList(canonicalUrl, page.breadcrumbs),
    ],
  };
}

export function createFaqPageJsonLd(page: PageIdentity, questions: readonly { question: string; answer: string }[]) {
  const base = createPublicPageJsonLd(page);
  return {
    ...base,
    "@graph": [
      ...base["@graph"],
      {
        "@type": "FAQPage",
        "@id": `${getAbsoluteUrl(page.canonicalPath)}#faq`,
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

export function createCompanyPageJsonLd({
  page,
  company,
}: {
  page: PageIdentity;
  company: {
    name: string;
    description: string;
    country: string;
    category: string;
    email: string;
    website: string;
    logoUrl: string | null;
  };
}) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);
  const entityId = `${canonicalUrl}#organization`;
  const logo = getPublicAbsoluteUrl(company.logoUrl);
  const website = getPublicAbsoluteUrl(company.website);

  return {
    "@context": "https://schema.org",
    "@graph": [
      createWebPage(page, "ProfilePage", entityId),
      createBreadcrumbList(canonicalUrl, page.breadcrumbs),
      {
        "@type": "Organization",
        "@id": entityId,
        name: company.name,
        description: company.description,
        url: canonicalUrl,
        industry: company.category,
        address: {
          "@type": "PostalAddress",
          addressCountry: company.country,
        },
        ...(company.email ? { email: company.email } : {}),
        ...(website ? { sameAs: [website] } : {}),
        ...(logo ? { logo } : {}),
      },
    ],
  };
}

export function createExpertPageJsonLd({
  page,
  expert,
}: {
  page: PageIdentity;
  expert: {
    name: string;
    specialty: string;
    country: string;
    email: string;
    imageUrl: string | null;
  };
}) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);
  const entityId = `${canonicalUrl}#person`;
  const image = getPublicAbsoluteUrl(expert.imageUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      createWebPage(page, "ProfilePage", entityId),
      createBreadcrumbList(canonicalUrl, page.breadcrumbs),
      {
        "@type": "Person",
        "@id": entityId,
        name: expert.name,
        url: canonicalUrl,
        jobTitle: expert.specialty,
        address: {
          "@type": "PostalAddress",
          addressCountry: expert.country,
        },
        ...(expert.email ? { email: expert.email } : {}),
        ...(image ? { image } : {}),
      },
    ],
  };
}

export function createOpportunityPageJsonLd({
  page,
  opportunity,
}: {
  page: PageIdentity;
  opportunity: {
    name: string;
    description: string;
    country: string;
    status: string;
    imageUrl: string | null;
  };
}) {
  const canonicalUrl = getAbsoluteUrl(page.canonicalPath);
  const entityId = `${canonicalUrl}#opportunity`;
  const image = getPublicAbsoluteUrl(opportunity.imageUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      createWebPage(page, "WebPage", entityId),
      createBreadcrumbList(canonicalUrl, page.breadcrumbs),
      {
        "@type": "Thing",
        "@id": entityId,
        name: opportunity.name,
        description: opportunity.description,
        url: canonicalUrl,
        spatialCoverage: {
          "@type": "Country",
          name: opportunity.country,
        },
        additionalProperty: {
          "@type": "PropertyValue",
          name: "status",
          value: opportunity.status,
        },
        ...(image ? { image } : {}),
      },
    ],
  };
}
