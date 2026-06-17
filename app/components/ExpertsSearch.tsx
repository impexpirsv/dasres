"use client";

import { useState } from "react";
import Link from "next/link";

interface Expert {
  id: number;
  name: string;
  country: string;
  specialty: string;
  status: string;
  experience: string;
  email: string;
  imageUrl?: string | null;
  averageRating: number;
  reviewCount: number;
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
      expert.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      expert.country
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      expert.specialty
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCountry =
      country === "" || expert.country === country;

    return matchesSearch && matchesCountry;
  });

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

            <h2 className="text-2xl font-bold mb-2">
              {expert.name}
            </h2>

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