import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import NotificationLink from "../../components/NotificationLink";
import MarkAllNotificationsReadButton from "../../components/MarkAllNotificationsReadButton";
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

    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            <h1 className="text-4xl font-bold mb-8">
                Notifications
            </h1>
<div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5">
  <div>
    <p className="font-semibold">
      Notification Center
    </p>
    <p className="text-sm text-slate-500">
      Manage your case updates, messages, documents and system alerts.
    </p>
  </div>

  <MarkAllNotificationsReadButton />
</div>
            <div className="space-y-4">
                {notifications.length === 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        No notifications yet.
                    </div>
                )}

                {notifications.map((notification) => {
                    const content = (
                        <div
                            className={`rounded-2xl border p-6 transition ${notification.isRead
                                ? "bg-slate-900 border-slate-800"
                                : "bg-slate-900 border-blue-500 hover:border-blue-400"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-lg">
                                    {notification.title}
                                </h2>

                                <span
                                    className={`text-xs px-3 py-1 rounded-full ${notification.isRead
                                            ? "bg-slate-800 text-slate-400"
                                            : "bg-blue-600 text-white"
                                        }`}
                                >
                                    {notification.isRead ? "Read" : "Unread"}
                                </span>
                            </div>

                            <p className="text-slate-400 mt-2">
                                {notification.message}
                            </p>

                            <p className="text-xs text-slate-500 mt-4">
                                {notification.createdAt.toLocaleString()}
                            </p>
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