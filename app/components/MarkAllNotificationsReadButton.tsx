"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllAsRead() {
    setLoading(true);

    await fetch("/api/notifications/read-all", {
      method: "POST",
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={markAllAsRead}
      disabled={loading}
      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Updating..." : "Mark all as read"}
    </button>
  );
}