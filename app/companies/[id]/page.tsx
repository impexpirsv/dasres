import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { defaultLocale, isLocale, type Locale } from "../../../lib/locale";
import { calculateTrustScore } from "../../../lib/ranking";
import { serializeJsonLd } from "../../../lib/seo/jsonld";
import {
  getDefaultSocialImage,
  getEntitySocialImage,
  getOpenGraphLocale,
} from "../../../lib/seo/social";
import { createCompanyPageJsonLd } from "../../../lib/seo/structured-data";
import { getAbsoluteUrl } from "../../../lib/seo/urls";
import { getLocalizedCompaniesAlternates } from "../../../lib/seo/localized-companies";
import { getCompany, getCompanyViewAccess } from "../../../lib/companies/get-company";
import { AppError } from "../../../lib/errors";
import Image from "next/image";
import DeleteCompanyButton from "../../components/DeleteCompanyButton";
import CompanyVerificationButtons from "../../components/CompanyVerificationButtons";
import SaveCompanyButton from "../../components/SaveCompanyButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
  routeLocale?: Locale;
  localized?: boolean;
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}
function getCategoryKey(category: string) {
  switch (category) {
    case "Customs Clearance":
      return "customsClearance";

    case "Shipping":
      return "shipping";

    case "Inspection":
      return "inspection";

    case "Insurance":
      return "insurance";

    case "Sourcing":
      return "sourcing";

    case "Documentation":
      return "documentation";

    case "Payment":
      return "payment";

    default:
      return "general";
  }
}
const getCompanyMetadata = unstable_cache(
  async (id: number) => {
    try {
      return await getCompany({ companyId: id, viewer: null });
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    }
  },
  ["public-company-metadata"],
  {
    revalidate: 300,
    tags: ["public-companies"],
  },
);

const getRelatedExperts = unstable_cache(
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
  ["public-company-related-experts"],
  {
    revalidate: 300,
    tags: ["public-experts"],
  },
);

export async function createCompanyMetadata({ params, routeLocale, localized = false }: Props): Promise<Metadata> {
  const { id } = await params;

  const companyId = Number(id);

  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [t, rootMetadata] = await Promise.all([
    getTranslations({ locale, namespace: "publicCompanyProfile.metadata" }),
    getTranslations({ locale, namespace: "rootMetadata" }),
  ]);

  if (!Number.isInteger(companyId) || companyId <= 0) {
    if (localized) {
      notFound();
    }

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

  const company = await getCompanyMetadata(companyId);

  if (!company) {
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

  const title = `${company.name} | ${company.category}`;

  const description = t("description", {
    name: company.name,
    category: company.category,
    country: company.country,
  });
  const canonicalPath = localized ? `/${locale}/companies/${company.id}` : `/companies/${company.id}`;
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const socialImage =
    getEntitySocialImage(company.logoUrl, company.name) ??
    getDefaultSocialImage(rootMetadata("openGraph.imageAlt"));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      ...(localized ? { languages: getLocalizedCompaniesAlternates({ companyId: company.id }) } : {}),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: getOpenGraphLocale(locale),
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

export const generateMetadata = createCompanyMetadata;

export default async function CompanyProfilePage({ params, routeLocale, localized = false }: Props) {
  const { id } = await params;

  const companyId = Number(id);

  const user = localized ? null : await requireUser();
  const requestedLocale = routeLocale ?? await getLocale();
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const companiesPath = localized ? `/${locale}/companies` : "/companies";

  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "publicCompanyProfile" }),
    getTranslations({ locale, namespace: "navbar" }),
  ]);
function getCategoryLabel(category: string) {
  return t(
    `categories.${getCategoryKey(category)}`,
  );
}

