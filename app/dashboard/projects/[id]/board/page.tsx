import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import KanbanTaskCard from "../../../../components/project/KanbanTaskCard";
const columns = [
  {
    title: "Todo",
    status: "TODO",
  },
  {
    title: "In Progress",
    status: "IN_PROGRESS",
  },
  {
    title: "Review",
    status: "REVIEW",
  },
  {
    title: "Completed",
    status: "COMPLETED",
  },
];

export default async function ProjectBoardPage({
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
          attachments: {
            select: {
              id: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          checklistItems: {
            select: {
              id: true,
              completed: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  if (
    user.role !== "admin" &&
    project.createdBy !== user.id &&
    project.assignedTo !== user.id
  ) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="text-blue-400 hover:underline"
      >
        ← Back to Project
      </Link>

      <div className="mt-6 mb-10">
        <p className="text-blue-400 font-semibold mb-3">Project Board</p>

        <h1 className="text-4xl font-bold">{project.title}</h1>

        <p className="text-slate-400 mt-3">
          Track project tasks by workflow status.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = project.tasks.filter(
            (task) => task.status === column.status,
          );

          return (
            <section
              key={column.status}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-bold text-white">{column.title}</h2>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {columnTasks.length}
                </span>
              </div>

              {columnTasks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                  No tasks
                </p>
              ) : (
                <div className="space-y-4">
                  {columnTasks.map((task) => (
                    <KanbanTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
