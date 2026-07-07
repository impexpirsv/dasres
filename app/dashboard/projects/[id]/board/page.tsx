import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import KanbanTaskCard from "../../../../components/project/KanbanTaskCard";
import ProjectBoard from "../../../../components/project/ProjectBoard";
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

      <ProjectBoard tasks={project.tasks} />
    </div>
  );
}
