import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
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
import ProjectMessaging from "../../../components/project/ProjectMessaging";

const PROJECT_TABS = [
  "overview",
  "tasks",
  "board",
  "calendar",
  "gantt",
  "workload",
  "documents",
  "messages",
  "activity",
  "timeline",
] as const;

type ProjectTab = (typeof PROJECT_TABS)[number];

function isProjectTab(
  value: string | undefined,
): value is ProjectTab {
  return PROJECT_TABS.includes(
    value as ProjectTab,
  );
}

function normalizeNumber(
  value: number | null | undefined,
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}) {
  const user = await requireUser();

  const [t, locale] = await Promise.all([
    getTranslations("projectDetailPage"),
    getLocale(),
  ]);

  const { id } = await params;
  const { tab } = await searchParams;

  const projectId = Number(id);

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0
  ) {
    notFound();
  }

  const activeTab: ProjectTab =
    isProjectTab(tab)
      ? tab
      : "overview";

  const project =
    await prisma.project.findUnique({
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
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            activities: {
              include: {
                user: {
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
            steps: {
              orderBy: {
                id: "asc",
              },
            },
          },
        },
        conversations: {
          include: {
            messages: {
              include: {
                sender: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!project || !project.tradeCase) {
    notFound();
  }

  const isCustomer =
    project.createdBy === user.id;

  const isProvider =
    project.assignedTo === user.id;

  const isAdmin = user.role === "admin";

  if (
    !isAdmin &&
    !isCustomer &&
    !isProvider
  ) {
    notFound();
  }

  const participantIds = [
    project.createdBy,
    project.assignedTo,
  ].filter(
    (value): value is number =>
      typeof value === "number",
  );

  const assignableUsers =
    participantIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: participantIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: [
            {
              name: "asc",
            },
            {
              email: "asc",
            },
          ],
        })
      : [];

  const completedSteps =
    project.tradeCase.steps.filter(
      (step) => step.completed,
    ).length;

  const totalSteps =
    project.tradeCase.steps.length;

  const totalEstimatedHours =
    project.tasks.reduce(
      (sum, task) =>
        sum +
        normalizeNumber(
          task.estimatedHours,
        ),
      0,
    );

  const totalLoggedHours =
    project.tasks.reduce(
      (sum, task) =>
        sum +
        normalizeNumber(task.loggedHours),
      0,
    );

  const totalRemainingHours =
    project.tasks.reduce(
      (sum, task) =>
        sum +
        normalizeNumber(
          task.remainingHours,
        ),
      0,
    );

  const isRtl =
    locale.startsWith("fa") ||
    locale.startsWith("ar");

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <Link
        href="/dashboard/projects"
        className="mb-8 inline-flex items-center gap-2 text-blue-400 hover:underline"
      >
        <span aria-hidden="true">
          {isRtl ? "→" : "←"}
        </span>

        <span>
          {t("backToProjects")}
        </span>
      </Link>

      <div className="sticky top-0 z-30 -mx-6 mb-8 border-b border-slate-800 bg-slate-950/95 px-6 pb-4 pt-6 backdrop-blur">
        <ProjectHeader
          status={project.status}
          title={project.title}
          description={
            project.description ||
            project.tradeCase.description
          }
          progress={project.progress}
        />

        <ProjectTabs
          projectId={project.id}
        />
      </div>

      {activeTab === "overview" && (
        <>
          <ProjectOverviewCards
            customer={
              project.tradeCase.customer
                .name ||
              project.tradeCase.customer
                .email
            }
            category={
              project.tradeCase.category
            }
            completedSteps={
              completedSteps
            }
            totalSteps={totalSteps}
            tasks={project.tasks}
          />

          <ProjectTimeSummary
            estimated={
              totalEstimatedHours
            }
            logged={totalLoggedHours}
            remaining={
              totalRemainingHours
            }
          />
        </>
      )}

      {activeTab === "tasks" && (
        <>
          <div className="mb-4 flex flex-wrap justify-end gap-3 print:hidden">
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

          <div className="mt-8 space-y-6">
            <ProjectHealthCard
              tasks={project.tasks}
            />

            <ProjectCriticalPathCard
              tasks={project.tasks}
            />

            <ProjectAIInsights
              tasks={project.tasks}
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ProjectTasksSection
              projectId={project.id}
              tasks={project.tasks}
              assignableUsers={
                assignableUsers
              }
              isAdmin={isAdmin}
            />

            <ProjectAIAssistant
              tasks={project.tasks}
            />
          </div>
        </>
      )}

      {activeTab === "board" && (
        <ProjectBoard
          tasks={project.tasks}
        />
      )}

      {activeTab === "calendar" && (
        <ProjectCalendarView
          tasks={project.tasks}
        />
      )}

      {activeTab === "gantt" && (
        <ProjectGanttView
          tasks={project.tasks}
        />
      )}

      {activeTab === "workload" && (
        <ProjectWorkloadView
          tasks={project.tasks}
        />
      )}

      {activeTab === "documents" && (
        <ProjectDocuments
          tasks={project.tasks}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === "messages" && (
        <ProjectMessaging
          projectId={project.id}
          conversations={
            project.conversations
          }
          currentUserId={user.id}
        />
      )}

      {activeTab === "activity" && (
        <ProjectActivitySection
          activities={
            project.tradeCase.activities
          }
        />
      )}

      {activeTab === "timeline" && (
        <ProjectTimeline
          steps={
            project.tradeCase.steps
          }
        />
      )}
    </main>
  );
}