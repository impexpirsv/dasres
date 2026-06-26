"use client";

import { useState } from "react";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  country: string;
  category: string;
  status: string;
  verificationStatus: string;
  description: string;
  email: string;
  website: string;
  logoUrl?: string | null;
  planType: string;
  averageRating: number;
  reviewCount: number;
  trustScore: number;
}

function trustColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function VerificationBadge({ status }: { status: string }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-block bg-emerald-600 px-3 py-1 rounded-lg text-sm">
        ✓ Verified
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-block bg-red-600 px-3 py-1 rounded-lg text-sm">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-block bg-yellow-600 px-3 py-1 rounded-lg text-sm">
      Pending
    </span>
  );
}

function PlanBadge({ planType }: { planType: string }) {
  if (planType === "ENTERPRISE") {
    return (
      <span className="inline-block bg-purple-600 px-3 py-1 rounded-lg text-sm">
        👑 ENTERPRISE
      </span>
    );
  }

  if (planType === "DIAMOND") {
    return (
      <span className="inline-block bg-cyan-600 px-3 py-1 rounded-lg text-sm">
        💎 DIAMOND
      </span>
    );
  }

  if (planType === "GOLD") {
    return (
      <span className="inline-block bg-yellow-600 px-3 py-1 rounded-lg text-sm">
        🥇 GOLD
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
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const countries = Array.from(
    new Set(companies.map((company) => company.country))
  );

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.country.toLowerCase().includes(search.toLowerCase()) ||
      company.category.toLowerCase().includes(search.toLowerCase());

    const matchesCountry =
      country === "" || company.country === country;

    const matchesRating =
      ratingFilter === "" ||
      (ratingFilter === "5" && company.averageRating === 5) ||
      (ratingFilter === "4" && company.averageRating >= 4);

    const matchesVerified =
      !verifiedOnly ||
      company.verificationStatus === "VERIFIED";

    return (
      matchesSearch &&
      matchesCountry &&
      matchesRating &&
      matchesVerified
    );
  });

  const featuredCompanies = filteredCompanies.filter(
    (company) =>
      company.planType === "ENTERPRISE" ||
      company.planType === "DIAMOND"
  );

  return (
    <>
      <div className="grid lg:grid-cols-4 gap-4 mb-10">
        <input
          type="text"
          placeholder="🔍 Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
        >
          <option value="">All Countries</option>

          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
        </select>

        <label className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 text-slate-300">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="mr-3"
          />
          Verified Only
        </label>
      </div>

      {featuredCompanies.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">
              Featured Companies
            </h2>

            <p className="text-slate-400 mt-2">
              Premium trade companies with higher visibility on Dasres.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredCompanies.slice(0, 4).map((company) => (
              <Link
                key={company.id}
                href={`${profileBasePath}/${company.id}`}
                className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-yellow-500 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20"
              >
                <div className="flex items-start gap-5">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-24 h-24 object-contain rounded-2xl bg-white p-3"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl">
                      🏢
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <PlanBadge planType={company.planType} />
                      <VerificationBadge
                        status={company.verificationStatus}
                      />
                    </div>

                    <h3 className="text-2xl font-bold">
                      {company.name}
                    </h3>

                    <p className="text-blue-400 mt-1">
                      {company.category}
                    </p>

                    <p className="text-slate-400 mt-2">
                      {company.country}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mt-5">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p
                          className={`text-xl font-bold ${trustColor(
                            company.trustScore
                          )}`}
                        >
                          {company.trustScore}
                        </p>
                        <p className="text-xs text-slate-500">
                          Trust
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xl font-bold text-yellow-400">
                          {company.averageRating > 0
                            ? company.averageRating.toFixed(1)
                            : "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Rating
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xl font-bold text-blue-400">
                          {company.reviewCount}
                        </p>
                        <p className="text-xs text-slate-500">
                          Reviews
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex mt-6 text-blue-400 hover:text-blue-300">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Link
            key={company.id}
            href={`${profileBasePath}/${company.id}`}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-40 object-contain rounded-xl mb-4 bg-white p-3"
              />
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                  🏢
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {company.name}
                  </h2>

                  <p className="text-slate-500 text-sm">
                    {company.country}
                  </p>
                </div>
              </div>

              <VerificationBadge
                status={company.verificationStatus}
              />
            </div>

            <p className="text-blue-400">
              {company.category}
            </p>

            <p className="text-slate-500 mt-3 line-clamp-2">
              {company.description}
            </p>

            {company.reviewCount > 0 ? (
              <div className="mt-3 text-yellow-400 font-semibold">
                ⭐ {company.averageRating.toFixed(1)} (
                {company.reviewCount}{" "}
                {company.reviewCount > 1 ? "reviews" : "review"})
              </div>
            ) : (
              <div className="mt-3 text-slate-500">
                No rating yet
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p
                  className={`text-lg font-bold ${trustColor(
                    company.trustScore
                  )}`}
                >
                  {company.trustScore}
                </p>
                <p className="text-xs text-slate-500">
                  Trust
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-lg font-bold text-yellow-400">
                  {company.averageRating > 0
                    ? company.averageRating.toFixed(1)
                    : "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  Rating
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-lg font-bold text-blue-400">
                  {company.reviewCount}
                </p>
                <p className="text-xs text-slate-500">
                  Reviews
                </p>
              </div>
            </div>

            <div className="mt-5 inline-block bg-green-600 px-3 py-1 rounded-lg">
              Available
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}