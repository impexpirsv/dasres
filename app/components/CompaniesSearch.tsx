"use client";

import { useState } from "react";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  country: string;
  category: string;
  status: string;
  description: string;
  email: string;
  website: string;
  logoUrl?: string | null;

  averageRating: number;
  reviewCount: number;
}

export default function CompaniesSearch({
  companies,
}: {
  companies: Company[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  const countries = Array.from(
    new Set(companies.map((company) => company.country)),
  );

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.country.toLowerCase().includes(search.toLowerCase()) ||
      company.category.toLowerCase().includes(search.toLowerCase());

    const matchesCountry = country === "" || company.country === country;

    return matchesSearch && matchesCountry;
  });

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

      <div className="grid md:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
          >
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-40 object-contain rounded-xl mb-4 bg-white p-3"
              />
            )}
            <h2 className="text-2xl font-bold mb-2">{company.name}</h2>

            <p className="text-blue-400">{company.category}</p>

            {company.reviewCount > 0 ? (
              <div className="mt-3 text-yellow-400 font-semibold">
                ⭐ {company.averageRating.toFixed(1)} ({company.reviewCount}{" "}
                {company.reviewCount > 1 ? "reviews" : "review"})
              </div>
            ) : (
              <div className="mt-3 text-slate-500">No rating yet</div>
            )}

            <p className="text-slate-400 mt-2">{company.country}</p>

            <div className="mt-4 inline-block bg-green-600 px-3 py-1 rounded">
              {company.status}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
