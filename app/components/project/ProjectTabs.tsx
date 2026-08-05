"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ProjectTabs({
  projectId,
}: {
  projectId: number;
}) {
  const t = useTranslations("projectTabs");

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "overview";

  const tabs = [
    {
      title: t("overview"),
      tab: "overview",
      href: `/dashboard/projects/${projectId}`,
    },
    {
      title: t("tasks"),
      tab: "tasks",
      href: `/dashboard/projects/${projectId}?tab=tasks`,
    },
    {
      title: t("board"),
      tab: "board",
      href: `/dashboard/projects/${projectId}?tab=board`,
    },
    {
      title: t("calendar"),
      tab: "calendar",
      href: `/dashboard/projects/${projectId}?tab=calendar`,
    },
    {
      title: t("gantt"),
      tab: "gantt",
      href: `/dashboard/projects/${projectId}?tab=gantt`,
    },
    {
      title: t("workload"),
      tab: "workload",
      href: `/dashboard/projects/${projectId}?tab=workload`,
    },
    {
      title: t("documents"),
      tab: "documents",
      href: `/dashboard/projects/${projectId}?tab=documents`,
    },
    {
      title: t("timeline"),
      tab: "timeline",
      href: `/dashboard/projects/${projectId}?tab=timeline`,
    },
    {
      title: t("messages"),
      tab: "messages",
      href: `/dashboard/projects/${projectId}?tab=messages`,
    },
    {
      title: t("activity"),
      tab: "activity",
      href: `/dashboard/projects/${projectId}?tab=activity`,
    },
  ];

  const isProjectPage =
    pathname === `/dashboard/projects/${projectId}`;

  return (
    <nav aria-label={t("overview")} className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-2 pt-4">
      {tabs.map((tab) => {
        const active =
          isProjectPage && currentTab === tab.tab;

        return (
          <Link
            key={tab.tab}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`ui-button shrink-0 px-4 text-sm ${
              active
                ? "ui-button-primary"
                : "ui-button-ghost bg-slate-900"
            }`}
          >
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}
