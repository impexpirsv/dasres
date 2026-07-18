import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import ProjectBoard from "../../../../components/project/ProjectBoard";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectBoardPage({
  params,
}: Props) {
  const user = await requireUser();

  const [t, locale, resolvedParams] = await Promise.all([
    getTranslations("projectBoardPage"),
    getLocale(),
    params,
  ]);

  const projectId = Number(resolvedParams.id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      title: true,
      createdBy: true,
      assignedTo: true,
      tasks: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          progress: true,
          startDate: true,
          dueDate: true,
          assignedToId: true,
          createdAt: true,
          updatedAt: true,
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
      },
    },
  });

  if (!project) {
    notFound();
  }

  const canAccessProject =
    user.role === "admin" ||
    project.createdBy === user.id ||
    project.assignedTo === user.id;

  if (!canAccessProject) {
    notFound();
  }

  const isRtl =
    locale.startsWith("fa") ||
    locale.startsWith("ar");

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex items-center gap-2 text-blue-400 hover:underline"
      >
        <span aria-hidden="true">
          {isRtl ? "→" : "←"}
        </span>

        <span>{t("backToProject")}</span>
      </Link>

      <div className="mb-10 mt-6">
        <p className="mb-3 font-semibold text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="break-words text-4xl font-bold">
          {project.title}
        </h1>

        <p className="mt-3 text-slate-400">
          {t("description")}
        </p>
      </div>

      <ProjectBoard tasks={project.tasks} />
    </div>
  );
}