import { getTranslations } from "next-intl/server";

type Task = {
  id: number;
  title: string;
  status: string;
  progress: number;
  dueDate: Date | string | null;
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
  attachments: {
    id: number;
    fileName: string;
    approvalStatus?: string;
  }[];
};

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "COMPLETED") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export default async function ProjectAIInsights({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = await getTranslations("projectAIInsights");

  const overdueTasks = tasks.filter(isOverdue);

  const blockedTasks = tasks.filter(
    (task) =>
      Boolean(task.dependsOn) &&
      task.dependsOn?.status !== "COMPLETED" &&
      task.status !== "COMPLETED",
  );

  const pendingApprovals = tasks.flatMap((task) =>
    task.attachments.filter(
      (attachment) =>
        attachment.approvalStatus !== "APPROVED",
    ),
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedTasks / tasks.length) * 100,
        );

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        overdueTasks.length * 12 -
        blockedTasks.length * 15 -
        pendingApprovals.length * 6,
    ),
  );

  const healthLabel =
    healthScore >= 85
      ? t("health.excellent")
      : healthScore >= 65
        ? t("health.stable")
        : healthScore >= 45
          ? t("health.atRisk")
          : t("health.critical");

  const nextAction =
    pendingApprovals.length > 0
      ? t("nextActions.approveDocument", {
          fileName: pendingApprovals[0].fileName,
        })
      : blockedTasks.length > 0
        ? t("nextActions.resolveDependency", {
            taskTitle: blockedTasks[0].title,
          })
        : overdueTasks.length > 0
          ? t("nextActions.reviewOverdueTask", {
              taskTitle: overdueTasks[0].title,
            })
          : progress < 100
            ? t("nextActions.continueExecution")
            : t("nextActions.completionReview");

  const recommendation =
    pendingApprovals.length > 0
      ? t("recommendations.pendingApprovals")
      : blockedTasks.length > 0
        ? t("recommendations.blockedTasks")
        : overdueTasks.length > 0
          ? t("recommendations.overdueTasks")
          : t("recommendations.normalProgress");

  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          <span aria-hidden="true">🤖</span>{" "}
          {t("title")}
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          {t("description")}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <p className="text-xs font-semibold tracking-wide text-slate-500">
          {t("healthScore")}
        </p>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-4xl font-black text-white">
              {healthScore}
              <span className="text-lg text-slate-500">
                /100
              </span>
            </p>

            <p className="mt-1 text-sm font-semibold text-cyan-300">
              {healthLabel}
            </p>
          </div>

          <p className="text-start text-sm text-slate-400">
            {t("progressLabel")}{" "}
            <span className="font-bold text-blue-300">
              {progress}%
            </span>
          </p>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label={t("healthScore")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={healthScore}
        >
          <div
            className="h-full rounded-full bg-cyan-500"
            style={{
              width: `${healthScore}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-red-200">
            <span aria-hidden="true">⚠</span>{" "}
            {t("risks.title")}
          </p>

          <div className="mt-3 space-y-2 text-sm text-red-100">
            <p>
              {t("risks.overdueTasks", {
                count: overdueTasks.length,
              })}
            </p>

            <p>
              {t("risks.blockedTasks", {
                count: blockedTasks.length,
              })}
            </p>

            <p>
              {t("risks.pendingApprovals", {
                count: pendingApprovals.length,
              })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-sm font-bold text-blue-200">
            <span aria-hidden="true">🎯</span>{" "}
            {t("nextAction")}
          </p>

          <p className="mt-3 break-words text-sm leading-6 text-blue-100">
            {nextAction}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">
            <span aria-hidden="true">💡</span>{" "}
            {t("recommendation")}
          </p>

          <p className="mt-3 break-words text-sm leading-6 text-emerald-100">
            {recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}