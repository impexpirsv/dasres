import { getTranslations } from "next-intl/server";

type Task = {
  id: number;
  title: string;
  status: string;
  progress?: number | null;
  dueDate: Date | string | null;
  estimatedHours: number | null;
  loggedHours: number | null;
  dependsOn?: {
    id: number;
    status?: string;
  } | null;
};

type RiskLevel = "low" | "medium" | "high";

function isTaskOverdue(
  task: Task,
  today: Date,
) {
  if (
    !task.dueDate ||
    task.status === "COMPLETED"
  ) {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() < today.getTime();
}

export default async function ProjectAIAssistant({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = await getTranslations(
    "projectAIAssistant",
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completed = tasks.filter(
    (task) =>
      task.status === "COMPLETED",
  ).length;

  const overdue = tasks.filter((task) =>
    isTaskOverdue(task, today),
  ).length;

  const blocked = tasks.filter(
    (task) =>
      Boolean(task.dependsOn) &&
      task.dependsOn?.status !==
        "COMPLETED" &&
      task.status !== "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completed / tasks.length) * 100,
        );

  let riskKey: RiskLevel = "low";
  let riskColor = "text-green-300";
  let riskBackground =
    "border-green-500/20 bg-green-500/5";

  if (blocked > 0 || overdue > 0) {
    riskKey = "medium";
    riskColor = "text-amber-300";
    riskBackground =
      "border-amber-500/20 bg-amber-500/5";
  }

  if (blocked > 2 || overdue > 2) {
    riskKey = "high";
    riskColor = "text-red-300";
    riskBackground =
      "border-red-500/20 bg-red-500/5";
  }

  const suggestions: string[] = [];

  if (blocked > 0) {
    suggestions.push(
      t("suggestions.resolveBlocked"),
    );
  }

  if (overdue > 0) {
    suggestions.push(
      t("suggestions.reviewOverdue"),
    );
  }

  if (tasks.length > 0 && progress < 40) {
    suggestions.push(
      t("suggestions.increasePace"),
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      t("suggestions.normal"),
    );
  }

  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <h3 className="text-lg font-bold text-white">
          <span aria-hidden="true">
            🤖
          </span>{" "}
          {t("title")}
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div
          className={`rounded-2xl border p-4 ${riskBackground}`}
        >
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            {t("risk")}
          </p>

          <p
            className={`mt-2 text-2xl font-black ${riskColor}`}
          >
            {t(
              `riskLevels.${riskKey}`,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-wide text-slate-500">
              {t("progress")}
            </p>

            <p className="text-2xl font-black text-blue-300">
              {progress}%
            </p>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label={t("progress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            {t("aiSuggestions")}
          </p>

          <ul className="mt-3 space-y-2">
            {suggestions.map(
              (suggestion, index) => (
                <li
                  key={`${index}-${suggestion}`}
                  className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-cyan-400"
                  >
                    •
                  </span>

                  <span className="break-words">
                    {suggestion}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}