import Link from "next/link";
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
    include: {
      user: true,
    },
  });

  const openCount = tickets.filter(
    (ticket) => ticket.status === "OPEN"
  ).length;

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  const closedCount = tickets.filter(
    (ticket) => ticket.status === "CLOSED"
  ).length;

  const reopenedCount = tickets.filter(
    (ticket) => ticket.status === "REOPEN"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold">
            Tickets
          </h1>

          <p className="text-slate-400 mt-3">
            Manage support requests, case issues and platform assistance.
          </p>
        </div>

        <Link
          href="/dashboard/tickets/new"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
        >
          New Ticket
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Open
          </p>

          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {openCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            In Progress
          </p>

          <p className="text-4xl font-bold text-blue-400 mt-2">
            {inProgressCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Reopened
          </p>

          <p className="text-4xl font-bold text-yellow-400 mt-2">
            {reopenedCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">
            Closed
          </p>

          <p className="text-4xl font-bold text-slate-300 mt-2">
            {closedCount}
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
          No tickets found.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold">
              {user.role === "admin"
                ? "All Tickets"
                : "My Tickets"}
            </h2>

            <p className="text-slate-400 mt-2">
              {tickets.length} ticket
              {tickets.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="block p-6 hover:bg-slate-800/50 transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-lg">
                        {ticket.subject}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTicketBadge(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-slate-400 mt-2">
                      {ticket.category}
                    </p>

                    {user.role === "admin" && (
                      <p className="text-sm text-slate-500 mt-2">
                        Created by:{" "}
                        {ticket.user.name ||
                          ticket.user.email}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-500">
                      Created
                    </p>

                    <p className="text-sm text-slate-300 mt-1">
                      {ticket.createdAt.toLocaleString()}
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