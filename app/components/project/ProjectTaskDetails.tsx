"use client";

import { useLocale, useTranslations } from "next-intl";
import ProjectTaskStatusSelect from "./ProjectTaskStatusSelect";
import EditProjectTaskForm from "./EditProjectTaskForm";
import ProjectTaskAttachmentUpload from "./ProjectTaskAttachmentUpload";
import ProjectTaskComments from "./ProjectTaskComments";
import ProjectTaskChecklist from "./ProjectTaskChecklist";
import AssignTaskSelect from "./AssignTaskSelect";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assignedToId: number | null;
  assignedTo: UserOption | null;
  progress: number;
  estimatedHours: number | null;
  loggedHours: number;
  remainingHours: number;
  attachments: {
    id: number;
    fileName: string;
    uploadedBy: UserOption | null;
  }[];
  comments: Parameters<
    typeof ProjectTaskComments
  >[0]["comments"];
  checklistItems: {
    id: number;
    title: string;
    completed: boolean;
  }[];
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
  dependents?: {
    id: number;
    title: string;
    status?: string;
  }[];
};

const priorityClasses: Record<string, string> = {
  URGENT: "bg-red-600 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-yellow-600 text-white",
  LOW: "bg-slate-700 text-white",
};

const dependentStatusClasses: Record<
  string,
  string
> = {
  COMPLETED:
    "bg-green-600/20 text-green-300",
  IN_PROGRESS:
    "bg-blue-600/20 text-blue-300",
  REVIEW:
    "bg-yellow-600/20 text-yellow-300",
  TODO: "bg-slate-700 text-slate-300",
};

export default function ProjectTaskDetails({
  task,
  assignableUsers,
  availableTasks,
  isAdmin,
}: {
  task: Task | null;
  assignableUsers: UserOption[];
  availableTasks: {
    id: number;
    title: string;
  }[];
  isAdmin: boolean;
}) {
  const t = useTranslations(
    "projectTaskDetails",
  );
  const locale = useLocale();

  if (!task) {
    return (
      <div className="ui-card ui-empty p-8 text-center text-slate-400">
        {t("emptyState")}
      </div>
    );
  }

  const priorityKey =
    task.priority.toLowerCase();

  const priorityClass =
    priorityClasses[task.priority] ??
    priorityClasses.LOW;

  const startDate = task.startDate
    ? new Date(task.startDate)
    : null;

  const dueDate = task.dueDate
    ? new Date(task.dueDate)
    : null;

  const validStartDate =
    startDate !== null &&
    !Number.isNaN(startDate.getTime());

  const validDueDate =
    dueDate !== null &&
    !Number.isNaN(dueDate.getTime());
const now = new Date();
  const isOverdue =
    validDueDate &&
    task.status !== "COMPLETED" &&
   dueDate.getTime() < now.getTime();
   
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);

  const normalizedProgress = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(Number(task.progress))
        ? Number(task.progress)
        : 0,
    ),
  );

  return (
    <div className="workspace-panel bg-slate-950">
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold text-white">
            {task.title}
          </h2>

          {task.description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
              {task.description}
            </p>
          )}
        </div>

        <span
          className={`ui-badge shrink-0 ${priorityClass}`}
        >
          {t(
            `priorities.${priorityKey}`,
          )}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">
            {t("assignedTo")}
          </p>

          {isAdmin ? (
            <AssignTaskSelect
              taskId={task.id}
              assignedToId={
                task.assignedToId
              }
              users={assignableUsers}
            />
          ) : (
            <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              {task.assignedTo?.name ||
                task.assignedTo?.email ||
                t("unassigned")}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">
            {t("startDate")}
          </p>

          <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            {validStartDate && startDate
              ? formatDate(startDate)
              : t("noStartDate")}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">
            {t("dueDate")}
          </p>

          <p
            className={`rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm ${
              isOverdue
                ? "text-red-400"
                : "text-slate-300"
            }`}
          >
            {validDueDate && dueDate
              ? formatDate(dueDate)
              : t("noDueDate")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            {t("progress")}
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-400">
            {normalizedProgress}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            {t("estimated")}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {task.estimatedHours !== null
              ? t("hours", {
                  count:
                    task.estimatedHours,
                })
              : t("notSet")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            {t("logged")}
          </p>

          <p className="mt-2 text-2xl font-bold text-green-400">
            {t("hours", {
              count: task.loggedHours,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            {t("remaining")}
          </p>

          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {t("hours", {
              count:
                task.remainingHours,
            })}
          </p>
        </div>
      </div>

      {task.dependsOn && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">
            {t("dependsOn")}
          </p>

          <p className="mt-2 break-words text-sm font-semibold text-white">
            {task.dependsOn.title}
          </p>
        </div>
      )}

      {(task.dependents?.length ?? 0) >
        0 && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">
            {t("blocks")}
          </p>

          <div className="mt-3 space-y-2">
            {task.dependents?.map(
              (dependent) => {
                const status =
                  dependent.status ??
                  "TODO";

                const statusKey =
                  status.toLowerCase();

                const statusClass =
                  dependentStatusClasses[
                    status
                  ] ??
                  dependentStatusClasses.TODO;

                return (
                  <div
                    key={dependent.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <span className="min-w-0 break-words text-sm font-medium text-white">
                      {
                        dependent.title
                      }
                    </span>

                    <span
                      className={`ui-badge shrink-0 ${statusClass}`}
                    >
                      {t(
                        `statuses.${statusKey}`,
                      )}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <ProjectTaskStatusSelect
          taskId={task.id}
          currentStatus={task.status}
        />
      </div>

      <div className="mt-5">
        <EditProjectTaskForm
          taskId={task.id}
          currentTitle={task.title}
          currentDescription={
            task.description
          }
          currentPriority={
            task.priority
          }
          currentStartDate={
            task.startDate
          }
          currentDueDate={task.dueDate}
          currentAssignedToId={
            task.assignedToId
          }
          assignableUsers={
            assignableUsers
          }
          currentEstimatedHours={
            task.estimatedHours ??
            undefined
          }
          currentLoggedHours={
            task.loggedHours
          }
          currentDependsOnId={
            task.dependsOn?.id
          }
          availableTasks={
            availableTasks
          }
        />
      </div>

      <div className="mt-5">
        <ProjectTaskAttachmentUpload
          taskId={task.id}
        />
      </div>

      {task.attachments.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            {t("attachments")}
          </p>

          <div className="space-y-2">
            {task.attachments.map(
              (attachment) => {
                const uploader =
                  attachment.uploadedBy
                    ?.name ||
                  attachment.uploadedBy
                    ?.email ||
                  t("unknown");

                return (
                  <a
                    key={attachment.id}
                    href={
                      `/api/project-task-attachments/${attachment.id}/download`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 flex-col items-start justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-blue-300 transition hover:border-blue-500 hover:text-blue-200 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="break-all font-semibold">
                      {
                        attachment.fileName
                      }
                    </div>

                    <div className="break-words text-xs text-slate-500 sm:text-end">
                      {t("uploadedBy", {
                        name: uploader,
                      })}
                    </div>
                  </a>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <ProjectTaskChecklist
          taskId={task.id}
          items={task.checklistItems}
        />
      </div>

      <div className="mt-5">
        <ProjectTaskComments
          taskId={task.id}
          comments={task.comments}
        />
      </div>
    </div>
  );
}
