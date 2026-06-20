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
}

function VerificationBadge({ status }: { status: string }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-block bg-emerald-600 px-3 py-1 rounded text-sm">
        ✓ Verified
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-block bg-red-600 px-3 py-1 rounded text-sm">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-block bg-yellow-600 px-3 py-1 rounded text-sm">
      Pending
    </span>
  );
}

function PlanBadge({ planType }: { planType: string }) {
  if (planType === "ENTERPRISE") {
    return (
      <span className="inline-block bg-purple-600 px-3 py-1 rounded text-sm">
        👑 ENTERPRISE
      </span>
    );
  }

  if (planType === "DIAMOND") {
    return (
      <span className="inline-block bg-cyan-600 px-3 py-1 rounded text-sm">
        💎 DIAMOND
      </span>
    );
  }

  if (planType === "GOLD") {
    return (
      <span className="inline-block bg-yellow-600 px-3 py-1 rounded text-sm">
        🥇 GOLD
      </span>
    );
  }

  return null;
}

export default function ExpertsSearch({
  experts,
}: {
  experts: Expert[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

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

    return matchesSearch && matchesCountry;
  });

  const featuredExperts = filteredExperts.filter(
    (expert) =>
      expert.planType === "ENTERPRISE" ||
      expert.planType === "DIAMOND"
  );

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <input
          type="text"
          placeholder="Search experts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800"
        >
          <option value="">All Countries</option>

          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {featuredExperts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">
                Featured Experts
              </h2>

              <p className="text-slate-400 mt-2">
                Premium experts with higher visibility on Dasres.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredExperts.slice(0, 4).map((expert) => (
              <Link
                key={expert.id}
                href={`/experts/${expert.id}`}
                className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-yellow-500 hover:border-yellow-400"
              >
                <div className="flex items-start gap-5">
                  {expert.imageUrl && (
                    <img
                      src={expert.imageUrl}
                      alt={expert.name}
                      className="w-28 h-28 object-cover rounded-2xl"
                    />
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

                    {expert.reviewCount > 0 && (
                      <p className="text-yellow-400 mt-3 font-semibold">
                        ⭐ {expert.averageRating.toFixed(1)} ·{" "}
                        {expert.reviewCount} reviews
                      </p>
                    )}
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
            href={`/experts/${expert.id}`}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
          >
            {expert.imageUrl && (
              <img
                src={expert.imageUrl}
                alt={expert.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex justify-between items-start gap-3 mb-2">
              <h2 className="text-2xl font-bold">
                {expert.name}
              </h2>

              <div className="flex flex-wrap gap-2 justify-end">
                <VerificationBadge
                  status={expert.verificationStatus}
                />

                <PlanBadge planType={expert.planType} />
              </div>
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

            <p className="text-slate-400 mt-2">
              {expert.country}
            </p>

            <div className="mt-4 inline-block bg-green-600 px-3 py-1 rounded">
              {expert.status}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}