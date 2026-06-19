import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">
          Tickets
        </h1>

        <Link
          href="/dashboard/tickets/new"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
        >
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.id}`}
              className="block bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">
                  {ticket.subject}
                </h2>

                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    ticket.status === "OPEN"
                      ? "bg-emerald-600"
                      : "bg-slate-700"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              <p className="text-slate-500 mt-3">
                {ticket.category}
              </p>
{user.role === "admin" && (
  <p className="text-sm text-slate-400 mt-2">
    Created by: {ticket.user.name || ticket.user.email}
  </p>
)}
              <p className="text-xs text-slate-500 mt-3">
                {ticket.createdAt.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}