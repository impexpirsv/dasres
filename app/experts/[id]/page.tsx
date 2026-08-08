import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { prisma } from "../../../lib/prisma";
import { calculateTrustScore } from "../../../lib/ranking";
import { requireUser } from "../../../lib/auth";
import { serializeJsonLd } from "../../../lib/seo/jsonld";
import {
  getDefaultSocialImage,
  getEntitySocialImage,
  getOpenGraphLocale,
} from "../../../lib/seo/social";
import { createExpertPageJsonLd } from "../../../lib/seo/structured-data";
import { getAbsoluteUrl } from "../../../lib/seo/urls";
import { getExpert, getExpertViewAccess } from "../../../lib/experts/get-expert";
import { AppError } from "../../../lib/errors";
import { defaultLocale, isLocale, type Locale } from "../../../lib/locale";
import { getAlternateOpenGraphLocales, openGraphLocaleMap } from "../../../lib/seo/localized-homepage";
import { getLocalizedExpertsAlternates } from "../../../lib/seo/localized-experts";

import DeleteExpertButton from "../../components/DeleteExpertButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
  routeLocale?: Locale;
  localized?: boolean;
};

function getPremiumBorder(planType: string) {
  if (planType === "GOLD") {
    return "border-yellow-500 shadow-lg shadow-yellow-500/10";
  }

  if (planType === "DIAMOND") {
    return "border-cyan-500 shadow-lg shadow-cyan-500/10";
  }

  if (planType === "ENTERPRISE") {
    return "border-purple-500 shadow-lg shadow-purple-500/10";
  }

  return "border-slate-800";
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function getStatusClass(status: string) {
  const normalized = status
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  switch (normalized) {
    case "ACTIVE":
    case "VERIFIED":
      return "bg-emerald-600 text-white";

    case "PENDING":
      return "bg-yellow-600 text-black";

    case "REJECTED":
    case "SUSPENDED":
      return "bg-red-600 text-white";

    case "INACTIVE":
      return "bg-slate-700 text-slate-200";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

const getExpertMetadata = unstable_cache(
  async (expertId: number) => {
    try {
      return await getExpert({ expertId, viewer: null });
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    }
  },
  ["public-expert-metadata"],
  {
    revalidate: 300,
    tags: ["public-experts"],
  },
);

const getRelatedCompanies = unstable_cache(
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
        country: true,
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
  ["public-expert-related-companies"],
  {
    revalidate: 300,
    tags: ["public-companies"],
  },
);

export async function createExpertMetadata({
  params,
  routeLocale,
  localized = false,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const expertId = Number(id);
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  const [t, rootMetadata] = await Promise.all([
    getTranslations({ locale, namespace: "publicExpertProfile.metadata" }),
    getTranslations({ locale, namespace: "rootMetadata" }),
  ]);

  if (!Number.isInteger(expertId) || expertId <= 0) {
    return {
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      alternates: {
        canonical: null,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const expert = await getExpertMetadata(expertId);

  if (!expert) {
    return {
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      alternates: {
        canonical: null,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${expert.name} | ${expert.specialty}`;

  const description = t("description", {
    name: expert.name,
    specialty: expert.specialty,
    country: expert.country,
  });
  const canonicalPath = localized
    ? `/${locale}/experts/${expert.id}`
    : `/experts/${expert.id}`;
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const socialImage =
    getEntitySocialImage(expert.imageUrl, expert.name) ??
    getDefaultSocialImage(rootMetadata("openGraph.imageAlt"));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      ...(localized
        ? { languages: getLocalizedExpertsAlternates({ expertId: expert.id }) }
        : {}),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "profile",
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

export const generateMetadata = createExpertMetadata;

export default async function ExpertProfilePage({
  params,
  routeLocale,
  localized = false,
}: Props) {
  const { id } = await params;
  const expertId = Number(id);

  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const expertsPath = localized ? `/${locale}/experts` : "/experts";

  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "publicExpertProfile" }),
    getTranslations({ locale, namespace: "navbar" }),
  ]);

  const numberFormatter = new Intl.NumberFormat(locale);

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  if (!Number.isInteger(expertId) || expertId <= 0) {
    if (localized) notFound();

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h1 className="text-4xl font-bold">{t("notFound")}</h1>
      </div>
    );
  }

  const user = localized ? null : await requireUser();
  const expertAccess = await getExpertViewAccess({ expertId, viewer: user });

  if (!expertAccess) {
    notFound();
  }

  const expert = await prisma.expert.findFirst({
      where: expertAccess.scope,
      include: {
        owner: {
          select: {
            reviewsReceived: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                reviewer: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                id: "desc",
              },
            },
          },
        },
      },
    });

  if (!expert) {
    notFound();
  }

  const isAdmin = user?.role === "admin";

  const canManageExpert = Boolean(user && (isAdmin || expert.ownerId === user.id));

  const reviews = expert.owner?.reviewsReceived ?? [];

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  const [completedCases, relatedCompanies] = await Promise.all([
    expert.ownerId
      ? prisma.tradeCase.count({
          where: {
            status: "COMPLETED",
            proposals: {
              some: {
                status: "ACCEPTED",
                expert: {
                  ownerId: expert.ownerId,
                },
              },
            },
          },
        })
      : Promise.resolve(0),

    getRelatedCompanies(expert.country),
  ]);

  const trustScore = calculateTrustScore({
    averageRating: averageRating ?? 0,
    completedCases,
    verificationStatus: expert.verificationStatus,
    planType: expert.planType,
  });

  const premiumBorder = getPremiumBorder(expert.planType);

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "GOLD":
        return t("plans.gold");

      case "DIAMOND":
        return t("plans.diamond");

      case "ENTERPRISE":
        return t("plans.enterprise");

      default:
        return t("plans.free");
    }
  }

  function getStatusLabel(status: string) {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "active":
        return t("statuses.active");

      case "inactive":
        return t("statuses.inactive");

      case "pending":
        return t("statuses.pending");

      case "verified":
        return t("statuses.verified");

      case "rejected":
        return t("statuses.rejected");

      case "suspended":
        return t("statuses.suspended");

      default:
        return status;
    }
  }

  function renderPlanBadge(planType: string) {
    if (planType === "GOLD") {
      return (
        <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm text-black">
          🥇 {getPlanLabel(planType)}
        </span>
      );
    }

    if (planType === "DIAMOND") {
      return (
        <span className="rounded-full bg-cyan-600 px-4 py-2 text-sm text-black">
          💎 {getPlanLabel(planType)}
        </span>
      );
    }

    if (planType === "ENTERPRISE") {
      return (
        <span className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white">
          👑 {getPlanLabel(planType)}
        </span>
      );
    }

    return null;
  }

  const expertSchema =
    expert.verificationStatus === "VERIFIED"
      ? createExpertPageJsonLd({
          page: {
            canonicalPath: `${expertsPath}/${expert.id}`,
            name: expert.name,
            description: t("metadata.description", {
              name: expert.name,
              specialty: expert.specialty,
              country: expert.country,
            }),
            language: locale,
            breadcrumbs: [
              {
                name: navigation("home"),
                pathname: localized ? `/${locale}` : "/",
              },
              {
                name: navigation("experts"),
                pathname: expertsPath,
              },
              {
                name: expert.name,
                pathname: `${expertsPath}/${expert.id}`,
              },
            ],
          },
          expert: {
            name: expert.name,
            specialty: expert.specialty,
            country: expert.country,
            email: expert.email,
            imageUrl: expert.imageUrl,
          },
        })
      : null;

  return (
    <>
      {expertSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(expertSchema),
          }}
        />
      )}

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link
            href={expertsPath}
            className="mb-8 inline-block text-blue-400 hover:underline"
          >
            {t("backToExperts")}
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div
              className={`overflow-hidden rounded-3xl border bg-slate-900 lg:col-span-2 ${premiumBorder}`}
            >
              {expert.imageUrl && (
                <Image
                  src={expert.imageUrl}
                  alt={expert.name}
                  width={800}
                  height={500}
                  className="h-80 w-full object-cover"
                />
              )}

              <div className="p-10">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm ${getStatusClass(
                      expert.status,
                    )}`}
                  >
                    {getStatusLabel(expert.status)}
                  </span>

                  <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                    {expert.country}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-5xl font-bold">{expert.name}</h1>

                  {renderPlanBadge(expert.planType)}
                </div>

                <p className="mb-4 text-2xl text-blue-400">
                  {expert.specialty}
                </p>

                <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.trustScore")}
                  </p>

                  <p dir="ltr" className="text-2xl font-bold text-emerald-400">
                    {numberFormatter.format(trustScore)}
                    /100
                  </p>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.rating")}
                    </p>

                    <p className="text-2xl font-bold text-yellow-400">
                      {averageRating !== null
                        ? `⭐ ${ratingFormatter.format(averageRating)}`
                        : t("notAvailable")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.reviews")}
                    </p>

                    <p className="text-2xl font-bold text-slate-200">
                      {numberFormatter.format(reviews.length)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.specialty")}
                    </p>

                    <p className="text-xl font-bold text-blue-400">
                      {expert.specialty}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.country")}
                    </p>

                    <p className="text-2xl font-bold text-blue-400">
                      {expert.country}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-8">
                  <h2 className="mb-4 text-2xl font-bold">{t("experience")}</h2>

                  <p className="text-lg leading-8 text-slate-300">
                    {expert.experience}
                  </p>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-8">
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("recentReviews")}
                  </h2>

                  {reviews.length === 0 ? (
                    <p className="text-slate-500">{t("noReviews")}</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                        >
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <p className="font-semibold">
                              {review.reviewer?.name ||
                                review.reviewer?.email ||
                                t("anonymousUser")}
                            </p>

                            <p className="text-yellow-400">
                              ⭐ {numberFormatter.format(review.rating)}
                              /5
                            </p>
                          </div>

                          <p className="leading-7 text-slate-300">
                            {review.comment || t("noCommentProvided")}
                          </p>

                          <p className="mt-3 text-xs text-slate-500">
                            {review.createdAt.toLocaleDateString(locale)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div
                className={`rounded-3xl border bg-slate-900 p-6 ${premiumBorder}`}
              >
                <h2 className="mb-6 text-2xl font-bold">
                  {t("contactExpert")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.email")}
                    </p>

                    {expert.email ? (
                      <a
                        href={`mailto:${expert.email}`}
                        className="break-all text-blue-400 hover:underline"
                      >
                        {expert.email}
                      </a>
                    ) : (
                      <p className="text-slate-200">{t("notProvided")}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.country")}
                    </p>

                    <p className="text-slate-200">{expert.country}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.specialty")}
                    </p>

                    <p className="text-slate-200">{expert.specialty}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("fields.reputation")}
                    </p>

                    <p className="text-slate-200">
                      {averageRating !== null
                        ? t("ratingWithReviews", {
                            rating: ratingFormatter.format(averageRating),
                            count: numberFormatter.format(reviews.length),
                          })
                        : t("noReviews")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("metrics.trustScore")}
                    </p>

                    <p dir="ltr" className="font-semibold text-emerald-400">
                      {numberFormatter.format(trustScore)}
                      /100
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("completedCases")}
                    </p>

                    <p className="text-slate-200">
                      {numberFormatter.format(completedCases)}
                    </p>
                  </div>
                </div>

                {expert.email && (
                  <a
                    href={`mailto:${expert.email}`}
                    className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
                  >
                    {t("sendEmail")}
                  </a>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("relatedCompanies.title")}
                </h2>

                {relatedCompanies.length === 0 ? (
                  <p className="text-slate-500">
                    {t("relatedCompanies.empty")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {relatedCompanies.map((company) => (
                      <Link
                        key={company.id}
                        href={localized
                          ? `/${locale}/companies/${company.id}`
                          : `/companies/${company.id}`}
                        className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500"
                      >
                        <p className="font-semibold">{company.name}</p>

                        <p className="mt-1 text-sm text-slate-400">
                          {company.category}
                        </p>

                        <p className="mt-2 text-xs text-emerald-400">
                          ✓ {t("relatedCompanies.verified")}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {canManageExpert && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("adminActions")}
                  </h2>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/dashboard/experts/${expert.id}/edit`}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
                    >
                      {t("editExpert")}
                    </Link>

                    <DeleteExpertButton id={expert.id} />
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            {t("reviewNotice")}
          </div>
        </div>
      </div>
    </>
  );
}
