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
    <div className="ui-card ui-card-interactive">
      <p className="text-sm font-semibold text-slate-400">
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
        <p className="mt-2 text-sm leading-5 text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
