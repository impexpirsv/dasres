"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const t = useTranslations(
    "notifications.markAllRead",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markAllAsRead() {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "POST",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || t("errors.updateFailed"),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={markAllAsRead}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? t("updating")
          : t("markAll")}
      </button>
    </div>
  );
}