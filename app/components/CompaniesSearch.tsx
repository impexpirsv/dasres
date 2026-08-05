"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

interface Company {
  id: number;
  name: string;
  country: string;
  category: string;
  status: string;
  verificationStatus: string;
  description: string;
  website: string;
  logoUrl?: string | null;
  planType: string;
  averageRating: number;
  reviewCount: number;
  trustScore: number;
}

function trustColor(score: number) {
  if (score >= 90) {
    return "text-emerald-400";
  }

  if (score >= 70) {
    return "text-cyan-400";
  }

  if (score >= 50) {
    return "text-yellow-400";
  }

  return "text-red-400";
}

function VerificationBadge({
  status,
}: {
  status: string;
}) {
  const t = useTranslations(
    "companies.search.verification",
  );

  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        ✓ {t("verified")}
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        {t("rejected")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
      {t("pending")}
    </span>
  );
}

function PlanBadge({
  planType,
}: {
  planType: string;
}) {
  const t = useTranslations(
    "companies.search.plans",
  );

  if (planType === "ENTERPRISE") {
    return (
      <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
        👑 {t("enterprise")}
      </span>
    );
  }

  if (planType === "DIAMOND") {
    return (
      <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
        💎 {t("diamond")}
      </span>
    );
  }

  if (planType === "GOLD") {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
        🥇 {t("gold")}
      </span>
    );
  }

  return null;
}

