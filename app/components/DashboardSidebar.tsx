"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboardSidebar");

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
        : pathname === path || pathname.startsWith(`${path}/`);

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
    "px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <aside
      className={`${
        mobileOpen ? "block" : "hidden lg:block"
      } min-h-screen w-72 overflow-y-auto border-e border-slate-800 bg-slate-950 p-5`}
    >
      <div className="mb-8 border-b border-slate-800 px-4 pb-6">
        <h2 className="text-3xl font-black tracking-wider text-white">
          DASRES
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {t("tagline")}
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        <p className={sectionTitleClass}>{t("sections.main")}</p>

        <Link href="/dashboard" className={getLinkClass("/dashboard")}>
          {t("links.dashboard")}
        </Link>

        <Link
          href="/dashboard/search"
          className={getLinkClass("/dashboard/search")}
        >
          {t("links.globalSearch")}
        </Link>

        <Link
          href="/dashboard/experts"
          className={getLinkClass("/dashboard/experts")}
        >
          {t("links.experts")}
        </Link>

        <Link
          href="/dashboard/top-experts"
          className={getLinkClass("/dashboard/top-experts")}
        >
          {t("links.topExperts")}
        </Link>

        <Link
          href="/dashboard/companies"
          className={getLinkClass("/dashboard/companies")}
        >
          {t("links.companies")}
        </Link>

        <Link
          href="/dashboard/top-companies"
          className={getLinkClass("/dashboard/top-companies")}
        >
          {t("links.topCompanies")}
        </Link>

        <Link
          href="/dashboard/opportunities"
          className={getLinkClass("/dashboard/opportunities")}
        >
          {t("links.opportunities")}
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.tradeManagement")}
        </p>

        <Link
          href="/dashboard/cases"
          className={getLinkClass("/dashboard/cases")}
        >
          {t("links.submittedCases")}
        </Link>

        <Link
          href="/dashboard/my-cases"
          className={getLinkClass("/dashboard/my-cases")}
        >
          {t("links.activeWorkspaces")}
        </Link>

        <Link
          href="/dashboard/projects"
          className={getLinkClass("/dashboard/projects")}
        >
          {t("links.projects")}
        </Link>

        <Link
          href="/dashboard/my-tasks"
          className={getLinkClass("/dashboard/my-tasks")}
        >
          {t("links.myTasks")}
        </Link>

        <Link
          href="/dashboard/my-proposals"
          className={getLinkClass("/dashboard/my-proposals")}
        >
          {t("links.myProposals")}
        </Link>

        <Link
          href="/dashboard/reviews"
          className={getLinkClass("/dashboard/reviews")}
        >
          {t("links.myReviews")}
        </Link>

        <Link
          href="/dashboard/open-cases"
          className={getLinkClass("/dashboard/open-cases")}
        >
          {t("links.openCases")}
        </Link>

        <Link
          href="/dashboard/saved-cases"
          className={getLinkClass("/dashboard/saved-cases")}
        >
          {t("links.savedCases")}
        </Link>

        <Link
          href="/dashboard/saved-companies"
          className={getLinkClass("/dashboard/saved-companies")}
        >
          {t("links.savedCompanies")}
        </Link>

        <Link
          href="/dashboard/saved-experts"
          className={getLinkClass("/dashboard/saved-experts")}
        >
          {t("links.savedExperts")}
        </Link>

        <Link
          href="/dashboard/tickets"
          className={getLinkClass("/dashboard/tickets")}
        >
          {t("links.tickets")}
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.ownership")}
        </p>

        <Link
          href="/dashboard/my-companies"
          className={getLinkClass("/dashboard/my-companies")}
        >
          {t("links.myCompanies")}
        </Link>

        <Link
          href="/dashboard/my-experts"
          className={getLinkClass("/dashboard/my-experts")}
        >
          {t("links.myExperts")}
        </Link>

        {isAdmin && (
          <>
            <p className={sectionTitleClass}>
              {t("sections.admin")}
            </p>

            <Link
              href="/dashboard/users"
              className={getLinkClass("/dashboard/users")}
            >
              {t("links.users")}
            </Link>

            <Link
              href="/dashboard/verifications"
              className={getLinkClass("/dashboard/verifications")}
            >
              {t("links.verifications")}
            </Link>
          </>
        )}

        <p className={sectionTitleClass}>
          {t("sections.communication")}
        </p>

        <Link
          href="/dashboard/notifications"
          className={getLinkClass("/dashboard/notifications")}
        >
          <span className="flex items-center justify-between">
            <span>{t("links.notifications")}</span>

            {unreadNotificationsCount > 0 && (
              <span
                dir="ltr"
                className="ms-3 animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white"
              >
                {unreadNotificationsCount}
              </span>
            )}
          </span>
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.subscription")}
        </p>

        <div className="px-4 pb-2">
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs font-semibold text-yellow-400">
              {t("premium.title")}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {t("premium.description")}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/subscription"
          className={getLinkClass("/dashboard/subscription")}
        >
          {t("links.subscription")}
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.account")}
        </p>

        <div className="mt-6 border-t border-slate-800 pt-6">
          <Link
            href="/dashboard/settings"
            className={getLinkClass("/dashboard/settings")}
          >
            {t("links.settings")}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-start text-sm text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
          >
            {t("links.logout")}
          </button>
        </div>
      </nav>
    </aside>
  );
}