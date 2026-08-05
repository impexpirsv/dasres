import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

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

type Props = { tasks: Task[] };

const localeMap: Record<string, string> = {
  fa: "fa-IR",
  ar: "ar",
  en: "en-US",
};

function getDateOnly(value: Date): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function DashboardMyTasks({ tasks }: Props) {
  const t = await getTranslations("dashboardMyTasksWidget");
  const locale = await getLocale();
  const dateLocale = localeMap[locale] ?? locale;
  const today = getDateOnly(new Date()) ?? new Date();

  function getStatusClass(status: string): string {
    switch (status) {
      case "COMPLETED":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
      case "IN_PROGRESS":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
      case "TODO":
        return "border-slate-700 bg-slate-800 text-slate-300";
      default:
        return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    }
  }

  function getStatusLabel(status: string): string {
    const candidates = [status, status.toLowerCase()];
    for (const key of candidates) {
      if (t.has(`status.${key}`)) return t(`status.${key}`);
    }
    return status.replaceAll("_", " ");
  }

  return (
    <div className="mt-12 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-black text-white">{t("title")}</h2>
        <Link
          href="/dashboard/my-tasks"
          className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
        >
          {t("viewAll")} →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.slice(0, 5).map((task) => {
            const dueDate = task.dueDate ? getDateOnly(task.dueDate) : null;
            const isOverdue =
              dueDate !== null &&
              task.status !== "COMPLETED" &&
              dueDate.getTime() < today.getTime();

            return (
              <Link
                key={task.id}
                href={`/dashboard/projects/${task.project.id}?tab=tasks&task=${task.id}`}
                className="group block rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-white">{task.title}</p>
                    <p className="mt-2 break-words text-sm text-slate-400">
                      {task.project.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>

                    {dueDate && (
                      <time
                        dateTime={dueDate.toISOString()}
                        className={`text-xs ${isOverdue ? "text-red-400" : "text-slate-400"}`}
                      >
                        {dueDate.toLocaleDateString(dateLocale)}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
