import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  userRole: string;
  savedCasesCount: number;
  savedCompaniesCount: number;
  savedExpertsCount: number;
  expertsCount: number;
  companiesCount: number;
  opportunitiesCount: number;
  successRate: number;
  completedUserCases: number;
  totalUserCases: number;
  openCasesCount: number;
  inProgressCasesCount: number;
  completedCasesCount: number;
  myProposalsCount: number;
  acceptedProposalsCount: number;
  unreadNotificationsCount: number;
  openTicketsCount: number;
};

export default async function DashboardStatsGrid({
  userRole,
  savedCasesCount,
  savedCompaniesCount,
  savedExpertsCount,
  expertsCount,
  companiesCount,
  opportunitiesCount,
  successRate,
  completedUserCases,
  totalUserCases,
  openCasesCount,
  inProgressCasesCount,
  completedCasesCount,
  myProposalsCount,
  acceptedProposalsCount,
  unreadNotificationsCount,
  openTicketsCount,
}: Props) {
  const t = await getTranslations(
    "dashboardStatsGrid",
  );

  const isAdmin = userRole === "admin";


  const cards = [
    {
      href: "/dashboard/saved-cases",
      title: t("savedCases.title"),
      value: savedCasesCount,
      description: t("savedCases.description"),
      color: "blue",
    },
    {
      href: "/dashboard/saved-companies",
      title: t("savedCompanies.title"),
      value: savedCompaniesCount,
      description: t("savedCompanies.description"),
      color: "yellow",
    },
    {
      href: "/dashboard/saved-experts",
      title: t("savedExperts.title"),
      value: savedExpertsCount,
      description: t("savedExperts.description"),
      color: "emerald",
    },
    {
      href: isAdmin
        ? "/dashboard/experts"
        : "/dashboard/my-experts",
      title: isAdmin
        ? t("experts.adminTitle")
        : t("experts.userTitle"),
      value: expertsCount,
      description: isAdmin
        ? t("experts.adminDescription")
        : t("experts.userDescription"),
      color: "blue",
    },
    {
      href: isAdmin
        ? "/dashboard/companies"
        : "/dashboard/my-companies",
      title: isAdmin
        ? t("companies.adminTitle")
        : t("companies.userTitle"),
      value: companiesCount,
      description: isAdmin
        ? t("companies.adminDescription")
        : t("companies.userDescription"),
      color: "cyan",
    },
    {
      href: "/dashboard/opportunities",
      title: t("opportunities.title"),
      value: opportunitiesCount,
      description: t("opportunities.description"),
      color: "purple",
    },
    {
      title: t("successRate.title"),
      value: `${successRate}%`,
      description: t(
        "successRate.description",
        {
          completed: completedUserCases,
          total: totalUserCases,
        },
      ),
      color: "emerald",
    },
    {
      href: "/dashboard/cases",
      title: t("tradeCases.title"),
      value: totalUserCases,
      description: isAdmin
        ? t("tradeCases.adminDescription")
        : t("tradeCases.userDescription"),
      color: "cyan",
    },
    {
      href: "/dashboard/open-cases",
      title: t("openCases.title"),
      value: openCasesCount,
      description: t("openCases.description"),
      color: "emerald",
    },
    {
      title: t("inProgress.title"),
      value: inProgressCasesCount,
      description: t("inProgress.description"),
      color: "orange",
    },
    {
      title: t("completed.title"),
      value: completedCasesCount,
      description: t("completed.description"),
      color: "green",
    },
    {
      href: "/dashboard/my-proposals",
      title: t("proposals"),
      value: myProposalsCount,
      color: "yellow",
    },
    {
      title: t("accepted"),
      value: acceptedProposalsCount,
      color: "green",
    },
    {
      href: "/dashboard/notifications",
      title: t("notifications"),
      value: unreadNotificationsCount,
      color: "blue",
    },
    {
      href: "/dashboard/tickets",
      title: t("openTickets"),
      value: openTicketsCount,
      color: "purple",
    },
  ];


  const colorMap: Record<string, string> = {
    blue: "text-blue-400 hover:border-blue-500/70",
    cyan: "text-cyan-400 hover:border-cyan-500/70",
    yellow: "text-yellow-400 hover:border-yellow-500/70",
    emerald: "text-emerald-400 hover:border-emerald-500/70",
    purple: "text-purple-400 hover:border-purple-500/70",
    orange: "text-orange-400 hover:border-orange-500/70",
    green: "text-green-400 hover:border-green-500/70",
  };


  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label={t("tradeCases.title")}>

      {cards.map((card, index) => {

        const content = (
          <div
            className={`
              group
              h-full
              ui-card
              ui-card-interactive
              bg-gradient-to-br
              from-slate-900
              to-slate-950
              ${colorMap[card.color]}
            `}
          >

            <h2 className="text-lg font-bold text-slate-200">
              {card.title}
            </h2>


            <div
              className={`
                mt-3
                text-4xl
                font-black
                ${colorMap[card.color].split(" ")[0]}
              `}
            >
              {card.value}
            </div>


            {card.description && (
              <p className="mt-3 text-sm leading-5 text-slate-400">
                {card.description}
              </p>
            )}

          </div>
        );


        if (card.href) {
          return (
            <Link
              key={index}
              href={card.href}
            >
              {content}
            </Link>
          );
        }


        return (
          <div key={index}>
            {content}
          </div>
        );

      })}

    </section>
  );
}
