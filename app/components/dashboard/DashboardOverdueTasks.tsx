import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

type Task = {
  id: number;
  title: string;
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

export default async function DashboardOverdueTasks({
  tasks,
}: Props) {
  const t = await getTranslations("dashboardOverdueTasks");
  const locale = await getLocale();

  const dateLocale = localeMap[locale] ?? locale;

  if (tasks.length === 0) {
    return (
      <div className="mb-12 rounded-3xl border border-emerald-700 bg-emerald-950/20 p-6">
        <h2 className="text-xl font-bold text-emerald-400">
          ✅ {t("empty.title")}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12 rounded-3xl border border-red-800 bg-red-950/10 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-red-400">
          {t("title")}
        </h2>

        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/projects/${task.project.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-red-500"
          >
            <p className="font-semibold">
              {task.title}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {task.project.title}
            </p>

            {task.dueDate && (
              <p className="mt-2 text-xs text-red-400">
                {t("dueDate", {
                  date: task.dueDate.toLocaleDateString(dateLocale),
                })}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}