import { getTranslations } from "next-intl/server";

type Task = {
  status: string;
  estimatedHours: number | null;
  loggedHours: number | null;
  dueDate: Date | null;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}

export default async function ProjectHealthCard({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = await getTranslations("projectHealthCard");

  const completed = tasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completed / tasks.length) * 100);

  const estimated = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours ?? 0),
    0,
  );

  const logged = tasks.reduce(
    (sum, t) => sum + (t.loggedHours ?? 0),
    0,
  );

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return (
      t.status !== "COMPLETED" &&
      dueDate < today
    );
  }).length;

  const utilization =
    estimated === 0
      ? 0
      : Math.round((logged / estimated) * 100);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-lg font-bold text-white">
        {t("title")}
      </h3>

      <div className="mt-6 space-y-5">
        <Metric
          label={t("progress")}
          value={`${progress}%`}
          percent={progress}
          color="bg-blue-500"
        />

        <Metric
          label={t("hoursUsed")}
          value={
            estimated === 0
              ? t("noEstimate")
              : `${logged}/${estimated}`
          }
          percent={
            estimated === 0
              ? 0
              : utilization
          }
          color={
            utilization > 100
              ? "bg-red-500"
              : "bg-green-500"
          }
        />

        <Metric
          label={t("utilization")}
          value={
            estimated === 0
              ? t("noEstimate")
              : `${utilization}%`
          }
          percent={utilization}
          color={
            utilization > 100
              ? "bg-red-500"
              : "bg-amber-500"
          }
        />

        <Metric
          label={t("overdue")}
          value={
            overdue === 0
              ? t("noOverdueTasks")
              : t("overdueTasks", {
                  count: overdue,
                })
          }
          percent={
            tasks.length === 0
              ? 0
              : (overdue / tasks.length) * 100
          }
          color="bg-red-500"
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm">
        <span className="text-slate-400">
          {label}
        </span>

        <span className="text-start font-bold text-white">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${clampPercent(percent)}%`,
          }}
        />
      </div>
    </div>
  );
}