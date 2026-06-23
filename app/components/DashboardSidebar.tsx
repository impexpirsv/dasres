"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  isAdmin: boolean;
  unreadNotificationsCount: number;
  mobileOpen?: boolean;
}

export default function DashboardSidebar({
  isAdmin,
  unreadNotificationsCount,
  mobileOpen = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  function getLinkClass(path: string) {
    const isActive =
      path === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === path || pathname.startsWith(path + "/");

    return `
      block rounded-xl px-4 py-3 text-sm transition
      ${
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }
    `;
  }

  const sectionTitleClass =
    "px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <aside
      className={`${
        mobileOpen ? "block" : "hidden lg:block"
      } w-72 min-h-screen bg-slate-950 border-r border-slate-800 p-5 overflow-y-auto`}
    >
      <div className="mb-8 px-4 pb-6 border-b border-slate-800">
        <h2 className="text-3xl font-black tracking-wider text-white">
          DASRES
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Trust Ecosystem For Global Trade
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        <p className={sectionTitleClass}>Main</p>
        <Link href="/dashboard" className={getLinkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link
          href="/dashboard/experts"
          className={getLinkClass("/dashboard/experts")}
        >
          Experts
        </Link>

        <Link
          href="/dashboard/companies"
          className={getLinkClass("/dashboard/companies")}
        >
          Companies
        </Link>

        <Link
          href="/dashboard/opportunities"
          className={getLinkClass("/dashboard/opportunities")}
        >
          Opportunities
        </Link>
        <p className={sectionTitleClass}>Trade Management</p>

        <Link
          href="/dashboard/cases"
          className={getLinkClass("/dashboard/cases")}
        >
          My Cases
        </Link>

        <Link
          href="/dashboard/my-cases"
          className={getLinkClass("/dashboard/my-cases")}
        >
          My Active Cases
        </Link>

        <Link
          href="/dashboard/my-proposals"
          className={getLinkClass("/dashboard/my-proposals")}
        >
          My Proposals
        </Link>

        <Link
          href="/dashboard/reviews"
          className={getLinkClass("/dashboard/reviews")}
        >
          My Reviews
        </Link>

        <Link
          href="/dashboard/open-cases"
          className={getLinkClass("/dashboard/open-cases")}
        >
          Open Cases
        </Link>
        <Link
          href="/dashboard/saved-cases"
          className={getLinkClass("/dashboard/saved-cases")}
        >
          Saved Cases
        </Link>
        <Link
          href="/dashboard/saved-companies"
          className={getLinkClass("/dashboard/saved-cases")}
        >
          Saved Companies
        </Link>
        <Link
          href="/dashboard/saved-experts"
          className={getLinkClass("/dashboard/saved-experts")}
        >
          Saved Experts
        </Link>
        <Link
          href="/dashboard/tickets"
          className={getLinkClass("/dashboard/tickets")}
        >
          Tickets
        </Link>
        <p className={sectionTitleClass}>Ownership</p>

        <Link
          href="/dashboard/my-companies"
          className={getLinkClass("/dashboard/my-companies")}
        >
          My Companies
        </Link>
        <Link
          href="/dashboard/my-experts"
          className={getLinkClass("/dashboard/my-experts")}
        >
          My Experts
        </Link>

        {isAdmin && (
          <>
            <p className={sectionTitleClass}>Admin</p>

            <Link
              href="/dashboard/users"
              className={getLinkClass("/dashboard/users")}
            >
              Users
            </Link>

            <Link
              href="/dashboard/verifications"
              className={getLinkClass("/dashboard/verifications")}
            >
              Verifications
            </Link>
          </>
        )}

        <p className={sectionTitleClass}>Communication</p>

        <Link
          href="/dashboard/notifications"
          className={getLinkClass("/dashboard/notifications")}
        >
          <span className="flex items-center justify-between">
            <span>Notifications</span>

            {unreadNotificationsCount > 0 && (
              <span className="ml-3 rounded-full bg-red-500 animate-pulse px-2 py-0.5 text-xs font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </span>
        </Link>
        <p className={sectionTitleClass}>Subscription</p>
        <div className="px-4 pb-2">
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs font-semibold text-yellow-400">
              PREMIUM FEATURES
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Plans, limits and visibility
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className={getLinkClass("/dashboard/subscription")}
        >
          Subscription
        </Link>
        <p className={sectionTitleClass}>Account</p>
        <div className="mt-6 border-t border-slate-800 pt-6">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
          >
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
