import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  unreadNotificationsCount: number;
  openTicketsCount: number;
  openCasesCount: number;
  myProposalsCount: number;
};

export default async function DashboardAttention({
  unreadNotificationsCount,
  openTicketsCount,
  openCasesCount,
  myProposalsCount,
}: Props) {
  const t = await getTranslations(
    "dashboardAttention",
  );


  const items = [
    {
      href: "/dashboard/notifications",
      label: t("unreadNotifications"),
      count: unreadNotificationsCount,
      color:
        "text-blue-400 hover:border-blue-500/70 hover:shadow-blue-500/10",
    },
    {
      href: "/dashboard/tickets",
      label: t("openTickets"),
      count: openTicketsCount,
      color:
        "text-purple-400 hover:border-purple-500/70 hover:shadow-purple-500/10",
    },
    {
      href: "/dashboard/open-cases",
      label: t("openCases"),
      count: openCasesCount,
      color:
        "text-emerald-400 hover:border-emerald-500/70 hover:shadow-emerald-500/10",
    },
    {
      href: "/dashboard/my-proposals",
      label: t("myProposals"),
      count: myProposalsCount,
      color:
        "text-yellow-400 hover:border-yellow-500/70 hover:shadow-yellow-500/10",
    },
  ];


  return (
    <section className="mb-12">

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



      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        {items.map((item) => (

          <Link
            key={item.href}
            href={item.href}
            className={`
              group

              rounded-[2rem]

              border
              border-slate-800

              bg-gradient-to-br
              from-slate-900
              to-slate-950

              p-6

              transition-all
              duration-300

              hover:-translate-y-1
              hover:shadow-2xl

              ${item.color}
            `}
          >

            <p className="text-sm text-slate-500">
              {item.label}
            </p>


            <p
              className={`
                mt-4
                text-5xl
                font-black
                transition
                group-hover:scale-105
                ${item.color.split(" ")[0]}
              `}
            >
              {item.count}
            </p>


            <div className="mt-5 h-1 w-12 rounded-full bg-slate-700 transition group-hover:w-20" />

          </Link>

        ))}

      </div>

    </section>
  );
}