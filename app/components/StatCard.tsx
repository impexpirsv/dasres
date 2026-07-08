import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  color?:
    | "blue"
    | "green"
    | "yellow"
    | "red"
    | "purple"
    | "cyan"
    | "white";
};

const colors = {
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  white: "text-white",
};

export default function StatCard({
  title,
  value,
  subtitle,
  color = "white",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p
      className={`mt-3 break-words ${
  typeof value === "number"
    ? "text-5xl font-black"
    : "text-2xl font-bold"
} ${colors[color]}`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}