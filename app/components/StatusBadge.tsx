"use client";

import { useTranslations } from "next-intl";

export type Status =
  | "TODO"
  | "PENDING"
  | "OPEN"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED";

const statusClasses: Record<Status, string> = {
  TODO:
    "border-slate-500/30 bg-slate-500/10 text-slate-300",
  OPEN:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  IN_PROGRESS:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  REVIEW:
    "border-purple-500/30 bg-purple-500/10 text-purple-300",
  COMPLETED:
    "border-green-500/30 bg-green-500/10 text-green-300",
  APPROVED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED:
    "border-red-500/30 bg-red-500/10 text-red-300",
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  CLOSED:
    "border-slate-500/30 bg-slate-500/10 text-slate-300",
  ACTIVE:
    "border-green-500/30 bg-green-500/10 text-green-300",
  EXPIRED:
    "border-orange-500/30 bg-orange-500/10 text-orange-300",
  CANCELLED:
    "border-red-500/30 bg-red-500/10 text-red-300",
};

const FALLBACK_STATUS_CLASS =
  "border-slate-600 bg-slate-700/40 text-slate-300";

function isKnownStatus(value: string): value is Status {
  return Object.prototype.hasOwnProperty.call(
    statusClasses,
    value,
  );
}

export default function StatusBadge({
  status,
  small = false,
}: {
  status: Status | string;
  small?: boolean;
}) {
  const t = useTranslations("statusBadge");

  const normalizedStatus = status.trim().toUpperCase();
  const key = normalizedStatus.toLowerCase();

  const label = t.has(key)
    ? t(key)
    : normalizedStatus.replaceAll("_", " ");

  const className = isKnownStatus(normalizedStatus)
    ? statusClasses[normalizedStatus]
    : FALLBACK_STATUS_CLASS;

  return (
    <span
      className={`ui-badge ${
        small
          ? "min-h-6 px-2 text-[11px]"
          : ""
      } ${className}`}
    >
      {label}
    </span>
  );
}
