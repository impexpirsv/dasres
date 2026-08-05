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

type DatedTask = Task & {
  start: Date;
  end: Date;
  duration: number;
};

type PathResult = {
  taskIds: number[];
  duration: number;
};

function getDateOnly(
  date: Date | string,
): Date | null {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  value.setHours(0, 0, 0, 0);

  return value;
}

function getDaysBetween(
  start: Date,
  end: Date,
): number {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.max(
    1,
    Math.round(
      (end.getTime() -
        start.getTime()) /
        millisecondsPerDay,
    ) + 1,
  );
}

function createDatedTasks(
  tasks: Task[],
): DatedTask[] {
  return tasks.flatMap((task) => {
    const rawStart =
      task.startDate ??
      task.dueDate;

    const rawEnd =
      task.dueDate ??
      task.startDate;

    if (!rawStart || !rawEnd) {
      return [];
    }

    const parsedStart =
      getDateOnly(rawStart);

    const parsedEnd =
      getDateOnly(rawEnd);

    if (!parsedStart || !parsedEnd) {
      return [];
    }

    const start =
      parsedStart.getTime() <=
      parsedEnd.getTime()
        ? parsedStart
        : parsedEnd;

    const end =
      parsedEnd.getTime() >=
      parsedStart.getTime()
        ? parsedEnd
        : parsedStart;

    return [
      {
        ...task,
        start,
        end,
        duration:
          getDaysBetween(
            start,
            end,
          ),
      },
    ];
  });
}

function calculateCriticalPath(
  tasks: DatedTask[],
): PathResult {
  const taskById = new Map(
    tasks.map((task) => [
      task.id,
      task,
    ]),
  );

  const memo = new Map<
    number,
    PathResult
  >();

  function getLongestPathToTask(
    taskId: number,
    visiting: Set<number>,
  ): PathResult {
    const cached =
      memo.get(taskId);

    if (cached) {
      return cached;
    }

    const task =
      taskById.get(taskId);

    if (!task) {
      return {
        taskIds: [],
        duration: 0,
      };
    }

    if (visiting.has(taskId)) {
      return {
        taskIds: [task.id],
        duration: task.duration,
      };
    }

    const nextVisiting =
      new Set(visiting);

    nextVisiting.add(taskId);

    const dependencyId =
      task.dependsOn?.id;

    const dependencyPath =
      dependencyId !== undefined &&
      taskById.has(dependencyId)
        ? getLongestPathToTask(
            dependencyId,
            nextVisiting,
          )
        : {
            taskIds: [],
            duration: 0,
          };

    const result: PathResult = {
      taskIds: [
        ...dependencyPath.taskIds,
        task.id,
      ],
      duration:
        dependencyPath.duration +
        task.duration,
    };

    memo.set(taskId, result);

    return result;
  }

  return tasks.reduce<PathResult>(
    (longestPath, task) => {
      const candidate =
        getLongestPathToTask(
          task.id,
          new Set(),
        );

      return candidate.duration >
        longestPath.duration
        ? candidate
        : longestPath;
    },
    {
      taskIds: [],
      duration: 0,
    },
  );
}

export default async function ProjectCriticalPathCard({
  tasks,
}: {
  tasks: Task[];
}) {
  const t =
    await getTranslations(
      "projectCriticalPathCard",
    );

  const datedTasks =
    createDatedTasks(tasks);

  const criticalPath =
    calculateCriticalPath(
      datedTasks,
    );

  const taskById = new Map(
    datedTasks.map((task) => [
      task.id,
      task,
    ]),
  );

  const criticalTasks =
    criticalPath.taskIds.flatMap(
      (taskId) => {
        const task =
          taskById.get(taskId);

        return task
          ? [task]
          : [];
      },
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
              count:
                criticalPath.duration,
            })}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {criticalTasks.length ===
        0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            {t("empty")}
          </p>
        ) : (
        criticalTasks.map(
  (task, index) => (
    <div
      key={`${task.id}-${index}`}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-red-200">
                      {index === 0 ||
                      !task.dependsOn
                        ? t(
                            "pathStart",
                          )
                        : t(
                            "dependsOn",
                            {
                              task:
                                task
                                  .dependsOn
                                  .title,
                            },
                          )}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    {t("critical")}
                  </span>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}