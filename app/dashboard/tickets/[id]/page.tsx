import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("tickets.detail");

  const { id } = await params;
  const ticketId = Number(id);

  if (!ticketId || Number.isNaN(ticketId)) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-bold">
          {t("errors.invalidId")}
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
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-bold">
          {t("errors.notFound")}
        </h1>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isOwner = ticket.userId === user.id;

  if (!isAdmin && !isOwner) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-bold">
          {t("errors.accessDenied")}
        </h1>
      </div>
    );
  }

  const firstMessage = ticket.messages[0];
  const latestMessage =
    ticket.messages[ticket.messages.length - 1];

  function getStatusLabel(status: string) {
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

  function getCategoryLabel(category: string) {
    switch (category) {
      case "GENERAL":
        return t("categories.general");

      case "TECHNICAL":
        return t("categories.technical");

      case "VERIFICATION":
        return t("categories.verification");

      case "BILLING":
        return t("categories.billing");

      case "DISPUTE":
        return t("categories.dispute");

      default:
        return category;
    }
  }

  function formatDate(date: Date) {
    return date.toLocaleString(locale);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Link
        href="/dashboard/tickets"
        className="mb-8 inline-block text-blue-400 hover:underline"
      >
        {t("backToTickets")}
      </Link>

      <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {t("ticketNumber", {
                id: ticket.id,
              })}
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {ticket.subject}
            </h1>

            <p className="mt-3 text-slate-400">
              {getCategoryLabel(ticket.category)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getTicketBadge(
                ticket.status,
              )}`}
            >
              {getStatusLabel(ticket.status)}
            </span>

            {ticket.status !== "CLOSED" ? (
              <CloseTicketButton ticketId={ticket.id} />
            ) : (
              isAdmin && (
                <ReopenTicketButton ticketId={ticket.id} />
              )
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-500">
              {t("createdBy")}
            </p>

            <p className="mt-1">
              {ticket.user.name || ticket.user.email}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-500">
              {t("createdAt")}
            </p>

            <p className="mt-1">
              {formatDate(ticket.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-500">
              {t("messages")}
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-400">
              {ticket.messages.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-500">
              {t("lastUpdate")}
            </p>

            <p className="mt-1">
              {latestMessage
                ? formatDate(latestMessage.createdAt)
                : formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              {t("conversation")}
            </h2>

            <span className="text-sm text-slate-500">
              {t("messageCount", {
                count: ticket.messages.length,
              })}
            </span>
          </div>

          {ticket.messages.length === 0 ? (
            <p className="text-slate-500">
              {t("noMessages")}
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
                      <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
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
                          {formatDate(message.createdAt)}
                        </p>
                      </div>

                      <p className="whitespace-pre-wrap break-words leading-7">
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
              {t("closedNotice")}
            </div>
          ) : (
            <AddTicketReplyForm ticketId={ticket.id} />
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {t("timeline.title")}
            </h2>

            <div className="space-y-4">
              <div className="border-s-2 border-blue-500 ps-4">
                <p className="font-semibold">
                  {t("timeline.created")}
                </p>

                <p className="text-sm text-slate-500">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>

              {firstMessage && (
                <div className="border-s-2 border-slate-700 ps-4">
                  <p className="font-semibold">
                    {t("timeline.firstMessage")}
                  </p>

                  <p className="text-sm text-slate-500">
                    {formatDate(firstMessage.createdAt)}
                  </p>
                </div>
              )}

              {latestMessage && (
                <div className="border-s-2 border-slate-700 ps-4">
                  <p className="font-semibold">
                    {t("timeline.latestReply")}
                  </p>

                  <p className="text-sm text-slate-500">
                    {formatDate(latestMessage.createdAt)}
                  </p>
                </div>
              )}

              {ticket.status === "CLOSED" && (
                <div className="border-s-2 border-slate-500 ps-4">
                  <p className="font-semibold">
                    {t("timeline.closed")}
                  </p>

                  <p className="text-sm text-slate-500">
                    {t("timeline.closedDescription")}
                  </p>
                </div>
              )}

              {ticket.status === "REOPEN" && (
                <div className="border-s-2 border-yellow-500 ps-4">
                  <p className="font-semibold">
                    {t("timeline.reopened")}
                  </p>

                  <p className="text-sm text-slate-500">
                    {t("timeline.reopenedDescription")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {t("rules.title")}
            </h2>

            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                • {t("rules.focused")}
              </li>

              <li>
                • {t("rules.caseDetails")}
              </li>

              <li>
                • {t("rules.closedReplies")}
              </li>

              <li>
                • {t("rules.adminReopen")}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}