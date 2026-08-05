"use client";

import { useTranslations } from "next-intl";

type CountryFilterProps = {
  value: string;
  onChange: (value: string) => void;
  countries: string[];
};

export default function CountryFilter({
  value,
  onChange,
  countries,
}: CountryFilterProps) {
  const t = useTranslations("countryFilter");
  const tc = useTranslations("common.countries");

  function translateCountry(country: string): string {
    const normalized = country.trim();

    if (tc.has(normalized)) {
      return tc(normalized);
    }

    const lower = normalized.toLowerCase();

    if (tc.has(lower)) {
      return tc(lower);
    }

    const underscored = lower.replaceAll(" ", "_");

    return tc.has(underscored)
      ? tc(underscored)
      : normalized;
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={t("allCountries")}
      className="mb-8 w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white"
    >
      <option value="">{t("allCountries")}</option>

      {countries.map((country) => (
        <option key={country} value={country}>
          {translateCountry(country)}
        </option>
      ))}
    </select>
  );
}
