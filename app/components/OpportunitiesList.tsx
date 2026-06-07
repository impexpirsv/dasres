"use client";

import { useState } from "react";
import DirectoryCard from "./DirectoryCard.tsx";
import SearchBox from "./SearchBox.tsx";
import CountryFilter from "./CountryFilter.tsx";

type Opportunity = {
  id: number;
  title: string;
  country: string;
  status: string;
  description: string;
};

export default function OpportunitiesList({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  return (
    <>
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search opportunities..."
      />

      <CountryFilter
        value={country}
        onChange={setCountry}
        countries={["China", "Germany", "Turkey"]}
      />

      <div className="space-y-6">
        {opportunities
          .filter((opportunity) => {
            const matchesSearch = opportunity.title
              .toLowerCase()
              .includes(search.toLowerCase());

            const matchesCountry =
              country === "" ||
              opportunity.country === country;

            return matchesSearch && matchesCountry;
          })
          .map((opportunity) => (
            <DirectoryCard
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              title={opportunity.title}
              subtitle={opportunity.country}
              description={opportunity.description}
              status={opportunity.status}
            />
          ))}
      </div>
    </>
  );
}