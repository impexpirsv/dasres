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
}

function VerificationBadge({
  status,
}: {
  status: string;
}) {
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
export default function CompaniesSearch({
  companies,
}: {
  companies: Company[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

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

    return matchesSearch && matchesCountry;
  });
const featuredCompanies = filteredCompanies.filter(
  (company) =>
    company.planType === "ENTERPRISE" ||
    company.planType === "DIAMOND"
);
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <input
          type="text"
          placeholder="Search companies..."
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
{featuredCompanies.length > 0 && (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold">
          Featured Companies
        </h2>

        <p className="text-slate-400 mt-2">
          Premium trade companies with higher visibility on Dasres.
        </p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      {featuredCompanies.slice(0, 4).map((company) => (
        <Link
          key={company.id}
          href={`/dashboard/companies/${company.id}`}
          className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-yellow-500 hover:border-yellow-400"
        >
          <div className="flex items-start gap-5">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-28 h-28 object-contain rounded-2xl bg-white p-3"
              />
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

              {company.reviewCount > 0 && (
                <p className="text-yellow-400 mt-3 font-semibold">
                  ⭐ {company.averageRating.toFixed(1)} ·{" "}
                  {company.reviewCount} reviews
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
        {filteredCompanies.map((company) => (
          <Link
            key={company.id}
            href={`/dashboard/companies/${company.id}`}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
          >
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-40 object-contain rounded-xl mb-4 bg-white p-3"
              />
            )}

            <div className="flex justify-between items-start gap-3 mb-2">
              <h2 className="text-2xl font-bold">
                {company.name}
              </h2>

              <VerificationBadge
                status={company.verificationStatus}
              />
              <PlanBadge planType={company.planType} />
            </div>

            <p className="text-blue-400">
              {company.category}
            </p>

            {company.reviewCount > 0 ? (
              <div className="mt-3 text-yellow-400 font-semibold">
                ⭐ {company.averageRating.toFixed(1)} (
                {company.reviewCount}{" "}
                {company.reviewCount > 1
                  ? "reviews"
                  : "review"})
              </div>
            ) : (
              <div className="mt-3 text-slate-500">
                No rating yet
              </div>
            )}

            <p className="text-slate-400 mt-2">
              {company.country}
            </p>

            <div className="mt-4 inline-block bg-green-600 px-3 py-1 rounded">
              {company.status}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}