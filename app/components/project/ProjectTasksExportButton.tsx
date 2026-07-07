"use client";

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

function formatDate(date: Date | string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

export default function ProjectTasksExportButton({
  projectTitle,
  tasks,
}: {
  projectTitle: string;
  tasks: Task[];
}) {
  function handleExport() {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Progress",
      "Start Date",
      "Due Date",
      "Estimated Hours",
      "Logged Hours",
      "Assigned To",
      "Assigned Email",
      "Depends On",
      "Dependency Status",
    ];

    const rows = tasks.map((task) => [
      task.id,
      task.title,
      task.status,
      task.priority ?? "",
      `${task.progress ?? 0}%`,
      formatDate(task.startDate),
      formatDate(task.dueDate),
      task.estimatedHours ?? 0,
      task.loggedHours ?? 0,
      task.assignedTo?.name ?? "",
      task.assignedTo?.email ?? "",
      task.dependsOn?.title ?? "",
      task.dependsOn?.status ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeProjectTitle = projectTitle
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^a-z0-9-_]/g, "");

    link.href = url;
    link.download = `${safeProjectTitle || "project"}-tasks.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500/20"
    >
      Export Excel
    </button>
  );
}