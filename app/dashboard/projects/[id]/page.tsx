import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import ProjectTasksSection from "../../../components/project/ProjectTasksSection";
import ProjectHeader from "../../../components/project/ProjectHeader";
import ProjectOverviewCards from "../../../components/project/ProjectOverviewCards";
import ProjectTimeline from "../../../components/project/ProjectTimeline";
import ProjectActivitySection from "../../../components/project/ProjectActivitySection";
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
          attachments: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              replies: {
                include: {
                  author: {
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
            },
            where: {
              parentId: null,
            },
            orderBy: {
              createdAt: "asc",
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

      <ProjectHeader
        status={project.status}
        title={project.title}
        description={project.description || project.tradeCase.description}
        progress={project.progress}
      />

      <ProjectOverviewCards
        customer={
          project.tradeCase.customer.name || project.tradeCase.customer.email
        }
        category={project.tradeCase.category}
        completedSteps={completedSteps}
        totalSteps={totalSteps}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <ProjectTimeline steps={project.tradeCase.steps} />
        <ProjectTasksSection
          projectId={project.id}
          tasks={project.tasks}
          assignableUsers={assignableUsers}
        />
        <ProjectActivitySection activities={project.tradeCase.activities} />
      </div>
    </div>
  );
}
