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
      className={`w-[min(82vw,20rem)] shrink-0 snap-start rounded-[var(--ui-radius-card)] border p-3 transition sm:p-4 xl:min-h-[32rem] xl:w-auto ${
        isOver
          ? "border-blue-500 bg-blue-950/30"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <h2 className="min-w-0 break-words font-bold text-white">
          {title}
        </h2>

        <span
          aria-label={t("taskCount", {
            count,
          })}
          className="ui-badge shrink-0 border-slate-700 bg-slate-800 text-slate-200"
        >
          {count}
        </span>
      </div>

      <div className="min-h-32 space-y-3">
        {children}
      </div>
    </section>
  );
}
