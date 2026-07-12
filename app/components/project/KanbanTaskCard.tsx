"use client";

import { useLocale, useTranslations } from "next-intl";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | string | null;
  assignedTo: {
    name: string | null;
    email: string;
  } | null;
  attachments: {
    id: number;
  }[];
  comments: {
    id: number;
  }[];
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

export default function KanbanTaskCard({
  task,
}: {
  task: Task;
}) {
  const t = useTranslations("kanbanTaskCard");
  const locale = useLocale();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const completedChecklist = task.checklistItems.filter(
    (item) => item.completed,
  ).length;

  const totalChecklist = task.checklistItems.length;

  const priorityKey = task.priority.toLowerCase();

  const priorityClass =
    priorityClasses[task.priority] ??
    priorityClasses.LOW;

  const dueDate = task.dueDate
    ? new Date(task.dueDate)
    : null;

  const hasValidDueDate =
    dueDate !== null &&
    !Number.isNaN(dueDate.getTime());

  const isOverdue =
    hasValidDueDate &&
    task.status !== "COMPLETED" &&
    dueDate.getTime() < Date.now();

  const formattedDueDate =
    hasValidDueDate && dueDate
      ? new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(dueDate)
      : t("noDueDate");

  const assignee =
    task.assignedTo?.name ||
    task.assignedTo?.email ||
    t("unassigned");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={t("dragLabel", {
        title: task.title,
      })}
      className={`cursor-grab touch-none rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm transition-[border-color,box-shadow,opacity] duration-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/20 active:cursor-grabbing ${
        isDragging
          ? "border-blue-500 shadow-xl shadow-blue-900/30"
          : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-semibold leading-6 text-white">
          {task.title}
        </h3>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${priorityClass}`}
        >
          {t(`priorities.${priorityKey}`)}
        </span>
      </div>

      {task.description && (
        <p className="mb-4 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-400">
          {task.description}
        </p>
      )}

      <div className="space-y-2 text-xs">
        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-slate-500">
            {t("assignee")}
          </span>

          <span className="min-w-0 break-words text-end text-slate-300">
            {assignee}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-slate-500">
            {t("due")}
          </span>

          <time
            dateTime={
              hasValidDueDate && dueDate
                ? dueDate.toISOString()
                : undefined
            }
            className={
              isOverdue
                ? "text-end text-red-400"
                : "text-end text-slate-300"
            }
          >
            {formattedDueDate}
          </time>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4 text-slate-300">
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="font-bold text-white">
              {completedChecklist}/{totalChecklist}
            </p>

            <p className="mt-1 text-slate-500">
              {t("checklist")}
            </p>
          </div>

          <div>
            <p className="font-bold text-white">
              {task.comments.length}
            </p>

            <p className="mt-1 text-slate-500">
              {t("comments")}
            </p>
          </div>

          <div>
            <p className="font-bold text-white">
              {task.attachments.length}
            </p>

            <p className="mt-1 text-slate-500">
              {t("files")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}