import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { formatCountry } from "../../../lib/format";

import Navbar from "../../components/Navbar";
import DeleteOpportunityButton from "../../components/DeleteOpportunityButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
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

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const opportunityId = Number(id);

  const t = await getTranslations(
    "publicOpportunityProfile.metadata",
  );

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return {
      title: t("notFoundTitle"),
      description: t(
        "notFoundDescription",
      ),
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
    };
  }

  const opportunityDescription =
    opportunity.description || "";

  const title = `${opportunity.title} | Dasres`;

  const description =
    opportunityDescription.length > 160
      ? `${opportunityDescription.slice(
          0,
          157,
        )}...`
      : opportunityDescription ||
        t("notFoundDescription");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: opportunity.imageUrl
        ? [
            {
              url: opportunity.imageUrl,
              alt: opportunity.title,
            },
          ]
        : [
            {
              url: "/og-image.png",
              alt: opportunity.title,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: opportunity.imageUrl
        ? [opportunity.imageUrl]
        : ["/og-image.png"],
    },
  };
}

export default async function OpportunityProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const opportunityId = Number(id);

  const t = await getTranslations(
    "publicOpportunityProfile",
  );

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
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
      getCurrentUser(),

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

  const opportunitySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opportunity.title,
    description:
      opportunityDescription,
    image:
      opportunity.imageUrl ||
      "/og-image.png",
    author: {
      "@type": "Organization",
      name: "Dasres",
    },
    publisher: {
      "@type": "Organization",
      name: "Dasres",
      logo: {
        "@type": "ImageObject",
        url: "/og-image.png",
      },
    },
    about: {
      "@type": "Thing",
      name: getStatusLabel(
        opportunity.status,
      ),
    },
    contentLocation: {
      "@type": "Country",
      name: opportunity.country,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            opportunitySchema,
          ),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-20">
        <Link
          href="/opportunities"
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
                href="/companies"
                className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center transition hover:bg-slate-700"
              >
                {t(
                  "actions.findCompanies",
                )}
              </Link>

              <Link
                href="/experts"
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
                        href={`/companies/${company.id}`}
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
                        href={`/experts/${expert.id}`}
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