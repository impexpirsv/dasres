import { getTranslations } from "next-intl/server";

type Task = {
  id: number;
  title: string;
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
};

function getDateOnly(date: Date | string) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getDaysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / msPerDay) + 1,
  );
}

export default async function ProjectCriticalPathCard({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = await getTranslations("projectCriticalPathCard");

  const datedTasks = tasks
    .filter((task) => task.startDate || task.dueDate)
    .map((task) => {
      const start = getDateOnly(task.startDate || task.dueDate!);
      const end = getDateOnly(task.dueDate || task.startDate!);

      return {
        ...task,
        start,
        end,
        duration: getDaysBetween(start, end),
      };
    });

  const taskById = new Map(
    datedTasks.map((task) => [task.id, task]),
  );

  const criticalTasks = datedTasks.filter((task) => {
    if (!task.dependsOn) return false;

    const dependency = taskById.get(task.dependsOn.id);

    if (!dependency) return false;

    const dependencyEnd = getDateOnly(dependency.end);
    const taskStart = getDateOnly(task.start);

    return dependencyEnd.getTime() >= taskStart.getTime();
  });

  const totalCriticalDays = criticalTasks.reduce(
    (sum, task) => sum + task.duration,
    0,
  );

  return (
    <div className="rounded-3xl border border-red-500/20 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {t("title")}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-start">
          <p className="text-xs font-medium text-red-300">
            {t("criticalTasks")}
          </p>

          <p className="text-2xl font-black text-red-200">
            {criticalTasks.length}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            {t("criticalDuration")}
          </p>

          <p className="font-bold text-white">
            {t("duration", {
              count: totalCriticalDays,
            })}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {criticalTasks.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            {t("empty")}
          </p>
        ) : (
          criticalTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-red-200">
                    {t("dependsOn", {
                      task: task.dependsOn?.title ?? "",
                    })}
                  </p>
                </div>

                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                  {t("critical")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}