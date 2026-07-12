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
  "COMMENT_ADDED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "MESSAGE_SENT",
] as const;

type KnownAction = (typeof KNOWN_ACTIONS)[number];

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

  function getActionLabel(action: string) {
    if (isKnownAction(action)) {
      return t(
        `actions.${action.toLowerCase()}`,
      );
    }

    return action
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      );
  }

  const recentActivities = [...activities]
    .sort((first, second) => {
      const firstTime = new Date(
        first.createdAt,
      ).getTime();

      const secondTime = new Date(
        second.createdAt,
      ).getTime();

      return (
        (Number.isNaN(secondTime)
          ? 0
          : secondTime) -
        (Number.isNaN(firstTime)
          ? 0
          : firstTime)
      );
    })
    .slice(0, 8);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
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
            (activity) => (
              <li
                key={activity.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="break-words font-semibold text-white">
                  {getActionLabel(
                    activity.action,
                  )}
                </p>

                {activity.details && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">
                    {activity.details}
                  </p>
                )}

                <time
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
                  className="mt-2 block text-xs text-slate-500"
                >
                  {formatDate(
                    activity.createdAt,
                  )}
                </time>
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  );
}