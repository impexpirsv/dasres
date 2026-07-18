import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import NotificationLink from "../../components/NotificationLink";
import MarkAllNotificationsReadButton from "../../components/MarkAllNotificationsReadButton";

function getNotificationBadgeClass(type: string) {
  switch (type) {
    case "PROPOSAL_SUBMITTED":
      return "bg-yellow-600 text-black";

    case "PROPOSAL_ACCEPTED":
      return "bg-green-600 text-white";

    case "PROPOSAL_REJECTED":
      return "bg-red-600 text-white";

    case "PROJECT_MESSAGE":
      return "bg-blue-600 text-white";

    case "DOCUMENT_UPLOADED":
      return "bg-purple-600 text-white";

    case "DOCUMENT_APPROVED":
      return "bg-emerald-600 text-white";

    case "TASK_ASSIGNED":
      return "bg-indigo-600 text-white";

    case "TASK_COMPLETED":
      return "bg-green-700 text-white";

    case "TASK_COMMENT":
      return "bg-sky-600 text-white";

    case "TICKET_UPDATED":
      return "bg-cyan-600 text-black";

    case "DEADLINE_REMINDER":
      return "bg-orange-600 text-white";

    case "PROJECT_COMPLETED":
      return "bg-green-500 text-black";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = await getTranslations("notifications.list");

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
    (notification) => !notification.isRead,
  ).length;

  const readCount =
    notifications.length - unreadCount;

  function getNotificationBadgeLabel(type: string) {
    switch (type) {
      case "PROPOSAL_SUBMITTED":
        return t("types.proposal");

      case "PROPOSAL_ACCEPTED":
        return t("types.accepted");

      case "PROPOSAL_REJECTED":
        return t("types.rejected");

      case "PROJECT_MESSAGE":
        return t("types.message");

      case "DOCUMENT_UPLOADED":
        return t("types.document");

      case "DOCUMENT_APPROVED":
        return t("types.approved");

      case "TASK_ASSIGNED":
        return t("types.assigned");

      case "TASK_COMPLETED":
        return t("types.completed");

      case "TASK_COMMENT":
        return t("types.comment");

      case "TICKET_UPDATED":
        return t("types.ticket");

      case "DEADLINE_REMINDER":
        return t("types.deadline");

      case "PROJECT_COMPLETED":
        return t("types.projectDone");

      default:
        return t("types.system");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10">
        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("description")}
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("total")}
          </p>

          <p className="mt-2 text-4xl font-bold text-blue-400">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("unread")}
          </p>

          <p className="mt-2 text-4xl font-bold text-yellow-400">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-green-500 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            {t("read")}
          </p>

          <p className="mt-2 text-4xl font-bold text-green-400">
            {readCount}
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">
            {t("centerTitle")}
          </p>

          <p className="text-sm text-slate-500">
            {t("centerDescription")}
          </p>
        </div>

        {unreadCount > 0 && (
          <MarkAllNotificationsReadButton />
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            {t("empty")}
          </div>
        )}

        {notifications.map((notification) => {
          const badgeClass =
            getNotificationBadgeClass(
              notification.type,
            );

          const badgeLabel =
            getNotificationBadgeLabel(
              notification.type,
            );

          const content = (
            <div
              className={`rounded-2xl border p-6 transition ${
                notification.isRead
                  ? "border-slate-800 bg-slate-900"
                  : "border-blue-500 bg-slate-900 hover:border-blue-400"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold">
                    {notification.title}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs ${
                    notification.isRead
                      ? "bg-slate-800 text-slate-400"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {notification.isRead
                    ? t("read")
                    : t("unread")}
                </span>
              </div>

              <p className="mt-3 text-slate-400">
                {notification.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {notification.createdAt.toLocaleString(
                    locale,
                  )}
                </p>

                {notification.link && (
                  <p className="text-sm text-blue-400">
                    {t("open")}
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