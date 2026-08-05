import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DashboardQuickActions() {
  const t = await getTranslations(
    "dashboardQuickActions",
  );


  const actions = [
    {
      href: "/dashboard/cases/new",
      icon: "➕",
      title: t("createCase.title"),
      description: t("createCase.description"),
      color: "blue",
    },
    {
      href: "/dashboard/open-cases",
      icon: "📂",
      title: t("openCases.title"),
      description: t("openCases.description"),
      color: "cyan",
    },
    {
      href: "/dashboard/my-companies",
      icon: "🏢",
      title: t("myCompanies.title"),
      description: t("myCompanies.description"),
      color: "emerald",
    },
    {
      href: "/dashboard/my-experts",
      icon: "👨‍💼",
      title: t("myExperts.title"),
      description: t("myExperts.description"),
      color: "purple",
    },
  ];


  const colorMap: Record<string, string> = {
    blue:
      "hover:border-blue-500/70 hover:shadow-blue-500/10",
    cyan:
      "hover:border-cyan-500/70 hover:shadow-cyan-500/10",
    emerald:
      "hover:border-emerald-500/70 hover:shadow-emerald-500/10",
    purple:
      "hover:border-purple-500/70 hover:shadow-purple-500/10",
  };


  return (
    <section className="mb-10">

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>

          <h2 className="text-3xl font-black text-white">
            {t("title")}
          </h2>


          <p className="mt-2 text-sm text-slate-400">
            {t("description")}
          </p>

        </div>

      </div>



      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {actions.map((action) => (

          <Link
            key={action.href}
            href={action.href}
            className={`
              group

              ui-card
              ui-card-interactive
              bg-gradient-to-br
              from-slate-900
              to-slate-950

              ${colorMap[action.color]}
            `}
          >

            <div
              className="
                mb-4
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-slate-800/80
                text-2xl
                transition
                group-hover:scale-110
              "
            >
              {action.icon}
            </div>


            <h3 className="text-xl font-black text-white">
              {action.title}
            </h3>


            <p className="mt-3 text-sm leading-6 text-slate-400">
              {action.description}
            </p>


          </Link>

        ))}

      </div>

    </section>
  );
}
