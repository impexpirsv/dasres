type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export default function SearchBox({
  value,
  onChange,
  placeholder,
}: SearchBoxProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mb-8 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white"
    />
  );
}
