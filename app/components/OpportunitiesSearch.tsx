"use client";

import { useState } from "react";
import Link from "next/link";

interface Opportunity {
  id: number;
  title: string;
  country: string;
  status: string;
  description: string;
  imageUrl: string | null;
}

export default function OpportunitiesSearch({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  const countries = Array.from(
    new Set(
      opportunities
        .map((opportunity) =>
          opportunity.country?.trim()
        )
        .filter(Boolean)
    )
  );

  const filteredOpportunities =
    opportunities.filter((opportunity) => {
      const matchesSearch =
        opportunity.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        opportunity.country
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        opportunity.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCountry =
        country === "" ||
        opportunity.country === country;

      return matchesSearch && matchesCountry;
    });

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800"
        />

        <select
          value={country}
          onChange={(e) =>
            setCountry(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800"
        >
          <option value="">All Countries</option>

          {countries.map((country) => (
            <option
              key={country}
              value={country}
            >
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredOpportunities.map(
          (opportunity) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500"
            >
              {opportunity.imageUrl && (
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">
                  {opportunity.title}
                </h2>

                <p className="text-blue-400">
                  {opportunity.country}
                </p>

                <p className="text-slate-400 mt-2">
                  {opportunity.description.slice(
                    0,
                    100
                  )}
                  ...
                </p>

                <div className="mt-4 inline-block bg-green-600 px-3 py-1 rounded">
                  {opportunity.status}
                </div>
              </div>
            </Link>
          )
        )}
      </div>
    </>
  );
}