"use client";

import { useTranslations } from "next-intl";

export type Status =
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

export default function StatusBadge({
  status,
  small = false,
}: {
  status: Status;
  small?: boolean;
}) {
  const t = useTranslations("statusBadge");

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold transition-all duration-200 ${
        small
          ? "px-2 py-1 text-[11px]"
          : "px-3 py-1 text-xs"
      } ${statusClasses[status]}`}
    >
      {t(status.toLowerCase())}
    </span>
  );
}