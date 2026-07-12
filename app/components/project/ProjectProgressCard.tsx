"use client";

import { useTranslations } from "next-intl";

type ProjectTask = {
  id: number;
  status: string;
};

export default function ProjectProgressCard({
  tasks,
}: {
  tasks: ProjectTask[];
}) {
  const t = useTranslations("projectProgressCard");

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const percent =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100,
        );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">
          {t("title")}
        </h3>

        <span className="text-sm font-semibold text-blue-400">
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

      <p className="mt-3 text-xs text-slate-400">
        {t("summary", {
          completed: completedTasks,
          total: totalTasks,
        })}
      </p>
    </div>
  );
}