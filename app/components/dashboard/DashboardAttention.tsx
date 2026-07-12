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
  const t = await getTranslations("dashboardAttention");

  const items = [
    {
      href: "/dashboard/notifications",
      label: t("unreadNotifications"),
      count: unreadNotificationsCount,
      hoverClass: "hover:border-blue-500",
      countClass: "text-blue-400",
    },
    {
      href: "/dashboard/tickets",
      label: t("openTickets"),
      count: openTicketsCount,
      hoverClass: "hover:border-purple-500",
      countClass: "text-purple-400",
    },
    {
      href: "/dashboard/open-cases",
      label: t("openCases"),
      count: openCasesCount,
      hoverClass: "hover:border-emerald-500",
      countClass: "text-emerald-400",
    },
    {
      href: "/dashboard/my-proposals",
      label: t("myProposals"),
      count: myProposalsCount,
      hoverClass: "hover:border-yellow-500",
      countClass: "text-yellow-400",
    },
  ];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">
          {t("title")}
        </h2>

        <p className="text-slate-400 text-sm">
          {t("description")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all ${item.hoverClass}`}
          >
            <p className="text-slate-500 text-sm">
              {item.label}
            </p>

            <p className={`text-4xl font-bold mt-3 ${item.countClass}`}>
              {item.count}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}