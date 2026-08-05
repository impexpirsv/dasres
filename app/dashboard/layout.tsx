import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import DashboardSidebar from "../components/DashboardSidebar";
import MobileDashboardMenu from "../components/MobileDashboardMenu";

import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";


export async function generateMetadata(): Promise<Metadata> {
  const [dashboard, root] = await Promise.all([
    getTranslations("dashboardPage"),
    getTranslations("rootMetadata"),
  ]);

  return {
    title: {
      absolute: `${dashboard("title")} | ${root("siteName")}`,
    },
    alternates: {
      canonical: null,
    },
    openGraph: null,
    twitter: null,
    robots: {
      index: false,
      follow: false,
    },
  };
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await requireUser();


  const unreadNotificationsCount =
    await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });



  return (
    <div
      data-dashboard-shell
      className="
        min-h-screen
        overflow-x-hidden
        bg-slate-950
        text-white
        lg:flex
      "
    >

      <DashboardSidebar
        isAdmin={user.role === "admin"}
        unreadNotificationsCount={
          unreadNotificationsCount
        }
      />


      <MobileDashboardMenu
        isAdmin={user.role === "admin"}
        unreadNotificationsCount={
          unreadNotificationsCount
        }
      />


      <main
        className="
          min-w-0
          flex-1
          bg-slate-950
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-3
            py-4
            sm:px-4
            sm:py-6
            md:px-6
            md:py-8
            xl:px-8
          "
        >
          {children}
        </div>

      </main>

    </div>
  );
}
