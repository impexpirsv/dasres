import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

type Activity = {
  id: number;
  action: string;
  details: string | null;
  caseId: number;
  createdAt: Date | string;
  user: {
    name: string | null;
  } | null;
  tradeCase: {
    title: string;
  };
};

const localeMap: Record<string, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar",
};

const ACTION_CONFIG: Record<
  string,
  { key: string; icon: string }
> = {
  PROPOSAL_SUBMITTED: { key: "proposalSubmitted", icon: "📨" },
  PROPOSAL_ACCEPTED: { key: "proposalAccepted", icon: "✅" },
  PROPOSAL_REJECTED: { key: "proposalRejected", icon: "❌" },
  CASE_COMPLETED: { key: "caseCompleted", icon: "🏁" },
  CASE_STEP_COMPLETED: { key: "caseStepCompleted", icon: "✅" },
  PROJECT_CREATED: { key: "projectCreated", icon: "📁" },
  PROJECT_UPDATED: { key: "projectUpdated", icon: "✏️" },
  PROJECT_COMPLETED: { key: "projectCompleted", icon: "🏁" },
  TASK_CREATED: { key: "taskCreated", icon: "➕" },
  PROJECT_TASK_CREATED: { key: "projectTaskCreated", icon: "➕" },
  TASK_UPDATED: { key: "taskUpdated", icon: "✏️" },
  PROJECT_TASK_UPDATED: { key: "projectTaskUpdated", icon: "✏️" },
  TASK_ASSIGNED: { key: "taskAssigned", icon: "👤" },
  PROJECT_TASK_ASSIGNED: { key: "projectTaskAssigned", icon: "👤" },
  TASK_COMPLETED: { key: "taskCompleted", icon: "✅" },
  PROJECT_TASK_COMPLETED: { key: "projectTaskCompleted", icon: "✅" },
  TASK_STATUS_UPDATED: { key: "taskStatusUpdated", icon: "🔔" },
  PROJECT_TASK_STATUS_UPDATED: { key: "projectTaskStatusUpdated", icon: "🔔" },
  COMMENT_ADDED: { key: "commentAdded", icon: "💭" },
  TASK_COMMENT_ADDED: { key: "taskCommentAdded", icon: "💭" },
  PROJECT_TASK_COMMENT_CREATED: { key: "projectTaskCommentCreated", icon: "💭" },
  PROJECT_TASK_COMMENT_UPDATED: { key: "projectTaskCommentUpdated", icon: "💭" },
  PROJECT_TASK_COMMENT_DELETED: { key: "projectTaskCommentDeleted", icon: "🗑️" },
  DOCUMENT_UPLOADED: { key: "documentUploaded", icon: "📄" },
  PROJECT_TASK_ATTACHMENT_UPLOADED: {
    key: "projectTaskAttachmentUploaded",
    icon: "📄",
  },
  DOCUMENT_APPROVED: { key: "documentApproved", icon: "✅" },
  DOCUMENT_REJECTED: { key: "documentRejected", icon: "❌" },
  MESSAGE_SENT: { key: "messageSent", icon: "💬" },
  PROJECT_MESSAGE_SENT: { key: "projectMessageSent", icon: "💬" },
  PROJECT_TASK_CHECKLIST_CREATED: {
    key: "projectTaskChecklistCreated",
    icon: "☑️",
  },
  PROJECT_TASK_CHECKLIST_TOGGLED: {
    key: "projectTaskChecklistToggled",
    icon: "☑️",
  },
  TICKET_UPDATED: { key: "ticketUpdated", icon: "🎫" },
  COMPANY_VERIFIED: { key: "companyVerified", icon: "🏢" },
  COMPANY_REJECTED: { key: "companyRejected", icon: "⚠️" },
};

