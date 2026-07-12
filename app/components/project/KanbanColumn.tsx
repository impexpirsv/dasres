"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

export default function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const t = useTranslations("kanbanColumn");

  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={t("ariaLabel", {
        title,
        count,
      })}
      data-column-id={id}
      className={`min-h-[500px] rounded-3xl border p-5 transition ${
        isOver
          ? "border-blue-500 bg-blue-950/30"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="min-w-0 break-words font-bold text-white">
          {title}
        </h2>

        <span
          aria-label={t("taskCount", {
            count,
          })}
          className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
        >
          {count}
        </span>
      </div>

      <div className="min-h-40 space-y-4">
        {children}
      </div>
    </section>
  );
}