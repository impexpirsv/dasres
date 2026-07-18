"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ReopenTicketButton({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tickets.reopenButton");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reopenTicket() {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `/api/tickets/${ticketId}/reopen`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.reopenFailed"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.reopenFailed"));
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
        onClick={reopenTicket}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("reopening") : t("reopen")}
      </button>
    </div>
  );
}