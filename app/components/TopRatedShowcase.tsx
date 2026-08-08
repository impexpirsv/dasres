import Link from "next/link";
import {
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../lib/prisma";
import { calculateTrustScore } from "../../lib/ranking";
import {
  getEntityReviewRatingStats,
  getReviewRatingStats,
} from "../../lib/ranking/review-aggregates";
import { unstable_cache } from "next/cache";
import type { Locale } from "../../lib/locale";

const getTopRatedData = unstable_cache(
  async () => {
    const [
      companies,
      experts,
    ] = await Promise.all([
      prisma.company.findMany({
        where: {
          verificationStatus: "VERIFIED",
        },
        select: {
          id: true,
          name: true,
          category: true,
          country: true,
          verificationStatus: true,
          planType: true,
          ownerId: true,
        },
      }),

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
      await getReviewRatingStats([
        ...companies.map(
          (company) =>
            company.ownerId,
        ),
        ...experts.map(
          (expert) => expert.ownerId,
        ),
      ]);

    return {
      companies: companies.map(
        (company) => ({
          ...company,
          ...getEntityReviewRatingStats(
            reviewStats,
            company.ownerId,
          ),
        }),
      ),
      experts: experts.map(
        (expert) => ({
          ...expert,
          ...getEntityReviewRatingStats(
            reviewStats,
            expert.ownerId,
          ),
        }),
      ),
    };
  },
  ["top-rated-showcase"],
  {
    revalidate: 300,
  },
);

export default async function TopRatedShowcase({ locale, localized }: { locale: Locale; localized: boolean }) {
const t =
  await getTranslations(
    "topRatedShowcase",
  );

const tc = await getTranslations(
  "common.countries",
);

const ts = await getTranslations(
  "common.specialties",
);

const tcat = await getTranslations(
  "common.categories",
);


function translateCountry(
  country: string,
) {
  const value = country.trim();

  if (tc.has(value)) {
    return tc(value);
  }

  const lower = value.toLowerCase();

  if (tc.has(lower)) {
    return tc(lower);
  }

  return country;
}


function translateSpecialty(
  specialty: string,
) {
  const value = specialty.trim();

  if (ts.has(value)) {
    return ts(value);
  }

  const lower = value.toLowerCase();

  if (ts.has(lower)) {
    return ts(lower);
  }

  const normalized =
    lower.replaceAll(" ", "_");

  if (ts.has(normalized)) {
    return ts(normalized);
  }

  return specialty;
}


function translateCategory(
  category: string,
) {
  const value = category.trim();

  if (tcat.has(value)) {
    return tcat(value);
  }

  const lower = value.toLowerCase();

  if (tcat.has(lower)) {
    return tcat(lower);
  }

  const normalized =
    lower.replaceAll(" ", "_");

  if (tcat.has(normalized)) {
    return tcat(normalized);
  }

  return category;
}

  const {
    companies,
    experts,
  } = await getTopRatedData();

  const topCompany =
    companies
      .map((company) => {
        const averageRating =
          company.averageRating;

        const trustScore =
          calculateTrustScore({
            averageRating,
            completedCases: 0,
            verificationStatus:
              company.verificationStatus,
            planType:
              company.planType,
          });

        return {
          ...company,
          averageRating,
          reviewCount:
            company.reviewCount,
          trustScore,
        };
      })
      .sort(
        (a, b) =>
          b.trustScore -
            a.trustScore ||
          b.averageRating -
            a.averageRating ||
          b.reviewCount -
            a.reviewCount,
      )[0];

  const topExpert =
    experts
      .map((expert) => {
        const averageRating =
          expert.averageRating;

        const trustScore =
          calculateTrustScore({
            averageRating,
            completedCases: 0,
            verificationStatus:
              expert.verificationStatus,
            planType:
              expert.planType,
          });

        return {
          ...expert,
          averageRating,
          reviewCount:
            expert.reviewCount,
          trustScore,
        };
      })
      .sort(
        (a, b) =>
          b.trustScore -
            a.trustScore ||
          b.averageRating -
            a.averageRating ||
          b.reviewCount -
            a.reviewCount,
      )[0];

  if (!topCompany && !topExpert) {
    return null;
  }

  function ratingText(
    value: number,
  ) {
    return value > 0
      ? value.toFixed(1)
      : t("noReviews");
  }
    return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.2),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.16),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {t("eyebrow")}
            </div>


            <h2 className="mb-6 text-4xl font-black leading-tight md:text-6xl">
              {t("titleLine1")}

              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {t("titleLine2")}
              </span>
            </h2>


            <p className="mb-10 max-w-xl text-lg leading-8 text-slate-400">
              {t("description")}
            </p>


            <div className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-emerald-500/50">
                <p className="text-3xl font-black text-emerald-400">
                  ✓
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  {t("verifiedProfiles")}
                </p>
              </div>


              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-yellow-500/50">
                <p className="text-3xl font-black text-yellow-400">
                  ★
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  {t("reviewHistory")}
                </p>
              </div>


              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-blue-500/50">
                <p
                  dir="ltr"
                  className="text-3xl font-black text-blue-400"
                >
                  100
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  {t("trustScoring")}
                </p>
              </div>

            </div>
          </div>



          <div className="grid gap-6 md:grid-cols-2">

            {topCompany && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/80 p-7 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-2 hover:border-blue-500/60">

                <div className="mb-7">

                  <div className="mb-5 text-5xl">
                    🏆
                  </div>

                  <p className="mb-2 font-bold text-blue-400">
                    {t("topCompany")}
                  </p>

                  <h3 className="text-3xl font-black">
                    {topCompany.name}
                  </h3>

                  <p className="mt-2 text-slate-400">
                  {translateCategory(
  topCompany.category,
)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                   {translateCountry(
  topCompany.country,
)}
                  </p>

                </div>


                <span className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  ✓ {t("verified")}
                </span>


                <div className="mb-7 grid grid-cols-3 gap-3">

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-2xl font-black text-emerald-400"
                    >
                      {topCompany.trustScore}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("trust")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-xl font-black text-yellow-400"
                    >
                      {ratingText(
                        topCompany.averageRating,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("rating")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-2xl font-black text-blue-400"
                    >
                      {topCompany.reviewCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("reviews")}
                    </p>
                  </div>

                </div>


                <Link
                  href={`${localized ? `/${locale}` : ""}/companies/${topCompany.id}`}
                  className="flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-bold text-white transition hover:scale-[1.02]"
                >
                  {t("viewCompany")}
                </Link>

              </div>
            )}



            {topExpert && (
              <div className="group rounded-[2rem] border border-slate-800 bg-slate-900/80 p-7 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-2 hover:border-cyan-500/60">

                <div className="mb-7">

                  <div className="mb-5 text-5xl">
                    ⭐
                  </div>

                  <p className="mb-2 font-bold text-cyan-400">
                    {t("topExpert")}
                  </p>

                  <h3 className="text-3xl font-black">
                    {topExpert.name}
                  </h3>

                  <p className="mt-2 text-slate-400">
                   {translateSpecialty(
  topExpert.specialty,
)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                  {translateCountry(
  topExpert.country,
)}
                  </p>

                </div>


                <span className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  ✓ {t("verified")}
                </span>


                <div className="mb-7 grid grid-cols-3 gap-3">

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-2xl font-black text-emerald-400"
                    >
                      {topExpert.trustScore}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("trust")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-xl font-black text-yellow-400"
                    >
                      {ratingText(
                        topExpert.averageRating,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("rating")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p
                      dir="ltr"
                      className="text-2xl font-black text-blue-400"
                    >
                      {topExpert.reviewCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("reviews")}
                    </p>
                  </div>

                </div>


                <Link
                  href={`${localized ? `/${locale}` : ""}/experts/${topExpert.id}`}
                  className="flex w-full justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 font-bold text-white transition hover:scale-[1.02]"
                >
                  {t("viewExpert")}
                </Link>

              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
