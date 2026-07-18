"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

interface MobileDashboardMenuProps {
  isAdmin: boolean;
  unreadNotificationsCount: number;
}

export default function MobileDashboardMenu({
  isAdmin,
  unreadNotificationsCount,
}: MobileDashboardMenuProps) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const t = useTranslations("dashboardSidebar");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="border-b border-slate-800 p-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2"
        >
          ☰ {t("menu")}
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />

        <div className="fixed start-0 top-0 z-50 h-screen w-72 overflow-y-auto">
            <DashboardSidebar
              isAdmin={isAdmin}
              unreadNotificationsCount={unreadNotificationsCount}
              mobileOpen
            />
          </div>
        </>
      )}
    </>
  );
}