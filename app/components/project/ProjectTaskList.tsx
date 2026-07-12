"use client";

import { useLocale, useTranslations } from "next-intl";
import StatusBadge, {
  type Status,
} from "../StatusBadge";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedTo: UserOption | null;
  checklistItems: {
    id: number;
    completed: boolean;
  }[];
};

const priorityClasses: Record<string, string> = {
  URGENT: "bg-red-600 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-yellow-600 text-white",
  LOW: "bg-slate-700 text-white",
};

export default function ProjectTaskList({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelect: (taskId: number) => void;
}) {
  const t = useTranslations("projectTaskList");
  const locale = useLocale();

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-slate-500">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const completed = task.checklistItems.filter(
          (item) => item.completed,
        ).length;

        const total = task.checklistItems.length;

        const percent =
          total === 0
            ? 0
            : Math.round((completed / total) * 100);

        const isSelected = selectedTaskId === task.id;

        const priorityKey = task.priority.toLowerCase();

        const priorityClass =
          priorityClasses[task.priority] ??
          priorityClasses.LOW;

        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onSelect(task.id)}
            aria-pressed={isSelected}
            className={`w-full rounded-2xl border p-4 text-start transition ${
              isSelected
                ? "border-blue-500 bg-blue-950/30"
                : "border-slate-800 bg-slate-950 hover:border-blue-500"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">
                  {task.title}
                </h3>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {task.assignedTo?.name ||
                    task.assignedTo?.email ||
                    t("unassigned")}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${priorityClass}`}
              >
                {t(`priorities.${priorityKey}`)}
              </span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">
                  {t("progress")}
                </span>

                <span className="text-slate-300">
                  {percent}%
                </span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-slate-800"
                role="progressbar"
                aria-label={t("progressLabel", {
                  title: task.title,
                })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <StatusBadge
                status={task.status as Status}
              />

              <span className="shrink-0">
                {task.dueDate
                  ? new Intl.DateTimeFormat(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(task.dueDate))
                  : t("noDueDate")}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}