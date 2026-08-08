import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { formatCountry } from "../../../lib/format";
import { serializeJsonLd } from "../../../lib/seo/jsonld";
import {
  getDefaultSocialImage,
  getEntitySocialImage,
  getOpenGraphLocale,
} from "../../../lib/seo/social";
import { createOpportunityPageJsonLd } from "../../../lib/seo/structured-data";
import { getAbsoluteUrl } from "../../../lib/seo/urls";
import { defaultLocale, isLocale, type Locale } from "../../../lib/locale";
import {
  getAlternateOpenGraphLocales,
  openGraphLocaleMap,
} from "../../../lib/seo/localized-homepage";
import { getLocalizedOpportunitiesAlternates } from "../../../lib/seo/localized-opportunities";

import Navbar from "../../components/Navbar";
import DeleteOpportunityButton from "../../components/DeleteOpportunityButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
  routeLocale?: Locale;
  localized?: boolean;
};

function normalizeStatus(status: string) {
  return status
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getStatusClass(status: string) {
  const normalizedStatus =
    normalizeStatus(status);

  switch (normalizedStatus) {
    case "OPEN":
      return "bg-emerald-600 text-white";

    case "IN_PROGRESS":
      return "bg-yellow-600 text-black";

    case "CLOSED":
      return "bg-red-600 text-white";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

const getOpportunityMetadata =
  unstable_cache(
    async (opportunityId: number) => {
      return prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
        },
      });
    },
    ["public-opportunity-metadata"],
    {
      revalidate: 300,
      tags: ["public-opportunities"],
    },
  );

const getRelatedCompanies =
  unstable_cache(
    async (country: string) => {
      return prisma.company.findMany({
        where: {
          verificationStatus: "VERIFIED",
          country,
        },
        select: {
          id: true,
          name: true,
          category: true,
        },
        take: 3,
        orderBy: [
          {
            verifiedAt: "desc",
          },
          {
            id: "desc",
          },
        ],
      });
    },
    ["public-opportunity-related-companies"],
    {
      revalidate: 300,
      tags: ["public-companies"],
    },
  );

const getRelatedExperts =
  unstable_cache(
    async (country: string) => {
      return prisma.expert.findMany({
        where: {
          verificationStatus: "VERIFIED",
          country,
        },
        select: {
          id: true,
          name: true,
          specialty: true,
        },
        take: 3,
        orderBy: [
          {
            verifiedAt: "desc",
          },
          {
            id: "desc",
          },
        ],
      });
    },
    ["public-opportunity-related-experts"],
    {
      revalidate: 300,
      tags: ["public-experts"],
    },
  );

