"use client";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type Task = {
  id: number;
  title: string;
  status: string;
  priority?: string | null;
  progress?: number | null;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  estimatedHours: number | null;
  loggedHours: number | null;
  assignedTo?: {
    name: string;
    email: string;
  } | null;
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
};

function escapeCsv(
  value: string | number | null | undefined,
) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function createSafeFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "project";
}

export default function ProjectTasksExportButton({
  projectTitle,
  tasks,
}: {
  projectTitle: string;
  tasks: Task[];
}) {
  const t = useTranslations(
    "projectTasksExportButton",
  );
  const locale = useLocale();

  function formatDate(
    value: Date | string | null,
  ) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case "TODO":
        return t("statuses.todo");

      case "IN_PROGRESS":
        return t("statuses.inProgress");

      case "REVIEW":
        return t("statuses.review");

      case "COMPLETED":
        return t("statuses.completed");

      default:
        return status || t("unknown");
    }
  }

  function getPriorityLabel(
    priority?: string | null,
  ) {
    switch (priority) {
      case "LOW":
        return t("priorities.low");

      case "MEDIUM":
        return t("priorities.medium");

      case "HIGH":
        return t("priorities.high");

      case "URGENT":
        return t("priorities.urgent");

      default:
        return priority || "";
    }
  }

  function handleExport() {
    const headers = [
      t("headers.id"),
      t("headers.title"),
      t("headers.status"),
      t("headers.priority"),
      t("headers.progress"),
      t("headers.startDate"),
      t("headers.dueDate"),
      t("headers.estimatedHours"),
      t("headers.loggedHours"),
      t("headers.assignedTo"),
      t("headers.assignedEmail"),
      t("headers.dependsOn"),
      t("headers.dependencyStatus"),
    ];

    const rows = tasks.map((task) => {
      const normalizedProgress = Math.min(
        100,
        Math.max(
          0,
          Number.isFinite(Number(task.progress))
            ? Number(task.progress)
            : 0,
        ),
      );

      return [
        task.id,
        task.title,
        getStatusLabel(task.status),
        getPriorityLabel(task.priority),
        `${normalizedProgress}%`,
        formatDate(task.startDate),
        formatDate(task.dueDate),
        task.estimatedHours ?? "",
        task.loggedHours ?? 0,
        task.assignedTo?.name ?? "",
        task.assignedTo?.email ?? "",
        task.dependsOn?.title ?? "",
        task.dependsOn?.status
          ? getStatusLabel(
              task.dependsOn.status,
            )
          : "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map(escapeCsv).join(","),
      )
      .join("\r\n");

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${createSafeFileName(
      projectTitle,
    )}-tasks.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={tasks.length === 0}
      aria-label={t("ariaLabel")}
      title={
        tasks.length === 0
          ? t("emptyTooltip")
          : t("tooltip")
      }
      className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {t("button")}
    </button>
  );
}