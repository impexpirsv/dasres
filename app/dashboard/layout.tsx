import DashboardSidebar from "../components/DashboardSidebar";
import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import MobileDashboardMenu from "../components/MobileDashboardMenu";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <DashboardSidebar
        isAdmin={user.role === "admin"}
        unreadNotificationsCount={unreadNotificationsCount}
      />
      <MobileDashboardMenu
        isAdmin={user.role === "admin"}
        unreadNotificationsCount={unreadNotificationsCount}
      />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
