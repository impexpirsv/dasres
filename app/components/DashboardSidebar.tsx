"use client";

import Link from "next/link";

interface DashboardSidebarProps {
  isAdmin: boolean;
}

export default function DashboardSidebar({
  isAdmin,
}: DashboardSidebarProps) {
  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
      <h2 className="text-2xl font-bold mb-8">
        DASRES
      </h2>

      <nav className="flex flex-col gap-4">
        <Link href="/dashboard">
          Dashboard
        </Link>

        {isAdmin && (
          <Link href="/dashboard/users">
            Users
          </Link>
        )}

        <Link href="/experts">
          Experts
        </Link>

        <Link href="/companies">
          Companies
        </Link>

        <Link href="/opportunities">
          Opportunities
        </Link>

        <button
          onClick={handleLogout}
          className="text-left text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}