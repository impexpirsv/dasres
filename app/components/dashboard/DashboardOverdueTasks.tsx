import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";


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

  const t = await getTranslations(
    "dashboardOverdueTasks",
  );


  const locale = await getLocale();

  const dateLocale =
    localeMap[locale] ?? locale;



  if (tasks.length === 0) {
    return (
      <div
        className="
          mb-12
          rounded-[2rem]
          border
          border-emerald-500/30
          bg-gradient-to-br
          from-emerald-950/40
          to-slate-950
          p-6
        "
      >

        <h2
          className="
            flex
            items-center
            gap-2
            text-xl
            font-black
            text-emerald-400
          "
        >
          ✅ {t("empty.title")}
        </h2>


        <p className="mt-3 text-sm text-slate-400">
          {t("empty.description")}
        </p>

      </div>
    );
  }



  return (
    <div
      className="
        mb-12
        rounded-[2rem]
        border
        border-red-500/30
        bg-gradient-to-br
        from-red-950/30
        to-slate-950
        p-6
        shadow-xl
        shadow-red-500/5
      "
    >

      <div
        className="
          mb-6
          flex
          items-center
          justify-between
          gap-4
        "
      >

        <h2
          className="
            text-xl
            font-black
            text-red-400
          "
        >
          {t("title")}
        </h2>


        <span
          className="
            rounded-full
            bg-red-600
            px-3
            py-1
            text-xs
            font-black
            text-white
          "
        >
          {tasks.length}
        </span>

      </div>



      <div className="space-y-3">

        {tasks.map((task) => (

          <Link
            key={task.id}
            href={`/dashboard/projects/${task.project.id}`}
            className="
              block
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/70
              p-4
              transition-all
              hover:-translate-y-0.5
              hover:border-red-500/50
              hover:shadow-lg
              hover:shadow-red-500/10
            "
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="font-bold text-white">
                  {task.title}
                </p>


                <p className="mt-1 text-sm text-slate-400">
                  {task.project.title}
                </p>

              </div>


              <span className="text-xl">
                ⚠️
              </span>

            </div>



            {task.dueDate && (
              <p
                className="
                  mt-3
                  text-xs
                  font-semibold
                  text-red-400
                "
              >
                {t("dueDate", {
                  date:
                    task.dueDate.toLocaleDateString(
                      dateLocale,
                    ),
                })}
              </p>
            )}

          </Link>

        ))}

      </div>

    </div>
  );
}