import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import CreateProjectTaskForm from "../../../components/CreateProjectTaskForm";
import ProjectTaskStatusSelect from "../../../components/ProjectTaskStatusSelect";
import EditProjectTaskForm from "../../../components/EditProjectTaskForm";
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      tasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      tradeCase: {
        include: {
          customer: true,
          proposals: {
            where: {
              status: "ACCEPTED",
            },
            include: {
              company: true,
              expert: true,
            },
          },
          documents: true,
          messages: {
            include: {
              sender: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          activities: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          steps: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isCustomer = project.createdBy === user.id;
  const isProvider = project.assignedTo === user.id;

  if (user.role !== "admin" && !isCustomer && !isProvider) {
    notFound();
  }
  const assignableUsers = await prisma.user.findMany({
    where: {
      OR: [
        {
          id: project.createdBy ?? -1,
        },
        {
          id: project.assignedTo ?? -1,
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  const completedSteps = project.tradeCase.steps.filter(
    (step) => step.completed,
  ).length;

  const totalSteps = project.tradeCase.steps.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <Link
        href="/dashboard/projects"
        className="text-blue-400 hover:underline mb-8 inline-block"
      >
        ← Back to Projects
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <span className="inline-block bg-blue-600/20 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              {project.status}
            </span>

            <h1 className="text-5xl font-bold mb-4">{project.title}</h1>

            <p className="text-slate-400 max-w-3xl">
              {project.description || project.tradeCase.description}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 min-w-56">
            <p className="text-slate-500 text-sm">Progress</p>

            <p className="text-4xl font-bold text-blue-400 mt-2">
              {project.progress}%
            </p>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${project.progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Customer</p>
          <p className="text-xl font-bold mt-2">
            {project.tradeCase.customer.name ||
              project.tradeCase.customer.email}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Category</p>
          <p className="text-xl font-bold mt-2">{project.tradeCase.category}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Steps</p>
          <p className="text-xl font-bold mt-2">
            {completedSteps} / {totalSteps} Completed
          </p>
        </div>
      </div>

      <div className="mb-8">
        <CreateProjectTaskForm projectId={project.id} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">Timeline Steps</h2>

          <div className="space-y-4">
            {project.tradeCase.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.completed
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.completed ? "✓" : "•"}
                </div>

                <div>
                  <p className="font-semibold">{step.title}</p>

                  <p className="text-sm text-slate-500 mt-1">
                    {step.completedAt
                      ? step.completedAt.toLocaleDateString()
                      : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">Trade Tasks</h2>

          <div className="space-y-4">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{task.title}</h3>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      task.priority === "URGENT"
                        ? "bg-red-600"
                        : task.priority === "HIGH"
                          ? "bg-orange-600"
                          : task.priority === "MEDIUM"
                            ? "bg-yellow-600"
                            : "bg-slate-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-slate-400 mt-2">
                    {task.description}
                  </p>
                )}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>
                    Assignee:{" "}
                    <span className="text-slate-300">
                      {task.assignedTo
                        ? task.assignedTo.name || task.assignedTo.email
                        : "Unassigned"}
                    </span>
                  </p>

                  <p>
                    Due:{" "}
                    <span
                      className={
                        task.dueDate &&
                        task.status !== "COMPLETED" &&
                        task.dueDate < new Date()
                          ? "text-red-400"
                          : "text-slate-300"
                      }
                    >
                      {task.dueDate
                        ? task.dueDate.toLocaleDateString()
                        : "No due date"}
                    </span>
                  </p>
                </div>
                <div className="mt-3 text-xs text-slate-500">{task.status}</div>
                <ProjectTaskStatusSelect
                  taskId={task.id}
                  currentStatus={task.status}
                />
                <EditProjectTaskForm
                  taskId={task.id}
                  currentTitle={task.title}
                  currentDescription={task.description}
                  currentPriority={task.priority}
                  currentDueDate={task.dueDate}
                  currentAssignedToId={task.assignedToId}
                  assignableUsers={assignableUsers}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">Recent Activity</h2>

          <div className="space-y-4">
            {project.tradeCase.activities.length === 0 ? (
              <p className="text-slate-500">No activity yet.</p>
            ) : (
              project.tradeCase.activities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
                >
                  <p className="font-semibold">
                    {activity.action.replaceAll("_", " ")}
                  </p>

                  {activity.details && (
                    <p className="text-sm text-slate-400 mt-1">
                      {activity.details}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {activity.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
