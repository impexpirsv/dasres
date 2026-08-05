import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import { getCompanyViewAccess } from "../../../../lib/companies/get-company";
import { calculateTrustScore } from "../../../../lib/ranking";
import { serializeJsonLd } from "../../../../lib/seo/jsonld";
import DeleteCompanyButton from "../../../components/DeleteCompanyButton";
import CompanyVerificationButtons from "../../../components/CompanyVerificationButtons";
import SaveCompanyButton from "../../../components/SaveCompanyButton";
import Image from "next/image";
type Props = {
  params: Promise<{ id: string }>;
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

export default async function CompanyProfilePage({ params }: Props) {
  const { id } = await params;

  const user = await requireUser();

  const [t, tc, tcat, locale] = await Promise.all([
    getTranslations("companyProfile"),
    getTranslations("common.countries"),
    getTranslations("common.categories"),
    getLocale(),
  ]);

  const isAdmin = user.role === "admin";

  function translateCountry(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    return tc.has(normalized) ? tc(normalized) : tc.has(lower) ? tc(lower) : normalized;
  }

  function translateCategory(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return tcat.has(normalized)
      ? tcat(normalized)
      : tcat.has(lower)
        ? tcat(lower)
        : tcat.has(underscored)
          ? tcat(underscored)
          : normalized;
  }

  const companyId = Number(id);
  const companyAccess = Number.isInteger(companyId) && companyId > 0
    ? await getCompanyViewAccess({ companyId, viewer: user })
    : null;

  if (!companyAccess) {
    notFound();
  }

  const company = await prisma.company.findFirst({
    where: companyAccess.scope,
  });

  if (!company) {
    notFound();
  }

  const companyReviews = company.ownerId
    ? await prisma.review.findMany({
        where: {
          reviewedUserId: company.ownerId,
        },
        orderBy: {
          id: "desc",
        },
      })
    : [];

  const averageRating =
    companyReviews.length > 0
      ? companyReviews.reduce((sum, review) => sum + review.rating, 0) /
        companyReviews.length
      : null;

  const canManageCompany = isAdmin || company.ownerId === user.id;

  const completedCases = company.ownerId
    ? await prisma.tradeCase.count({
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
    : 0;

  const trustScore = calculateTrustScore({
    averageRating: averageRating || 0,
    completedCases,
    verificationStatus: company.verificationStatus,
    planType: company.planType,
  });

  const existingSave = await prisma.savedCompany.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId: company.id,
      },
    },
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
        return planType;
    }
  }

  const companySchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description,
    url: company.website,
    email: company.email,
    logo: company.logoUrl ? company.logoUrl : "/og-image.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: company.country,
    },
    industry: company.category,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: t("schema.status"),
        value: getStatusLabel(company.status),
      },
      {
        "@type": "PropertyValue",
        name: t("schema.category"),
        value: company.category,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(companySchema),
        }}
      />

      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href="/dashboard/companies"
          className="mb-8 inline-block text-blue-400 hover:underline"
        >
          {t("backToCompanies")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div
            className={`overflow-hidden rounded-3xl border bg-slate-900 lg:col-span-2 ${
              company.planType === "GOLD"
                ? "border-yellow-500 shadow-lg shadow-yellow-500/10"
                : company.planType === "DIAMOND"
                  ? "border-cyan-500 shadow-lg shadow-cyan-500/10"
                  : company.planType === "ENTERPRISE"
                    ? "border-purple-500 shadow-lg shadow-purple-500/10"
                    : "border-slate-800"
            }`}
          >
            {company.logoUrl && (
              <div className="bg-white p-10">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={800}
                  height={500}
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
                  {translateCountry(company.country)}
                </span>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm">
                    ✓ {t("verificationBadges.verified")}
                  </span>
                )}

                {company.verificationStatus === "REJECTED" && (
                  <span className="rounded-full bg-red-600 px-4 py-2 text-sm">
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
                  <span className="rounded-full bg-purple-600 px-4 py-2 text-sm">
                    👑 {getPlanLabel(company.planType)}
                  </span>
                )}
              </div>

              <p className="mb-8 text-2xl text-blue-400">{translateCategory(company.category)}</p>

              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.trustScore")}
                  </p>

                  <p className="text-2xl font-bold text-emerald-400">
                    {trustScore}/100
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.rating")}
                  </p>

                  <p className="text-2xl font-bold text-yellow-400">
                    {averageRating
                      ? `⭐ ${averageRating.toFixed(1)}`
                      : t("notAvailable")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="mb-1 text-sm text-slate-500">
                    {t("metrics.reviews")}
                  </p>

                  <p className="text-2xl font-bold text-slate-200">
                    {companyReviews.length}
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
                    {translateCountry(company.country)}
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="mb-2 text-sm text-slate-500">
                  {t("companyRating")}
                </p>

                {averageRating ? (
                  <div>
                    <p className="text-3xl font-bold text-yellow-400">
                      ⭐ {averageRating.toFixed(1)} / 5.0
                    </p>

                    <p className="mt-2 text-slate-400">
                      {t("basedOnReviews", {
                        count: companyReviews.length,
                      })}
                    </p>

                    <p className="mt-3 font-semibold text-emerald-400">
                      {t("trustScoreValue", {
                        score: trustScore,
                      })}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {t("completedCasesValue", {
                        count: completedCases,
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
              className={`rounded-3xl border bg-slate-900 p-6 ${
                company.planType === "GOLD"
                  ? "border-yellow-500 shadow-lg shadow-yellow-500/10"
                  : company.planType === "DIAMOND"
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/10"
                    : company.planType === "ENTERPRISE"
                      ? "border-purple-500 shadow-lg shadow-purple-500/10"
                      : "border-slate-800"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                {t("companyInformation")}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">{t("fields.email")}</p>

                  <p className="break-all text-slate-200">{company.email}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.website")}
                  </p>

                  <p className="break-all text-slate-200">
                    {company.website || t("notProvided")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.country")}
                  </p>

                  <p className="text-slate-200">{translateCountry(company.country)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.category")}
                  </p>

                  <p className="text-slate-200">{translateCategory(company.category)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t("fields.reputation")}
                  </p>

                  <p className="text-slate-200">
                    {averageRating
                      ? t("ratingWithReviews", {
                          rating: averageRating.toFixed(1),
                          count: companyReviews.length,
                        })
                      : t("noReviews")}
                  </p>
                </div>
              </div>

              <SaveCompanyButton
                companyId={company.id}
                initialSaved={Boolean(existingSave)}
              />

              <a
                href={`mailto:${company.email}`}
                className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-center hover:bg-blue-700"
              >
                {t("sendEmail")}
              </a>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-xl bg-slate-800 px-6 py-3 text-center hover:bg-slate-700"
                >
                  {t("visitWebsite")}
                </a>
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
                  className="rounded-xl bg-blue-600 px-6 py-3 text-center hover:bg-blue-700"
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
