import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

function getTicketBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-600 text-white";

    case "IN_PROGRESS":
      return "bg-blue-600 text-white";

    case "CLOSED":
      return "bg-slate-700 text-slate-300";

    case "REOPEN":
      return "bg-yellow-600 text-black";

    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default async function TicketsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = await getTranslations("tickets.list");
const tc = await getTranslations("common.categories");
  const tickets = await prisma.ticket.findMany({
    where:
      user.role === "admin"
        ? {}
        : {
            userId: user.id,
          },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      subject: true,
      status: true,
      category: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS",
  ).length;

  const closedCount = tickets.filter(
    (ticket) => ticket.status === "CLOSED",
  ).length;

  const reopenedCount = tickets.filter(
    (ticket) => ticket.status === "REOPEN",
  ).length;

  function getTicketStatusLabel(status: string) {
    switch (status) {
      case "OPEN":
        return t("statuses.open");

      case "IN_PROGRESS":
        return t("statuses.inProgress");

      case "CLOSED":
        return t("statuses.closed");

      case "REOPEN":
        return t("statuses.reopened");

      default:
        return status;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-5xl font-bold">{t("title")}</h1>

          <p className="mt-3 text-slate-400">{t("description")}</p>
        </div>

        <Link
          href="/dashboard/tickets/new"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center font-medium text-white transition hover:bg-blue-700"
        >
          {t("newTicket")}
        </Link>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">{t("statuses.open")}</p>

          <p className="mt-2 text-4xl font-bold text-emerald-400">
            {openCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">{t("statuses.inProgress")}</p>

          <p className="mt-2 text-4xl font-bold text-blue-400">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">{t("statuses.reopened")}</p>

          <p className="mt-2 text-4xl font-bold text-yellow-400">
            {reopenedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">{t("statuses.closed")}</p>

          <p className="mt-2 text-4xl font-bold text-slate-300">
            {closedCount}
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">
              {user.role === "admin" ? t("allTickets") : t("myTickets")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t("ticketsFound", {
                count: tickets.length,
              })}
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="block p-6 transition hover:bg-slate-800/50"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold">{ticket.subject}</h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getTicketBadge(
                          ticket.status,
                        )}`}
                      >
                        {getTicketStatusLabel(ticket.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-400">
                    {tc(
  `ticket_${ticket.category.toLowerCase()}`,
)}
                    </p>

                    {user.role === "admin" && (
                      <p className="mt-2 text-sm text-slate-500">
                        {t("createdBy", {
                          name: ticket.user.name || ticket.user.email,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="text-start md:text-end">
                    <p className="text-xs text-slate-500">{t("created")}</p>

                    <p className="mt-1 text-sm text-slate-300">
                      {ticket.createdAt.toLocaleString(locale)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
