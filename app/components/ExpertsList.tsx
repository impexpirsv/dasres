"use client";

import { useState } from "react";
import DirectoryCard from "./DirectoryCard";
import SearchBox from "./SearchBox";
import CountryFilter from "./CountryFilter";

type Expert = {
  id: number;
  name: string;
  country: string;
  specialty: string;
  status: string;
  experience: string;
  email: string;
};

export default function ExpertsList({ experts }: { experts: Expert[] }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  return (
    <>
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search experts..."
      />

      <CountryFilter
        value={country}
        onChange={setCountry}
        countries={["China", "UAE", "Turkey"]}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {experts
          .filter((expert) => {
            const matchesSearch = expert.name
              .toLowerCase()
              .includes(search.toLowerCase());

            const matchesCountry =
              country === "" || expert.country === country;

            return matchesSearch && matchesCountry;
          })
          .map((expert) => (
            <DirectoryCard
              key={expert.id}
              href={`/experts/${expert.id}`}
              title={expert.name}
              subtitle={expert.specialty}
              location={expert.country}
              description={expert.experience}
              status={expert.status}
            />
          ))}
      </div>
    </>
  );
}