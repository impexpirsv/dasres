type Task = {
  id: number;
  title: string;
  status: string;
  progress: number;
  dueDate: Date | null;
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
  if (!task.dueDate || task.status === "COMPLETED") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export default function ProjectAIInsights({ tasks }: { tasks: Task[] }) {
  const overdueTasks = tasks.filter(isOverdue);

  const blockedTasks = tasks.filter(
    (task) =>
      task.dependsOn &&
      task.dependsOn.status !== "COMPLETED" &&
      task.status !== "COMPLETED",
  );

  const pendingApprovals = tasks.flatMap((task) =>
    task.attachments.filter(
      (attachment) => attachment.approvalStatus !== "APPROVED",
    ),
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks / tasks.length) * 100);

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
      ? "Excellent"
      : healthScore >= 65
        ? "Stable"
        : healthScore >= 45
          ? "At Risk"
          : "Critical";

  const nextAction =
    pendingApprovals.length > 0
      ? `Approve ${pendingApprovals[0].fileName}`
      : blockedTasks.length > 0
        ? `Resolve dependency for ${blockedTasks[0].title}`
        : overdueTasks.length > 0
          ? `Review overdue task: ${overdueTasks[0].title}`
          : progress < 100
            ? "Continue execution and close the next task"
            : "Project is ready for completion review";

  const recommendation =
    pendingApprovals.length > 0
      ? "Document approval is the main bottleneck. Review pending documents before moving to shipping or delivery."
      : blockedTasks.length > 0
        ? "Resolve task dependencies before starting downstream execution."
        : overdueTasks.length > 0
          ? "Schedule risk is increasing. Review deadlines and reassign delayed tasks."
          : "Project is progressing normally. Keep monitoring documents and workflow milestones.";

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          🤖 AI Copilot Insights
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Rule-based analysis prepared for future GPT integration.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          AI Health Score
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-black text-white">
              {healthScore}
              <span className="text-lg text-slate-500">/100</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-cyan-300">
              {healthLabel}
            </p>
          </div>

          <p className="text-right text-sm text-slate-400">
            Progress:{" "}
            <span className="font-bold text-blue-300">{progress}%</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-red-200">⚠ Risks</p>
          <div className="mt-3 space-y-2 text-sm text-red-100">
            <p>{overdueTasks.length} overdue task(s)</p>
            <p>{blockedTasks.length} blocked task(s)</p>
            <p>{pendingApprovals.length} pending approval(s)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-sm font-bold text-blue-200">🎯 Next Action</p>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            {nextAction}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">
            💡 Recommendation
          </p>
          <p className="mt-3 text-sm leading-6 text-emerald-100">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}