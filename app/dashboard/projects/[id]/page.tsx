import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import ProjectTasksSection from "../../../components/project/ProjectTasksSection";
import ProjectHeader from "../../../components/project/ProjectHeader";
import ProjectOverviewCards from "../../../components/project/ProjectOverviewCards";
import ProjectTimeline from "../../../components/project/ProjectTimeline";
import ProjectActivitySection from "../../../components/project/ProjectActivitySection";
import ProjectTabs from "../../../components/project/ProjectTabs";
import ProjectBoard from "../../../components/project/ProjectBoard";
import ProjectCalendarView from "../../../components/project/ProjectCalendarView";
import ProjectGanttView from "../../../components/project/ProjectGanttView";
import ProjectWorkloadView from "../../../components/project/ProjectWorkloadView";
import ProjectTimeSummary from "../../../components/project/ProjectTimeSummary";
import ProjectOverviewHeader from "../../../components/project/ProjectOverviewHeader";
import ProjectHealthCard from "../../../components/project/ProjectHealthCard";
import ProjectCriticalPathCard from "../../../components/project/ProjectCriticalPathCard";
import ProjectPrintButton from "../../../components/project/ProjectPrintButton";
import ProjectTasksExportButton from "../../../components/project/ProjectTasksExportButton";
import ProjectAIAssistant from "../../../components/project/ProjectAIAssistant";
import ProjectDocuments from "../../../components/project/ProjectDocuments";
import ProjectAIInsights from "../../../components/project/ProjectAIInsights";
export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  const { tab } = await searchParams;
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
          checklistItems: {
            orderBy: {
              sortOrder: "asc",
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
              approvedBy: {
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
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          dependents: {
            select: {
              id: true,
              title: true,
              status: true,
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
  const totalEstimatedHours = project.tasks.reduce(
    (sum, task) => sum + (task.estimatedHours ?? 0),
    0,
  );

  const totalLoggedHours = project.tasks.reduce(
    (sum, task) => sum + task.loggedHours,
    0,
  );

  const totalRemainingHours = project.tasks.reduce(
    (sum, task) => sum + task.remainingHours,
    0,
  );
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <Link
        href="/dashboard/projects"
        className="text-blue-400 hover:underline mb-8 inline-block"
      >
        ← Back to Projects
      </Link>

      <div className="sticky top-0 z-30 -mx-6 mb-8 border-b border-slate-800 bg-slate-950/95 px-6 pb-4 pt-6 backdrop-blur">
        <ProjectHeader
          status={project.status}
          title={project.title}
          description={project.description || project.tradeCase.description}
          progress={project.progress}
        />

        <ProjectTabs projectId={project.id} />
      </div>

      {(!tab || tab === "overview") && (
        <>
          <ProjectOverviewCards
            customer={
              project.tradeCase.customer.name ||
              project.tradeCase.customer.email
            }
            category={project.tradeCase.category}
            completedSteps={completedSteps}
            totalSteps={totalSteps}
            tasks={project.tasks}
          />
          <ProjectTimeSummary
            estimated={totalEstimatedHours}
            logged={totalLoggedHours}
            remaining={totalRemainingHours}
          />
        </>
      )}

      {tab === "tasks" && (
        <>
          <div className="mb-4 flex justify-end gap-3 print:hidden">
            <ProjectTasksExportButton
              projectTitle={project.title}
              tasks={project.tasks}
            />

            <ProjectPrintButton />
          </div>
          <ProjectOverviewHeader
            project={{
              id: project.id,
              title: project.title,
              status: project.status,
            }}
            tasks={project.tasks}
          />

          <ProjectHealthCard tasks={project.tasks} />
          <ProjectCriticalPathCard tasks={project.tasks} />
          <ProjectAIInsights tasks={project.tasks} />
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <ProjectTasksSection
              projectId={project.id}
              tasks={project.tasks}
              assignableUsers={assignableUsers}
              isAdmin={user.role === "admin"}
            />

            <ProjectAIAssistant tasks={project.tasks} />
            <ProjectAIInsights tasks={project.tasks} />
          </div>
        </>
      )}
      {tab === "board" && <ProjectBoard tasks={project.tasks} />}
      {tab === "calendar" && <ProjectCalendarView tasks={project.tasks} />}
      {tab === "gantt" && <ProjectGanttView tasks={project.tasks} />}
      {tab === "workload" && <ProjectWorkloadView tasks={project.tasks} />}
      {tab === "documents" && (
        <ProjectDocuments
          tasks={project.tasks}
          isAdmin={user.role === "admin"}
        />
      )}
      {tab === "activity" && (
        <ProjectActivitySection activities={project.tradeCase.activities} />
      )}

      {tab === "timeline" && (
        <ProjectTimeline steps={project.tradeCase.steps} />
      )}
    </div>
  );
}
