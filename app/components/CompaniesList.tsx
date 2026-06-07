"use client";

import { useState } from "react";
import DirectoryCard from "./DirectoryCard";
import SearchBox from "./SearchBox";
import CountryFilter from "./CountryFilter";

type Company = {
  id: number;
  name: string;
  country: string;
  category: string;
  status: string;
  description: string;
  email: string;
  website: string;
};

export default function CompaniesList({
  companies,
}: {
  companies: Company[];
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  return (
    <>
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search companies..."
      />

      <CountryFilter
        value={country}
        onChange={setCountry}
        countries={["China", "UAE", "Turkey"]}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {companies
          .filter((company) => {
            const matchesSearch = company.name
              .toLowerCase()
              .includes(search.toLowerCase());

            const matchesCountry =
              country === "" || company.country === country;

            return matchesSearch && matchesCountry;
          })
          .map((company) => (
            <DirectoryCard
              key={company.id}
              href={`/companies/${company.id}`}
              title={company.name}
              subtitle={company.category}
              location={company.country}
              description={company.description}
              status={company.status}
            />
          ))}
      </div>
    </>
  );
}