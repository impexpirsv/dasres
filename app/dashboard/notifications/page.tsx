import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import NotificationLink from "../../components/NotificationLink";
import MarkAllNotificationsReadButton from "../../components/MarkAllNotificationsReadButton";

function getNotificationBadge(type: string) {
  switch (type) {
    case "PROPOSAL_SUBMITTED":
      return {
        label: "Proposal",
        className: "bg-yellow-600 text-black",
      };

    case "PROPOSAL_ACCEPTED":
      return {
        label: "Accepted",
        className: "bg-green-600 text-white",
      };

    case "MESSAGE_SENT":
      return {
        label: "Message",
        className: "bg-blue-600 text-white",
      };

    case "DOCUMENT_UPLOADED":
      return {
        label: "Document",
        className: "bg-purple-600 text-white",
      };

    case "TICKET_CREATED":
    case "TICKET_UPDATED":
      return {
        label: "Ticket",
        className: "bg-cyan-600 text-black",
      };

    default:
      return {
        label: "System",
        className: "bg-slate-700 text-slate-200",
      };
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications =
    await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const readCount =
    notifications.length - unreadCount;

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-10">
        <h1 className="text-5xl font-bold mb-4">
          Notifications
        </h1>

        <p className="text-slate-400">
          Track your case updates, proposals, messages, documents and system alerts.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
          <p className="text-slate-400 text-sm">
            Total Notifications
          </p>

          <p className="text-4xl font-bold text-blue-400 mt-2">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-6">
          <p className="text-slate-400 text-sm">
            Unread
          </p>

          <p className="text-4xl font-bold text-yellow-400 mt-2">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-green-500 bg-slate-900 p-6">
          <p className="text-slate-400 text-sm">
            Read
          </p>

          <p className="text-4xl font-bold text-green-400 mt-2">
            {readCount}
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="font-semibold">
            Notification Center
          </p>

          <p className="text-sm text-slate-500">
            Manage your case updates, messages, documents and system alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <MarkAllNotificationsReadButton />
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No notifications yet.
          </div>
        )}

        {notifications.map((notification) => {
          const badge = getNotificationBadge(
            notification.type
          );

          const content = (
            <div
              className={`rounded-2xl border p-6 transition ${
                notification.isRead
                  ? "bg-slate-900 border-slate-800"
                  : "bg-slate-900 border-blue-500 hover:border-blue-400"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-bold text-lg">
                    {notification.title}
                  </h2>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full w-fit ${
                    notification.isRead
                      ? "bg-slate-800 text-slate-400"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {notification.isRead ? "Read" : "Unread"}
                </span>
              </div>

              <p className="text-slate-400 mt-3">
                {notification.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="text-xs text-slate-500">
                  {notification.createdAt.toLocaleString()}
                </p>

                {notification.link && (
                  <p className="text-sm text-blue-400">
                    Open →
                  </p>
                )}
              </div>
            </div>
          );

          if (notification.link) {
            return (
              <NotificationLink
                key={notification.id}
                id={notification.id}
                href={notification.link}
              >
                {content}
              </NotificationLink>
            );
          }

          return (
            <div key={notification.id}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}