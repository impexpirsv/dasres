"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCountry } from "../../lib/format";
interface Opportunity {
  id: number;
  title: string;
  country: string;
  status: string;
  description: string;
  imageUrl: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "OPEN") {
    return (
      <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm">
        Open
      </span>
    );
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return (
      <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm">
        In Progress
      </span>
    );
  }

  if (normalizedStatus === "CLOSED") {
    return (
      <span className="rounded-full bg-red-600 px-4 py-2 text-sm">
        Closed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-4 py-2 text-sm">
      {status}
    </span>
  );
}

export default function OpportunitiesSearch({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");

  const countries = Array.from(
    new Set(
      opportunities
        .map((opportunity) => opportunity.country?.trim())
        .filter(Boolean),
    ),
  );

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch =
      opportunity.title.toLowerCase().includes(search.toLowerCase()) ||
      opportunity.country.toLowerCase().includes(search.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(search.toLowerCase());

    const matchesCountry = country === "" || opportunity.country === country;

    const matchesStatus = status === "" || opportunity.status.toUpperCase() === status.toUpperCase();

    return matchesSearch && matchesCountry && matchesStatus;
  });

  const featuredOpportunities = filteredOpportunities.filter(
    (opportunity) => opportunity.status.toUpperCase() === "OPEN",
  );

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        <input
          type="text"
          placeholder="🔍 Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
        >
          <option value="">All Countries</option>

          {countries.map((country) => (
            <option key={country} value={country}>
             {formatCountry(country)}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {featuredOpportunities.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Featured Opportunities</h2>

            <p className="mt-2 text-slate-400">
              Active trade opportunities currently open for collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredOpportunities.slice(0, 4).map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="rounded-3xl border border-blue-500 bg-gradient-to-br from-slate-900 to-slate-950 p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="flex items-start gap-5">
                  {opportunity.imageUrl ? (
                    <img
                      src={opportunity.imageUrl}
                      alt={opportunity.title}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-4xl">
                      🌍
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <StatusBadge status={opportunity.status} />

                      <span className="inline-block rounded-lg bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                        {formatCountry(opportunity.country)}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold">{opportunity.title}</h3>

                    <p className="mt-3 line-clamp-3 text-slate-400">
                      {opportunity.description}
                    </p>

                    <span className="mt-6 inline-flex text-blue-400 hover:text-blue-300">
                      View Opportunity →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {filteredOpportunities.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h3 className="text-2xl font-bold">No opportunities found</h3>

          <p className="text-slate-400 mt-3">
            Try changing your search or filters.
          </p>
        </div>
      )}
      {filteredOpportunities.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {opportunity.imageUrl ? (
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-slate-800 text-5xl">
                  🌍
                </div>
              )}

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                    {formatCountry(opportunity.country)}
                  </span>

                  <StatusBadge status={opportunity.status} />
                </div>

                <h2 className="text-2xl font-bold">{opportunity.title}</h2>

                <p className="mt-3 line-clamp-3 text-slate-400">
                  {opportunity.description}
                </p>

                <span className="mt-5 inline-flex text-blue-400 hover:text-blue-300">
                  View Opportunity →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
