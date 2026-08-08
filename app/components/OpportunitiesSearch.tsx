"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Opportunity {
  id: number;
  title: string;
  country: string;
  status: string;
  description: string;
  imageUrl: string | null;
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const t = useTranslations(
    "opportunities.search.statuses",
  );

  const normalizedStatus = status
    .trim()
    .toUpperCase();

  if (normalizedStatus === "OPEN") {
    return (
      <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
        {t("open")}
      </span>
    );
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return (
      <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm text-black">
        {t("inProgress")}
      </span>
    );
  }

  if (normalizedStatus === "CLOSED") {
    return (
      <span className="rounded-full bg-red-600 px-4 py-2 text-sm text-white">
        {t("closed")}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-4 py-2 text-sm text-slate-200">
      {status}
    </span>
  );
}

export default function OpportunitiesSearch({
  opportunities,
  profileBasePath = "/opportunities",
}: {
  opportunities: Opportunity[];
  profileBasePath?: string;
}) {
  const t = useTranslations(
    "opportunities.search",
  );

  const tc = useTranslations(
    "common.countries",
  );

  const [search, setSearch] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [status, setStatus] =
    useState("");

  function translateCountry(
    value: string,
  ) {
    const normalizedValue =
      value.trim();

    const lowercaseValue =
      normalizedValue.toLowerCase();

    if (tc.has(normalizedValue)) {
      return tc(normalizedValue);
    }

    if (tc.has(lowercaseValue)) {
      return tc(lowercaseValue);
    }

    return normalizedValue;
  }

  const countries = Array.from(
    new Set(
      opportunities
        .map((opportunity) =>
          opportunity.country.trim(),
        )
        .filter(Boolean),
    ),
  ).sort((first, second) =>
    first.localeCompare(second),
  );

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredOpportunities =
    opportunities.filter(
      (opportunity) => {
        const opportunityTitle =
          opportunity.title
            .trim()
            .toLowerCase();

        const opportunityCountry =
          opportunity.country
            .trim()
            .toLowerCase();

        const opportunityDescription =
          opportunity.description
            .trim()
            .toLowerCase();

        const normalizedStatus =
          opportunity.status
            .trim()
            .toUpperCase();

        const matchesSearch =
          normalizedSearch === "" ||
          opportunityTitle.includes(
            normalizedSearch,
          ) ||
          opportunityCountry.includes(
            normalizedSearch,
          ) ||
          opportunityDescription.includes(
            normalizedSearch,
          );

        const matchesCountry =
          country === "" ||
          opportunity.country.trim() ===
            country;

        const matchesStatus =
          status === "" ||
          normalizedStatus === status;

        return (
          matchesSearch &&
          matchesCountry &&
          matchesStatus
        );
      },
    );

  const featuredOpportunities =
    filteredOpportunities.filter(
      (opportunity) =>
        opportunity.status
          .trim()
          .toUpperCase() === "OPEN",
    );

  return (
    <>
      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={t(
            "searchPlaceholder",
          )}
          aria-label={t("searchLabel")}
          className="ui-field"
        />

        <select
          value={country}
          onChange={(event) =>
            setCountry(event.target.value)
          }
          aria-label={t("countryLabel")}
          className="ui-field"
        >
          <option value="">
            {t("allCountries")}
          </option>

          {countries.map(
            (countryName) => (
              <option
                key={countryName}
                value={countryName}
              >
                {translateCountry(
                  countryName,
                )}
              </option>
            ),
          )}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          aria-label={t("statusLabel")}
          className="ui-field"
        >
          <option value="">
            {t("allStatuses")}
          </option>

          <option value="OPEN">
            {t("statuses.open")}
          </option>

          <option value="IN_PROGRESS">
            {t("statuses.inProgress")}
          </option>

          <option value="CLOSED">
            {t("statuses.closed")}
          </option>
        </select>
      </div>

      {featuredOpportunities.length >
        0 && (
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">
              {t("featured.title")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t(
                "featured.description",
              )}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredOpportunities
              .slice(0, 4)
              .map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`${profileBasePath}/${opportunity.id}`}
                  className="rounded-3xl border border-blue-500 bg-gradient-to-br from-slate-900 to-slate-950 p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <div className="flex items-start gap-5">
                    {opportunity.imageUrl ? (
                      <Image
                        src={
                          opportunity.imageUrl
                        }
                        alt={
                          opportunity.title
                        }
                        width={96}
                        height={96}
                        className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-4xl">
                        🌍
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <StatusBadge
                          status={
                            opportunity.status
                          }
                        />

                        <span className="inline-block rounded-lg bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                          {translateCountry(
                            opportunity.country,
                          )}
                        </span>
                      </div>

                      <h3 className="break-words text-2xl font-bold">
                        {opportunity.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-slate-400">
                        {
                          opportunity.description
                        }
                      </p>

                      <span className="mt-6 inline-flex text-blue-400 transition hover:text-blue-300">
                        {t(
                          "viewOpportunity",
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {filteredOpportunities.length ===
      0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h3 className="text-2xl font-bold">
            {t("empty.title")}
          </h3>

          <p className="mt-3 text-slate-400">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredOpportunities.map(
            (opportunity) => (
              <Link
                key={opportunity.id}
                href={`${profileBasePath}/${opportunity.id}`}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {opportunity.imageUrl ? (
                  <Image
                    src={
                      opportunity.imageUrl
                    }
                    alt={
                      opportunity.title
                    }
                    width={800}
                    height={400}
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
                      {translateCountry(
                        opportunity.country,
                      )}
                    </span>

                    <StatusBadge
                      status={
                        opportunity.status
                      }
                    />
                  </div>

                  <h2 className="break-words text-2xl font-bold">
                    {opportunity.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-slate-400">
                    {
                      opportunity.description
                    }
                  </p>

                  <span className="mt-5 inline-flex text-blue-400 transition hover:text-blue-300">
                    {t(
                      "viewOpportunity",
                    )}
                  </span>
                </div>
              </Link>
            ),
          )}
        </div>
      )}
    </>
  );
}
