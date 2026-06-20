import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import AddTicketReplyForm from "../../../components/AddTicketReplyForm";
import CloseTicketButton from "../../../components/CloseTicketButton";
import ReopenTicketButton from "../../../components/ReopenTicketButton";

type Props = {
  params: Promise<{ id: string }>;
};

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

export default async function TicketDetailPage({
  params,
}: Props) {
  const user = await requireUser();

  const { id } = await params;
  const ticketId = Number(id);

  if (!ticketId || Number.isNaN(ticketId)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold">
          Invalid Ticket ID
        </h1>
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
        <h1 className="text-4xl font-bold">
          Ticket Not Found
        </h1>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isOwner = ticket.userId === user.id;

  if (!isAdmin && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold">
          Access Denied
        </h1>
      </div>
    );
  }

  const firstMessage = ticket.messages[0];
  const latestMessage =
    ticket.messages[ticket.messages.length - 1];

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <Link
        href="/dashboard/tickets"
        className="text-blue-400 hover:underline mb-8 inline-block"
      >
        ← Back to Tickets
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <p className="text-sm text-slate-500">
              Ticket #{ticket.id}
            </p>

            <h1 className="text-4xl font-bold mt-2">
              {ticket.subject}
            </h1>

            <p className="text-slate-400 mt-3">
              {ticket.category}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getTicketBadge(
                ticket.status
              )}`}
            >
              {ticket.status}
            </span>

            {ticket.status !== "CLOSED" ? (
              <CloseTicketButton
                ticketId={ticket.id}
              />
            ) : (
              isAdmin && (
                <ReopenTicketButton
                  ticketId={ticket.id}
                />
              )
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Created By
            </p>

            <p className="mt-1">
              {ticket.user.name || ticket.user.email}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Created At
            </p>

            <p className="mt-1">
              {ticket.createdAt.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Messages
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-400">
              {ticket.messages.length}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Last Update
            </p>

            <p className="mt-1">
              {latestMessage
                ? latestMessage.createdAt.toLocaleString()
                : ticket.createdAt.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              Conversation
            </h2>

            <span className="text-sm text-slate-500">
              {ticket.messages.length} message
              {ticket.messages.length === 1 ? "" : "s"}
            </span>
          </div>

          {ticket.messages.length === 0 ? (
            <p className="text-slate-500">
              No messages yet.
            </p>
          ) : (
            <div className="space-y-4">
              {ticket.messages.map((message) => {
                const isMine =
                  message.senderId === user.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4 mb-2">
                        <p
                          className={`text-sm font-semibold ${
                            isMine
                              ? "text-blue-100"
                              : "text-blue-400"
                          }`}
                        >
                          {message.sender.name ||
                            message.sender.email}
                        </p>

                        <p
                          className={`text-xs ${
                            isMine
                              ? "text-blue-100"
                              : "text-slate-500"
                          }`}
                        >
                          {message.createdAt.toLocaleString()}
                        </p>
                      </div>

                      <p className="leading-7">
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {ticket.status === "CLOSED" ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-500">
              This ticket is closed.
            </div>
          ) : (
            <AddTicketReplyForm
              ticketId={ticket.id}
            />
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              Ticket Timeline
            </h2>

            <div className="space-y-4">
              <div className="border-l-2 border-blue-500 pl-4">
                <p className="font-semibold">
                  Ticket Created
                </p>

                <p className="text-sm text-slate-500">
                  {ticket.createdAt.toLocaleString()}
                </p>
              </div>

              {firstMessage && (
                <div className="border-l-2 border-slate-700 pl-4">
                  <p className="font-semibold">
                    First Message
                  </p>

                  <p className="text-sm text-slate-500">
                    {firstMessage.createdAt.toLocaleString()}
                  </p>
                </div>
              )}

              {latestMessage && (
                <div className="border-l-2 border-slate-700 pl-4">
                  <p className="font-semibold">
                    Latest Reply
                  </p>

                  <p className="text-sm text-slate-500">
                    {latestMessage.createdAt.toLocaleString()}
                  </p>
                </div>
              )}

              {ticket.status === "CLOSED" && (
                <div className="border-l-2 border-slate-500 pl-4">
                  <p className="font-semibold">
                    Ticket Closed
                  </p>

                  <p className="text-sm text-slate-500">
                    Current status is closed.
                  </p>
                </div>
              )}

              {ticket.status === "REOPEN" && (
                <div className="border-l-2 border-yellow-500 pl-4">
                  <p className="font-semibold">
                    Ticket Reopened
                  </p>

                  <p className="text-sm text-slate-500">
                    This ticket requires attention again.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              Support Rules
            </h2>

            <ul className="space-y-3 text-sm text-slate-400">
              <li>• Keep replies focused and professional.</li>
              <li>• Attach case details when needed.</li>
              <li>• Closed tickets cannot receive replies.</li>
              <li>• Admins can reopen closed tickets.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}