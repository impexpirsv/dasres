"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Expert {
  id: number;
  name: string;
  country: string;
  specialty: string;
  status: string;
  verificationStatus: string;
 experience: string;
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

function VerificationBadge({ status }: { status: string }) {
  const t = useTranslations("experts.search.verification");

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

function PlanBadge({ planType }: { planType: string }) {
  const t = useTranslations("experts.search.plans");

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

export default function ExpertsSearch({
  experts,
  profileBasePath = "/experts",
}: {
  experts: Expert[];
  profileBasePath?: string;
}) {
  const t = useTranslations("experts.search");

  const tc = useTranslations("common.countries");
  const ts = useTranslations("common.specialties");
  const common = useTranslations("common");
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale);

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const [search, setSearch] = useState("");

  const [country, setCountry] = useState("");

  const [ratingFilter, setRatingFilter] = useState("");

  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const countries = Array.from(
    new Set(experts.map((expert) => expert.country).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      normalizedSearch === "" ||
      expert.name.toLowerCase().includes(normalizedSearch) ||
      expert.country.toLowerCase().includes(normalizedSearch) ||
      expert.specialty.toLowerCase().includes(normalizedSearch);

    const matchesCountry = country === "" || expert.country === country;

    const matchesRating =
      ratingFilter === "" ||
      (ratingFilter === "5" && expert.averageRating === 5) ||
      (ratingFilter === "4" && expert.averageRating >= 4);

    const matchesVerified =
      !verifiedOnly || expert.verificationStatus === "VERIFIED";

    return matchesSearch && matchesCountry && matchesRating && matchesVerified;
  });

  const featuredExperts = filteredExperts.filter(
    (expert) =>
      expert.planType === "ENTERPRISE" || expert.planType === "DIAMOND",
  );
  return (
    <>
      <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="ui-field"
          />

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label={t("countryLabel")}
            className="ui-field"
          >
            <option value="">{t("allCountries")}</option>

            {countries.map((item) => (
              <option key={item} value={item}>
                {tc(item)}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            aria-label={t("ratingFilterLabel")}
            className="ui-field"
          >
            <option value="">{t("allRatings")}</option>

            <option value="5">{t("fiveStars")}</option>

            <option value="4">{t("fourPlusStars")}</option>
          </select>

          <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-300 transition hover:border-blue-500">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="ui-checkbox me-3"
            />

            {t("verifiedOnly")}
          </label>
        </div>
      </div>

      {featuredExperts.length > 0 && (
        <section className="mb-14">
          <div className="mb-7">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
              {t("featured.title")}
            </p>

            <p className="text-slate-400">{t("featured.description")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredExperts.slice(0, 4).map((expert) => (
              <Link
                key={expert.id}
                href={`${profileBasePath}/${expert.id}`}
                className="
                  group
                  rounded-[2rem]
                  border
                  border-cyan-500/30
                  bg-gradient-to-br
                  from-slate-900
                  to-slate-950
                  p-7
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:border-cyan-400
                  hover:shadow-2xl
                  hover:shadow-cyan-500/10
                "
              >
                <div className="flex gap-5">
                  {expert.imageUrl ? (
                    <Image
                      src={expert.imageUrl}
                      alt={expert.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-4xl">
                      👤
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <PlanBadge planType={expert.planType} />

                      <VerificationBadge status={expert.verificationStatus} />
                    </div>

                    <h3 className="text-2xl font-black">{expert.name}</h3>

                    <p className="mt-1 text-cyan-400">{ts(expert.specialty)}</p>

                    <p className="mt-1 text-sm text-slate-500">
                      {tc(expert.country)}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p
                      className={`text-xl font-black ${trustColor(expert.trustScore)}`}
                    >
                      {numberFormatter.format(expert.trustScore)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.trust")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p className="text-xl font-black text-yellow-400">
                      {expert.averageRating > 0
                        ? ratingFormatter.format(expert.averageRating)
                        : t("notAvailable")}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.rating")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                    <p className="text-xl font-black text-blue-400">
                      {numberFormatter.format(expert.reviewCount)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("metrics.reviews")}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm font-semibold text-cyan-400 transition group-hover:text-blue-300">
                  {t("viewProfile")} →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredExperts.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredExperts.map((expert) => {
            return (
              <Link
                key={expert.id}
                href={`${profileBasePath}/${expert.id}`}
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
                hover:border-cyan-500/60
                hover:shadow-2xl
                hover:shadow-cyan-500/10
              "
              >
                <div className="mb-5 flex items-center gap-4">
                  {expert.imageUrl ? (
                    <Image
                      src={expert.imageUrl}
                      alt={expert.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                      👤
                    </div>
                  )}

                <div>
  <h2 className="text-xl font-black">
    {expert.name}
  </h2>

 <p className="text-sm text-slate-500">
 {common("years", {
  count: Number(
    expert.experience.replace(/\D/g, ""),
  ),
})}
</p>
</div>
</div>

<VerificationBadge status={expert.verificationStatus} />

                <p className="mt-4 text-cyan-400">{ts(expert.specialty)}</p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <p className={`font-bold ${trustColor(expert.trustScore)}`}>
                      {numberFormatter.format(expert.trustScore)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {t("metrics.trust")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <p className="font-bold text-yellow-400">
                      {expert.averageRating > 0
                        ? ratingFormatter.format(expert.averageRating)
                        : t("notAvailable")}
                    </p>

                    <p className="text-xs text-slate-500">
                      {t("metrics.rating")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <p className="font-bold text-blue-400">
                      {numberFormatter.format(expert.reviewCount)}
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
            );
          })}
        </div>
      )}
    </>
  );
}
