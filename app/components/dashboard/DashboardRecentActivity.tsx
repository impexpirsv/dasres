import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

type Activity = {
  id: number;
  action: string;
  details: string | null;
  caseId: number;
  createdAt: Date;
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

function getActivityIcon(action: string) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return "📨";

    case "PROPOSAL_ACCEPTED":
      return "✅";

    case "PROPOSAL_REJECTED":
      return "❌";

    case "CASE_COMPLETED":
    case "PROJECT_COMPLETED":
      return "🏁";

    case "DOCUMENT_UPLOADED":
    case "PROJECT_TASK_ATTACHMENT_UPLOADED":
      return "📄";

    case "DOCUMENT_APPROVED":
      return "✅";

    case "DOCUMENT_REJECTED":
      return "❌";

    case "MESSAGE_SENT":
    case "PROJECT_MESSAGE_SENT":
      return "💬";

    case "TASK_COMMENT_ADDED":
      return "💭";

    case "TASK_ASSIGNED":
      return "👤";

    case "TASK_COMPLETED":
      return "✅";

    case "PROJECT_TASK_UPDATED":
      return "🔔";

    case "PROJECT_TASK_CHECKLIST_TOGGLED":
      return "☑️";

    case "TICKET_UPDATED":
      return "🎫";

    case "COMPANY_VERIFIED":
      return "🏢";

    case "COMPANY_REJECTED":
      return "⚠️";

    default:
      return "🔔";
  }
}

function getActivityTranslationKey(action: string) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return "proposalSubmitted";

    case "PROPOSAL_ACCEPTED":
      return "proposalAccepted";

    case "PROPOSAL_REJECTED":
      return "proposalRejected";

    case "CASE_COMPLETED":
      return "caseCompleted";

    case "PROJECT_COMPLETED":
      return "projectCompleted";

    case "DOCUMENT_UPLOADED":
      return "documentUploaded";

    case "PROJECT_TASK_ATTACHMENT_UPLOADED":
      return "projectTaskAttachmentUploaded";

    case "DOCUMENT_APPROVED":
      return "documentApproved";

    case "DOCUMENT_REJECTED":
      return "documentRejected";

    case "MESSAGE_SENT":
      return "messageSent";

    case "PROJECT_MESSAGE_SENT":
      return "projectMessageSent";

    case "TASK_COMMENT_ADDED":
      return "taskCommentAdded";

    case "TASK_ASSIGNED":
      return "taskAssigned";

    case "TASK_COMPLETED":
      return "taskCompleted";

    case "PROJECT_TASK_UPDATED":
      return "projectTaskUpdated";

    case "PROJECT_TASK_CHECKLIST_TOGGLED":
      return "projectTaskChecklistToggled";

    case "TICKET_UPDATED":
      return "ticketUpdated";

    case "COMPANY_VERIFIED":
      return "companyVerified";

    case "COMPANY_REJECTED":
      return "companyRejected";

    default:
      return null;
  }
}

function getBadgeColor(action: string) {
  if (
    action.includes("MESSAGE") ||
    action.includes("COMMENT")
  ) {
    return "border-blue-500/30 bg-blue-500/20 text-blue-300";
  }

  if (
    action.includes("DOCUMENT") ||
    action.includes("ATTACHMENT")
  ) {
    return "border-purple-500/30 bg-purple-500/20 text-purple-300";
  }

  if (action.includes("PROPOSAL")) {
    return "border-emerald-500/30 bg-emerald-500/20 text-emerald-300";
  }

  if (
    action.includes("CASE") ||
    action.includes("PROJECT") ||
    action.includes("TASK")
  ) {
    return "border-yellow-500/30 bg-yellow-500/20 text-yellow-300";
  }

  if (action.includes("TICKET")) {
    return "border-orange-500/30 bg-orange-500/20 text-orange-300";
  }

  if (action.includes("COMPANY")) {
    return "border-cyan-500/30 bg-cyan-500/20 text-cyan-300";
  }

  return "border-slate-600 bg-slate-700 text-slate-300";
}

export default async function DashboardRecentActivity({
  recentActivities,
}: {
  recentActivities: Activity[];
}) {
  const t = await getTranslations(
    "dashboardRecentActivity",
  );

  const locale = await getLocale();
  const dateLocale =
    localeMap[locale] ?? locale;

  return (
    <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {t("title")}
        </h2>
      </div>

      {recentActivities.length === 0 ? (
        <p className="text-slate-500">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {recentActivities.map(
            (activity) => {
              const translationKey =
                getActivityTranslationKey(
                  activity.action,
                );

              const activityLabel =
                translationKey
                  ? t(
                      `actions.${translationKey}`,
                    )
                  : activity.action.replaceAll(
                      "_",
                      " ",
                    );

              const badgeColor =
                getBadgeColor(
                  activity.action,
                );

              const icon =
                getActivityIcon(
                  activity.action,
                );

              return (
                <div
                  key={activity.id}
                  className="border-b border-slate-800 pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {icon}{" "}
                      {activityLabel}
                    </p>

                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor}`}
                    >
                      {activityLabel}
                    </span>
                  </div>

                  {activity.details && (
                    <p className="mt-1 text-sm text-slate-400">
                      {
                        activity.details
                      }
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    {activity.user
                      ?.name ||
                      t("system")}
                    {" • "}

                    <Link
                      href={`/dashboard/cases/${activity.caseId}`}
                      className="text-blue-400 hover:underline"
                    >
                      {
                        activity
                          .tradeCase.title
                      }
                    </Link>

                    {" • "}

                    {activity.createdAt.toLocaleString(
                      dateLocale,
                    )}
                  </p>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}