"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function ProjectTabs({ projectId }: { projectId: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "overview";

  const tabs = [
    {
      title: "Overview",
      tab: "overview",
      href: `/dashboard/projects/${projectId}`,
    },
    {
      title: "Tasks",
      tab: "tasks",
      href: `/dashboard/projects/${projectId}?tab=tasks`,
    },
    {
      title: "Board",
      tab: "board",
      href: `/dashboard/projects/${projectId}?tab=board`,
    },
    {
      title: "Calendar",
      tab: "calendar",
      href: `/dashboard/projects/${projectId}?tab=calendar`,
    },
    {
      title: "Gantt",
      tab: "gantt",
      href: `/dashboard/projects/${projectId}?tab=gantt`,
    },
    {
      title: "Workload",
      tab: "workload",
      href: `/dashboard/projects/${projectId}?tab=workload`,
    },
    {
      title: "Timeline",
      tab: "timeline",
      href: `/dashboard/projects/${projectId}?tab=timeline`,
    },
    {
      title: "Activity",
      tab: "activity",
      href: `/dashboard/projects/${projectId}?tab=activity`,
    },
  ];

  const isProjectPage = pathname === `/dashboard/projects/${projectId}`;

  return (
    <div className="flex flex-wrap gap-2 pt-4">
      {tabs.map((tab) => {
        const active = isProjectPage && currentTab === tab.tab;

        return (
          <Link
            key={tab.title}
            href={tab.href}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}
