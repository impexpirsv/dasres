"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
        : pathname === path ||
          pathname.startsWith(`${path}/`);


    return `
      group
      block
      rounded-xl
      px-4
      py-3
      text-sm
      font-medium
      transition-all
      duration-200

      ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-300 hover:bg-slate-900 hover:text-white"
      }
    `;
  }


  const sectionTitleClass =
    "px-4 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500";


  return (
    <aside
      className={`
        ${
          mobileOpen
            ? "block"
            : "hidden lg:block"
        }

        min-h-screen
        w-72
        overflow-y-auto

        border-e
        border-slate-800

        bg-slate-950/95

        p-5

        backdrop-blur-xl
      `}
    >


      <div className="mb-8 border-b border-slate-800 px-4 pb-6">

        <Link
          href="/dashboard"
          className="group block"
        >

          <h2
            className="
              bg-gradient-to-r
              from-blue-400
              via-cyan-400
              to-emerald-400

              bg-clip-text

              text-3xl
              font-black
              tracking-[0.18em]

              text-transparent

              transition
              group-hover:scale-105
            "
          >
            DASRES
          </h2>


          <p className="mt-2 text-xs text-slate-500 transition group-hover:text-cyan-400">
            {t("tagline")}
          </p>

        </Link>

      </div>



      <nav className="flex flex-col gap-1">


        <p className={sectionTitleClass}>
          {t("sections.main")}
        </p>


        <Link
          href="/dashboard"
          className={getLinkClass("/dashboard")}
        >
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


        {[
          [
            "/dashboard/cases",
            "submittedCases",
          ],
          [
            "/dashboard/my-cases",
            "activeWorkspaces",
          ],
          [
            "/dashboard/projects",
            "projects",
          ],
          [
            "/dashboard/my-tasks",
            "myTasks",
          ],
          [
            "/dashboard/my-proposals",
            "myProposals",
          ],
          [
            "/dashboard/reviews",
            "myReviews",
          ],
          [
            "/dashboard/open-cases",
            "openCases",
          ],
          [
            "/dashboard/saved-cases",
            "savedCases",
          ],
          [
            "/dashboard/saved-companies",
            "savedCompanies",
          ],
          [
            "/dashboard/saved-experts",
            "savedExperts",
          ],
          [
            "/dashboard/tickets",
            "tickets",
          ],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={getLinkClass(href)}
          >
            {t(`links.${label}`)}
          </Link>
        ))}



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

            <span>
              {t("links.notifications")}
            </span>


            {unreadNotificationsCount > 0 && (
              <span
                dir="ltr"
                className="
                  animate-pulse
                  rounded-full
                  bg-red-500
                  px-2
                  py-0.5
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

          <div className="
            rounded-2xl
            border
            border-yellow-500/30
            bg-gradient-to-br
            from-yellow-500/10
            to-orange-500/10
            p-4
          ">

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
          className={getLinkClass("/dashboard/subscription")}
        >
          {t("links.subscription")}
        </Link>




        <p className={sectionTitleClass}>
          {t("sections.account")}
        </p>


        <div className="mt-5 border-t border-slate-800 pt-5">

          <Link
            href="/dashboard/settings"
            className={getLinkClass("/dashboard/settings")}
          >
            {t("links.settings")}
          </Link>


          <button
            type="button"
            onClick={handleLogout}
            className="
              mt-1
              w-full
              rounded-xl
              px-4
              py-3
              text-start
              text-sm
              font-medium
              text-red-400
              transition
              hover:bg-red-950/40
              hover:text-red-300
            "
          >
            {t("links.logout")}
          </button>

        </div>


      </nav>

    </aside>
  );
}