export default function CompaniesSearch({
  companies,
  profileBasePath = "/companies",
}: {
  companies: Company[];
  profileBasePath?: string;
}) {
  const t = useTranslations(
    "companies.search",
  );
const tc = useTranslations(
  "common.countries",
);

const tcat = useTranslations(
  "common.categories",
);
  const locale = useLocale();

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const ratingFormatter =
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const [search, setSearch] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [ratingFilter, setRatingFilter] =
    useState("");

  const [verifiedOnly, setVerifiedOnly] =
    useState(false);
function translateCountry(value: string) {
  return tc.has(value)
    ? tc(value)
    : tc.has(value.toLowerCase())
    ? tc(value.toLowerCase())
    : value;
}


function translateCategory(value: string) {
  return tcat.has(value)
    ? tcat(value)
    : tcat.has(
        value.toLowerCase().replaceAll(" ", "_"),
      )
    ? tcat(
        value.toLowerCase().replaceAll(" ", "_"),
      )
    : value;
}
  const countries = Array.from(
    new Set(
      companies
        .map(
          (company) =>
            company.country,
        )
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b),
  );

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredCompanies =
    companies.filter((company) => {
      const matchesSearch =
        normalizedSearch === "" ||
        company.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        company.country
          .toLowerCase()
          .includes(normalizedSearch) ||
        company.category
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCountry =
        country === "" ||
        company.country === country;

      const matchesRating =
        ratingFilter === "" ||
        (ratingFilter === "5" &&
          company.averageRating === 5) ||
        (ratingFilter === "4" &&
          company.averageRating >= 4);

      const matchesVerified =
        !verifiedOnly ||
        company.verificationStatus ===
          "VERIFIED";

      return (
        matchesSearch &&
        matchesCountry &&
        matchesRating &&
        matchesVerified
      );
    });

  const featuredCompanies =
    filteredCompanies.filter(
      (company) =>
        company.planType ===
          "ENTERPRISE" ||
        company.planType ===
          "DIAMOND",
    );
      return (
    <>
      <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur">

        <div className="grid gap-4 lg:grid-cols-4">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="ui-field"
          />


          <select
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            aria-label={t("countryLabel")}
            className="ui-field"
          >
            <option value="">
              {t("allCountries")}
            </option>

            {countries.map(
              (countryName) => (
                <option
                  key={countryName}
                  value={countryName}
                >
                  {countryName}
                </option>
              ),
            )}
          </select>


          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value)
            }
            aria-label={t("ratingFilterLabel")}
            className="ui-field"
          >
            <option value="">
              {t("allRatings")}
            </option>

            <option value="5">
              {t("fiveStars")}
            </option>

            <option value="4">
              {t("fourPlusStars")}
            </option>

          </select>


          <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-300 transition hover:border-blue-500">

            <input
              type="checkbox"
              checked={verifiedOnly}
              className="ui-checkbox me-3 shrink-0"
              onChange={(e) =>
                setVerifiedOnly(
                  e.target.checked,
                )
              }
            />

            {t("verifiedOnly")}

          </label>

        </div>

      </div>



      {featuredCompanies.length > 0 && (
        <div className="mb-14">

          <div className="mb-7">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
              {t("featured.title")}
            </p>

            <p className="text-slate-400">
              {t("featured.description")}
            </p>
          </div>


          <div className="grid gap-6 md:grid-cols-2">

            {featuredCompanies
              .slice(0, 4)
              .map((company) => (

              <Link
                key={company.id}
                href={`${profileBasePath}/${company.id}`}
                className="
                  group
                  rounded-[2rem]
                  border
                  border-yellow-500/30
                  bg-gradient-to-br
                  from-slate-900
                  to-slate-950
                  p-7
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:border-yellow-400
                  hover:shadow-2xl
                  hover:shadow-yellow-500/10
                "
              >

                <div className="flex gap-5">

                  {company.logoUrl ? (
                    <Image
                      src={company.logoUrl}
                      alt={company.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 shrink-0 rounded-2xl bg-white object-contain p-3"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-4xl">
                      🏢
                    </div>
                  )}


                  <div className="min-w-0">

                    <div className="mb-3 flex flex-wrap gap-2">
                      <PlanBadge
                        planType={
                          company.planType
                        }
                      />

                      <VerificationBadge
                        status={
                          company.verificationStatus
                        }
                      />
                    </div>


                    <h3 className="break-words text-2xl font-black">
                      {company.name}
                    </h3>


                  <p className="mt-1 text-blue-400">
  {translateCategory(company.category)}
</p>


                    <p className="mt-1 text-sm text-slate-500">
  {translateCountry(company.country)}
</p>

                  </div>

                </div>


                <div className="mt-7 grid grid-cols-3 gap-3">

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p className={`text-xl font-black ${trustColor(company.trustScore)}`}>
                      {numberFormatter.format(
                        company.trustScore,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.trust")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p className="text-xl font-black text-yellow-400">
                      {company.averageRating > 0
                        ? ratingFormatter.format(
                            company.averageRating,
                          )
                        : t("notAvailable")}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.rating")}
                    </p>
                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p className="text-xl font-black text-blue-400">
                      {numberFormatter.format(
                        company.reviewCount,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.reviews")}
                    </p>
                  </div>

                </div>


                <p className="mt-6 text-sm font-semibold text-blue-400 transition group-hover:text-cyan-300">
                  {t("viewProfile")} →
                </p>


              </Link>

            ))}

          </div>

        </div>
      )}


      {filteredCompanies.length === 0 ? (

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
          {t("empty")}
        </div>

      ) : (

        <div className="grid gap-6 md:grid-cols-3">

          {filteredCompanies.map(
            (company) => (

            <Link
              key={company.id}
              href={`${profileBasePath}/${company.id}`}
              className="
                group
                rounded-[2rem]
                border
                border-slate-800
                bg-slate-900/70
                p-6
                transition-all
                duration-300
                hover:-translate-y-2
                hover:border-blue-500/60
                hover:shadow-2xl
                hover:shadow-blue-500/10
              "
            >

              {company.logoUrl && (
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={800}
                  height={400}
                  className="mb-5 h-40 w-full rounded-2xl bg-white object-contain p-4"
                />
              )}


              <div className="mb-5 flex items-start justify-between gap-3">

                <div className="flex min-w-0 gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-xl">
                    🏢
                  </div>

                  <div>
                    <h2 className="break-words text-xl font-black">
                      {company.name}
                    </h2>

                   <p className="text-sm text-slate-500">
  {translateCountry(company.country)}
</p>
                  </div>

                </div>


                <VerificationBadge
                  status={
                    company.verificationStatus
                  }
                />

              </div>


            <p className="text-blue-400">
  {translateCategory(company.category)}
</p>


              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                {company.description}
              </p>


              <div className="mt-5 grid grid-cols-3 gap-3">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className={`font-bold ${trustColor(company.trustScore)}`}>
                    {numberFormatter.format(
                      company.trustScore,
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.trust")}
                  </p>
                </div>


                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="font-bold text-yellow-400">
                    {company.averageRating > 0
                      ? ratingFormatter.format(
                          company.averageRating,
                        )
                      : t("notAvailable")}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.rating")}
                  </p>
                </div>


                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="font-bold text-blue-400">
                    {numberFormatter.format(
                      company.reviewCount,
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.reviews")}
                  </p>
                </div>

              </div>


              <div className="mt-5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {t("available")}
              </div>


            </Link>

          ))}

        </div>

      )}

    </>
  );
}
