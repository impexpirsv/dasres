import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyTasksPage() {
  const user = await requireUser();

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
      task.dueDate && task.status !== "COMPLETED" && task.dueDate < new Date(),
  ).length;
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="text-blue-400 font-semibold mb-3">My Tasks</p>

        <h1 className="text-5xl font-bold mb-4">Assigned Work</h1>

        <p className="text-slate-400">
          {tasks.length} assigned task{tasks.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-500 text-sm">Assigned</p>
            <p className="text-3xl font-bold mt-2">{assignedCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-500 text-sm">Completed</p>
            <p className="text-3xl font-bold mt-2 text-green-400">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-500 text-sm">In Progress</p>
            <p className="text-3xl font-bold mt-2 text-yellow-400">
              {inProgressCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-500 text-sm">Overdue</p>
            <p className="text-3xl font-bold mt-2 text-red-400">
              {overdueCount}
            </p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <div className="text-6xl mb-4">✅</div>

          <h2 className="text-2xl font-bold mb-3">No Assigned Tasks</h2>

          <p className="text-slate-400 max-w-md mx-auto">
            You don't have any assigned work yet.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-3xl p-6 border ${
                task.dueDate &&
                task.status !== "COMPLETED" &&
                task.dueDate < new Date()
                  ? "border-red-500 bg-red-950/20"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="bg-blue-600/20 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {task.status}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.priority === "URGENT"
                      ? "bg-red-600 text-white"
                      : task.priority === "HIGH"
                        ? "bg-orange-600 text-white"
                        : task.priority === "MEDIUM"
                          ? "bg-yellow-600 text-white"
                          : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>

              {task.description && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                  {task.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-slate-400 mb-5">
                <p>
                  Project:{" "}
                  <span className="text-slate-200">{task.project.title}</span>
                </p>

                <p>
                  Project Status:{" "}
                  <span className="text-slate-200">{task.project.status}</span>
                </p>

                <p>
                  Due Date:{" "}
                  <span
                    className={
                      task.dueDate &&
                      task.status !== "COMPLETED" &&
                      task.dueDate < new Date()
                        ? "text-red-400"
                        : "text-slate-200"
                    }
                  >
                    {task.dueDate
                      ? task.dueDate.toLocaleDateString("en-US")
                      : "No due date"}
                  </span>
                </p>
              </div>

              <Link
                href={`/dashboard/projects/${task.project.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-semibold"
              >
                View Project
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
