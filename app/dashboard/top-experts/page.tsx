import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { calculateTrustScore } from "../../../lib/ranking";
import {
  getEntityReviewRatingStats,
  getReviewRatingStats,
} from "../../../lib/ranking/review-aggregates";

const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

export default async function TopExpertsPage() {
  await requireUser();

  const [locale, t, experts] = await Promise.all([
    getLocale(),
    getTranslations("topExperts"),
    prisma.expert.findMany({
      where: {
        verificationStatus: "VERIFIED",
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        country: true,
        verificationStatus: true,
        planType: true,
        ownerId: true,
      },
    }),
  ]);

  const reviewStats =
    await getReviewRatingStats(
      experts.map(
        (expert) => expert.ownerId,
      ),
    );

  const numberFormatter = new Intl.NumberFormat(locale);
  const tc = await getTranslations("common.countries");
  const ts = await getTranslations("common.specialties");


  function translateCountry(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    return tc.has(normalized) ? tc(normalized) : tc.has(lower) ? tc(lower) : normalized;
  }

  function translateSpecialty(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return ts.has(normalized) ? ts(normalized) : ts.has(lower) ? ts(lower) : ts.has(underscored) ? ts(underscored) : normalized;
  }

  function getPlanLabel(planType: string) {
    const key = planType.trim().toLowerCase();
    return t.has(`plans.${key}`) ? t(`plans.${key}`) : planType.replaceAll("_", " ");
  }

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const rankedExperts = experts
    .map((expert) => {
      const {
        averageRating,
        reviewCount,
      } = getEntityReviewRatingStats(
        reviewStats,
        expert.ownerId,
      );

      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus: expert.verificationStatus,
        planType: expert.planType,
      });

      return {
        id: expert.id,
        name: expert.name,
        specialty: expert.specialty,
        country: expert.country,
        verificationStatus: expert.verificationStatus,
        planType: expert.planType,
        averageRating,
        reviewCount,
        trustScore,
      };
    })
    .sort(
      (a, b) =>
        b.trustScore - a.trustScore ||
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount ||
        planPriority[b.planType] - planPriority[a.planType],
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold">{t("title")}</h1>

          <p className="text-slate-400">{t("description")}</p>
        </div>

        {rankedExperts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-5">
            {rankedExperts.map((expert, index) => (
              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="block rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-2xl font-bold text-blue-400">
                      #{numberFormatter.format(index + 1)}
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">{expert.name}</h2>

                        {expert.verificationStatus === "VERIFIED" && (
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs">
                            ✓ {t("verified")}
                          </span>
                        )}

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {getPlanLabel(expert.planType)}
                        </span>
                      </div>

                      <p className="text-blue-400">{translateSpecialty(expert.specialty)}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {translateCountry(expert.country)}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-full grid-cols-1 gap-4 sm:grid-cols-3 md:min-w-[420px]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">{t("trust")}</p>

                      <p className="text-2xl font-bold text-emerald-400">
                        {numberFormatter.format(expert.trustScore)}/
                        {numberFormatter.format(100)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">{t("rating")}</p>

                      <p className="text-2xl font-bold text-yellow-400">
                        {expert.averageRating > 0
                          ? ratingFormatter.format(expert.averageRating)
                          : t("notAvailable")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">{t("reviews")}</p>

                      <p className="text-2xl font-bold text-blue-400">
                        {numberFormatter.format(expert.reviewCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
