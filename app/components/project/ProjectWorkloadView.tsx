"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  progress: number;
  dueDate: Date | string | null;
  assignedToId: number | null;
  assignedTo: UserOption | null;
};

type Capacity = "HIGH" | "MEDIUM" | "LOW";

export default function ProjectWorkloadView({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = useTranslations("projectWorkloadView");

  const rows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        name: string;
        tasks: Task[];
      }
    >();

    for (const task of tasks) {
      const key =
        task.assignedToId !== null
          ? String(task.assignedToId)
          : "unassigned";

      const name =
        task.assignedTo?.name ||
        task.assignedTo?.email ||
        t("unassigned");

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          name,
          tasks: [],
        });
      }

      grouped.get(key)?.tasks.push(task);
    }

    const now = Date.now();

    return Array.from(grouped.values())
      .map((group) => {
        const total = group.tasks.length;

        const completed = group.tasks.filter(
          (task) => task.status === "COMPLETED",
        ).length;

        const active = group.tasks.filter(
          (task) => task.status !== "COMPLETED",
        ).length;

        const overdue = group.tasks.filter((task) => {
          if (!task.dueDate || task.status === "COMPLETED") {
            return false;
          }

          const dueDate = new Date(task.dueDate);

          return (
            !Number.isNaN(dueDate.getTime()) &&
            dueDate.getTime() < now
          );
        }).length;

        const averageProgress =
          total === 0
            ? 0
            : Math.round(
                group.tasks.reduce((sum, task) => {
                  const progress = Number(task.progress);

                  const normalizedProgress =
                    Number.isFinite(progress)
                      ? Math.min(100, Math.max(0, progress))
                      : 0;

                  return sum + normalizedProgress;
                }, 0) / total,
              );

        const capacity: Capacity =
          active >= 10
            ? "HIGH"
            : active >= 6
              ? "MEDIUM"
              : "LOW";

        return {
          ...group,
          total,
          completed,
          active,
          overdue,
          averageProgress,
          capacity,
        };
      })
      .sort((first, second) => {
        if (first.overdue !== second.overdue) {
          return second.overdue - first.overdue;
        }

        if (first.active !== second.active) {
          return second.active - first.active;
        }

        return first.name.localeCompare(second.name);
      });
  }, [tasks, t]);

  if (rows.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold text-white">
          {t("title")}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {t("description")}
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
          {t("emptyState")}
        </div>
      </section>
    );
  }

  function getCapacityLabel(capacity: Capacity) {
    switch (capacity) {
      case "HIGH":
        return t("capacities.high");

      case "MEDIUM":
        return t("capacities.medium");

      default:
        return t("capacities.low");
    }
  }

  function getWorkloadLabel(
    capacity: Capacity,
    overdue: number,
  ) {
    if (overdue > 0) {
      return t("workloadStates.needsAttention");
    }

    if (capacity === "HIGH") {
      return t("workloadStates.highLoad");
    }

    if (capacity === "MEDIUM") {
      return t("workloadStates.balanced");
    }

    return t("workloadStates.available");
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold text-white">
        {t("title")}
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        {t("description")}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const workloadLabel = getWorkloadLabel(
            row.capacity,
            row.overdue,
          );

          return (
            <article
              key={row.key}
              className={`rounded-2xl border p-5 transition-all ${
                row.overdue > 0
                  ? "border-red-700 bg-red-950/10"
                  : row.capacity === "HIGH"
                    ? "border-orange-600 bg-orange-950/10"
                    : row.capacity === "MEDIUM"
                      ? "border-yellow-600 bg-yellow-950/10"
                      : "border-green-700 bg-green-950/10"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-white">
                    {row.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {t("totalTasks", {
                      count: row.total,
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-300">
                    {row.averageProgress}%
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.capacity === "HIGH"
                        ? "bg-red-600/20 text-red-300"
                        : row.capacity === "MEDIUM"
                          ? "bg-yellow-600/20 text-yellow-300"
                          : "bg-green-600/20 text-green-300"
                    }`}
                  >
                    {getCapacityLabel(row.capacity)}
                  </span>
                </div>
              </div>

              <div
                className="h-3 overflow-hidden rounded-full bg-slate-800"
                role="progressbar"
                aria-label={t("progressLabel", {
                  name: row.name,
                })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={row.averageProgress}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    row.overdue > 0
                      ? "bg-red-500"
                      : row.capacity === "HIGH"
                        ? "bg-orange-500"
                        : row.capacity === "MEDIUM"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                  }`}
                  style={{
                    width: `${row.averageProgress}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  {t("workload")}
                </span>

                <span
                  className={
                    row.overdue > 0
                      ? "text-end font-semibold text-red-400"
                      : row.capacity === "HIGH"
                        ? "text-end font-semibold text-orange-400"
                        : row.capacity === "MEDIUM"
                          ? "text-end font-semibold text-yellow-400"
                          : "text-end font-semibold text-green-400"
                  }
                >
                  {workloadLabel}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="font-bold text-white">
                    {row.active}
                  </p>

                  <p className="text-slate-500">
                    {t("active")}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-white">
                    {row.completed}
                  </p>

                  <p className="text-slate-500">
                    {t("done")}
                  </p>
                </div>

                <div>
                  <p
                    className={
                      row.overdue > 0
                        ? "font-bold text-red-400"
                        : "font-bold text-white"
                    }
                  >
                    {row.overdue}
                  </p>

                  <p className="text-slate-500">
                    {t("overdue")}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}