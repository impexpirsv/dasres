import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import {
  getProjectActivityData,
  getProjectBoardData,
  getProjectCalendarData,
  getProjectDetailHeader,
  getProjectDocumentsData,
  getProjectGanttData,
  getProjectMessagesData,
  getProjectOverviewData,
  getProjectTasksData,
  getProjectTimelineData,
  getProjectWorkloadData,
  isProjectDetailTab,
  type ProjectDetailTab,
} from "../../../../lib/projects/project-detail-data";
import { getAuthorizedProjectViewScope } from "../../../../lib/projects/project-view-access";
import ProjectActivitySection from "../../../components/project/ProjectActivitySection";
import ProjectAIAssistant from "../../../components/project/ProjectAIAssistant";
import ProjectAIInsights from "../../../components/project/ProjectAIInsights";
import ProjectBoard from "../../../components/project/ProjectBoard";
import ProjectCalendarView from "../../../components/project/ProjectCalendarView";
import ProjectCriticalPathCard from "../../../components/project/ProjectCriticalPathCard";
import ProjectDocuments from "../../../components/project/ProjectDocuments";
import ProjectGanttView from "../../../components/project/ProjectGanttView";
import ProjectHealthCard from "../../../components/project/ProjectHealthCard";
import ProjectHeader from "../../../components/project/ProjectHeader";
import ProjectMessaging from "../../../components/project/ProjectMessaging";
import ProjectOverviewCards from "../../../components/project/ProjectOverviewCards";
import ProjectOverviewHeader from "../../../components/project/ProjectOverviewHeader";
import ProjectPrintButton from "../../../components/project/ProjectPrintButton";
import ProjectTabs from "../../../components/project/ProjectTabs";
import ProjectTasksExportButton from "../../../components/project/ProjectTasksExportButton";
import ProjectTasksSection from "../../../components/project/ProjectTasksSection";
import ProjectTimeline from "../../../components/project/ProjectTimeline";
import ProjectTimeSummary from "../../../components/project/ProjectTimeSummary";
import ProjectWorkloadView from "../../../components/project/ProjectWorkloadView";

function normalizeNumber(
  value: number | null | undefined,
): number {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : 0;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const [t, locale, resolvedParams, resolvedSearchParams] =
    await Promise.all([
      getTranslations("projectDetailPage"),
      getLocale(),
      params,
      searchParams,
    ]);

  const projectId = Number(
    resolvedParams.id,
  );

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0
  ) {
    notFound();
  }

  const activeTab: ProjectDetailTab =
    isProjectDetailTab(
      resolvedSearchParams.tab,
    )
      ? resolvedSearchParams.tab
      : "overview";

  const authorizedProjectScope =
    await getAuthorizedProjectViewScope({
      projectId,
      userId: user.id,
      userRole: user.role,
    });

  if (!authorizedProjectScope) {
    notFound();
  }

  const project =
    await getProjectDetailHeader(
      authorizedProjectScope,
    );

  if (!project || !project.tradeCase) {
    notFound();
  }

  const isAdmin = user.role === "admin";
  let tabContent: ReactNode;

  switch (activeTab) {
    case "overview": {
      const data =
        await getProjectOverviewData(
          authorizedProjectScope,
        );

      if (!data || !data.tradeCase) {
        notFound();
      }

      const completedSteps =
        data.tradeCase.steps.filter(
          (step) => step.completed,
        ).length;
      const totalEstimatedHours =
        data.tasks.reduce(
          (sum, task) =>
            sum +
            normalizeNumber(
              task.estimatedHours,
            ),
          0,
        );
      const totalLoggedHours =
        data.tasks.reduce(
          (sum, task) =>
            sum +
            normalizeNumber(
              task.loggedHours,
            ),
          0,
        );
      const totalRemainingHours =
        data.tasks.reduce(
          (sum, task) =>
            sum +
            normalizeNumber(
              task.remainingHours,
            ),
          0,
        );

      tabContent = (
        <>
          <ProjectOverviewCards
            customer={
              data.tradeCase.customer.name ||
              data.tradeCase.customer.email
            }
            category={data.tradeCase.category}
            completedSteps={completedSteps}
            totalSteps={
              data.tradeCase.steps.length
            }
            tasks={data.tasks}
          />

          <ProjectTimeSummary
            estimated={totalEstimatedHours}
            logged={totalLoggedHours}
            remaining={totalRemainingHours}
          />
        </>
      );
      break;
    }

    case "tasks": {
      const data =
        await getProjectTasksData(
          authorizedProjectScope,
        );

      if (!data) {
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
                { name: "asc" },
                { email: "asc" },
              ],
            })
          : [];

      tabContent = (
        <>
          <div className="mb-4 flex flex-wrap justify-end gap-3 print:hidden">
            <ProjectTasksExportButton
              projectTitle={project.title}
              tasks={data.tasks}
            />
            <ProjectPrintButton />
          </div>

          <ProjectOverviewHeader
            project={{
              id: project.id,
              title: project.title,
              status: project.status,
            }}
            tasks={data.tasks}
          />

          <div className="mt-8 space-y-6">
            <ProjectHealthCard
              tasks={data.tasks}
            />
            <ProjectCriticalPathCard
              tasks={data.tasks}
            />
            <ProjectAIInsights
              tasks={data.tasks}
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ProjectTasksSection
              projectId={project.id}
              tasks={data.tasks}
              assignableUsers={assignableUsers}
              isAdmin={isAdmin}
            />
            <ProjectAIAssistant
              tasks={data.tasks}
            />
          </div>
        </>
      );
      break;
    }

    case "board": {
      const data =
        await getProjectBoardData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectBoard tasks={data.tasks} />
      );
      break;
    }

    case "calendar": {
      const data =
        await getProjectCalendarData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectCalendarView
          tasks={data.tasks}
        />
      );
      break;
    }

    case "gantt": {
      const data =
        await getProjectGanttData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectGanttView
          tasks={data.tasks}
        />
      );
      break;
    }

    case "workload": {
      const data =
        await getProjectWorkloadData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectWorkloadView
          tasks={data.tasks}
        />
      );
      break;
    }

    case "documents": {
      const data =
        await getProjectDocumentsData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectDocuments
          tasks={data.tasks}
          isAdmin={isAdmin}
        />
      );
      break;
    }

    case "messages": {
      const data =
        await getProjectMessagesData(
          authorizedProjectScope,
        );
      if (!data) notFound();
      tabContent = (
        <ProjectMessaging
          projectId={project.id}
          conversations={
            data.conversations
          }
          currentUserId={user.id}
        />
      );
      break;
    }

    case "activity": {
      const data =
        await getProjectActivityData(
          authorizedProjectScope,
        );
      if (!data || !data.tradeCase) {
        notFound();
      }
      tabContent = (
        <ProjectActivitySection
          activities={
            data.tradeCase.activities
          }
        />
      );
      break;
    }

    case "timeline": {
      const data =
        await getProjectTimelineData(
          authorizedProjectScope,
        );
      if (!data || !data.tradeCase) {
        notFound();
      }
      tabContent = (
        <ProjectTimeline
          steps={data.tradeCase.steps}
        />
      );
      break;
    }
  }

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
          {isRtl ? "â†’" : "â†گ"}
        </span>
        <span>{t("backToProjects")}</span>
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
        <ProjectTabs projectId={project.id} />
      </div>

      {tabContent}
    </main>
  );
}
