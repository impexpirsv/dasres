"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function ExpertsSearch({
  experts,
  profileBasePath = "/experts",
}: {
  experts: Expert[];
  profileBasePath?: string;
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const countries = Array.from(
    new Set(experts.map((expert) => expert.country))
  );

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.name.toLowerCase().includes(search.toLowerCase()) ||
      expert.country.toLowerCase().includes(search.toLowerCase()) ||
      expert.specialty.toLowerCase().includes(search.toLowerCase());

    const matchesCountry =
      country === "" || expert.country === country;

    const matchesRating =
      ratingFilter === "" ||
      (ratingFilter === "5" && expert.averageRating === 5) ||
      (ratingFilter === "4" && expert.averageRating >= 4);

    const matchesVerified =
      !verifiedOnly ||
      expert.verificationStatus === "VERIFIED";

    return (
      matchesSearch &&
      matchesCountry &&
      matchesRating &&
      matchesVerified
    );
  });

  const featuredExperts = filteredExperts.filter(
    (expert) =>
      expert.planType === "ENTERPRISE" ||
      expert.planType === "DIAMOND"
  );

  return (
    <>
      <div className="grid lg:grid-cols-4 gap-4 mb-10">
        <input
          type="text"
          placeholder="🔍 Search experts..."
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

      {featuredExperts.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">
              Featured Experts
            </h2>

            <p className="text-slate-400 mt-2">
              Premium experts with higher visibility on Dasres.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredExperts.slice(0, 4).map((expert) => (
              <Link
                key={expert.id}
                href={`${profileBasePath}/${expert.id}`}
                className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-yellow-500 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20"
              >
                <div className="flex items-start gap-5">
                  {expert.imageUrl ? (
                    <img
                      src={expert.imageUrl}
                      alt={expert.name}
                      className="w-24 h-24 object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <PlanBadge planType={expert.planType} />
                      <VerificationBadge
                        status={expert.verificationStatus}
                      />
                    </div>

                    <h3 className="text-2xl font-bold">
                      {expert.name}
                    </h3>

                    <p className="text-blue-400 mt-1">
                      {expert.specialty}
                    </p>

                    <p className="text-slate-400 mt-2">
                      {expert.country}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mt-5">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p
                          className={`text-xl font-bold ${trustColor(
                            expert.trustScore
                          )}`}
                        >
                          {expert.trustScore}
                        </p>
                        <p className="text-xs text-slate-500">
                          Trust
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xl font-bold text-yellow-400">
                          {expert.averageRating > 0
                            ? expert.averageRating.toFixed(1)
                            : "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Rating
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xl font-bold text-blue-400">
                          {expert.reviewCount}
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
        {filteredExperts.map((expert) => (
          <Link
            key={expert.id}
            href={`${profileBasePath}/${expert.id}`}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            {expert.imageUrl && (
              <img
                src={expert.imageUrl}
                alt={expert.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                  👤
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {expert.name}
                  </h2>

                  <p className="text-slate-500 text-sm">
                    {expert.country}
                  </p>
                </div>
              </div>

              <VerificationBadge
                status={expert.verificationStatus}
              />
            </div>

            <p className="text-blue-400">
              {expert.specialty}
            </p>

            {expert.reviewCount > 0 ? (
              <div className="mt-3 text-yellow-400 font-semibold">
                ⭐ {expert.averageRating.toFixed(1)} (
                {expert.reviewCount}{" "}
                {expert.reviewCount > 1 ? "reviews" : "review"})
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
                    expert.trustScore
                  )}`}
                >
                  {expert.trustScore}
                </p>
                <p className="text-xs text-slate-500">
                  Trust
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-lg font-bold text-yellow-400">
                  {expert.averageRating > 0
                    ? expert.averageRating.toFixed(1)
                    : "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  Rating
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-lg font-bold text-blue-400">
                  {expert.reviewCount}
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