export async function createOpportunityMetadata({
  params,
  routeLocale,
  localized = false,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const opportunityId = Number(id);

  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [t, rootMetadata] = await Promise.all([
    getTranslations({ locale, namespace: "publicOpportunityProfile.metadata" }),
    getTranslations({ locale, namespace: "rootMetadata" }),
  ]);

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return {
      title: t("notFoundTitle"),
      description: t(
        "notFoundDescription",
      ),
      alternates: {
        canonical: null,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const opportunity =
    await getOpportunityMetadata(
      opportunityId,
    );

  if (!opportunity) {
    return {
      title: t("notFoundTitle"),
      description: t(
        "notFoundDescription",
      ),
      alternates: {
        canonical: null,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const opportunityDescription =
    opportunity.description || "";

  const title = opportunity.title;

  const description =
    opportunityDescription.length > 160
      ? `${opportunityDescription.slice(
          0,
          157,
        )}...`
      : opportunityDescription ||
        t("notFoundDescription");
  const canonicalPath = localized
    ? `/${locale}/opportunities/${opportunity.id}`
    : `/opportunities/${opportunity.id}`;
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const socialImage =
    getEntitySocialImage(
      opportunity.imageUrl,
      opportunity.title,
    ) ??
    getDefaultSocialImage(rootMetadata("openGraph.imageAlt"));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      ...(localized
        ? {
            languages: getLocalizedOpportunitiesAlternates({
              opportunityId: opportunity.id,
            }),
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: getOpenGraphLocale(locale),
      ...(localized
        ? {
            locale: openGraphLocaleMap[locale],
            alternateLocale: getAlternateOpenGraphLocales(locale),
          }
        : {}),
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export const generateMetadata = createOpportunityMetadata;

export default async function OpportunityProfilePage({
  params,
  routeLocale,
  localized = false,
}: Props) {
  const { id } = await params;

  const opportunityId = Number(id);

  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const opportunitiesPath = localized
    ? `/${locale}/opportunities`
    : "/opportunities";

  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "publicOpportunityProfile" }),
    getTranslations({ locale, namespace: "navbar" }),
  ]);

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    if (localized) notFound();

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h1 className="text-4xl font-bold">
          {t("notFound")}
        </h1>
      </div>
    );
  }

  const [user, opportunity] =
    await Promise.all([
      localized ? Promise.resolve(null) : getCurrentUser(),

      prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          country: true,
          imageUrl: true,
        },
      }),
    ]);

  const isAdmin =
    user?.role === "admin";

  if (!opportunity) {
    if (localized) notFound();

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h1 className="text-4xl font-bold">
          {t("notFound")}
        </h1>
      </div>
    );
  }

  const opportunityDescription =
    opportunity.description || "";

  const [
    relatedCompanies,
    relatedExperts,
  ] = await Promise.all([
    getRelatedCompanies(
      opportunity.country,
    ),
    getRelatedExperts(
      opportunity.country,
    ),
  ]);

  function getStatusLabel(
    status: string,
  ) {
    const normalizedStatus =
      normalizeStatus(status);

    switch (normalizedStatus) {
      case "OPEN":
        return t("statuses.open");

      case "IN_PROGRESS":
        return t(
          "statuses.inProgress",
        );

      case "CLOSED":
        return t("statuses.closed");

      default:
        return status;
    }
  }

  const opportunitySchema =
    createOpportunityPageJsonLd({
      page: {
        canonicalPath: `${opportunitiesPath}/${opportunity.id}`,
        name: opportunity.title,
        description: opportunityDescription,
        language: locale,
        breadcrumbs: [
          {
            name: navigation("home"),
            pathname: localized ? `/${locale}` : "/",
          },
          {
            name: navigation("opportunities"),
            pathname: opportunitiesPath,
          },
          {
            name: opportunity.title,
            pathname: `${opportunitiesPath}/${opportunity.id}`,
          },
        ],
      },
      opportunity: {
        name: opportunity.title,
        description: opportunityDescription,
        country: opportunity.country,
        status: opportunity.status,
        imageUrl: opportunity.imageUrl,
      },
    });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar isAuthenticated={user !== null} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            opportunitySchema,
          ),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-20">
        <Link
          href={opportunitiesPath}
          className="mb-8 inline-block text-blue-400 hover:underline"
        >
          {t("backToOpportunities")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 lg:col-span-2">
            {opportunity.imageUrl ? (
              <div className="relative h-96 w-full">
                <Image
                  src={
                    opportunity.imageUrl
                  }
                  alt={
                    opportunity.title
                  }
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center bg-slate-800 text-7xl">
                🌍
              </div>
            )}

            <div className="p-10">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-4 py-2 text-sm ${getStatusClass(
                    opportunity.status,
                  )}`}
                >
                  {getStatusLabel(
                    opportunity.status,
                  )}
                </span>

                <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-400">
                  {formatCountry(
                    opportunity.country,
                  )}
                </span>

                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {t(
                    "tradeOpportunity",
                  )}
                </span>
              </div>

              <h1 className="mb-6 text-5xl font-black leading-tight md:text-6xl">
                {opportunity.title}
              </h1>

              <div className="mb-10 grid grid-cols-2 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t("metrics.status")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {getStatusLabel(
                      opportunity.status,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t(
                      "metrics.country",
                    )}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-400">
                    {formatCountry(
                      opportunity.country,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t(
                      "metrics.visibility",
                    )}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-yellow-400">
                    {t("values.public")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t(
                      "metrics.platform",
                    )}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-cyan-400">
                    Dasres
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t(
                      "metrics.category",
                    )}
                  </p>

                  <p className="mt-2 text-xl font-bold text-purple-400">
                    {t("values.trade")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    {t("metrics.trust")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {t(
                      "values.verified",
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-8">
                <h2 className="mb-4 text-2xl font-bold">
                  {t(
                    "opportunityDescription",
                  )}
                </h2>

                <p className="whitespace-pre-wrap text-lg leading-8 text-slate-300">
                  {
                    opportunityDescription
                  }
                </p>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-8">
                <h2 className="mb-4 text-2xl font-bold">
                  {t(
                    "howToRespond.title",
                  )}
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="mb-2 font-bold text-blue-400">
                      {t(
                        "howToRespond.review.title",
                      )}
                    </p>

                    <p className="text-slate-400">
                      {t(
                        "howToRespond.review.description",
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="mb-2 font-bold text-blue-400">
                      {t(
                        "howToRespond.contact.title",
                      )}
                    </p>

                    <p className="text-slate-400">
                      {t(
                        "howToRespond.contact.description",
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="mb-2 font-bold text-blue-400">
                      {t(
                        "howToRespond.collaborate.title",
                      )}
                    </p>

                    <p className="text-slate-400">
                      {t(
                        "howToRespond.collaborate.description",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-8">
                  <Link
                    href={`/dashboard/opportunities/${opportunity.id}/edit`}
                    className="rounded-xl bg-blue-600 px-6 py-3 transition hover:bg-blue-700"
                  >
                    {t(
                      "editOpportunity",
                    )}
                  </Link>

                  <DeleteOpportunityButton
                    id={opportunity.id}
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">
                {t("summary.title")}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {t(
                      "summary.country",
                    )}
                  </p>

                  <p className="text-slate-200">
                    {formatCountry(
                      opportunity.country,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t(
                      "summary.status",
                    )}
                  </p>

                  <p className="text-slate-200">
                    {getStatusLabel(
                      opportunity.status,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("summary.type")}
                  </p>

                  <p className="text-slate-200">
                    {t(
                      "tradeOpportunity",
                    )}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/cases/new"
                className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
              >
                {t(
                  "actions.openTradeCase",
                )}
              </Link>

              <Link
                href={localized ? `/${locale}/companies` : "/companies"}
                className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center transition hover:bg-slate-700"
              >
                {t(
                  "actions.findCompanies",
                )}
              </Link>

              <Link
                href={localized ? `/${locale}/experts` : "/experts"}
                className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center transition hover:bg-slate-700"
              >
                {t(
                  "actions.findExperts",
                )}
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t(
                  "relatedCompanies.title",
                )}
              </h2>

              {relatedCompanies.length ===
              0 ? (
                <p className="text-slate-500">
                  {t(
                    "relatedCompanies.empty",
                  )}
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedCompanies.map(
                    (company) => (
                      <Link
                        key={company.id}
                        href={localized
                          ? `/${locale}/companies/${company.id}`
                          : `/companies/${company.id}`}
                        className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500"
                      >
                        <p className="font-semibold">
                          {company.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {
                            company.category
                          }
                        </p>

                        <p className="mt-2 text-xs text-emerald-400">
                          ✓{" "}
                          {t(
                            "relatedCompanies.verified",
                          )}
                        </p>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t(
                  "relatedExperts.title",
                )}
              </h2>

              {relatedExperts.length ===
              0 ? (
                <p className="text-slate-500">
                  {t(
                    "relatedExperts.empty",
                  )}
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedExperts.map(
                    (expert) => (
                      <Link
                        key={expert.id}
                        href={localized
                          ? `/${locale}/experts/${expert.id}`
                          : `/experts/${expert.id}`}
                        className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500"
                      >
                        <p className="font-semibold">
                          {expert.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {
                            expert.specialty
                          }
                        </p>

                        <p className="mt-2 text-xs text-emerald-400">
                          ✓{" "}
                          {t(
                            "relatedExperts.verified",
                          )}
                        </p>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t(
                  "trustNotice.title",
                )}
              </h2>

              <p className="leading-7 text-slate-400">
                {t(
                  "trustNotice.description",
                )}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
