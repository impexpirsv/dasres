"use client";

import { useTranslations } from "next-intl";

type ProjectTask = {
  status: string;
};

export default function ProjectListProgress({
  tasks,
}: {
  tasks: ProjectTask[];
}) {
  const t = useTranslations("projectListProgress");

  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const percent =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">
          {t("progress")}
        </span>

        <span className="font-medium text-blue-400">
          {percent}%
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={t("progressLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {t("summary", {
          completed,
          total,
        })}
      </p>
    </div>
  );
}