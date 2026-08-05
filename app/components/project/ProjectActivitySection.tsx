import {
  getLocale,
  getTranslations,
} from "next-intl/server";

type Activity = {
  id: number;
  action: string;
  details: string | null;
  createdAt: Date | string;
};

const KNOWN_ACTIONS = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_ASSIGNED",
  "TASK_COMPLETED",
  "TASK_STATUS_UPDATED",
  "PROJECT_TASK_STATUS_UPDATED",
  "COMMENT_ADDED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "MESSAGE_SENT",
  "PROJECT_TASK_CREATED",
  "PROJECT_TASK_UPDATED",
  "PROJECT_TASK_ASSIGNED",
  "PROJECT_TASK_COMPLETED",
  "PROJECT_TASK_CHECKLIST_CREATED",
  "PROJECT_TASK_CHECKLIST_TOGGLED",
  "PROJECT_TASK_COMMENT_CREATED",
  "PROJECT_TASK_COMMENT_UPDATED",
  "PROJECT_TASK_COMMENT_DELETED",
  "PROJECT_TASK_ATTACHMENT_UPLOADED",
  "PROJECT_MESSAGE_SENT",
  "PROJECT_DOCUMENT_APPROVED",
  "PROJECT_DOCUMENT_REJECTED",
] as const;

type KnownAction =
  (typeof KNOWN_ACTIONS)[number];

function isKnownAction(
  action: string,
): action is KnownAction {
  return KNOWN_ACTIONS.includes(
    action as KnownAction,
  );
}

export default async function ProjectActivitySection({
  activities,
}: {
  activities: Activity[];
}) {
  const t = await getTranslations(
    "projectActivitySection",
  );

  const locale = await getLocale();

  const dateFormatter =
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  function formatDate(
    value: Date | string,
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  function getActionLabel(
    action: string,
  ) {
    if (isKnownAction(action)) {
      const key = action.toLowerCase();

      if (
        t.has(`actions.${key}`)
      ) {
        return t(
          `actions.${key}`,
        );
      }
    }

    return action.replaceAll(
      "_",
      " ",
    );
  }

  function getStatusLabel(
    status: string,
  ) {
    const key =
      status.toLowerCase();

    if (
      t.has(`statuses.${key}`)
    ) {
      return t(
        `statuses.${key}`,
      );
    }

    return status;
  }

  function getDetails(
    action: string,
    details: string | null,
  ) {
    if (!details) {
      return null;
    }

    try {
      const data = JSON.parse(
        details.trim(),
      ) as {
        taskTitle?: unknown;
        status?: unknown;
        fileName?: unknown;
      };

      if (
        action ===
          "PROJECT_TASK_STATUS_UPDATED" &&
        typeof data.taskTitle ===
          "string"
      ) {
        return t(
          "details.taskStatusUpdated",
          {
            title:
              data.taskTitle,
            status:
              getStatusLabel(
                String(
                  data.status ??
                    "",
                ),
              ),
          },
        );
      }

      if (
        action ===
          "DOCUMENT_UPLOADED"
      ) {
        return t(
          "details.documentUploaded",
          {
            file:
              typeof data.fileName ===
              "string"
                ? data.fileName
                : "",
          },
        );
      }

      return details;
    } catch {
      if (
        action ===
        "PROJECT_TASK_STATUS_UPDATED"
      ) {
        return details.replace(
          /([A-Z_]+)$/,
          (value) =>
            getStatusLabel(
              value,
            ),
        );
      }

      return details;
    }
  }

  const recentActivities = [
    ...activities,
  ]
    .sort(
      (
        first,
        second,
      ) =>
        new Date(
          second.createdAt,
        ).getTime() -
        new Date(
          first.createdAt,
        ).getTime(),
    )
    .slice(0, 8);

  return (
        <section className="workspace-panel">
      <h2 className="mb-5 text-2xl font-bold text-white">
        {t("title")}
      </h2>

      {recentActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
          {t("emptyState")}
        </div>
      ) : (
        <ol className="space-y-4">
          {recentActivities.map(
            (activity) => {
              const details =
                getDetails(
                  activity.action,
                  activity.details,
                );

              return (
                <li
                  key={activity.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4"
                >
                  <p className="break-words font-semibold text-white">
                    {getActionLabel(
                      activity.action,
                    )}
                  </p>

                  {details && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">
                      {details}
                    </p>
                  )}

                  <time
                    className="mt-2 block text-xs text-slate-500"
                    dateTime={
                      Number.isNaN(
                        new Date(
                          activity.createdAt,
                        ).getTime(),
                      )
                        ? undefined
                        : new Date(
                            activity.createdAt,
                          ).toISOString()
                    }
                  >
                    {formatDate(
                      activity.createdAt,
                    )}
                  </time>
                </li>
              );
            },
          )}
        </ol>
      )}
    </section>
  );
}
