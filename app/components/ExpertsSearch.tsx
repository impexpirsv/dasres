"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Expert {
  id: number;
  name: string;
  country: string;
  specialty: string;
  status: string;
  verificationStatus: string;
  experience: string;
  email: string;
  imageUrl?: string | null;
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
    "experts.search.verification",
  );

  if (status === "VERIFIED") {
    return (
      <span className="inline-block rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white">
        ✓ {t("verified")}
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-block rounded-lg bg-red-600 px-3 py-1 text-sm text-white">
        {t("rejected")}
      </span>
    );
  }

  return (
    <span className="inline-block rounded-lg bg-yellow-600 px-3 py-1 text-sm text-black">
      {t("pending")}
    </span>
  );
}

function PlanBadge({
  planType,
}: {
  planType: string;
}) {
  const t = useTranslations("experts.search.plans");

  if (planType === "ENTERPRISE") {
    return (
      <span className="inline-block rounded-lg bg-purple-600 px-3 py-1 text-sm text-white">
        👑 {t("enterprise")}
      </span>
    );
  }

  if (planType === "DIAMOND") {
    return (
      <span className="inline-block rounded-lg bg-cyan-600 px-3 py-1 text-sm text-black">
        💎 {t("diamond")}
      </span>
    );
  }

  if (planType === "GOLD") {
    return (
      <span className="inline-block rounded-lg bg-yellow-600 px-3 py-1 text-sm text-black">
        🥇 {t("gold")}
      </span>
    );
  }

  return null;
}

export default function ExpertsSearch({
  experts,
  profileBasePath = "/experts",
}: {
  experts: Expert[];
  profileBasePath?: string;
}) {
  const t = useTranslations("experts.search");

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [ratingFilter, setRatingFilter] =
    useState("");
  const [verifiedOnly, setVerifiedOnly] =
    useState(false);

  const countries = Array.from(
    new Set(
      experts
        .map((expert) => expert.country)
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredExperts = experts.filter(
    (expert) => {
      const matchesSearch =
        normalizedSearch === "" ||
        expert.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        expert.country
          .toLowerCase()
          .includes(normalizedSearch) ||
        expert.specialty
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCountry =
        country === "" ||
        expert.country === country;

      const matchesRating =
        ratingFilter === "" ||
        (ratingFilter === "5" &&
          expert.averageRating === 5) ||
        (ratingFilter === "4" &&
          expert.averageRating >= 4);

      const matchesVerified =
        !verifiedOnly ||
        expert.verificationStatus === "VERIFIED";

      return (
        matchesSearch &&
        matchesCountry &&
        matchesRating &&
        matchesVerified
      );
    },
  );

  const featuredExperts = filteredExperts.filter(
    (expert) =>
      expert.planType === "ENTERPRISE" ||
      expert.planType === "DIAMOND",
  );

  return (
    <>
      <div className="mb-10 grid gap-4 lg:grid-cols-4">
        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
        />

        <select
          value={country}
          onChange={(e) =>
            setCountry(e.target.value)
          }
          aria-label={t("countryLabel")}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
        >
          <option value="">
            {t("allCountries")}
          </option>

          {countries.map((countryName) => (
            <option
              key={countryName}
              value={countryName}
            >
              {countryName}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) =>
            setRatingFilter(e.target.value)
          }
          aria-label={t("ratingFilterLabel")}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
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

        <label className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 text-slate-300">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) =>
              setVerifiedOnly(e.target.checked)
            }
            className="me-3"
          />

          {t("verifiedOnly")}
        </label>
      </div>

      {featuredExperts.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">
              {t("featured.title")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t("featured.description")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredExperts
              .slice(0, 4)
              .map((expert) => (
                <Link
                  key={expert.id}
                  href={`${profileBasePath}/${expert.id}`}
                  className="rounded-3xl border border-yellow-500 bg-gradient-to-br from-slate-900 to-slate-950 p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20"
                >
                  <div className="flex items-start gap-5">
                    {expert.imageUrl ? (
                    <Image
  src={expert.imageUrl}
  alt={expert.name}
  width={96}
  height={96}
  className="h-24 w-24 rounded-2xl object-cover"
/>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-4xl">
                        👤
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <PlanBadge
                          planType={expert.planType}
                        />

                        <VerificationBadge
                          status={
                            expert.verificationStatus
                          }
                        />
                      </div>

                      <h3 className="break-words text-2xl font-bold">
                        {expert.name}
                      </h3>

                      <p className="mt-1 text-blue-400">
                        {expert.specialty}
                      </p>

                      <p className="mt-2 text-slate-400">
                        {expert.country}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                          <p
                            className={`text-xl font-bold ${trustColor(
                              expert.trustScore,
                            )}`}
                          >
                            {expert.trustScore}
                          </p>

                          <p className="text-xs text-slate-500">
                            {t("metrics.trust")}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                          <p className="text-xl font-bold text-yellow-400">
                            {expert.averageRating > 0
                              ? expert.averageRating.toFixed(
                                  1,
                                )
                              : t("notAvailable")}
                          </p>

                          <p className="text-xs text-slate-500">
                            {t("metrics.rating")}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                          <p className="text-xl font-bold text-blue-400">
                            {expert.reviewCount}
                          </p>

                          <p className="text-xs text-slate-500">
                            {t("metrics.reviews")}
                          </p>
                        </div>
                      </div>

                      <span className="mt-6 inline-flex text-blue-400 hover:text-blue-300">
                        {t("viewProfile")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {filteredExperts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredExperts.map((expert) => (
            <Link
              key={expert.id}
              href={`${profileBasePath}/${expert.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {expert.imageUrl && (
             <Image
  src={expert.imageUrl}
  alt={expert.name}
  width={800}
  height={400}
  className="mb-4 h-48 w-full rounded-xl object-cover"
/>
              )}

              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl">
                    👤
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words text-2xl font-bold">
                      {expert.name}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {expert.country}
                    </p>
                  </div>
                </div>

                <VerificationBadge
                  status={
                    expert.verificationStatus
                  }
                />
              </div>

              <p className="text-blue-400">
                {expert.specialty}
              </p>

              {expert.experience && (
                <p className="mt-3 line-clamp-2 text-slate-500">
                  {expert.experience}
                </p>
              )}

              {expert.reviewCount > 0 ? (
                <div className="mt-3 font-semibold text-yellow-400">
                  ⭐{" "}
                  {expert.averageRating.toFixed(1)}{" "}
                  (
                  {t("reviewCount", {
                    count: expert.reviewCount,
                  })}
                  )
                </div>
              ) : (
                <div className="mt-3 text-slate-500">
                  {t("noRating")}
                </div>
              )}

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p
                    className={`text-lg font-bold ${trustColor(
                      expert.trustScore,
                    )}`}
                  >
                    {expert.trustScore}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.trust")}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-lg font-bold text-yellow-400">
                    {expert.averageRating > 0
                      ? expert.averageRating.toFixed(1)
                      : t("notAvailable")}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.rating")}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-lg font-bold text-blue-400">
                    {expert.reviewCount}
                  </p>

                  <p className="text-xs text-slate-500">
                    {t("metrics.reviews")}
                  </p>
                </div>
              </div>

              <div className="mt-5 inline-block rounded-lg bg-green-600 px-3 py-1 text-white">
                {t("available")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}