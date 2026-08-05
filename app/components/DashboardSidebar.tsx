"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface DashboardSidebarProps {
  isAdmin: boolean;
  unreadNotificationsCount: number;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

type NavigationItem = {
  href: string;
  label: string;
};

const mainNavigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "dashboard",
  },
  {
    href: "/dashboard/search",
    label: "globalSearch",
  },
  {
    href: "/dashboard/experts",
    label: "experts",
  },
  {
    href: "/dashboard/top-experts",
    label: "topExperts",
  },
  {
    href: "/dashboard/companies",
    label: "companies",
  },
  {
    href: "/dashboard/top-companies",
    label: "topCompanies",
  },
  {
    href: "/dashboard/opportunities",
    label: "opportunities",
  },
];

const tradeManagementNavigationItems: NavigationItem[] = [
  {
    href: "/dashboard/cases",
    label: "submittedCases",
  },
  {
    href: "/dashboard/my-cases",
    label: "activeWorkspaces",
  },
  {
    href: "/dashboard/projects",
    label: "projects",
  },
  {
    href: "/dashboard/my-tasks",
    label: "myTasks",
  },
  {
    href: "/dashboard/my-proposals",
    label: "myProposals",
  },
  {
    href: "/dashboard/reviews",
    label: "myReviews",
  },
  {
    href: "/dashboard/open-cases",
    label: "openCases",
  },
  {
    href: "/dashboard/saved-cases",
    label: "savedCases",
  },
  {
    href: "/dashboard/saved-companies",
    label: "savedCompanies",
  },
  {
    href: "/dashboard/saved-experts",
    label: "savedExperts",
  },
  {
    href: "/dashboard/tickets",
    label: "tickets",
  },
];

const ownershipNavigationItems: NavigationItem[] = [
  {
    href: "/dashboard/my-companies",
    label: "myCompanies",
  },
  {
    href: "/dashboard/my-experts",
    label: "myExperts",
  },
];

const adminNavigationItems: NavigationItem[] = [
  {
    href: "/dashboard/users",
    label: "users",
  },
  {
    href: "/dashboard/verifications",
    label: "verifications",
  },
];

export default function DashboardSidebar({
  isAdmin,
  unreadNotificationsCount,
  mobileOpen = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("dashboardSidebar");

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  function isLinkActive(path: string) {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  function getLinkClass(path: string) {
    const active = isLinkActive(path);

    return `
      group
      relative
      block
      rounded-xl
      min-h-11
      px-3
      py-2.5
      text-sm
      font-medium
      transition-all
      duration-200
      focus-visible:outline-2
      focus-visible:outline-offset-2
      focus-visible:outline-cyan-400
      ${
        active
          ? "bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white shadow-lg shadow-blue-600/20 before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-white"
          : "text-slate-300 hover:bg-slate-900 hover:text-white"
      }
    `;
  }

  function handleNavigation() {
    onNavigate?.();
  }

  async function handleLogout() {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      window.location.assign("/login");
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      setLogoutLoading(false);
    }
  }

  function renderNavigationItems(
    items: NavigationItem[],
  ) {
    return items.map((item) => {
      const active = isLinkActive(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          className={getLinkClass(item.href)}
          aria-current={active ? "page" : undefined}
          onClick={handleNavigation}
        >
          {t(`links.${item.label}`)}
        </Link>
      );
    });
  }

  const sectionTitleClass =
    "px-4 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500";

  return (
    <aside
      className={`
        ${mobileOpen ? "block" : "hidden lg:block"}
        h-full
        min-h-screen
        w-64
        shrink-0
        overflow-y-auto
        border-e
        border-slate-800
        bg-slate-950/95
        p-3
        backdrop-blur-xl
      `}
    >
      <div className="mb-4 border-b border-slate-800 px-3 pb-5 pt-2">
        <Link
          href="/dashboard"
          className="group block"
          onClick={handleNavigation}
        >
          <h2
            className="
              bg-gradient-to-r
              from-blue-400
              via-cyan-400
              to-emerald-400
              bg-clip-text
              text-2xl
              font-black
              tracking-[0.08em]
              text-transparent
              transition
              group-hover:scale-105
            "
          >
            Dasres
          </h2>

          <p className="mt-2 text-xs text-slate-500 transition group-hover:text-cyan-400">
            {t("tagline")}
          </p>
        </Link>
      </div>

      <nav
        className="flex flex-col gap-1"
        aria-label={t("menu")}
      >
        <p className={sectionTitleClass}>
          {t("sections.main")}
        </p>

        {renderNavigationItems(
          mainNavigationItems,
        )}

        <p className={sectionTitleClass}>
          {t("sections.tradeManagement")}
        </p>

        {renderNavigationItems(
          tradeManagementNavigationItems,
        )}

        <p className={sectionTitleClass}>
          {t("sections.ownership")}
        </p>

        {renderNavigationItems(
          ownershipNavigationItems,
        )}

        {isAdmin && (
          <>
            <p className={sectionTitleClass}>
              {t("sections.admin")}
            </p>

            {renderNavigationItems(
              adminNavigationItems,
            )}
          </>
        )}

        <p className={sectionTitleClass}>
          {t("sections.communication")}
        </p>

        <Link
          href="/dashboard/notifications"
          className={getLinkClass(
            "/dashboard/notifications",
          )}
          aria-current={
            isLinkActive(
              "/dashboard/notifications",
            )
              ? "page"
              : undefined
          }
          onClick={handleNavigation}
        >
          <span className="flex items-center justify-between gap-3">
            <span>
              {t("links.notifications")}
            </span>

            {unreadNotificationsCount > 0 && (
              <span
                dir="ltr"
                className="
                  min-w-6
                  rounded-full
                  bg-red-500
                  px-2
                  py-0.5
                  text-center
                  text-xs
                  font-bold
                  text-white
                "
              >
                {unreadNotificationsCount}
              </span>
            )}
          </span>
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.subscription")}
        </p>

        <div className="px-1 pb-2">
          <div
            className="
              rounded-[var(--ui-radius-card)]
              border
              border-yellow-500/30
              bg-gradient-to-br
              from-yellow-500/10
              to-orange-500/10
              p-4
            "
          >
            <p className="text-sm font-bold text-yellow-400">
              {t("premium.title")}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {t("premium.description")}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/subscription"
          className={getLinkClass(
            "/dashboard/subscription",
          )}
          aria-current={
            isLinkActive(
              "/dashboard/subscription",
            )
              ? "page"
              : undefined
          }
          onClick={handleNavigation}
        >
          {t("links.subscription")}
        </Link>

        <p className={sectionTitleClass}>
          {t("sections.account")}
        </p>

        <div className="mt-5 border-t border-slate-800 pt-5">
          <Link
            href="/dashboard/settings"
            className={getLinkClass(
              "/dashboard/settings",
            )}
            aria-current={
              isLinkActive(
                "/dashboard/settings",
              )
                ? "page"
                : undefined
            }
            onClick={handleNavigation}
          >
            {t("links.settings")}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            aria-busy={logoutLoading}
            className="ui-button ui-button-ghost mt-1 w-full justify-start px-4 py-3
              text-start
              text-sm
              font-medium
              text-red-400
              transition
              hover:bg-red-950/40
              hover:text-red-300
              disabled:cursor-not-allowed
              disabled:opacity-60"
          >
            {t("links.logout")}
          </button>
        </div>
      </nav>
    </aside>
  );
}
