import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import AddTicketReplyForm from "../../../components/AddTicketReplyForm";
import CloseTicketButton from "../../../components/CloseTicketButton";
import ReopenTicketButton from "../../../components/ReopenTicketButton";
type Props = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: Props) {
  const user = await requireUser();

  const { id } = await params;
  const ticketId = Number(id);

  if (!ticketId || Number.isNaN(ticketId)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold">Invalid Ticket ID</h1>
      </div>
    );
  }

  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
    include: {
      user: true,
      messages: {
        orderBy: {
          id: "asc",
        },
        include: {
          sender: true,
        },
      },
    },
  });

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold">Ticket Not Found</h1>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isOwner = ticket.userId === user.id;

  if (!isAdmin && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <Link
        href="/dashboard/tickets"
        className="text-blue-400 hover:underline mb-8 inline-block"
      >
        ← Back to Tickets
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>

            <h1 className="text-4xl font-bold mt-2">{ticket.subject}</h1>
          </div>

          
          <div className="flex items-center gap-3">
  <span
    className={`rounded-full px-4 py-2 text-sm font-semibold ${
      ticket.status === "OPEN"
        ? "bg-emerald-600"
        : "bg-slate-700"
    }`}
  >
    {ticket.status}
  </span>

  {ticket.status === "OPEN" ? (
    <CloseTicketButton
      ticketId={ticket.id}
    />
  ) : (
    user.role === "admin" && (
      <ReopenTicketButton
        ticketId={ticket.id}
      />
    )
  )}
</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Category</p>
            <p className="mt-1">{ticket.category}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Created By</p>
            <p className="mt-1">{ticket.user.name || ticket.user.email}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Created At</p>
            <p className="mt-1">{ticket.createdAt.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6">Conversation</h2>

        {ticket.messages.length === 0 ? (
          <p className="text-slate-500">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {ticket.messages.map((message) => {
              const isMine = message.senderId === user.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      isMine
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p
                        className={`text-sm font-semibold ${
                          isMine ? "text-blue-100" : "text-blue-400"
                        }`}
                      >
                        {message.sender.name || message.sender.email}
                      </p>

                      <p
                        className={`text-xs ${
                          isMine ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {message.createdAt.toLocaleString()}
                      </p>
                    </div>

                    <p>{message.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {ticket.status === "OPEN" ? (
          <AddTicketReplyForm ticketId={ticket.id} />
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-500">
            This ticket is closed.
          </div>
        )}
      </div>
    </div>
  );
}
