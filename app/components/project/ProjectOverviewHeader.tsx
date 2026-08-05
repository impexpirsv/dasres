import { getTranslations } from "next-intl/server";

type Task = {
  id: number;
  status: string;
  estimatedHours: number | null;
  loggedHours: number | null;
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
};

type Project = {
  id: number;
  title: string;
  status: string;
};

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-green-300 bg-green-500/10 border-green-500/30";

    case "IN_PROGRESS":
      return "text-blue-300 bg-blue-500/10 border-blue-500/30";

    case "REVIEW":
      return "text-amber-300 bg-amber-500/10 border-amber-500/30";

    case "CANCELLED":
      return "text-red-300 bg-red-500/10 border-red-500/30";

    default:
      return "text-slate-300 bg-slate-500/10 border-slate-700";
  }
}

function getStatusTranslationKey(status: string) {
  switch (status) {
    case "TODO":
      return "todo";

    case "PENDING":
      return "pending";

    case "OPEN":
      return "open";

    case "IN_PROGRESS":
      return "inProgress";

    case "REVIEW":
      return "review";

    case "COMPLETED":
      return "completed";

    case "APPROVED":
      return "approved";

    case "REJECTED":
      return "rejected";

    case "CLOSED":
      return "closed";

    case "ACTIVE":
      return "active";

    case "EXPIRED":
      return "expired";

    case "CANCELLED":
      return "cancelled";

    default:
      return null;
  }
}

export default async function ProjectOverviewHeader({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const t = await getTranslations("projectOverviewHeader");

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const reviewTasks = tasks.filter(
    (task) => task.status === "REVIEW",
  ).length;

  const blockedTasks = tasks.filter(
    (task) =>
      task.dependsOn &&
      task.dependsOn.status &&
      task.dependsOn.status !== "COMPLETED" &&
      task.status !== "COMPLETED",
  ).length;

  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + (task.estimatedHours ?? 0),
    0,
  );

  const totalLoggedHours = tasks.reduce(
    (sum, task) => sum + (task.loggedHours ?? 0),
    0,
  );

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const remainingTasks = Math.max(
    totalTasks - completedTasks,
    0,
  );

  const statusTranslationKey =
    getStatusTranslationKey(project.status);

  const statusLabel = statusTranslationKey
    ? t(`status.${statusTranslationKey}`)
    : project.status.replaceAll("_", " ");

  const features = [
    "tasks",
    "kanban",
    "calendar",
    "timeline",
    "gantt",
    "workload",
  ] as const;

  return (
    <div className="workspace-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {project.title}
            </h1>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusColor(
                project.status,
              )}`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-start">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("overallProgress")}
          </p>

          <p className="mt-1 text-3xl font-black text-white">
            {progress}%
          </p>
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.tasks")}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {totalTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.completed")}
          </p>

          <p className="mt-2 text-2xl font-bold text-green-300">
            {completedTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.inProgress")}
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-300">
            {inProgressTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.review")}
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-300">
            {reviewTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.blocked")}
          </p>

          <p className="mt-2 text-2xl font-bold text-red-300">
            {blockedTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">
            {t("metrics.remaining")}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-200">
            {remainingTasks}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">
              {t("hours.estimated")}
            </p>

            <p className="text-lg font-bold text-blue-300">
              {t("hours.value", {
                hours: totalEstimatedHours,
              })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">
              {t("hours.logged")}
            </p>

            <p className="text-lg font-bold text-green-300">
              {t("hours.value", {
                hours: totalLoggedHours,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {features.map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300"
          >
            {t(`features.${feature}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
