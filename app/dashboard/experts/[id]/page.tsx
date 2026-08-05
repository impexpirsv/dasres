import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import { getExpertViewAccess } from "../../../../lib/experts/get-expert";
import { calculateTrustScore } from "../../../../lib/ranking";
import { formatCountry } from "../../../../lib/format";
import { serializeJsonLd } from "../../../../lib/seo/jsonld";
import DeleteExpertButton from "../../../components/DeleteExpertButton";
import SaveExpertButton from "../../../components/SaveExpertButton";
import Image from "next/image";
type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getPremiumBorder(planType: string) {
  switch (planType) {
    case "GOLD":
      return "border-yellow-500 shadow-lg shadow-yellow-500/10";

    case "DIAMOND":
      return "border-cyan-500 shadow-lg shadow-cyan-500/10";

    case "ENTERPRISE":
      return "border-purple-500 shadow-lg shadow-purple-500/10";

    default:
      return "border-slate-800";
  }
}

function getStatusClass(status: string) {
  switch (status.trim().toUpperCase()) {
    case "ACTIVE":
    case "VERIFIED":
      return "bg-emerald-600 text-white";

    case "PENDING":
      return "bg-yellow-600 text-black";

    case "INACTIVE":
    case "REJECTED":
      return "bg-red-600 text-white";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

export default async function ExpertProfilePage({
  params,
}: Props) {
  const { id } = await params;
  const expertId = Number(id);

  const user = await requireUser();

  const [locale, t, ts] = await Promise.all([
    getLocale(),
    getTranslations("dashboardExpertProfile"),
    getTranslations("common.specialties"),
  ]);

  const numberFormatter = new Intl.NumberFormat(
    locale,
  );

  const ratingFormatter = new Intl.NumberFormat(
    locale,
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  );

  if (!Number.isInteger(expertId) || expertId <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <h1 className="text-4xl font-bold">
          {t("notFound")}
        </h1>
      </div>
    );
  }

  const expertAccess = await getExpertViewAccess({ expertId, viewer: user });

  if (!expertAccess) {
    notFound();
  }

  const expert = await prisma.expert.findFirst({
    where: expertAccess.scope,
  });

  if (!expert) {
    notFound();
  }

  const isAdmin = user.role === "admin";

  function translateSpecialty(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return ts.has(normalized)
      ? ts(normalized)
      : ts.has(lower)
        ? ts(lower)
        : ts.has(underscored)
          ? ts(underscored)
          : normalized;
  }

  const canManageExpert =
    isAdmin || expert.ownerId === user.id;

  const [existingSave, reviews, completedCases] =
    await Promise.all([
      prisma.savedExpert.findUnique({
        where: {
          userId_expertId: {
            userId: user.id,
            expertId: expert.id,
          },
        },
      }),

      expert.ownerId
        ? prisma.review.findMany({
            where: {
              reviewedUserId: expert.ownerId,
            },
            include: {
              reviewer: true,
            },
            orderBy: {
              id: "desc",
            },
          })
        : Promise.resolve([]),

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
    ]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        ) / reviews.length
      : 0;

  const trustScore = calculateTrustScore({
    averageRating,
    completedCases,
    verificationStatus:
      expert.verificationStatus,
    planType: expert.planType,
  });

  const premiumBorder = getPremiumBorder(
    expert.planType,
  );

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "GOLD":
        return `🥇 ${t("plans.gold")}`;

      case "DIAMOND":
        return `💎 ${t("plans.diamond")}`;

      case "ENTERPRISE":
        return `👑 ${t("plans.enterprise")}`;

      case "FREE":
        return t("plans.free");

      default:
        return planType;
    }
  }

  function getPlanClass(planType: string) {
    switch (planType) {
      case "GOLD":
        return "bg-yellow-600 text-white";

      case "DIAMOND":
        return "bg-cyan-600 text-white";

      case "ENTERPRISE":
        return "bg-purple-600 text-white";

      default:
        return "bg-slate-700 text-slate-200";
    }
  }

  function getStatusLabel(status: string) {
    switch (status.trim().toUpperCase()) {
      case "ACTIVE":
        return t("statuses.active");

      case "INACTIVE":
        return t("statuses.inactive");

      case "PENDING":
        return t("statuses.pending");

      case "VERIFIED":
        return t("statuses.verified");

      case "REJECTED":
        return t("statuses.rejected");

      default:
        return status;
    }
  }

  const formattedCountry = formatCountry(
    expert.country,
  );

  const expertSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: expert.name,
    jobTitle: expert.specialty,
    email: expert.email,
    image: expert.imageUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: expert.country,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(expertSchema),
        }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link
            href="/dashboard/experts"
            className="mb-8 inline-block text-blue-400 hover:underline"
          >
            {t("backToExperts")}
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div
              className={`overflow-hidden rounded-3xl border bg-slate-900 lg:col-span-2 ${premiumBorder}`}
            >
              {expert.imageUrl ? (
             <Image
  src={expert.imageUrl}
  alt={expert.name}
  width={800}
  height={500}
  className="h-80 w-full object-cover"
/>
              ) : (
                <div className="flex h-80 w-full items-center justify-center bg-slate-800 text-7xl">
                  👤
                </div>
              )}

              <div className="p-6 sm:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm ${getStatusClass(
                      expert.status,
                    )}`}
                  >
                    {getStatusLabel(expert.status)}
                  </span>

                  <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                    {formattedCountry}
                  </span>

                  {expert.verificationStatus ===
                    "VERIFIED" && (
                    <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                      ✓ {t("statuses.verified")}
                    </span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold md:text-5xl">
                    {expert.name}
                  </h1>

                  <span
                    className={`rounded-full px-4 py-2 text-sm ${getPlanClass(
                      expert.planType,
                    )}`}
                  >
                    {getPlanLabel(expert.planType)}
                  </span>
                </div>

                <p className="mb-8 text-2xl text-blue-400">
                  {translateSpecialty(expert.specialty)}
                </p>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:col-span-2 lg:col-span-1">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.trustScore")}
                    </p>

                    <p className="text-2xl font-bold text-emerald-400">
                      {t("trustScoreValue", {
                        score: numberFormatter.format(
                          trustScore,
                        ),
                        maximum:
                          numberFormatter.format(100),
                      })}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.rating")}
                    </p>

                    <p className="text-2xl font-bold text-yellow-400">
                      {reviews.length > 0
                        ? `⭐ ${ratingFormatter.format(
                            averageRating,
                          )}`
                        : t("notAvailable")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.reviews")}
                    </p>

                    <p className="text-2xl font-bold text-slate-200">
                      {numberFormatter.format(
                        reviews.length,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.specialty")}
                    </p>

                    <p className="text-xl font-bold text-blue-400">
                      {translateSpecialty(expert.specialty)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="mb-1 text-sm text-slate-500">
                      {t("metrics.country")}
                    </p>

                    <p className="text-xl font-bold text-blue-400">
                      {formattedCountry}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-8">
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("experience")}
                  </h2>

                  <p className="whitespace-pre-wrap text-lg leading-8 text-slate-300">
                    {expert.experience}
                  </p>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-8">
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("recentReviews.title")}
                  </h2>

                  {reviews.length === 0 ? (
                    <p className="text-slate-500">
                      {t("recentReviews.empty")}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews
                        .slice(0, 3)
                        .map((review) => {
                          const reviewerName =
                            review.reviewer?.name ||
                            review.reviewer?.email ||
                            t(
                              "recentReviews.fallbackUser",
                            );

                          return (
                            <div
                              key={review.id}
                              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                            >
                              <div className="mb-2 flex items-center justify-between gap-4">
                                <p className="font-semibold">
                                  {reviewerName}
                                </p>

                                <p className="whitespace-nowrap text-yellow-400">
                                  ⭐{" "}
                                  {t(
                                    "recentReviews.rating",
                                    {
                                      rating:
                                        numberFormatter.format(
                                          review.rating,
                                        ),
                                      maximum:
                                        numberFormatter.format(
                                          5,
                                        ),
                                    },
                                  )}
                                </p>
                              </div>

                              <p className="whitespace-pre-wrap leading-7 text-slate-300">
                                {review.comment ||
                                  t(
                                    "recentReviews.noComment",
                                  )}
                              </p>
                            </div>
                          );
                        })}
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
                  {t("contact.title")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.email")}
                    </p>

                    <p className="break-all text-slate-200">
                      {expert.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.country")}
                    </p>

                    <p className="text-slate-200">
                      {formattedCountry}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.specialty")}
                    </p>

                    <p className="text-slate-200">
                      {translateSpecialty(expert.specialty)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.reputation")}
                    </p>

                    <p className="text-slate-200">
                      {reviews.length > 0
                        ? t(
                            "contact.reputationValue",
                            {
                              rating:
                                ratingFormatter.format(
                                  averageRating,
                                ),
                              count:
                                numberFormatter.format(
                                  reviews.length,
                                ),
                            },
                          )
                        : t(
                            "contact.noReviews",
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.trustScore")}
                    </p>

                    <p className="font-semibold text-emerald-400">
                      {t("trustScoreValue", {
                        score: numberFormatter.format(
                          trustScore,
                        ),
                        maximum:
                          numberFormatter.format(100),
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      {t("contact.completedCases")}
                    </p>

                    <p className="text-slate-200">
                      {numberFormatter.format(
                        completedCases,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <SaveExpertButton
                    expertId={expert.id}
                    initialSaved={Boolean(existingSave)}
                  />
                </div>

                <a
                  href={`mailto:${expert.email}`}
                  className="mt-3 block rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
                >
                  {t("contact.sendEmail")}
                </a>
              </div>

              {canManageExpert && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("management.title")}
                  </h2>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/dashboard/experts/${expert.id}/edit`}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-center transition hover:bg-blue-700"
                    >
                      {t("management.edit")}
                    </Link>

                    <DeleteExpertButton
                      id={expert.id}
                    />
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
