import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: {
    id: number;
    title: string;
  };
};

type Props = {
  tasks: Task[];
};

const localeMap: Record<string, string> = {
  fa: "fa-IR",
  ar: "ar",
  en: "en-US",
};

export default async function DashboardMyTasks({
  tasks,
}: Props) {
  const t = await getTranslations(
    "dashboardMyTasksWidget",
  );

  const locale = await getLocale();

  const dateLocale = localeMap[locale] ?? locale;

  return (
    <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {t("title")}
        </h2>

        <Link
          href="/dashboard/my-tasks"
          className="text-sm text-blue-400 hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.project.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {task.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {task.project.title}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      task.status === "COMPLETED"
                        ? "bg-green-600 text-white"
                        : task.status === "IN_PROGRESS"
                          ? "bg-yellow-600 text-white"
                          : task.status === "TODO"
                            ? "bg-slate-700 text-white"
                            : "bg-blue-600 text-white"
                    }`}
                  >
                    {t(`status.${task.status}`)}
                  </span>

                  {task.dueDate && (
                    <span
                      className={`text-xs ${
                        task.status !== "COMPLETED" &&
                        task.dueDate < new Date()
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {task.dueDate.toLocaleDateString(
                        dateLocale,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}