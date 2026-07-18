import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function getTaskStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-800 bg-emerald-600/20 text-emerald-300";

    case "IN_PROGRESS":
      return "border-yellow-800 bg-yellow-600/20 text-yellow-300";

    case "REVIEW":
      return "border-purple-800 bg-purple-600/20 text-purple-300";

    default:
      return "border-blue-800 bg-blue-600/20 text-blue-300";
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-600 text-white";

    case "HIGH":
      return "bg-orange-600 text-white";

    case "MEDIUM":
      return "bg-yellow-600 text-black";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

export default async function MyTasksPage() {
  const user = await requireUser();

 const t = await getTranslations(
  "dashboardMyTasks",
);

  const locale = await getLocale();
  const now = new Date();

  const tasks = await prisma.projectTask.findMany({
    where: {
      assignedToId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [
      {
        dueDate: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const assignedCount = tasks.length;

  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const overdueCount = tasks.filter(
    (task) =>
      task.dueDate &&
      task.status !== "COMPLETED" &&
      task.dueDate < now,
  ).length;

  function getTaskStatusLabel(status: string) {
    switch (status) {
      case "TODO":
        return t("taskStatuses.todo");

      case "IN_PROGRESS":
        return t("taskStatuses.inProgress");

      case "REVIEW":
        return t("taskStatuses.review");

      case "COMPLETED":
        return t("taskStatuses.completed");

      default:
        return status;
    }
  }

  function getProjectStatusLabel(
    status: string,
  ) {
    switch (status) {
      case "OPEN":
        return t("projectStatuses.open");

      case "IN_PROGRESS":
        return t(
          "projectStatuses.inProgress",
        );

      case "COMPLETED":
        return t("projectStatuses.completed");

      case "CANCELLED":
        return t("projectStatuses.cancelled");

      default:
        return status;
    }
  }

  function getPriorityLabel(priority: string) {
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
        return priority;
    }
  }

  const stats = [
    {
      key: "assigned",
      label: t("stats.assigned"),
      value: assignedCount,
      valueClass: "text-white",
    },
    {
      key: "completed",
      label: t("stats.completed"),
      value: completedCount,
      valueClass: "text-green-400",
    },
    {
      key: "inProgress",
      label: t("stats.inProgress"),
      value: inProgressCount,
      valueClass: "text-yellow-400",
    },
    {
      key: "overdue",
      label: t("stats.overdue"),
      value: overdueCount,
      valueClass: "text-red-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <p className="mb-3 font-semibold text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("assignedSummary", {
            count: tasks.length,
          })}
        </p>

        <div className="mb-10 mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-500">
                {stat.label}
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${stat.valueClass}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div
            aria-hidden="true"
            className="mb-4 text-6xl"
          >
            ✅
          </div>

          <h2 className="mb-3 text-2xl font-bold">
            {t("empty.title")}
          </h2>

          <p className="mx-auto max-w-md text-slate-400">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              task.status !== "COMPLETED" &&
              task.dueDate < now;

            return (
              <div
                key={task.id}
                className={`rounded-3xl border p-6 ${
                  isOverdue
                    ? "border-red-500 bg-red-950/20"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTaskStatusClass(
                      task.status,
                    )}`}
                  >
                    {getTaskStatusLabel(
                      task.status,
                    )}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                      task.priority,
                    )}`}
                  >
                    {getPriorityLabel(
                      task.priority,
                    )}
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold">
                  {task.title}
                </h2>

                {task.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                    {task.description}
                  </p>
                )}

                <div className="mb-5 space-y-2 text-sm text-slate-400">
                  <p>
                    {t("fields.project")}:{" "}
                    <span className="text-slate-200">
                      {task.project.title}
                    </span>
                  </p>

                  <p>
                    {t("fields.projectStatus")}:{" "}
                    <span className="text-slate-200">
                      {getProjectStatusLabel(
                        task.project.status,
                      )}
                    </span>
                  </p>

                  <p>
                    {t("fields.dueDate")}:{" "}
                    <span
                      className={
                        isOverdue
                          ? "text-red-400"
                          : "text-slate-200"
                      }
                    >
                      {task.dueDate
                        ? task.dueDate.toLocaleDateString(
                            locale,
                          )
                        : t("noDueDate")}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/dashboard/projects/${task.project.id}`}
                  className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-700"
                >
                  {t("viewProject")}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}