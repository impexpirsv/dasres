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
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mb-8 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white"
    >
      <option value="">All Countries</option>

      {countries.map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
}