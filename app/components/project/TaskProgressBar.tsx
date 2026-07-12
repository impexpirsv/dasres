"use client";

import { useTranslations } from "next-intl";

type ChecklistItem = {
  id: number;
  completed: boolean;
};

export default function TaskProgressBar({
  items,
}: {
  items: ChecklistItem[];
}) {
  const t = useTranslations("taskProgressBar");

  const totalItems = items.length;

  const completedItems = items.filter(
    (item) => item.completed,
  ).length;

  const progress =
    totalItems === 0
      ? 0
      : Math.round(
          (completedItems / totalItems) * 100,
        );

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300">
          {t("title")}
        </p>

        <p className="text-sm font-bold text-blue-400">
          {progress}%
        </p>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={t("ariaLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {t("summary", {
          completed: completedItems,
          total: totalItems,
        })}
      </p>
    </div>
  );
}