function getCountryLabel(country: string) {
  switch (country.toLowerCase()) {
    case "iran":
      return t("countries.iran");

    default:
      return country;
  }
}
  const numberFormatter = new Intl.NumberFormat(locale);

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const isAdmin = user?.role === "admin";

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h1 className="text-4xl font-bold">{t("notFound")}</h1>
      </div>
    );
  }

  const companyAccess = await getCompanyViewAccess({
    companyId,
    viewer: user,
  });

  if (!companyAccess) {
    notFound();
  }

  const company = await prisma.company.findFirst({
    where: companyAccess.scope,
    select: {
      id: true,
      name: true,
      country: true,
      category: true,
      status: true,
      description: true,
      email: true,
      website: true,
      logoUrl: true,
      verificationStatus: true,
      planType: true,
      ownerId: true,
      owner: {
        select: {
          reviewsReceived: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
            orderBy: {
              id: "desc",
            },
          },
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  const companyReviews = company.owner?.reviewsReceived ?? [];

  const averageRating =
    companyReviews.length > 0
      ? companyReviews.reduce((sum, review) => sum + review.rating, 0) /
        companyReviews.length
      : null;

  const canManageCompany = Boolean(user && (isAdmin || company.ownerId === user.id));

  const [completedCases, existingSave, relatedExperts] = await Promise.all([
    company.ownerId
      ? prisma.tradeCase.count({
          where: {
            status: "COMPLETED",
            proposals: {
              some: {
                status: "ACCEPTED",
                company: {
                  ownerId: company.ownerId,
                },
              },
            },
          },
        })
      : Promise.resolve(0),

    user ? prisma.savedCompany.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
      select: {
        id: true,
      },
    }) : Promise.resolve(null),

    getRelatedExperts(company.country),
  ]);

  const trustScore = calculateTrustScore({
    averageRating: averageRating ?? 0,
    completedCases,
    verificationStatus: company.verificationStatus,
    planType: company.planType,
  });

  function getStatusLabel(status: string) {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "active":
        return t("statuses.active");

      case "inactive":
        return t("statuses.inactive");

      case "open":
        return t("statuses.open");

      case "pending":
        return t("statuses.pending");

      case "verified":
        return t("statuses.verified");

      case "rejected":
        return t("statuses.rejected");

      case "completed":
        return t("statuses.completed");

      case "in_progress":
        return t("statuses.inProgress");

      default:
        return status;
    }
  }

  function getVerificationLabel(status: string) {
    switch (status) {
      case "VERIFIED":
        return t("verificationStatuses.verified");

      case "REJECTED":
        return t("verificationStatuses.rejected");

      default:
        return t("verificationStatuses.pending");
    }
  }

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

  const planBorderClass =
    company.planType === "GOLD"
      ? "border-yellow-500 shadow-lg shadow-yellow-500/10"
      : company.planType === "DIAMOND"
        ? "border-cyan-500 shadow-lg shadow-cyan-500/10"
        : company.planType === "ENTERPRISE"
          ? "border-purple-500 shadow-lg shadow-purple-500/10"
          : "border-slate-800";

  const companySchema =
    company.verificationStatus === "VERIFIED"
      ? createCompanyPageJsonLd({
          page: {
            canonicalPath: `${companiesPath}/${company.id}`,
            name: company.name,
            description: company.description,
            language: locale,
            breadcrumbs: [
              {
                name: navigation("home"),
                pathname: localized ? `/${locale}` : "/",
              },
              {
                name: navigation("companies"),
                pathname: companiesPath,
              },
              {
                name: company.name,
                pathname: `${companiesPath}/${company.id}`,
              },
            ],
          },
          company: {
            name: company.name,
            description: company.description,
            country: company.country,
            category: company.category,
            email: company.email,
            website: company.website,
            logoUrl: company.logoUrl,
          },
        })
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {companySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(companySchema),
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href={companiesPath}
          className="mb-8 inline-block text-blue-400 hover:underline"
        >
          {t("backToCompanies")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div
            className={`overflow-hidden rounded-3xl border bg-slate-900 lg:col-span-2 ${planBorderClass}`}
          >
            {company.logoUrl && (
              <div className="bg-white p-10">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={600}
                  height={400}
                  className="h-72 w-full object-contain"
                />
              </div>
            )}

            <div className="p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {t("statusLabel")}: {getStatusLabel(company.status)}
                </span>

                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                {getCountryLabel(company.country)}
                </span>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                    ✓ {t("verificationBadges.verified")}
                  </span>
                )}

                {company.verificationStatus === "REJECTED" && (
                  <span className="rounded-full bg-red-600 px-4 py-2 text-sm text-white">
                    {t("verificationBadges.rejected")}
                  </span>
                )}

                {company.verificationStatus === "PENDING" && (
                  <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm text-black">
                    {t("verificationBadges.pending")}
                  </span>
                )}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-5xl font-bold">{company.name}</h1>

                {company.planType === "GOLD" && (
                  <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm text-black">
                    🥇 {getPlanLabel(company.planType)}
                  </span>
                )}

                {company.planType === "DIAMOND" && (
                  <span className="rounded-full bg-cyan-600 px-4 py-2 text-sm text-black">
                    💎 {getPlanLabel(company.planType)}
                  </span>
                )}

                {company.planType === "ENTERPRISE" && (
                  <span className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white">
                    👑 {getPlanLabel(company.planType)}
                  </span>
                )}
              </div>

              <p className="mb-8 text-2xl text-blue-400">{getCategoryLabel(company.category)}</p>

              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.trustScore")}
                  </p>

                  <p dir="ltr" className="text-2xl font-bold text-emerald-400">
                    {numberFormatter.format(trustScore)}
                    /100
                  </p>
                </div>

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
                    {numberFormatter.format(companyReviews.length)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.verification")}
                  </p>

                  <p
                    className={`text-2xl font-bold ${
                      company.verificationStatus === "VERIFIED"
                        ? "text-emerald-400"
                        : company.verificationStatus === "REJECTED"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {getVerificationLabel(company.verificationStatus)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.country")}
                  </p>

                  <p className="text-2xl font-bold text-blue-400">
                     {getCountryLabel(company.country)}
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="mb-2 text-sm text-slate-500">
                  {t("companyRating")}
                </p>

                {averageRating !== null ? (
                  <div>
                    <p dir="ltr" className="text-3xl font-bold text-yellow-400">
                      ⭐ {ratingFormatter.format(averageRating)} / 5.0
                    </p>

                    <p className="mt-2 text-slate-400">
                      {t("basedOnReviews", {
                        count: companyReviews.length,
                      })}
                    </p>

                    <p className="mt-3 font-semibold text-emerald-400">
                      {t("trustScoreValue", {
                        score: numberFormatter.format(trustScore),
                      })}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {t("completedCasesValue", {
                        count: numberFormatter.format(completedCases),
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">{t("noReviews")}</p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-8">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("companyDescription")}
                </h2>

                <p className="text-lg leading-8 text-slate-300">
                  {company.description}
                </p>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-8">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("recentReviews")}
                </h2>

                {companyReviews.length === 0 ? (
                  <p className="text-slate-500">{t("noReviews")}</p>
                ) : (
                  <div className="space-y-4">
                    {companyReviews.slice(0, 3).map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <p className="mb-2 font-semibold text-yellow-400">
                          {"⭐".repeat(review.rating)}
                        </p>

                        <p className="leading-7 text-slate-300">
                          {review.comment || t("noCommentProvided")}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          {review.createdAt.toLocaleDateString(
                            locale === "fa"
                              ? "fa-IR"
                              : locale === "ar"
                                ? "ar"
                                : "en-US",
                          )}
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
              className={`rounded-3xl border bg-slate-900 p-6 ${planBorderClass}`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                {t("companyInformation")}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">{t("fields.email")}</p>

                  {company.email ? (
                    <a
                      href={`mailto:${company.email}`}
                      className="break-all text-blue-400 hover:underline"
                    >
                      {company.email}
                    </a>
                  ) : (
                    <p className="text-slate-200">{t("notProvided")}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.website")}
                  </p>

                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-blue-400 hover:underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <p className="text-slate-200">{t("notProvided")}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.country")}
                  </p>

                  <p className="text-slate-200"> {getCountryLabel(company.country)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.category")}
                  </p>

                  <p className="text-slate-200"> {getCategoryLabel(company.category)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.reputation")}
                  </p>

                  <p className="text-slate-200">
                    {averageRating !== null
                      ? t("ratingWithReviews", {
                          rating: ratingFormatter.format(averageRating),
                          count: numberFormatter.format(companyReviews.length),
                        })
                      : t("noReviews")}
                  </p>
                </div>
              </div>

              {user && (
                <SaveCompanyButton
                  companyId={company.id}
                  initialSaved={Boolean(existingSave)}
                />
              )}

              <a
                href={`mailto:${company.email}`}
                className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
              >
                {t("sendEmail")}
              </a>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center transition hover:bg-slate-700"
                >
                  {t("visitWebsite")}
                </a>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">
                {t("relatedExperts.title")}
              </h2>

              {relatedExperts.length === 0 ? (
                <p className="text-slate-500">{t("relatedExperts.empty")}</p>
              ) : (
                <div className="space-y-3">
                  {relatedExperts.map((expert) => (
                    <Link
                      key={expert.id}
                      href={`/experts/${expert.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500"
                    >
                      <p className="font-semibold">{expert.name}</p>

                      <p className="mt-1 text-sm text-slate-400">
                        {expert.specialty}
                      </p>

                      <p className="mt-2 text-xs text-emerald-400">
                        ✓ {t("relatedExperts.verified")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {canManageCompany && (
              <div className="flex flex-col gap-3">
                {isAdmin && (
                  <div className="rounded-xl bg-slate-800 p-4">
                    <p className="mb-2 text-sm text-slate-500">
                      {t("verificationStatus")}
                    </p>

                    <p className="mb-4 font-semibold text-slate-200">
                      {getVerificationLabel(company.verificationStatus)}
                    </p>

                    <CompanyVerificationButtons companyId={company.id} />
                  </div>
                )}

                <Link
                  href={`/dashboard/companies/${company.id}/edit`}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
                >
                  {t("editCompany")}
                </Link>

                <DeleteCompanyButton id={company.id} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