function getBadgeColor(action: string): string {
  if (action.includes("MESSAGE") || action.includes("COMMENT")) {
    return "border-blue-500/30 bg-blue-500/20 text-blue-300";
  }
  if (action.includes("DOCUMENT") || action.includes("ATTACHMENT")) {
    return "border-purple-500/30 bg-purple-500/20 text-purple-300";
  }
  if (action.includes("PROPOSAL")) {
    return "border-emerald-500/30 bg-emerald-500/20 text-emerald-300";
  }
  if (action.includes("TICKET")) {
    return "border-orange-500/30 bg-orange-500/20 text-orange-300";
  }
  if (action.includes("COMPANY")) {
    return "border-cyan-500/30 bg-cyan-500/20 text-cyan-300";
  }
  if (
    action.includes("CASE") ||
    action.includes("PROJECT") ||
    action.includes("TASK") ||
    action.includes("CHECKLIST")
  ) {
    return "border-yellow-500/30 bg-yellow-500/20 text-yellow-300";
  }
  return "border-slate-600 bg-slate-700 text-slate-300";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default async function DashboardRecentActivity({
  recentActivities,
}: {
  recentActivities: Activity[];
}) {
  const t = await getTranslations("dashboardRecentActivity");
  const locale = await getLocale();
  const dateLocale = localeMap[locale] ?? locale;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function translateStatus(status: string): string {
    const key = status.toLowerCase();
    return t.has(`statuses.${key}`) ? t(`statuses.${key}`) : status.replaceAll("_", " ");
  }

  function getActivityLabel(action: string): string {
    const config = ACTION_CONFIG[action];
    return config && t.has(`actions.${config.key}`)
      ? t(`actions.${config.key}`)
      : action.replaceAll("_", " ");
  }

  function translateLegacyDetails(details: string): string {
    return details
      .replace(
        "Project task status updated:",
        t.has("details.projectTaskStatusUpdatedPrefix")
          ? t("details.projectTaskStatusUpdatedPrefix")
          : "Project task status updated:",
      )
      .replace(
        "Attachment uploaded:",
        t.has("details.attachmentUploadedPrefix")
          ? t("details.attachmentUploadedPrefix")
          : "Attachment uploaded:",
      )
      .replace(
        "Project task updated:",
        t.has("details.projectTaskUpdatedPrefix")
          ? t("details.projectTaskUpdatedPrefix")
          : "Project task updated:",
      )
      .replaceAll("IN_PROGRESS", translateStatus("IN_PROGRESS"))
      .replaceAll("COMPLETED", translateStatus("COMPLETED"))
      .replaceAll("REVIEW", translateStatus("REVIEW"))
      .replaceAll("TODO", translateStatus("TODO"));
  }

  function getActivityDetails(action: string, details: string | null): string | null {
    if (!details) return null;

    try {
      const parsed: unknown = JSON.parse(details);
      if (!isRecord(parsed)) return translateLegacyDetails(details);

      const taskTitle =
        typeof parsed.taskTitle === "string"
          ? parsed.taskTitle
          : typeof parsed.title === "string"
            ? parsed.title
            : "";
      const fileName = typeof parsed.fileName === "string" ? parsed.fileName : "";
      const status = typeof parsed.status === "string" ? parsed.status : "";
      const itemTitle =
        typeof parsed.item === "string"
          ? parsed.item
          : typeof parsed.checklistTitle === "string"
            ? parsed.checklistTitle
            : typeof parsed.title === "string"
              ? parsed.title
              : "";

      if (
        (action === "PROJECT_TASK_STATUS_UPDATED" ||
          action === "TASK_STATUS_UPDATED") &&
        taskTitle &&
        status &&
        t.has("details.projectTaskStatusUpdated")
      ) {
        return t("details.projectTaskStatusUpdated", {
          title: taskTitle,
          status: translateStatus(status),
        });
      }

      if (
        (action === "PROJECT_TASK_ATTACHMENT_UPLOADED" ||
          action === "DOCUMENT_UPLOADED") &&
        t.has("details.projectTaskAttachmentUploaded")
      ) {
        return t("details.projectTaskAttachmentUploaded", { file: fileName });
      }

      if (action === "PROJECT_TASK_CHECKLIST_TOGGLED") {
        const completedLabel =
          parsed.completed === true
            ? t.has("checklist.completed")
              ? t("checklist.completed")
              : "Completed"
            : t.has("checklist.incomplete")
              ? t("checklist.incomplete")
              : "Incomplete";
        return itemTitle ? `${completedLabel} → ${itemTitle}` : completedLabel;
      }

      if (taskTitle) return taskTitle;
      if (fileName) return fileName;
      if (itemTitle) return itemTitle;

      return null;
    } catch {
      return translateLegacyDetails(details);
    }
  }

  return (
    <section className="mt-12 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-white">{t("title")}</h2>
      </div>

      {recentActivities.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const config = ACTION_CONFIG[activity.action];
            const activityLabel = getActivityLabel(activity.action);
            const activityDetails = getActivityDetails(activity.action, activity.details);
            const createdAt = new Date(activity.createdAt);
            const validCreatedAt = !Number.isNaN(createdAt.getTime());

            return (
              <article
                key={activity.id}
                className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl"
                    >
                      {config?.icon ?? "🔔"}
                    </div>
                    <p className="min-w-0 break-words font-bold text-white">
                      {activityLabel}
                    </p>
                  </div>

                  <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeColor(activity.action)}`}>
                    {activityLabel}
                  </span>
                </div>

                {activityDetails && (
                  <p className="mt-4 break-words rounded-xl bg-slate-900 p-3 text-sm leading-6 text-slate-400">
                    {activityDetails}
                  </p>
                )}

                <p className="mt-4 break-words text-xs leading-5 text-slate-500">
                  {activity.user?.name || t("system")}
                  {" • "}
                  <Link
                    href={`/dashboard/cases/${activity.caseId}`}
                    className="text-blue-400 transition hover:text-blue-300 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {activity.tradeCase.title}
                  </Link>
                  {validCreatedAt && (
                    <>
                      {" • "}
                      <time dateTime={createdAt.toISOString()}>
                        {dateFormatter.format(createdAt)}
                      </time>
                    </>
                  )}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
