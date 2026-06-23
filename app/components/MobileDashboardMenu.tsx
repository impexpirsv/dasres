"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
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
useEffect(() => {
  setOpen(false);
}, [pathname]);
  return (
    <>
      <div className="lg:hidden p-4 border-b border-slate-800">
        <button
          onClick={() => setOpen(true)}
          className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl"
        >
          ☰ Menu
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed left-0 top-0 z-50 w-72 h-screen overflow-y-auto">
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
